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

## Investigated README candidates

`/TMI/v1/version`, `/TMI/v1/network/telemetry?get=sim`, and
`/TMI/v1/network/telemetry?get=cell` each returned two HTTP 200 responses during
the authorized 2026-07-18 follow-up exact-allowlist probe. Persistent ignored
diagnostics retained the value-free evidence after the reporter exited. Each
pair had an identical schema. No observed path was null in either response;
that does not establish universal non-nullability.

### Version response

| Observed field path | Type/null observation  | Classification | Interpretation and possible future read-only use                                                                                                                                                           |
| ------------------- | ---------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version`           | number; not null twice | Unknown        | A numeric field under the top-level object. Its unit, scope, and relation to firmware are unknown. It might support read-only compatibility detection only after its meaning is independently established. |

### SIM response

The top level was an object containing an object at `sim`.

| Observed field path | Type/null observation   | Classification | Interpretation and possible future read-only use                                                                                                                                                      |
| ------------------- | ----------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sim.iccId`         | string; not null twice  | Sensitive      | Identifier-shaped field; value was not retained. No UI use is recommended.                                                                                                                            |
| `sim.imei`          | string; not null twice  | Sensitive      | Device identifier field; value was not retained. No UI use is recommended.                                                                                                                            |
| `sim.imsi`          | string; not null twice  | Sensitive      | Subscriber identifier field; value was not retained. No UI use is recommended.                                                                                                                        |
| `sim.msisdn`        | string; not null twice  | Sensitive      | Subscriber/phone identifier field; value was not retained. No UI use is recommended.                                                                                                                  |
| `sim.status`        | boolean; not null twice | Unknown        | A boolean named `status`; what state, polarity, or readiness it represents was not tested. It could support a read-only SIM-health indicator only after semantics and failure states are established. |

### Cell response

The top level was an object containing `cell`. Under it, `4g`, `5g`, `generic`,
and `gps` were objects. The paths below were present with the same types in both
responses.

| Observed field path(s)                                                                             | Type/null observation                          | Classification                                    | Interpretation and possible future read-only use                                                                                                                          |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cell.4g.bandwidth`, `cell.5g.bandwidth`                                                           | string; not null twice                         | Likely interpretation                             | Names suggest radio bandwidth, but format and units are unknown. Possible read-only radio diagnostics after validation.                                                   |
| `cell.4g.cqi`, `cell.5g.cqi`                                                                       | number; not null twice                         | Likely interpretation                             | Names suggest a channel-quality metric, but scale and meaning were not tested. Possible read-only diagnostics after validation.                                           |
| `cell.4g.earfcn`, `cell.5g.earfcn`                                                                 | string; not null twice                         | Unknown                                           | Field names resemble channel identifiers, but the shared spelling and string encoding prevent a semantic claim. Potentially sensitive network metadata; retain no values. |
| `cell.4g.ecgi`, `cell.5g.ecgi`                                                                     | string; not null twice                         | Sensitive                                         | Cellular identifier-shaped metadata; values were not retained.                                                                                                            |
| `cell.4g.mcc`, `cell.5g.mcc`, `cell.4g.mnc`, `cell.5g.mnc`, `cell.4g.plmn`, `cell.5g.plmn`         | string; not null twice                         | Sensitive                                         | Subscriber/network and potentially location-related metadata; values were not retained.                                                                                   |
| `cell.4g.pci`, `cell.5g.pci`, `cell.4g.tac`, `cell.5g.tac`                                         | string; not null twice                         | Sensitive                                         | Cell/tower or location-related identifier metadata; values were not retained.                                                                                             |
| `cell.4g.status`, `cell.5g.status`                                                                 | boolean; not null twice                        | Unknown                                           | Boolean presence is observed; state meaning and polarity are unknown. Possible read-only connection indicator only after validation.                                      |
| `cell.4g.sector.bands`, `cell.5g.sector.bands`                                                     | array of strings; not null and non-empty twice | Likely interpretation; sensitive network metadata | Container and element type are observed. Exact band meaning and active/available distinction are unknown; values were not retained.                                       |
| `cell.4g.sector.bars`, `cell.5g.sector.bars`                                                       | number; not null twice                         | Likely interpretation                             | Names suggest a signal summary, but range and equivalence to existing UI bars are untested.                                                                               |
| `cell.4g.sector.cid`, `cell.5g.sector.cid`                                                         | number; not null twice                         | Sensitive                                         | Cell identifier fields; values were not retained.                                                                                                                         |
| `cell.4g.sector.eNBID`, `cell.5g.sector.gNBID`                                                     | number; not null twice                         | Sensitive                                         | Tower/network identifier fields; values were not retained.                                                                                                                |
| `cell.4g.sector.rsrp`, `.rsrq`, `.rssi`, `.sinr`; `cell.5g.sector.rsrp`, `.rsrq`, `.rssi`, `.sinr` | number; not null twice                         | Likely interpretation                             | Names suggest signal metrics, but units, ranges, and presentation semantics were not tested. Possible read-only diagnostics after validation.                             |
| `cell.4g.supportedBands`, `cell.5g.supportedBands`                                                 | array of strings; not null and non-empty twice | Likely interpretation                             | Container and element type are observed. Whether these are modem, carrier, or serving-cell capabilities is unknown.                                                       |
| `cell.generic.apn`                                                                                 | string; not null twice                         | Sensitive                                         | APN field; value was not retained.                                                                                                                                        |
| `cell.generic.hasIPv6`, `cell.generic.roaming`                                                     | boolean; not null twice                        | Likely interpretation                             | Names suggest network state, but semantics were not exercised. Possible read-only status after validation.                                                                |
| `cell.generic.registration`                                                                        | string; not null twice                         | Unknown                                           | A registration-related string; vocabulary and state meaning are unknown. Possible read-only status after validation.                                                      |
| `cell.gps.latitude`, `cell.gps.longitude`                                                          | number; not null twice                         | Sensitive                                         | Precise location fields; values were not retained and should not be persisted.                                                                                            |

No response-derived related path was retained. No additional endpoint was
investigated.

## Remaining README-only paths

The paths for schedules, refresh, onboarding, `/auth.fcgi`, and
`/login_app.cgi?chk` remain README references only. They are endpoint
candidates, not observed response fields, and were not called by this task.

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
