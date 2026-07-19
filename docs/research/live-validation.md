# Live validation

## Current run status

Authenticated validation completed through the normal login UI on 2026-07-18.
The guarded Playwright run passed in 1.8 seconds, visited Signal, WiFi, and
System, and observed no console warning/error or attempted state-changing
request. It emitted seven API requests: one login POST and two GETs to each of
the three active read-only endpoints. Every API request returned HTTP 200; the
login took 19 ms and the GETs took 27--174 ms. The duplicate GETs occurred
during the development render and had identical shapes.

The sanitized diagnostic retained only paths, status, browser-visible
Content-Type, durations, and field names/types. It retained no raw modem value,
request body, header, token, cookie, credential, identifier, screenshot, trace,
HAR, or capture. The earlier timeout observations remain useful operational
history, but they do not describe this successful run.

Run the suite as described in [testing.md](testing.md), then record only
sanitized observations in the table below. The local Playwright attachment is
the detailed source of field names/types and should not be committed.

| Endpoint                                      | Live status                     | Browser-visible Content-Type      | Observed top-level shape                    | UI fields checked                                        | Polling                            | Confidence                  |
| --------------------------------------------- | ------------------------------- | --------------------------------- | ------------------------------------------- | -------------------------------------------------------- | ---------------------------------- | --------------------------- |
| `POST /TMI/v1/auth/login`                     | HTTP 200 in 19 ms               | `application/json; charset=utf-8` | Deliberately excluded from diagnostics      | Authentication only                                      | Initial login and only after a 401 | Live endpoint/status        |
| `GET /TMI/v1/gateway/?get=all`                | Two HTTP 200s in 170 and 174 ms | `application/json; charset=utf-8` | `device`, `signal`, and `time` objects      | Model, firmware, and RSRP for both present signal blocks | 5 seconds after completion         | Live schema and selected UI |
| `GET /TMI/v1/network/configuration/v2?get=ap` | Two HTTP 200s in 58 and 61 ms   | `application/json; charset=utf-8` | `2.4ghz`, `5.0ghz`, `bandSteering`, `ssids` | Every SSID's 2.4GHz and 5GHz displayed state             | 20 seconds after completion        | Live schema and selected UI |
| `GET /TMI/v1/network/telemetry/?get=clients`  | Two HTTP 200s in 27 and 31 ms   | `application/json; charset=utf-8` | `clients` object                            | Counts for all three interfaces                          | 5 seconds after completion         | Live schema and selected UI |

## Discrepancies to validate live

- The Vite proxy inserts `application/json; charset=utf-8` only when the modem
  omits Content-Type. Diagnostics report what the browser received, so a value
  of that type does not prove the firmware itself supplied it.
- README uses `/gateway/get=all`; runtime code uses `/gateway/?get=all`.
- Wi-Fi booleans named `2.4ghzSsid` and `5.0ghzSsid` are presented as radio
  state. The live v2 response also contains top-level `2.4ghz.isRadioEnabled`
  and `5.0ghz.isRadioEnabled`; the run did not establish that these global
  flags and the per-SSID flags have equivalent semantics.
- The declared TypeScript shapes do not prove runtime type, nullability, or
  field presence. The hardware run must specifically note strings in place of
  numbers/booleans, nulls, missing keys, and additional keys.

The live run confirmed `/gateway/?get=all`, confirmed that the per-SSID flags
are booleans and match what the current UI displays, and confirmed the primitive
types documented in `discovery-candidates.md`. It did not test the meaning or
mutability of any field. The Content-Type value above is what the browser saw;
because the Vite fallback supplies it when absent, it does not prove the modem
firmware sent that header.

## Second README-candidate investigation

On 2026-07-18, after the direct known gateway GET returned HTTP 200 and the
existing guarded hardware suite passed, an opt-in exact-allowlist probe used
normal UI login and issued two sequential authenticated GETs to each of the
three approved README candidates. It waited at least three seconds between
candidate requests and rechecked the known gateway GET before advancing. All
six candidate requests received HTTP responses, each pair had the same
sanitized parse result, every health recheck responded, and no unapproved
request was attempted.

The list reporter discarded the run's in-memory diagnostic attachment after
the pass. Exact status numbers, elapsed times, browser-visible Content-Type,
top-level shapes, field names, primitive types, and nullability therefore
cannot be documented from retained evidence. No candidate is called safe or
live-confirmed, and no field classification is made. The diagnostics helper
now writes the same sanitized attachment to the ignored Playwright result
directory so a future separately authorized run would retain it.

| Endpoint                                      | Classification       | Retained evidence                                       |
| --------------------------------------------- | -------------------- | ------------------------------------------------------- |
| `GET /TMI/v1/version`                         | Returned status only | Two responses; stable sanitized parse result            |
| `GET /TMI/v1/network/telemetry?get=sim`       | Returned status only | Two responses; stable sanitized parse result            |
| `GET /TMI/v1/network/telemetry?get=cell`      | Returned status only | Two responses; stable sanitized parse result            |
| `GET /TMI/v1/gateway/?get=all` health recheck | Live HTTP response   | Responded before probing and after every candidate pair |

## Safe observation procedure

After a successful run, inspect the local `sanitized-browser-diagnostics`
attachment. Copy only endpoint status, Content-Type, top-level structure,
field-name/type observations, and non-identifying discrepancies into this
document. Do not copy values for MAC, IP, SSID, key, token, cookie, serial,
IMEI, IMSI, ICCID, phone number, or client identity.
