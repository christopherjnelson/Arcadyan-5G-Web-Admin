import { useState } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDown } from "lucide-react";
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
  const [isSaving, setIsSaving] = useState(false);

  const isValid = ssidName.length >= 1 && wpaKey.length >= 8;

  async function handleSave() {
    setIsSaving(true);
    try {
      await setWifiConfig({
        ...wifiConfig,
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
      });
      onSaved();
    } finally {
      setIsSaving(false);
    }
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

      <div className="max-w-xs space-y-1">
        <Toggle label="2.4GHz SSID" checked={band24} onChange={setBand24} />
        <Toggle label="5GHz SSID" checked={band5} onChange={setBand5} />
        <Toggle
          label="Broadcast SSID"
          checked={broadcast}
          onChange={setBroadcast}
        />
      </div>

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

      <div>
        <Button onClick={handleSave} loading={isSaving} disabled={!isValid}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
