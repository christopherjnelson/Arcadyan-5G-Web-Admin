# Arcadyan 5G Web Admin

A modern web admin for the Arcadyan KVD21 5G gateway (T-Mobile Home Internet).

# Getting Started

Requires Node.js 20.19+ (or 22.12+).

- git clone https://github.com/christopherjnelson/Arcadyan-5G-Web-Admin.git
- cd Arcadyan-5G-Web-Admin
- npm install
- npm run dev

Then open http://localhost:5173 while connected to the gateway's network.
The dev server proxies `/api/*` to `http://192.168.12.1/TMI/v1/*` (see
`vite.config.ts`), so no CORS setup is needed.

> VPNs must be disabled in order to connect to the gateway via the webapp.

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check and produce a production build in `dist/`
- `npm run preview` — serve the production build locally
- `npm test` — run the Vitest suite
- `npm run test:watch` — run Vitest in watch mode
- `npm run test:hardware` — run the opt-in, read-only Playwright gateway suite
- `npm run lint` — run ESLint
- `npm run format` — run Prettier
- `npm run typecheck` — run `tsc` without emitting

Hardware validation is skipped unless `ARCADYAN_PASSWORD` is present. See
[`docs/research/testing.md`](docs/research/testing.md) for the safety boundary,
local diagnostics, and sensitive-data precautions.

## Production

The `/api` → `http://192.168.12.1/TMI/v1` proxy is **development-only**:
it lives in `server.proxy` (`vite.config.ts`), which applies only to
`vite dev`. `npm run preview` serves the built assets for verification
but does **not** proxy API requests, and statically hosted `dist/`
output has no proxy at all. A production deployment must reverse-proxy
`/api/*` → `http://192.168.12.1/TMI/v1/*` (e.g. via nginx or Caddy on
the gateway's LAN), or every API call will 404.

The gateway returns JSON bodies without a `Content-Type` header; the dev
proxy fills in `application/json; charset=utf-8` when it is missing, so a
production reverse proxy should do the same. See
[`docs/research/live-validation.md`](docs/research/live-validation.md)
for the full observation.

# Tech Stack

- React 19 + TypeScript, built with Vite
- Tailwind CSS v4 + Headless UI (disclosure, popover, menu, switch)
- React Router v7
- axios, with a centralized client (`src/lib/api.ts`) that transparently
  re-authenticates and retries once on 401 responses
- Vitest + React Testing Library

# Overview

This project started as a simple way to monitor the advanced cell metrics provided by the Arcadyan KVD21 and per usual, ballooned into an full fledged Web Admin for the device. I used a packet sniffer to monitor the HTTP requests the T-Mobile Home Internet App transmits and then did my best to re-produce the Mobile App's functionality. ~~Using nmap, I was able to deduce that the Gateway is running a custom version of OpenWRT~~ (According to [this user](https://github.com/chainofexecution/Arcadyan-KVD21), the gateway is running Android) but without SSH enabled, there isnt much more we can do outside of the functionality available via the currently exposed API's I've discovered. Any attempts to discover new endpoints via brute force have been unsuccessful.

# Upcoming Functionality

- Add New WiFi Network
- Ban/Delete Client from Network
- Display metric rating in Signal Popover
- Historic Cell Metric Data

# Documentation

Detailed research and validation notes live in [`docs/research/`](docs/research/).

| Document | Description |
| --- | --- |
| [`endpoint-inventory.md`](docs/research/endpoint-inventory.md) | Every known endpoint with method, auth, classification, and consumer; includes the open ports observed on the gateway. |
| [`ui-api-map.md`](docs/research/ui-api-map.md) | Which response fields each UI element displays and how they are transformed. |
| [`discovery-candidates.md`](docs/research/discovery-candidates.md) | Field-level discovery from live flows; candidate fields for future use. |
| [`live-validation.md`](docs/research/live-validation.md) | Sanitized results of guarded hardware runs and the radio-toggle experiment. |
| [`testing.md`](docs/research/testing.md) | How to run the opt-in hardware suite safely; sensitive-data precautions. |