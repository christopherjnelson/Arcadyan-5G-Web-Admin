# Discovery candidates

Discovery here is limited to current source/types, README/history, and fields
returned by existing application flows. No endpoint enumeration or parameter
probing is authorized.

## Fields known from current source

| Field/reference                                  | Current use                                                                          | Classification                     | Observation and possible future value                                                                                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ssids[].guest`                                  | Not displayed; preserved for untouched entries, forced false when an entry is edited | Likely understood; possibly useful | The name suggests guest-network classification, but semantics and mutability are not live-confirmed. Do not build a control from the name alone.                                            |
| `device.macId`, `device.serial`                  | Displayed                                                                            | Clearly understood; sensitive      | Existing UI values, not discovery candidates. Diagnostics retain only their field names and type.                                                                                           |
| `ssids[].ssidName`, `ssids[].wpaKey`             | Displayed/masked                                                                     | Clearly understood; sensitive      | Existing UI values. Never persist values.                                                                                                                                                   |
| Client `name`, `ipv4`, `mac`                     | Displayed on demand                                                                  | Clearly understood; sensitive      | Existing UI values. Counts can be validated without expanding device cards.                                                                                                                 |
| `signal["4g"]`, `signal["5g"]` missing blocks    | Rendered as offline/N/A                                                              | Likely understood                  | Absence is currently interpreted as no active generation. A live run should distinguish missing, null, and empty objects before raising confidence.                                         |
| `2.4ghz.isRadioEnabled`, `5.0ghz.isRadioEnabled` | No current use                                                                       | Likely understood; possibly useful | Observed as booleans in the live v2 response as well as in historical code. Relationship to v2 per-SSID band booleans remains unknown. Do not change radio state without separate approval. |

## Additional fields observed in current application flows

These paths and types were observed twice with identical shapes during the
successful 2026-07-18 guarded run. No values were retained, and names alone do
not establish semantics.

| Field/reference                                                                            | Observed type    | Current use | Classification and evidence-only note                               |
| ------------------------------------------------------------------------------------------ | ---------------- | ----------- | ------------------------------------------------------------------- |
| `device.friendlyName`, `device.name`, `device.role`, `device.type`, `device.updateState`   | string           | None        | Unknown; field presence/type only                                   |
| `device.isEnabled`, `device.isMeshSupported`                                               | boolean          | None        | Likely understood by name; semantics not tested                     |
| `device.manufacturerOUI`                                                                   | string           | None        | Sensitive identifier-related metadata; value not retained           |
| `signal["4g"].cid`, `signal["4g"].eNBID`, `signal["5g"].cid`, `signal["5g"].gNBID`         | number           | None        | Sensitive network identifiers; values not retained                  |
| `signal["4g"].rssi`, `signal["5g"].rssi`                                                   | number           | None        | Likely signal metrics; meaning/presentation not tested              |
| `signal.generic.apn`, `.registration`                                                      | string           | None        | APN may be sensitive; field presence/type only                      |
| `signal.generic.hasIPv6`, `.roaming`                                                       | boolean          | None        | Likely status fields; semantics not tested                          |
| `time.daylightSavings.isUsed`                                                              | boolean          | None        | Likely time configuration; semantics not tested                     |
| `time.localTime`, `time.upTime`                                                            | number           | None        | Units and epoch/clock semantics unknown                             |
| `time.localTimeZone`                                                                       | string           | None        | Potentially location-sensitive; value not retained                  |
| `2.4ghz`, `5.0ghz`: `airtimeFairness`, `isMUMIMOEnabled`, `isRadioEnabled`, `isWMMEnabled` | boolean          | None        | Likely radio configuration flags; read-only presence/type confirmed |
| `2.4ghz`, `5.0ghz`: `channel`, `channelBandwidth`, `mode`, `transmissionPower`             | string           | None        | Likely radio configuration; exact formats/semantics not retained    |
| `2.4ghz.maxClients`, `5.0ghz.maxClients`                                                   | number           | None        | Likely configured limits; semantics not tested                      |
| `bandSteering.isEnabled`                                                                   | boolean          | None        | Likely band-steering state; semantics not tested                    |
| `clients[interface][].ipv6`                                                                | array of strings | None        | Sensitive client addressing; values not retained                    |

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
