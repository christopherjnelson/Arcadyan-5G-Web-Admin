# Live validation

## Current run status

Authenticated validation was attempted through the normal login UI on
2026-07-18 with the required credential present in the process environment.
The browser issued exactly the allowed `POST /TMI/v1/auth/login`, but the
request received no HTTP response before the application's approximately
four-second Axios timeout aborted it. Repeated suite runs reproduced the same
pre-response timeout, including one run with a longer Playwright test timeout.
No authenticated page or known authenticated GET was reached, and the mutation
guard observed no other state-changing request.

The earlier unauthenticated evidence remains unchanged: one request to the
already-known gateway GET returned HTTP 200 and its response was discarded;
two later direct attempts received no bytes before 4- and 10-second timeouts.
No raw modem response, header, token, cookie, credential, identifier,
screenshot, trace, HAR, or capture was retained. Because the authenticated run
produced no response body, it supplied no schema, UI-mapping, or unused-field
evidence; `ui-api-map.md` and `discovery-candidates.md` therefore remain
unchanged.

Run the suite as described in [testing.md](testing.md), then record only
sanitized observations in the table below. The local Playwright attachment is
the detailed source of field names/types and should not be committed.

| Endpoint                                      | Live status                                                            | Content-Type                         | Top-level shape                                           | UI fields checked                    | Polling                            | Confidence                                             |
| --------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------- | ------------------------------------ | ---------------------------------- | ------------------------------------------------------ |
| `POST /TMI/v1/auth/login`                     | Request emitted; no HTTP response before client timeout                | Not observed                         | Not observed; body deliberately excluded from diagnostics | Authentication only                  | Initial login and only after a 401 | Request path/method live-confirmed; schema static only |
| `GET /TMI/v1/gateway/?get=all`                | HTTP 200 once without authorization; two subsequent transient timeouts | Missing on completed direct response | Not inspected; expected object: `device`, `signal`        | Not exercised through UI             | 5 seconds after completion         | Endpoint/status observed; schema/UI static only        |
| `GET /TMI/v1/network/configuration/v2?get=ap` | Not run                                                                | Not observed                         | Expected object: `ssids` array                            | Per-network 2.4GHz and 5GHz booleans | 20 seconds after completion        | Static only                                            |
| `GET /TMI/v1/network/telemetry/?get=clients`  | Not run                                                                | Not observed                         | Expected object: `clients` object                         | Counts for all three interfaces      | 5 seconds after completion         | Static only                                            |

## Discrepancies to validate live

- The Vite proxy inserts `application/json; charset=utf-8` only when the modem
  omits Content-Type. Diagnostics report what the browser received, so a value
  of that type does not prove the firmware itself supplied it.
- README uses `/gateway/get=all`; runtime code uses `/gateway/?get=all`.
- Wi-Fi booleans named `2.4ghzSsid` and `5.0ghzSsid` are presented as radio
  state. The historical implementation instead referenced top-level
  `isRadioEnabled` fields on an older endpoint shape.
- The declared TypeScript shapes do not prove runtime type, nullability, or
  field presence. The hardware run must specifically note strings in place of
  numbers/booleans, nulls, missing keys, and additional keys.

The 2026-07-18 run did not confirm or disprove any of these discrepancies. It
stopped at the login timeout before an authenticated response was available.

## Safe observation procedure

After a successful run, inspect the local `sanitized-browser-diagnostics`
attachment. Copy only endpoint status, Content-Type, top-level structure,
field-name/type observations, and non-identifying discrepancies into this
document. Do not copy values for MAC, IP, SSID, key, token, cookie, serial,
IMEI, IMSI, ICCID, phone number, or client identity.
