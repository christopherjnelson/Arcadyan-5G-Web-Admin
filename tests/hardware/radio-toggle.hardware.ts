import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type Response,
} from "@playwright/test";
import {
  attachDiagnostics,
  isAllowedMethodAndPath,
  safePath,
  type BrowserDiagnostics,
} from "./diagnostics";

/**
 * Opt-in single-band radio-toggle mutation validation.
 *
 * This harness is NEVER part of the default run or CI. It requires both
 * ARCADYAN_PASSWORD and ARCADYAN_RADIO_MUTATION=1. It toggles exactly one
 * top-level isRadioEnabled flag through the application's edit UI, confirms
 * the change through sanitized readbacks, restores the original state through
 * the UI, and confirms restoration. If the UI-driven restore cannot run, a
 * fallback posts the in-memory original configuration back. Only sanitized
 * booleans, counts, and statuses are ever recorded; raw configuration bodies
 * stay in memory and are never attached or logged.
 */

const password = process.env.ARCADYAN_PASSWORD;
const mutationEnabled = process.env.ARCADYAN_RADIO_MUTATION === "1";

test.skip(
  !password || !mutationEnabled,
  "radio mutation validation requires ARCADYAN_PASSWORD and explicit ARCADYAN_RADIO_MUTATION=1",
);

const GET_AP_PATH = "/api/network/configuration/v2?get=ap";
const SET_AP_PATH = "/api/network/configuration/v2?set=ap";
const CLIENTS_PATH = "/api/network/telemetry/?get=clients";
const LOGIN_PATH = "/api/auth/login";

const radioToggleLabel = {
  "2.4ghz": "2.4 GHz Radio",
  "5.0ghz": "5 GHz Radio",
} as const;
const radioDetailLabel = {
  "2.4ghz": "2.4GHz Radio",
  "5.0ghz": "5 GHz Radio",
} as const;

type BandKey = keyof typeof radioToggleLabel;

interface SanitizedWifiState {
  radios: Record<BandKey, boolean>;
  membership24: boolean[];
  membership5: boolean[];
}

/**
 * Route guard for this harness only: every GET, the normal login POST, and
 * the single approved configuration POST. Anything else is aborted and
 * fails the test. Response shapes are not captured here; the read-only
 * suite already records them, and this harness keeps bodies out of the
 * diagnostics entirely.
 */
async function installMutationGuard(
  context: BrowserContext,
  page: Page,
): Promise<BrowserDiagnostics> {
  const diagnostics: BrowserDiagnostics = {
    console: [],
    network: [],
    blockedMutations: [],
  };

  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const isApprovedSetAp =
      request.method() === "POST" &&
      `${url.pathname}${url.search}` === SET_AP_PATH;
    if (
      !isAllowedMethodAndPath(request.method(), request.url()) &&
      !isApprovedSetAp
    ) {
      diagnostics.blockedMutations.push(
        `${request.method()} ${safePath(request.url())}`,
      );
      await route.abort("blockedbyclient");
      return;
    }
    await route.continue();
  });

  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      diagnostics.console.push({
        type: message.type(),
        text: `${message.type()} message (${message.text().length} chars)`,
      });
    }
  });

  return diagnostics;
}

/** Sanitized readback through the app proxy; null on any failure. */
async function fetchSanitizedWifiState(
  page: Page,
  token: string,
): Promise<SanitizedWifiState | null> {
  return page.evaluate(
    async ({ path, bearerToken }) => {
      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 8000);
        const response = await fetch(path, {
          headers: { Authorization: `Bearer ${bearerToken}` },
          signal: controller.signal,
        });
        window.clearTimeout(timeout);
        if (!response.ok) return null;
        const config = await response.json();
        return {
          radios: {
            "2.4ghz": config["2.4ghz"].isRadioEnabled === true,
            "5.0ghz": config["5.0ghz"].isRadioEnabled === true,
          },
          membership24: config.ssids.map(
            (ssid: Record<string, unknown>) => ssid["2.4ghzSsid"] === true,
          ),
          membership5: config.ssids.map(
            (ssid: Record<string, unknown>) => ssid["5.0ghzSsid"] === true,
          ),
        };
      } catch {
        return null;
      }
    },
    { path: GET_AP_PATH, bearerToken: token },
  );
}

/**
 * Poll until the selected band reports the expected state. The gateway
 * answers get=ap with transient HTTP 408s while a radio change settles, so
 * failures are tolerated until the deadline.
 */
async function waitForRadioState(
  page: Page,
  token: string,
  band: BandKey,
  expected: boolean,
  timeoutMs: number,
): Promise<SanitizedWifiState | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const state = await fetchSanitizedWifiState(page, token);
    if (state && state.radios[band] === expected) return state;
    await page.waitForTimeout(3000);
  }
  return null;
}

async function fetchClientCounts(
  page: Page,
  token: string,
): Promise<Record<BandKey, number> | null> {
  return page.evaluate(
    async ({ path, bearerToken }) => {
      try {
        const response = await fetch(path, {
          headers: { Authorization: `Bearer ${bearerToken}` },
        });
        if (!response.ok) return null;
        const clients = await response.json();
        return {
          "2.4ghz": clients.clients["2.4ghz"].length,
          "5.0ghz": clients.clients["5.0ghz"].length,
        };
      } catch {
        return null;
      }
    },
    { path: CLIENTS_PATH, bearerToken: token },
  );
}

/** Restoration-only POST of the in-memory original configuration. */
async function postOriginalConfig(
  page: Page,
  token: string,
  originalConfig: unknown,
): Promise<boolean> {
  return page.evaluate(
    async ({ path, bearerToken, body }) => {
      try {
        const response = await fetch(path, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${bearerToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
        return response.ok;
      } catch {
        return false;
      }
    },
    { path: SET_AP_PATH, bearerToken: token, body: originalConfig },
  );
}

function apiResponse(page: Page, pathAndQuery: string): Promise<Response> {
  return page.waitForResponse((response) => {
    const url = new URL(response.url());
    return `${url.pathname}${url.search}` === pathAndQuery;
  });
}

test("toggles and restores one radio through the edit UI", async ({
  context,
  page,
}, testInfo) => {
  test.setTimeout(300_000);
  const diagnostics = await installMutationGuard(context, page);
  const steps: string[] = [];
  let token = "";
  let originalConfig: unknown = null;
  let originalRadios: Record<BandKey, boolean> | null = null;
  let mutationApplied = false;
  let restoreConfirmed = false;

  try {
    await page.goto("/login");
    await page.getByLabel("Password").fill(password!);
    const loginResponsePromise = apiResponse(page, LOGIN_PATH);
    await page.getByRole("button", { name: "Submit" }).click();
    const loginResponse = await loginResponsePromise;
    expect(loginResponse.ok(), "login should succeed").toBe(true);
    const loginPayload = await loginResponse.json();
    token = loginPayload?.auth?.token;
    expect(typeof token, "login should provide an in-memory token").toBe(
      "string",
    );
    steps.push("login ok");

    const wifiResponsePromise = apiResponse(page, GET_AP_PATH);
    await page.getByRole("link", { name: "WiFi" }).click();
    const wifiResponse = await wifiResponsePromise;
    expect(wifiResponse.ok(), "initial get=ap should succeed").toBe(true);
    // Held in memory only; never logged or attached.
    originalConfig = await wifiResponse.json();
    steps.push("captured original configuration in memory");

    const counts = await fetchClientCounts(page, token);
    expect(counts, "client counts should be readable").not.toBeNull();
    const band: BandKey =
      counts!["2.4ghz"] < counts!["5.0ghz"] ? "2.4ghz" : "5.0ghz";
    const otherBand: BandKey = band === "2.4ghz" ? "5.0ghz" : "2.4ghz";
    steps.push(`selected band with fewest clients: ${band}`);

    const initialState = await fetchSanitizedWifiState(page, token);
    expect(
      initialState,
      "initial sanitized state should be readable",
    ).not.toBeNull();
    originalRadios = initialState!.radios;
    test.skip(
      initialState!.radios[band] !== true,
      `selected band ${band} is not currently enabled; nothing safe to toggle`,
    );

    // Disable the selected radio through the normal edit UI.
    const networkCard = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Network 1", exact: true }),
    });
    await networkCard.getByRole("button", { name: "Edit" }).click();
    await page.getByRole("switch", { name: radioToggleLabel[band] }).click();
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await page.getByRole("button", { name: "Disable Radio" }).click();
    steps.push("submitted disable through UI with confirmation");

    const disabledState = await waitForRadioState(
      page,
      token,
      band,
      false,
      90_000,
    );
    expect(
      disabledState,
      `readback should confirm ${band} radio disabled`,
    ).not.toBeNull();
    mutationApplied = true;
    expect(
      disabledState!.radios[otherBand],
      "other band radio state must not change",
    ).toBe(initialState!.radios[otherBand]);
    expect(
      disabledState!.membership24,
      "2.4GHz membership must not change",
    ).toEqual(initialState!.membership24);
    expect(
      disabledState!.membership5,
      "5GHz membership must not change",
    ).toEqual(initialState!.membership5);
    steps.push("readback confirmed disable; unrelated state unchanged");

    // Wait until the application itself reflects the fresh state before
    // using its UI to re-enable; stale props would make the form a no-op.
    await expect(
      networkCard
        .locator("dt")
        .filter({ hasText: radioDetailLabel[band] })
        .locator("xpath=following-sibling::dd[1]"),
      "application should display the disabled radio before re-enabling",
    ).toHaveText("disabled", { timeout: 150_000 });
    steps.push("application display refreshed");

    await networkCard.getByRole("button", { name: "Edit" }).click();
    await page.getByRole("switch", { name: radioToggleLabel[band] }).click();
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(
      page.getByRole("alert"),
      "enabling a radio must not require confirmation",
    ).not.toBeVisible();
    steps.push("submitted re-enable through UI without confirmation");

    const restoredState = await waitForRadioState(
      page,
      token,
      band,
      true,
      90_000,
    );
    expect(
      restoredState,
      `readback should confirm ${band} radio restored`,
    ).not.toBeNull();
    restoreConfirmed = true;
    expect(restoredState!.radios).toEqual(initialState!.radios);
    expect(restoredState!.membership24).toEqual(initialState!.membership24);
    expect(restoredState!.membership5).toEqual(initialState!.membership5);
    steps.push("readback confirmed restoration to original state");

    expect(
      diagnostics.blockedMutations,
      "an unapproved request was attempted",
    ).toEqual([]);
  } finally {
    if (mutationApplied && !restoreConfirmed && originalRadios) {
      // Restoration-only fallback: post the in-memory original configuration
      // back until the readback confirms the original radio state.
      steps.push(
        "UI restore did not complete; attempting restoration fallback",
      );
      for (let attempt = 1; attempt <= 3 && !restoreConfirmed; attempt++) {
        await postOriginalConfig(page, token, originalConfig);
        await page.waitForTimeout(5000);
        const state = await fetchSanitizedWifiState(page, token);
        restoreConfirmed =
          state !== null &&
          state.radios["2.4ghz"] === originalRadios["2.4ghz"] &&
          state.radios["5.0ghz"] === originalRadios["5.0ghz"];
        steps.push(
          `restoration attempt ${attempt}: ${restoreConfirmed ? "confirmed" : "unconfirmed"}`,
        );
      }
      if (!restoreConfirmed) {
        steps.push("RESTORATION UNCONFIRMED — manual check required");
      }
    }
    (diagnostics as BrowserDiagnostics & { steps: string[] }).steps = steps;
    await attachDiagnostics(diagnostics, testInfo);
  }
});
