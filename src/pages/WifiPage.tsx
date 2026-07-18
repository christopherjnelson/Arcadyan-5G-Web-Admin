import { useCallback, useState } from "react";
import { Spinner } from "../components/ui/Spinner";
import { WifiCard } from "../components/WifiCard";
import { usePolling } from "../hooks/usePolling";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { getWifiConfig } from "../lib/api";
import type { WifiConfig } from "../lib/types";

export function WifiPage() {
  const user = useRequireAuth();
  const [wifiConfig, setWifiConfig] = useState<WifiConfig | null>(null);

  const refresh = useCallback(() => {
    getWifiConfig()
      .then(setWifiConfig)
      .catch(() => {
        // Transient poll failures keep the last good data on screen.
      });
  }, []);

  usePolling(refresh, 20000, user !== null);

  if (!wifiConfig) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {wifiConfig.ssids.map((ssid, index) => (
        <WifiCard
          key={index}
          index={index}
          ssid={ssid}
          wifiConfig={wifiConfig}
          onSaved={refresh}
        />
      ))}
    </div>
  );
}
