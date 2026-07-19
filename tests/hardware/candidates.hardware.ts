import { expect, test, type Page, type Response } from "@playwright/test";
import {
  attachDiagnostics,
  describeJsonShape,
  installReadOnlyDiagnostics,
  type BrowserDiagnostics,
} from "./diagnostics";

const password = process.env.ARCADYAN_PASSWORD;
const candidateProbeEnabled = process.env.ARCADYAN_CANDIDATE_PROBE === "1";
const requestTimeoutMs = 4_000;
const delayBetweenCandidateRequestsMs = 3_000;

const knownHealthPath = "/api/gateway/?get=all";
const candidatePaths = [
  "/api/version",
  "/api/network/telemetry?get=sim",
  "/api/network/telemetry?get=cell",
] as const;
const allowedApiGetPaths = new Set([knownHealthPath, ...candidatePaths]);

test.skip(
  !password || !candidateProbeEnabled,
  "candidate probing requires ARCADYAN_PASSWORD and explicit ARCADYAN_CANDIDATE_PROBE=1",
);

function apiResponseOrFailure(
  page: Page,
  pathAndQuery: string,
): Promise<Response | null> {
  const matches = (urlString: string) => {
    const url = new URL(urlString);
    return `${url.pathname}${url.search}` === pathAndQuery;
  };

  return Promise.race([
    page
      .waitForResponse((response) => matches(response.url()))
      .then((response) => response),
    page
      .waitForEvent("requestfailed", {
        predicate: (request) => matches(request.url()),
      })
      .then(() => null),
  ]);
}

async function authenticatedGet(
  page: Page,
  path: string,
  token: string,
): Promise<Response | null> {
  const responsePromise = apiResponseOrFailure(page, path);
  await page.evaluate(
    async ({ candidatePath, bearerToken, timeoutMs }) => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
      try {
        await fetch(candidatePath, {
          method: "GET",
          headers: { Authorization: `Bearer ${bearerToken}` },
          signal: controller.signal,
        });
      } catch {
        // Playwright's requestfailed listener records only a sanitized failure.
      } finally {
        window.clearTimeout(timeout);
      }
    },
    { candidatePath: path, bearerToken: token, timeoutMs: requestTimeoutMs },
  );
  return responsePromise;
}

async function sanitizedShape(response: Response): Promise<string> {
  try {
    return JSON.stringify(describeJsonShape(await response.json()));
  } catch {
    return "not-json";
  }
}

test("checks only the three approved README candidates", async ({
  context,
  page,
}, testInfo) => {
  const diagnostics: BrowserDiagnostics = await installReadOnlyDiagnostics(
    context,
    page,
    allowedApiGetPaths,
  );

  try {
    await page.goto("/login");
    await page.getByLabel("Password").fill(password!);
    const loginResponsePromise = apiResponseOrFailure(page, "/api/auth/login");
    const initialPageHealthPromise = apiResponseOrFailure(
      page,
      knownHealthPath,
    );
    await page.getByRole("button", { name: "Submit" }).click();
    const loginResponse = await loginResponsePromise;
    expect(
      loginResponse,
      "normal login should receive an HTTP response",
    ).not.toBeNull();
    expect(loginResponse!.ok(), "normal login should succeed").toBe(true);
    const loginPayload = await loginResponse!.json();
    const token: unknown = loginPayload?.auth?.token;
    expect(typeof token, "normal login should provide an in-memory token").toBe(
      "string",
    );
    expect(token, "normal login token should be non-empty").not.toBe("");
    const initialPageHealth = await initialPageHealthPromise;
    expect(
      initialPageHealth,
      "known gateway health check should respond after login",
    ).not.toBeNull();

    // Reloading the login route stops page polling. Candidate GETs below use
    // the in-memory token and never invoke the application's 401 retry logic.
    await page.goto("/login");

    const initialHealth = await authenticatedGet(
      page,
      knownHealthPath,
      token as string,
    );
    expect(
      initialHealth,
      "known gateway health check should respond",
    ).not.toBeNull();

    let consecutiveNoResponses = 0;
    for (const candidatePath of candidatePaths) {
      const first = await authenticatedGet(
        page,
        candidatePath,
        token as string,
      );
      consecutiveNoResponses = first ? 0 : consecutiveNoResponses + 1;
      expect(
        consecutiveNoResponses,
        "two consecutive requests received no HTTP status or headers",
      ).toBeLessThan(2);

      if (first) {
        const firstShape = await sanitizedShape(first);
        await page.waitForTimeout(delayBetweenCandidateRequestsMs);
        const second = await authenticatedGet(
          page,
          candidatePath,
          token as string,
        );
        consecutiveNoResponses = second ? 0 : consecutiveNoResponses + 1;
        expect(
          consecutiveNoResponses,
          "two consecutive requests received no HTTP status or headers",
        ).toBeLessThan(2);
        if (second) {
          expect(
            await sanitizedShape(second),
            `${candidatePath} sanitized response shape should remain stable`,
          ).toBe(firstShape);
        }
      }

      await page.waitForTimeout(delayBetweenCandidateRequestsMs);
      const health = await authenticatedGet(
        page,
        knownHealthPath,
        token as string,
      );
      expect(
        health,
        "known gateway health check stopped responding",
      ).not.toBeNull();
    }

    expect(
      diagnostics.blockedMutations,
      "an unapproved request was attempted",
    ).toEqual([]);
  } finally {
    await attachDiagnostics(diagnostics, testInfo);
  }
});
