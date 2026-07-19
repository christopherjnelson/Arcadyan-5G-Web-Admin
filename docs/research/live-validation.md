# Live validation

## Current run status

Live authenticated validation was not performed during the initial harness
implementation because `ARCADYAN_PASSWORD` was absent from the environment.
One unauthenticated request to the already-known gateway GET returned HTTP 200;
its response was discarded. Two later attempts to inspect only field paths and
types received no bytes before 4- and 10-second timeouts, so they were stopped
without further retries. No raw modem response, token, cookie, identifier,
screenshot, trace, or capture was written to the repository.

Run the suite as described in [testing.md](testing.md), then record only
sanitized observations in the table below. The local Playwright attachment is
the detailed source of field names/types and should not be committed.

| Endpoint                                      | Live status                                                            | Content-Type                         | Top-level shape                                                | UI fields checked                    | Polling                            | Confidence                                      |
| --------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------- | ------------------------------------ | ---------------------------------- | ----------------------------------------------- |
| `POST /TMI/v1/auth/login`                     | Not run (credential absent)                                            | Not observed                         | Expected `object`; body deliberately excluded from diagnostics | Authentication only                  | Initial login and only after a 401 | Static only                                     |
| `GET /TMI/v1/gateway/?get=all`                | HTTP 200 once without authorization; two subsequent transient timeouts | Missing on completed direct response | Not inspected; expected object: `device`, `signal`             | Not exercised through UI             | 5 seconds after completion         | Endpoint/status observed; schema/UI static only |
| `GET /TMI/v1/network/configuration/v2?get=ap` | Not run                                                                | Not observed                         | Expected object: `ssids` array                                 | Per-network 2.4GHz and 5GHz booleans | 20 seconds after completion        | Static only                                     |
| `GET /TMI/v1/network/telemetry/?get=clients`  | Not run                                                                | Not observed                         | Expected object: `clients` object                              | Counts for all three interfaces      | 5 seconds after completion         | Static only                                     |

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

## Safe observation procedure

After a successful run, inspect the local `sanitized-browser-diagnostics`
attachment. Copy only endpoint status, Content-Type, top-level structure,
field-name/type observations, and non-identifying discrepancies into this
document. Do not copy values for MAC, IP, SSID, key, token, cookie, serial,
IMEI, IMSI, ICCID, phone number, or client identity.
