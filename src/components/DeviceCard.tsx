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
        <DetailRow label="Connected">
          {device.connected ? (
            <Badge color="green">Online</Badge>
          ) : (
            <Badge color="red">Offline</Badge>
          )}
        </DetailRow>
        <DetailRow label="IP">{device.ipv4 || "N/A"}</DetailRow>
        <DetailRow label="Interface">{interfaceName}</DetailRow>
        <DetailRow label="MAC">{device.mac}</DetailRow>
      </dl>
    </Card>
  );
}
