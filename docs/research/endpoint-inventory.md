# Endpoint inventory

This inventory was produced from the current source, README, and Git history on
`research/api-validation`. Browser paths below use `/api`; Vite rewrites that
prefix to `/TMI/v1` on the gateway. “Authenticated” means the centralized Axios
client sends a bearer token after login.

## Active application endpoints

| Gateway path                              | Method | Parameters/body                                 | Auth                                                         | API function         | Consumer                                                            | Classification     | Expected response and UI assumptions                                                                                                                                                                                                                             |
| ----------------------------------------- | ------ | ----------------------------------------------- | ------------------------------------------------------------ | -------------------- | ------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/TMI/v1/auth/login`                      | POST   | JSON `{ username: "admin", password }`          | No                                                           | `login`              | `AuthContext`, reached from `LoginPage`; also 401 re-authentication | Login exception    | `{ auth: { token: string } }`; a 401 means invalid credentials. The password is retained in memory for re-authentication.                                                                                                                                        |
| `/TMI/v1/gateway/?get=all`                | GET    | Query `get=all`                                 | Client sends token; direct live GET returned 200 without one | `getGatewayInfo`     | `SignalPage`                                                        | Read-only          | Live response contained `device`, `signal`, and `time`; both signal generations were objects with numeric metrics/bars and string-array bands. Missing-generation behavior remains unobserved. Polled immediately, then 5 seconds after completion.              |
| `/TMI/v1/network/configuration/v2?get=ap` | GET    | Query `get=ap`                                  | Yes                                                          | `getWifiConfig`      | `WifiPage`, `WifiCard`, `WifiSettings`                              | Read-only          | Live response contained `2.4ghz`, `5.0ghz`, `bandSteering`, and `ssids`. Radio state is displayed from the top-level `isRadioEnabled` booleans; per-SSID band flags are displayed and edited only as band membership. Polled immediately, then every 20 seconds. |
| `/TMI/v1/network/telemetry/?get=clients`  | GET    | Query `get=clients`                             | Yes                                                          | `getClients`         | `SystemPage`, `DeviceCard`                                          | Read-only          | Live `clients` contained all three interface arrays. Observed client objects had boolean `connected`, string `name`/`ipv4`/`mac`, and a string-array `ipv6`; empty interface arrays are valid. Polled immediately, then 5 seconds after completion.              |
| `/TMI/v1/network/configuration/v2?set=ap` | POST   | Query `set=ap`; complete `WifiConfig` JSON body | Yes                                                          | `setWifiConfig`      | `WifiCard` delete and `WifiSettings` save                           | **State-changing** | No response body is consumed. Editing hardcodes `encryptionMode: "AES"` and `guest: false`; deleting removes an SSID by array index. Explicitly excluded from hardware validation.                                                                               |
| `/TMI/v1/gateway/reset?set=reboot`        | POST   | Query `set=reboot`; null body                   | Yes                                                          | `rebootGateway`      | `SystemPage`                                                        | **State-changing** | No response body is consumed; connection failure is swallowed because rebooting drops the gateway. Explicitly excluded from hardware validation.                                                                                                                 |
| `/TMI/v1/auth/admin/reset`                | POST   | JSON `{ usernameNew: "admin", passwordNew }`    | Yes                                                          | `resetAdminPassword` | `SystemPage`                                                        | **State-changing** | No response body is consumed. The UI subsequently logs in with the new password. Explicitly excluded from hardware validation.                                                                                                                                   |

Source locations: [`src/lib/api.ts`](../../src/lib/api.ts),
[`src/context/AuthContext.tsx`](../../src/context/AuthContext.tsx), and the
pages/components named above.

## README candidate probe

The 2026-07-18 follow-up read-only investigation issued two authenticated GETs
to each approved candidate below. Persistent ignored diagnostics worked: they
retained status, elapsed time, browser-visible Content-Type, and value-free
field/type structure after the passing list reporter exited. Every request was
HTTP 200, each endpoint pair had an identical schema, and the known gateway
health GET continued to return HTTP 200 after every pair. These observations
confirm the responses and their structures, but do not establish field
semantics or authorize application use.

| Referenced path                      | Method | Sanitized live evidence                                                            |
| ------------------------------------ | ------ | ---------------------------------------------------------------------------------- |
| `/TMI/v1/version`                    | GET    | Two HTTP 200s in 9--10 ms; top-level object containing numeric `version`           |
| `/TMI/v1/network/telemetry?get=sim`  | GET    | Two HTTP 200s in 9--16 ms; top-level object containing a structured `sim` object   |
| `/TMI/v1/network/telemetry?get=cell` | GET    | Two HTTP 200s in 24--57 ms; top-level object containing a structured `cell` object |

All three exposed `application/json; charset=utf-8` to the browser. The Vite
proxy supplies that value when the gateway omits Content-Type, so this does not
prove the modem sent the header. See `discovery-candidates.md` for the complete
value-free paths, types, null observations, array structures, and cautious
classifications.

No response-derived related path was retained or investigated.

## Other documented but inactive paths

These paths occur in the README but have no current caller. They were not
called or probed in this task. A method shown as “unknown” is not inferred from
the path name.

| Referenced path             | Method  | Evidence/status                                                                           |
| --------------------------- | ------- | ----------------------------------------------------------------------------------------- |
| `/TMI/v1/auth/refresh`      | Unknown | README only                                                                               |
| `/TMI/v1/profile/schedules` | Unknown | README only                                                                               |
| `/TMI/v1/setup/onboard`     | Unknown | README only; likely setup-related, so treat as potentially state-changing until evidenced |
| `/auth.fcgi`                | Unknown | README only; outside `/TMI/v1`                                                            |
| `/login_app.cgi?chk`        | Unknown | README only; outside `/TMI/v1`                                                            |

The README spelling `/TMI/v1/gateway/get=all` is inconsistent with the active
code and historical implementation, which both use
`/TMI/v1/gateway/?get=all`. The README also lists configuration `v2` set/get
paths without stating methods.

## Mapping risks and historical radio-state issue

- Radio display and editing previously used per-SSID booleans `2.4ghzSsid` and
  `5.0ghzSsid` under a global “Radio” label. Issue #4 showed both top-level
  `2.4ghz.isRadioEnabled` and `5.0ghz.isRadioEnabled` as `false` while the UI
  reported the radios enabled, proving the per-SSID flags are band membership,
  not radio state. The UI now reads radio state from the top-level flags and
  labels the per-SSID flags as SSID band membership.
- Commit `e522ee8` used the older `/network/configuration?get=ap` shape and
  wrote top-level `2.4ghz.isRadioEnabled` and `5.0ghz.isRadioEnabled`. The live
  v2 response also contains those booleans, and the TypeScript shape now
  includes them. The UI remains read-only for radio state; changing it would
  require separately approved state-changing evidence.
- `Hidden` deliberately inverts `isBroadcastEnabled`: `true` displays
  `false`, and `false` displays `true`.
- Missing client interface keys cause rendering/test failures; missing signal
  generations are handled as offline/N/A.
- `bars` is multiplied by 20 without clamping. Values outside 0–5 would yield
  an out-of-range percentage and the default label/color behavior.
- Wi-Fi network identity is array-index based, including the assumption that
  index 0 is the primary network.

## Open ports

These are the TCP ports observed open on the gateway. They are host-level
observations, not API endpoints, and none beyond 80/TCP are used by this
application.

| Port      | Service        | Notes                       |
| --------- | -------------- | --------------------------- |
| 53/TCP    | domain         | Cloudflare public DNS       |
| 80/TCP    | http           | lighttpd 1.4.59 (API host)  |
| 3517/TCP  | 802-11-iapp?   | Unidentified                |
| 8080/TCP  | http-proxy     | Unidentified                |
