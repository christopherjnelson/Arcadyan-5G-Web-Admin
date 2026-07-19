// @vitest-environment node
// Importing the Vite config pulls in esbuild, whose realm invariants do not
// hold under jsdom; this is Node-side configuration, so run it under Node.
import { describe, expect, it } from "vitest";
import config, { ensureJsonContentType } from "./vite.config";

type ProxyRes = { headers: Parameters<typeof ensureJsonContentType>[0] };

/**
 * Captures the listener the /api dev proxy registers for the `proxyRes`
 * event, using a minimal stand-in for the http-proxy event emitter. This
 * exercises the real configuration object, so a regression that drops or
 * renames the listener registration fails here.
 */
function registeredProxyResListener(): (proxyRes: ProxyRes) => void {
  const entry = config.server?.proxy?.["/api"];
  if (!entry || typeof entry === "string" || !entry.configure) {
    throw new Error("the /api dev proxy has no configure hook");
  }
  const listeners = new Map<string, (proxyRes: ProxyRes) => void>();
  const fakeProxy = {
    on(event: string, listener: (proxyRes: ProxyRes) => void) {
      listeners.set(event, listener);
    },
  };
  // The stand-in only implements the one emitter method the proxy uses.
  entry.configure(fakeProxy as never, entry);
  const listener = listeners.get("proxyRes");
  if (!listener) {
    throw new Error("the /api dev proxy registered no proxyRes listener");
  }
  return listener;
}

describe("dev /api proxy Content-Type fallback", () => {
  it("sets a JSON Content-Type when the gateway response omits one", () => {
    const proxyRes: ProxyRes = { headers: {} };

    registeredProxyResListener()(proxyRes);

    expect(proxyRes.headers["content-type"]).toBe(
      "application/json; charset=utf-8",
    );
  });

  it("preserves an existing Content-Type from the gateway", () => {
    const proxyRes: ProxyRes = {
      headers: { "content-type": "text/html; charset=utf-8" },
    };

    registeredProxyResListener()(proxyRes);

    expect(proxyRes.headers["content-type"]).toBe("text/html; charset=utf-8");
  });

  it("leaves every other response header untouched", () => {
    const proxyRes: ProxyRes = {
      headers: { "set-cookie": ["session=abc; Path=/"] },
    };

    registeredProxyResListener()(proxyRes);

    expect(proxyRes.headers["set-cookie"]).toEqual(["session=abc; Path=/"]);
    expect(proxyRes.headers["content-type"]).toBe(
      "application/json; charset=utf-8",
    );
  });
});
