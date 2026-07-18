/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

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
