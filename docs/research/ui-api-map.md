# UI-to-API map

This maps every modem-derived value displayed by the current application. It
documents current behavior; it does not assert that the modem semantics are
correct. All API requests are made by [`src/lib/api.ts`](../../src/lib/api.ts).

## Signal page

Source: `GET /TMI/v1/gateway/?get=all`, consumed by
[`SignalPage.tsx`](../../src/pages/SignalPage.tsx), with presentation helpers in
[`signal.ts`](../../src/lib/signal.ts).

| UI field               | Response property        | Transformation/assumption                                                  |
| ---------------------- | ------------------------ | -------------------------------------------------------------------------- |
| Gateway / HWVersion    | `device.hardwareVersion` | Displayed as a string                                                      |
| Gateway / MAC          | `device.macId`           | Displayed verbatim; sensitive                                              |
| Gateway / Manufacturer | `device.manufacturer`    | Displayed as a string                                                      |
| Gateway / Model        | `device.model`           | Displayed as a string                                                      |
| Gateway / SN           | `device.serial`          | Displayed verbatim; sensitive                                              |
| Gateway / Firmware     | `device.softwareVersion` | Displayed as a string                                                      |
| LTE fields             | `signal["4g"]`           | Entire block may be absent                                                 |
| 5G fields              | `signal["5g"]`           | Entire block may be absent                                                 |
| Signal label           | `<generation>.bars`      | 1–5 maps Poor/Fair/Good/Very Good/Excellent; other or missing maps Offline |
| Signal bar width       | `<generation>.bars`      | `(bars ?? 0) * 20`; assumes 0–5                                            |
| Band                   | `<generation>.bands`     | Arrays are joined with `, `; missing becomes N/A                           |
| RSRP                   | `<generation>.rsrp`      | Appends ` dBm`; missing block becomes N/A                                  |
| RSRQ                   | `<generation>.rsrq`      | Appends ` dB`; missing block becomes N/A                                   |
| SINR                   | `<generation>.sinr`      | Appends ` dB`; missing block becomes N/A                                   |

## Wi-Fi page

Source: `GET /TMI/v1/network/configuration/v2?get=ap`, consumed by
[`WifiPage.tsx`](../../src/pages/WifiPage.tsx),
[`WifiCard.tsx`](../../src/components/WifiCard.tsx), and
[`WifiSettings.tsx`](../../src/components/WifiSettings.tsx). One card is
rendered per `ssids[]` entry.

| UI field         | Response property                     | Transformation/assumption                                                                                              |
| ---------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Network number   | `ssids[]` array index                 | One-based display; index 0 cannot be deleted                                                                           |
| SSID             | `ssids[i].ssidName`                   | Displayed verbatim; sensitive                                                                                          |
| 2.4GHz Radio     | `ssids[i]["2.4ghzSsid"]`              | Boolean maps to enabled/disabled; global-radio interpretation unconfirmed                                              |
| 5 GHz Radio      | `ssids[i]["5.0ghzSsid"]`              | Boolean maps to enabled/disabled; global-radio interpretation unconfirmed                                              |
| Key              | `ssids[i].wpaKey`                     | Masked by default, displayed verbatim after user action; highly sensitive                                              |
| Encryption       | `encryptionVersion`, `encryptionMode` | Joined as `<version> with <mode>`                                                                                      |
| Hidden           | `isBroadcastEnabled`                  | Inverted: broadcast enabled → `false`, disabled → `true`                                                               |
| Edit form values | Same SSID fields                      | Merely opening Edit is local/read-only; Save sends a full state-changing configuration and is excluded from validation |

`guest` is typed and preserved on untouched entries but is not displayed. An
edited entry is forced to `guest: false`.

## System page

Source: `GET /TMI/v1/network/telemetry/?get=clients`, consumed by
[`SystemPage.tsx`](../../src/pages/SystemPage.tsx) and
[`DeviceCard.tsx`](../../src/components/DeviceCard.tsx).

| UI field       | Response property            | Transformation/assumption                           |
| -------------- | ---------------------------- | --------------------------------------------------- |
| 2.4GHz count   | `clients["2.4ghz"].length`   | Key and array assumed present                       |
| 5GHz count     | `clients["5.0ghz"].length`   | Key and array assumed present                       |
| Ethernet count | `clients.ethernet.length`    | Key and array assumed present                       |
| Device heading | `clients[interface][i].name` | Missing/empty becomes N/A; sensitive                |
| Connected      | `.connected`                 | Truthy maps Online, falsy maps Offline              |
| IP             | `.ipv4`                      | Missing/empty becomes N/A; sensitive                |
| Interface      | Parent object key            | Mapped to 2.4GHz, 5GHz, or Ethernet                 |
| MAC            | `.mac`                       | Displayed verbatim and used as React key; sensitive |

The password form and reboot controls do not display response data. They call
state-changing endpoints and are intentionally untouched by the hardware
suite. Login consumes `auth.token` internally but never displays it.

## Live mapping status

The 2026-07-18 guarded hardware run live-confirmed the response field names and
primitive types for all three read-only sources. It also compared the following
rendered values directly with the same live response, without retaining either
value:

- Signal: gateway model, firmware, and RSRP for both present signal blocks.
- Wi-Fi: the displayed 2.4GHz and 5GHz enabled/disabled state for every
  `ssids[]` entry.
- System: the displayed client count for all three interface arrays.

The remaining mappings in the tables are source-confirmed and their fields were
present with the documented primitive types, but their rendered values were not
individually compared by the harness. Device cards remained collapsed, so no
client identity was exposed during validation. Both `signal["4g"]` and
`signal["5g"]` were objects in this observation; behavior when either is absent
or null remains unobserved.

The v2 Wi-Fi response contained both the per-SSID band booleans used by the UI
and top-level `2.4ghz.isRadioEnabled` and `5.0ghz.isRadioEnabled` booleans. Live
presence does not establish that the per-SSID fields represent global radio
state, so the current “Radio” label remains a semantic assumption.
