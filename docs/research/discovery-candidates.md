# Discovery candidates

Discovery here is limited to current source/types, README/history, and fields
returned by existing application flows. No endpoint enumeration or parameter
probing is authorized.

## Fields known from current source

| Field/reference                                             | Current use                                                                          | Classification                     | Observation and possible future value                                                                                                                                                                    |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ssids[].guest`                                             | Not displayed; preserved for untouched entries, forced false when an entry is edited | Likely understood; possibly useful | The name suggests guest-network classification, but semantics and mutability are not live-confirmed. Do not build a control from the name alone.                                                         |
| `device.macId`, `device.serial`                             | Displayed                                                                            | Clearly understood; sensitive      | Existing UI values, not discovery candidates. Diagnostics retain only their field names and type.                                                                                                        |
| `ssids[].ssidName`, `ssids[].wpaKey`                        | Displayed/masked                                                                     | Clearly understood; sensitive      | Existing UI values. Never persist values.                                                                                                                                                                |
| Client `name`, `ipv4`, `mac`                                | Displayed on demand                                                                  | Clearly understood; sensitive      | Existing UI values. Counts can be validated without expanding device cards.                                                                                                                              |
| `signal["4g"]`, `signal["5g"]` missing blocks               | Rendered as offline/N/A                                                              | Likely understood                  | Absence is currently interpreted as no active generation. A live run should distinguish missing, null, and empty objects before raising confidence.                                                      |
| Historical `2.4ghz.isRadioEnabled`, `5.0ghz.isRadioEnabled` | No current use                                                                       | Unknown; possibly useful           | Present in commit `e522ee8` with the older `/network/configuration?get=ap` shape. Relationship to v2 per-SSID band booleans is unknown. Do not call the old endpoint or change radio state in this task. |

## README-only paths

The paths for telemetry `get=sim`, telemetry `get=cell`, `version`, schedules,
refresh, onboarding, `/auth.fcgi`, and `/login_app.cgi?chk` are evidenced only
as README references. They are endpoint candidates, not observed response
fields. This task does not call them because the current app flow does not.
`version` and the telemetry queries may eventually be useful read-only sources,
but even GET must wait for clear method/auth evidence from an already observed
response or a separately agreed investigation.

## Classifying fields after a hardware run

The diagnostic attachment records complete object key structure and primitive
types without values. For every additional field returned by one of the three
known GETs, add a row with:

- exact parent path and observed type/nullability;
- whether the current UI consumes it;
- `clearly understood`, `likely understood`, `unknown`, or `sensitive`;
- observation separated from any hypothesis;
- a future read-only use, if supported by evidence.

Field names alone are insufficient to claim meaning. Avoid recording even a
sanitized example value when type and structural context are enough.
