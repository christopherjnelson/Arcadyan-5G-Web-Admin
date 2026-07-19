/// <reference types="vitest/config" />
import type { IncomingHttpHeaders } from "node:http";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * The KVD21 returns JSON bodies without a Content-Type header, which makes
 * Firefox attempt XML parsing and log "XML Parsing Error: not well-formed"
 * for every successful response. Fill in a JSON Content-Type only when the
 * gateway sent none of its own; an existing value is never overridden.
 * Bodies, status codes, and cookies pass through untouched.
 *
 * Exported for dev-proxy.test.ts.
 */
export function ensureJsonContentType(headers: IncomingHttpHeaders): void {
  if (!headers["content-type"]) {
    headers["content-type"] = "application/json; charset=utf-8";
  }
}

// The KVD21 gateway listens on the LAN at 192.168.12.1.
// During development, /api/* is proxied to the gateway's TMI v1 API
// so the browser never deals with CORS.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://192.168.12.1",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/TMI/v1"),
        configure: (proxy) => {
          // proxyRes fires before the proxy writes response headers, so
          // mutating proxyRes.headers here is what the browser receives.
          proxy.on("proxyRes", (proxyRes) => {
            ensureJsonContentType(proxyRes.headers);
          });
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    css: false,
  },
});
