import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";
import { DetailRow } from "./ui/DetailRow";
import type { ClientDevice } from "../lib/types";

export function DeviceCard({
  interfaceName,
  device,
}: {
  interfaceName: string;
  device: ClientDevice;
}) {
  return (
    <Card title={device.name || "N/A"}>
      <dl>
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-1 text-sm">
          <dt className="font-semibold text-slate-300">Connected</dt>
          <dd>
            {device.connected ? (
              <Badge color="green">Online</Badge>
            ) : (
              <Badge color="red">Offline</Badge>
            )}
          </dd>
        </div>
        <DetailRow label="IP">{device.ipv4 || "N/A"}</DetailRow>
        <DetailRow label="Interface">{interfaceName}</DetailRow>
        <DetailRow label="MAC">{device.mac}</DetailRow>
      </dl>
    </Card>
  );
}
