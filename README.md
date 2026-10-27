# Arcadyan 5G Web Admin

A modern web admin for the Arcadyan KVD21 5G gateway (T-Mobile Home Internet).

# Getting Started

Requires Node.js 24.15+ on the Node 24 release line, or Node.js 26+.
The pinned development version is in `.node-version` and `.nvmrc`.

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

Build and start the production container on a machine connected to the gateway's LAN:

```sh
docker compose up --build -d
```

Open http://localhost:8080. Stop it with `docker compose down`.
The container serves the built app with Nginx and proxies `/api/*` to
`http://192.168.12.1/TMI/v1/*`. It preserves request bodies, authentication,
cookies, query strings, and upstream error status codes, and fills in a JSON
`Content-Type` only when the gateway did not supply one.

For a different gateway address or HTTP port:

```sh
GATEWAY_HOST=192.168.12.1 GATEWAY_PORT=80 docker compose up --build -d
```

`GATEWAY_HOST` accepts an IPv4 address or DNS hostname. The container must be
able to reach it; `localhost` inside the container refers to the container itself.
The published port binds to `127.0.0.1` by default. To allow other LAN clients,
change that address in `compose.yaml` to the host's LAN address. Those clients
will be able to reach the gateway's management API through the proxy.

The runtime runs as an unprivileged user, supports a read-only filesystem,
and needs only a small temporary filesystem at `/tmp`. The Compose configuration
drops all Linux capabilities and disables privilege escalation. Node.js, npm,
development dependencies, local environment files, and diagnostics are excluded
from the runtime image. `/healthz` checks the web server independently of gateway
availability.

To build and validate the image without contacting a real gateway:

```sh
docker build -t arcadyan-5g-web-admin:local .
python3 scripts/smoke-docker.py
```

The smoke checks use a temporary mock gateway, verify the production proxy and
SPA routes, and remove their containers and network when finished.

When deploying `dist/` without Docker, configure the same `/api/*` reverse proxy
in your web server. Vite's `server.proxy` applies only to development;
`npm run preview` serves static files and does not proxy API requests.

### Releases and automated checks

Pull requests and pushes to `master` run tests, lint, type checking, production
builds, and dependency audits on Node 24 and 26. They also build the Docker image,
run its mock-gateway smoke checks, and reject high or critical image vulnerabilities.
Dependabot maintains npm dependencies, Docker base images, and GitHub Actions.

Publishing a GitHub Release tagged `v<package.json version>` (initially `v1.0.0`)
validates the image again and publishes Linux AMD64 and ARM64 images to:

```text
ghcr.io/christopherjnelson/arcadyan-5g-web-admin:1.0.0
```

Stable releases also receive a minor-version tag, such as `1.0`, and `latest`.
The release workflow includes build provenance and an SBOM. Publishing uses
GitHub Actions' repository token, so no Docker Hub credentials are required.
For the first publication, check the package's visibility in GitHub Packages
and set it to public if anonymous pulls are desired.

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
