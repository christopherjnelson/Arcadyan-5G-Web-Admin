import { useState } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDown } from "lucide-react";
import { Alert } from "./ui/Alert";
import { Button } from "./ui/Button";
import { TextInput } from "./ui/TextInput";
import { Toggle } from "./ui/Toggle";
import { setWifiConfig } from "../lib/api";
import type { EncryptionVersion, SsidConfig, WifiConfig } from "../lib/types";

const ENCRYPTION_OPTIONS: EncryptionVersion[] = [
  "WPA2/WPA3",
  "WPA/WPA2",
  "WPA2",
];

type RadioConfirmation = "disable-radio" | "disable-all";

export function WifiSettings({
  index,
  ssid,
  wifiConfig,
  onSaved,
}: {
  index: number;
  ssid: SsidConfig;
  wifiConfig: WifiConfig;
  onSaved: () => void;
}) {
  const [ssidName, setSsidName] = useState(ssid.ssidName);
  const [wpaKey, setWpaKey] = useState(ssid.wpaKey);
  const [band24, setBand24] = useState(ssid["2.4ghzSsid"]);
  const [band5, setBand5] = useState(ssid["5.0ghzSsid"]);
  const [broadcast, setBroadcast] = useState(ssid.isBroadcastEnabled);
  const [encryption, setEncryption] = useState<EncryptionVersion>(
    ssid.encryptionVersion,
  );
  // Global per-band radio state, distinct from this SSID's band membership.
  const [radio24, setRadio24] = useState(wifiConfig["2.4ghz"].isRadioEnabled);
  const [radio5, setRadio5] = useState(wifiConfig["5.0ghz"].isRadioEnabled);
  const [pendingConfirmation, setPendingConfirmation] =
    useState<RadioConfirmation | null>(null);
  const [disableAllAcknowledged, setDisableAllAcknowledged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isValid = ssidName.length >= 1 && wpaKey.length >= 8;

  // Bands this submission would newly turn off, used for the warning text.
  const disablingBands: string[] = [];
  if (wifiConfig["2.4ghz"].isRadioEnabled && !radio24) {
    disablingBands.push("2.4 GHz");
  }
  if (wifiConfig["5.0ghz"].isRadioEnabled && !radio5) {
    disablingBands.push("5 GHz");
  }

  // The gateway expects the complete configuration on save. Every branch
  // spreads the fetched objects so properties this app does not model
  // (e.g. the observed top-level bandSteering object) are never silently
  // dropped from the payload.
  function buildConfig(): WifiConfig {
    return {
      ...wifiConfig,
      "2.4ghz": { ...wifiConfig["2.4ghz"], isRadioEnabled: radio24 },
      "5.0ghz": { ...wifiConfig["5.0ghz"], isRadioEnabled: radio5 },
      ssids: wifiConfig.ssids.map((entry, i) =>
        i === index
          ? {
              ...entry,
              "2.4ghzSsid": band24,
              "5.0ghzSsid": band5,
              encryptionMode: "AES",
              encryptionVersion: encryption,
              guest: false,
              isBroadcastEnabled: broadcast,
              ssidName,
              wpaKey,
            }
          : entry,
      ),
    };
  }

  async function save() {
    setIsSaving(true);
    try {
      await setWifiConfig(buildConfig());
      onSaved();
    } finally {
      setIsSaving(false);
    }
  }

  function handleSave() {
    if (!radio24 && !radio5) {
      // Turning off every radio gets the strongest guard.
      setPendingConfirmation("disable-all");
    } else if (disablingBands.length > 0) {
      setPendingConfirmation("disable-radio");
    } else {
      void save();
    }
  }

  function handleConfirm() {
    // Re-evaluate at confirm time: if both radios would now be off, escalate
    // to the stronger guard instead of saving under the weaker one.
    if (!radio24 && !radio5 && pendingConfirmation !== "disable-all") {
      setPendingConfirmation("disable-all");
      return;
    }
    void save();
  }

  function cancelConfirmation() {
    setPendingConfirmation(null);
    setDisableAllAcknowledged(false);
  }

  return (
    <div className="mt-4 space-y-4 border-t border-slate-700 pt-4">
      <TextInput
        id={`ssid-name-${index}`}
        label="SSID"
        type="text"
        required
        maxLength={28}
        value={ssidName}
        invalid={ssidName.length < 1}
        onChange={(e) => setSsidName(e.target.value)}
      />
      <TextInput
        id={`ssid-key-${index}`}
        label="Password"
        type="password"
        required
        maxLength={63}
        value={wpaKey}
        invalid={wpaKey.length < 8}
        onChange={(e) => setWpaKey(e.target.value)}
      />

      <fieldset
        className="max-w-xs space-y-1"
        disabled={pendingConfirmation !== null}
      >
        <legend className="text-sm font-medium text-slate-200">
          Radios (affect every network)
        </legend>
        <Toggle label="2.4 GHz Radio" checked={radio24} onChange={setRadio24} />
        <Toggle label="5 GHz Radio" checked={radio5} onChange={setRadio5} />
      </fieldset>

      <fieldset className="max-w-xs space-y-1">
        <legend className="text-sm font-medium text-slate-200">
          This network
        </legend>
        <Toggle
          label="Broadcast this SSID on 2.4 GHz"
          checked={band24}
          onChange={setBand24}
        />
        <Toggle
          label="Broadcast this SSID on 5 GHz"
          checked={band5}
          onChange={setBand5}
        />
        <Toggle
          label="Broadcast SSID"
          checked={broadcast}
          onChange={setBroadcast}
        />
      </fieldset>

      <Menu as="div" className="relative inline-block">
        <MenuButton className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
          {encryption}
          <ChevronDown className="h-4 w-4" />
        </MenuButton>
        <MenuItems className="absolute z-10 mt-1 w-40 rounded-md border border-slate-600 bg-slate-800 py-1 shadow-xl focus:outline-none">
          {ENCRYPTION_OPTIONS.map((option) => (
            <MenuItem key={option}>
              <button
                type="button"
                onClick={() => setEncryption(option)}
                className="block w-full px-4 py-2 text-left text-sm text-slate-200 data-[focus]:bg-slate-700"
              >
                {option}
              </button>
            </MenuItem>
          ))}
        </MenuItems>
      </Menu>

      {pendingConfirmation === null ? (
        <div>
          <Button onClick={handleSave} loading={isSaving} disabled={!isValid}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      ) : (
        <Alert
          title={
            pendingConfirmation === "disable-all"
              ? "Disable All Wi-Fi?"
              : "Disable Wi-Fi Radio?"
          }
        >
          {pendingConfirmation === "disable-all" ? (
            <>
              <p>
                This turns off both radios and disables all Wi-Fi on the
                gateway. Every wireless device will be disconnected, and Wi-Fi
                can only be turned back on from a wired connection.
              </p>
              <div className="mt-3 flex items-start gap-2">
                <input
                  id={`disable-all-ack-${index}`}
                  type="checkbox"
                  checked={disableAllAcknowledged}
                  onChange={(e) => setDisableAllAcknowledged(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-rose-500"
                />
                <label htmlFor={`disable-all-ack-${index}`}>
                  I understand this will turn off all Wi-Fi on the gateway.
                </label>
              </div>
            </>
          ) : (
            <p>
              Disabling the {disablingBands.join(" and ")} radio turns off that
              band for every Wi-Fi network. If your device is connected to the
              gateway through it, you will be disconnected.
            </p>
          )}
          <div className="mt-3 flex justify-end gap-2">
            <Button
              variant="danger"
              loading={isSaving}
              disabled={
                !isValid ||
                (pendingConfirmation === "disable-all" &&
                  !disableAllAcknowledged)
              }
              onClick={handleConfirm}
            >
              {pendingConfirmation === "disable-all"
                ? "Disable All Wi-Fi"
                : "Disable Radio"}
            </Button>
            <Button
              variant="ghost"
              disabled={isSaving}
              onClick={cancelConfirmation}
            >
              Cancel
            </Button>
          </div>
        </Alert>
      )}
    </div>
  );
}
