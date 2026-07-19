# Safe hardware validation

The Playwright suite logs in through the normal UI, visits Signal, WiFi, and
System, observes the three GET endpoints already used by the app, and compares
selected DOM values with their source JSON properties. It never clicks Edit,
Delete, Save Changes, Show Devices, or Reboot Gateway.

More importantly, a browser routing guard permits only GET and exactly one
kind of mutation: `POST /api/auth/login`. Any other POST, PUT, PATCH, DELETE, or
unexpected method is aborted and fails the test.

## Prerequisites

- Connect the test host to the gateway LAN and disable any route-conflicting
  VPN.
- Use a supported Node.js version and run `npm install`.
- Install the local Chromium binary once with `npx playwright install chromium`.
- Supply the admin password only in the process environment. Never put it in a
  `.env` file, shell history, Playwright config, fixture, or command argument.

For example, export `ARCADYAN_PASSWORD` using your shell's secure local method,
then run:

```sh
npm run test:hardware
```

If the variable is absent, the hardware test reports a clean skip. If the
gateway or credentials are unavailable, it fails at navigation/login with no
endpoint probing. The config starts Vite on `127.0.0.1:5173` or reuses an
existing server there.

## Diagnostics and sensitive data

The test attaches `sanitized-browser-diagnostics` to its local result. It
contains request method, sanitized path/query, status, browser-visible
Content-Type, approximate duration, object field names/types, classified
console warnings/errors, and failed-request summaries. It never records
request headers/body, response values, authorization, cookies, or login response
shape. Sensitive comparisons throw generic descriptions instead of actual and
expected values.

Screenshots, video, HTML reports, and traces are disabled by default. To retain
a trace only when the test fails:

```sh
ARCADYAN_PLAYWRIGHT_TRACE=1 npm run test:hardware
```

Traces can contain credentials, tokens, response bodies, and identifying data.
Keep them local, inspect them cautiously, and delete them when no longer needed.
`.gitignore` excludes Playwright output, reports, traces/ZIPs, HAR files, packet
captures, local environment files, and common generated directories.

## Reviewing a run

Record only sanitized conclusions in [live-validation.md](live-validation.md)
and unused field names/types in
[discovery-candidates.md](discovery-candidates.md). Before committing, run
`git status --ignored --short` and confirm that no trace, screenshot, report,
raw response, environment file, or capture is staged.

The suite intentionally does not validate Wi-Fi saves/deletes, admin password
reset, reboot, onboarding, schedules, authentication refresh, undocumented
paths, unknown parameters, or any control inferred from newly observed fields.
