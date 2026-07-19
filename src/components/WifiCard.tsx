import { useState } from "react";
import { Alert } from "./ui/Alert";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { DetailRow } from "./ui/DetailRow";
import { VisibilityToggle } from "./ui/VisibilityToggle";
import { setWifiConfig } from "../lib/api";
import type { SsidConfig, WifiConfig } from "../lib/types";
import { WifiSettings } from "./WifiSettings";

export function WifiCard({
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
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // The primary network (index 0) cannot be deleted.
  const canDelete = index > 0;

  async function handleConfirmDelete() {
    setIsSaving(true);
    try {
      await setWifiConfig({
        ...wifiConfig,
        ssids: wifiConfig.ssids.filter((_, i) => i !== index),
      });
      setIsConfirmingDelete(false);
      onSaved();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card title={`Network ${index + 1}`}>
      <dl>
        <DetailRow label="SSID">{ssid.ssidName}</DetailRow>
        <DetailRow label="2.4GHz Radio">
          {ssid["2.4ghzSsid"] ? "enabled" : "disabled"}
        </DetailRow>
        <DetailRow label="5 GHz Radio">
          {ssid["5.0ghzSsid"] ? "enabled" : "disabled"}
        </DetailRow>
        <DetailRow
          label="Key"
          trailing={
            <VisibilityToggle
              visible={showKey}
              onToggle={() => setShowKey((v) => !v)}
              subject="key"
            />
          }
        >
          {showKey ? ssid.wpaKey : "**********"}
        </DetailRow>
        <DetailRow label="Encryption">
          {`${ssid.encryptionVersion} with ${ssid.encryptionMode}`}
        </DetailRow>
        <DetailRow label="Hidden">
          {ssid.isBroadcastEnabled ? "false" : "true"}
        </DetailRow>
      </dl>

      {!isConfirmingDelete && (
        <div className="mt-4 flex gap-2">
          <Button variant="primary" onClick={() => setIsEditing((v) => !v)}>
            {isEditing ? "Close" : "Edit"}
          </Button>
          {canDelete && (
            <Button
              variant="danger"
              onClick={() => setIsConfirmingDelete(true)}
            >
              Delete
            </Button>
          )}
        </div>
      )}

      {isEditing && (
        <WifiSettings
          index={index}
          ssid={ssid}
          wifiConfig={wifiConfig}
          onSaved={() => {
            setIsEditing(false);
            onSaved();
          }}
        />
      )}

      {isConfirmingDelete && (
        <div className="mt-4">
          <Alert title="Confirm WiFi Network Deletion?">
            <p>
              This will delete this network and all of its settings. You cannot
              undo this.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <Button
                variant="success"
                loading={isSaving}
                onClick={handleConfirmDelete}
              >
                Confirm
              </Button>
              <Button
                variant="ghost"
                disabled={isSaving}
                onClick={() => setIsConfirmingDelete(false)}
              >
                Cancel
              </Button>
            </div>
          </Alert>
        </div>
      )}
    </Card>
  );
}
