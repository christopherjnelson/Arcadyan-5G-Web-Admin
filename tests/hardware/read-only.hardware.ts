import {
  expect,
  test,
  type Locator,
  type Page,
  type Request,
  type Response,
} from "@playwright/test";
import {
  attachDiagnostics,
  installReadOnlyDiagnostics,
  type BrowserDiagnostics,
} from "./diagnostics";

const password = process.env.ARCADYAN_PASSWORD;

test.skip(
  !password,
  "ARCADYAN_PASSWORD is absent; hardware validation is intentionally skipped",
);

function apiResponse(page: Page, pathAndQuery: string): Promise<Response> {
  return page.waitForResponse((response) => {
    const url = new URL(response.url());
    return `${url.pathname}${url.search}` === pathAndQuery;
  });
}

async function apiResponseOrFailure(
  page: Page,
  pathAndQuery: string,
): Promise<Response> {
  function matches(urlString: string): boolean {
    const url = new URL(urlString);
    return `${url.pathname}${url.search}` === pathAndQuery;
  }

  const outcome = await Promise.race([
    page
      .waitForResponse((response) => matches(response.url()))
      .then((response) => ({ response })),
    page
      .waitForEvent("requestfailed", {
        predicate: (request: Request) => matches(request.url()),
      })
      .then(() => ({ response: null })),
  ]);

  expect(
    outcome.response,
    `${pathAndQuery} should receive an HTTP response`,
  ).not.toBeNull();
  return outcome.response!;
}

function card(page: Page, heading: string): Locator {
  return page.locator("section").filter({
    has: page.getByRole("heading", { name: heading, exact: true }),
  });
}

function detailValue(container: Locator, label: string): Locator {
  return container
    .locator("dt")
    .filter({ hasText: label })
    .locator("xpath=following-sibling::dd[1]");
}

async function expectPrivateValueMatches(
  locator: Locator,
  expected: unknown,
  description: string,
): Promise<void> {
  await expect(locator, `${description} should be displayed`).toBeVisible();
  const matches = await locator.evaluate(
    (element, value) => element.textContent?.trim() === String(value),
    expected,
  );
  expect(matches, `${description} did not match its API property`).toBe(true);
}

test("validates all read-only pages against observed API responses", async ({
  context,
  page,
}, testInfo) => {
  const diagnostics: BrowserDiagnostics = await installReadOnlyDiagnostics(
    context,
    page,
  );

  try {
    await page.goto("/login");
    await page.getByLabel("Password").fill(password!);
    const loginResponsePromise = apiResponseOrFailure(page, "/api/auth/login");
    const gatewayResponsePromise = apiResponse(page, "/api/gateway/?get=all");
    // Avoid a secondary rejected wait when login fails before navigation.
    void gatewayResponsePromise.catch(() => undefined);
    await page.getByRole("button", { name: "Submit" }).click();
    const loginResponse = await loginResponsePromise;
    expect(loginResponse.ok(), "login endpoint should succeed").toBe(true);
    const gatewayResponse = await gatewayResponsePromise;
    expect(gatewayResponse.ok(), "gateway endpoint should succeed").toBe(true);
    const gateway = await gatewayResponse.json();

    await expect(page.getByRole("heading", { name: "Gateway" })).toBeVisible();
    await expectPrivateValueMatches(
      detailValue(card(page, "Gateway"), "Model"),
      gateway.device.model,
      "gateway model",
    );
    await expectPrivateValueMatches(
      detailValue(card(page, "Gateway"), "Firmware"),
      gateway.device.softwareVersion,
      "firmware version",
    );

    for (const [title, property] of [
      ["LTE", "4g"],
      ["5G", "5g"],
    ] as const) {
      const signal = gateway.signal[property];
      if (signal) {
        await expectPrivateValueMatches(
          detailValue(card(page, title), "RSRP"),
          `${signal.rsrp} dBm`,
          `${title} RSRP`,
        );
      }
    }

    const wifiResponsePromise = apiResponse(
      page,
      "/api/network/configuration/v2?get=ap",
    );
    await page.getByRole("link", { name: "WiFi" }).click();
    const wifiResponse = await wifiResponsePromise;
    expect(wifiResponse.ok(), "Wi-Fi endpoint should succeed").toBe(true);
    const wifi = await wifiResponse.json();
    await expect(
      page.getByRole("heading", { name: "Network 1" }),
    ).toBeVisible();

    for (const [index, ssid] of wifi.ssids.entries()) {
      const network = card(page, `Network ${index + 1}`);
      // Radio state is global per band and comes from the top-level flags;
      // the per-SSID flags only express that network's band membership.
      await expectPrivateValueMatches(
        detailValue(network, "2.4GHz Radio"),
        wifi["2.4ghz"].isRadioEnabled ? "enabled" : "disabled",
        `network ${index + 1} 2.4GHz radio state`,
      );
      await expectPrivateValueMatches(
        detailValue(network, "5 GHz Radio"),
        wifi["5.0ghz"].isRadioEnabled ? "enabled" : "disabled",
        `network ${index + 1} 5GHz radio state`,
      );
      await expectPrivateValueMatches(
        detailValue(network, "2.4GHz SSID"),
        ssid["2.4ghzSsid"] ? "enabled" : "disabled",
        `network ${index + 1} 2.4GHz band membership`,
      );
      await expectPrivateValueMatches(
        detailValue(network, "5 GHz SSID"),
        ssid["5.0ghzSsid"] ? "enabled" : "disabled",
        `network ${index + 1} 5GHz band membership`,
      );
    }

    const clientsResponsePromise = apiResponse(
      page,
      "/api/network/telemetry/?get=clients",
    );
    await page.getByRole("link", { name: "System" }).click();
    const clientsResponse = await clientsResponsePromise;
    expect(clientsResponse.ok(), "clients endpoint should succeed").toBe(true);
    const clients = await clientsResponse.json();
    const networkDevices = card(page, "Network Devices");

    for (const [property, label] of [
      ["2.4ghz", "2.4GHz"],
      ["5.0ghz", "5GHz"],
      ["ethernet", "Ethernet"],
    ] as const) {
      await expectPrivateValueMatches(
        detailValue(networkDevices, label),
        clients.clients[property].length,
        `${label} client count`,
      );
    }

    expect(
      diagnostics.blockedMutations,
      "the application attempted a state-changing request",
    ).toEqual([]);
  } finally {
    await attachDiagnostics(diagnostics, testInfo);
  }
});
