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

## Explicit candidate probe

`tests/hardware/candidates.hardware.ts` is a separate opt-in investigation
harness. An ordinary `npm run test:hardware` run skips it. It is enabled only
when both `ARCADYAN_PASSWORD` is non-empty and
`ARCADYAN_CANDIDATE_PROBE=1` is supplied to a targeted Playwright invocation.
Its API GET allowlist contains only the known gateway health path and the three
approved README candidates; path or query variations are aborted and fail the
test. The normal login POST remains the only permitted non-GET request.

The harness logs in once, stops application polling, keeps the token only in
memory, uses four-second request timeouts, sends requests sequentially, waits
at least three seconds between candidate requests, caps each candidate at two
GETs, compares sanitized shapes only, and checks gateway health before probing
and after each candidate pair. It never retries login or changes a path after
an error status.

Sanitized diagnostics are written beneath the ignored
`.playwright-artifacts` directory and attached to the local result. Do not
commit that directory. A completed candidate run consumes the two-request
allowance for each endpoint and must not be repeated merely to recover a
missing artifact.

## Explicit radio-toggle mutation validation

`tests/hardware/radio-toggle.hardware.ts` is a separately authorized mutation
harness. An ordinary `npm run test:hardware` run skips it, and it must never
run by default or in CI. It is enabled only when both `ARCADYAN_PASSWORD` is
non-empty and `ARCADYAN_RADIO_MUTATION=1` is supplied to a targeted Playwright
invocation. Its route guard permits GETs, the normal login POST, and the
single approved `POST /api/network/configuration/v2?set=ap`; any other
request is aborted and fails the test.

Run it only on a host wired to the gateway over Ethernet, and only when the
radio experiment is explicitly approved:

```sh
ARCADYAN_RADIO_MUTATION=1 npx playwright test radio-toggle
```

The harness logs in through the UI, captures the Wi-Fi configuration in
memory, selects the band with the fewest connected clients (tie: 5 GHz), and
skips unless that band is currently enabled. It disables the radio through
the normal edit UI, including the confirmation step, then polls sanitized
readbacks until the change is confirmed — tolerating the gateway's transient
HTTP 408s while the radio subsystem settles — and verifies that band
membership and the other band's radio state did not change. It then waits
for the application's own display to reflect the fresh state, re-enables the
radio through the UI (enabling requires no confirmation), and confirms
restoration through sanitized readbacks. If the UI-driven restore cannot
complete, a fallback posts the in-memory original configuration back up to
three times, strictly as restoration.

The harness records only sanitized booleans, client counts, and step labels.
Raw configuration bodies, tokens, and identifiers stay in memory and are
never attached, logged, or committed.
