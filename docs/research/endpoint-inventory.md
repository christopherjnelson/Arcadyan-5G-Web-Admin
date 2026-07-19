# Endpoint inventory

This inventory was produced from the current source, README, and Git history on
`research/api-validation`. Browser paths below use `/api`; Vite rewrites that
prefix to `/TMI/v1` on the gateway. “Authenticated” means the centralized Axios
client sends a bearer token after login.

## Active application endpoints

| Gateway path                              | Method | Parameters/body                                 | Auth                                                         | API function         | Consumer                                                            | Classification     | Expected response and UI assumptions                                                                                                                                                                                                              |
| ----------------------------------------- | ------ | ----------------------------------------------- | ------------------------------------------------------------ | -------------------- | ------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/TMI/v1/auth/login`                      | POST   | JSON `{ username: "admin", password }`          | No                                                           | `login`              | `AuthContext`, reached from `LoginPage`; also 401 re-authentication | Login exception    | `{ auth: { token: string } }`; a 401 means invalid credentials. The password is retained in memory for re-authentication.                                                                                                                         |
| `/TMI/v1/gateway/?get=all`                | GET    | Query `get=all`                                 | Client sends token; direct live GET returned 200 without one | `getGatewayInfo`     | `SignalPage`                                                        | Read-only          | Object with required `device` and `signal`; `signal.4g` and `signal.5g` may be absent. Numeric metric and bar values are assumed, while `bands` may be a string or string array. Polled immediately, then 5 seconds after each completed request. |
| `/TMI/v1/network/configuration/v2?get=ap` | GET    | Query `get=ap`                                  | Yes                                                          | `getWifiConfig`      | `WifiPage`, `WifiCard`, `WifiSettings`                              | Read-only          | `{ ssids: SsidConfig[] }`; array order identifies “Network N” and index 0 is assumed undeletable. Radio booleans are read from each SSID's `2.4ghzSsid` and `5.0ghzSsid`. Polled immediately, then every 20 seconds.                              |
| `/TMI/v1/network/telemetry/?get=clients`  | GET    | Query `get=clients`                             | Yes                                                          | `getClients`         | `SystemPage`, `DeviceCard`                                          | Read-only          | `{ clients: { "2.4ghz": [], "5.0ghz": [], ethernet: [] } }`; all three keys and arrays are assumed present. Polled immediately, then 5 seconds after each completed request.                                                                      |
| `/TMI/v1/network/configuration/v2?set=ap` | POST   | Query `set=ap`; complete `WifiConfig` JSON body | Yes                                                          | `setWifiConfig`      | `WifiCard` delete and `WifiSettings` save                           | **State-changing** | No response body is consumed. Editing hardcodes `encryptionMode: "AES"` and `guest: false`; deleting removes an SSID by array index. Explicitly excluded from hardware validation.                                                                |
| `/TMI/v1/gateway/reset?set=reboot`        | POST   | Query `set=reboot`; null body                   | Yes                                                          | `rebootGateway`      | `SystemPage`                                                        | **State-changing** | No response body is consumed; connection failure is swallowed because rebooting drops the gateway. Explicitly excluded from hardware validation.                                                                                                  |
| `/TMI/v1/auth/admin/reset`                | POST   | JSON `{ usernameNew: "admin", passwordNew }`    | Yes                                                          | `resetAdminPassword` | `SystemPage`                                                        | **State-changing** | No response body is consumed. The UI subsequently logs in with the new password. Explicitly excluded from hardware validation.                                                                                                                    |

Source locations: [`src/lib/api.ts`](../../src/lib/api.ts),
[`src/context/AuthContext.tsx`](../../src/context/AuthContext.tsx), and the
pages/components named above.

## Documented but inactive paths

These paths occur in the README but have no current caller. They were not
called or probed in this task. A method shown as “unknown” is not inferred from
the path name.

| Referenced path                      | Method                                               | Evidence/status                                                                           |
| ------------------------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `/TMI/v1/network/telemetry?get=sim`  | GET (query wording implies read, not live-confirmed) | README only                                                                               |
| `/TMI/v1/network/telemetry?get=cell` | GET (query wording implies read, not live-confirmed) | README only                                                                               |
| `/TMI/v1/auth/refresh`               | Unknown                                              | README only                                                                               |
| `/TMI/v1/profile/schedules`          | Unknown                                              | README only                                                                               |
| `/TMI/v1/version`                    | Unknown                                              | README only                                                                               |
| `/TMI/v1/setup/onboard`              | Unknown                                              | README only; likely setup-related, so treat as potentially state-changing until evidenced |
| `/auth.fcgi`                         | Unknown                                              | README only; outside `/TMI/v1`                                                            |
| `/login_app.cgi?chk`                 | Unknown                                              | README only; outside `/TMI/v1`                                                            |

The README spelling `/TMI/v1/gateway/get=all` is inconsistent with the active
code and historical implementation, which both use
`/TMI/v1/gateway/?get=all`. The README also lists configuration `v2` set/get
paths without stating methods.

## Mapping risks and historical radio-state issue

- Current radio display and editing use per-SSID booleans `2.4ghzSsid` and
  `5.0ghzSsid`. Their names suggest SSID band membership, but the UI labels
  them as global “Radio” state. That interpretation is unconfirmed.
- Commit `e522ee8` used the older `/network/configuration?get=ap` shape and
  wrote top-level `2.4ghz.isRadioEnabled` and `5.0ghz.isRadioEnabled`. The
  current v2 shape contains no typed `isRadioEnabled`. These fields must not be
  treated as equivalent without read-only evidence and a separately approved
  state-changing experiment.
- `Hidden` deliberately inverts `isBroadcastEnabled`: `true` displays
  `false`, and `false` displays `true`.
- Missing client interface keys cause rendering/test failures; missing signal
  generations are handled as offline/N/A.
- `bars` is multiplied by 20 without clamping. Values outside 0–5 would yield
  an out-of-range percentage and the default label/color behavior.
- Wi-Fi network identity is array-index based, including the assumption that
  index 0 is the primary network.
