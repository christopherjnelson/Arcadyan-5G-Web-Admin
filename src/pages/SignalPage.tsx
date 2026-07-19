import { useCallback, useRef, useState } from "react";
import { Card } from "../components/ui/Card";
import { DetailRow } from "../components/ui/DetailRow";
import { InfoPopover } from "../components/ui/InfoPopover";
import { ProgressBar } from "../components/ui/ProgressBar";
import { Spinner } from "../components/ui/Spinner";
import { usePolling } from "../hooks/usePolling";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { getGatewayInfo } from "../lib/api";
import {
  formatBands,
  signalColor,
  signalLabel,
  signalPercent,
} from "../lib/signal";
import type { CellSignal, GatewayInfo } from "../lib/types";

const METRIC_INFO = {
  rsrp: {
    title: "RSRP",
    body: "Reference Signal Received Power — a measure of cellular signal strength received by your gateway. RSRP is always negative and typically ranges from -44 dBm to -140 dBm, with -80 or higher being ideal.",
  },
  rsrq: {
    title: "RSRQ",
    body: "Reference Signal Received Quality — reflects the quality of the received pilot signals. Typically ranges from -3 to -20 dB, with -10 or higher being ideal.",
  },
  sinr: {
    title: "SINR",
    body: "Signal to Interference & Noise Ratio — the amount of cellular signal interference received by your gateway. SINR can be positive or negative, with 20 or higher being ideal.",
  },
} as const;

const BAND_INFO = {
  "4g": "Extended range bands are Band 12 (700 MHz) or Band 71 (600 MHz). Greater maximum speed bands are Band 2 (1900 MHz), Band 5 (850 MHz), Band 4 (1700/2100 MHz), or Band 66 (extension of Band 4).",
  "5g": "The extended range band is n71 (600 MHz), while the greater maximum speed band is n41 (2.5 GHz).",
} as const;

function MetricRow({
  label,
  value,
  info,
}: {
  label: string;
  value: string;
  info: { title: string; body: string };
}) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-1 text-sm">
      <dt className="font-semibold text-slate-300">{label}</dt>
      <dd>{value}</dd>
      <dd>
        <InfoPopover title={info.title}>{info.body}</InfoPopover>
      </dd>
    </div>
  );
}

function SignalCard({
  title,
  bandInfo,
  signal,
  loading,
}: {
  title: string;
  bandInfo: string;
  signal?: CellSignal;
  loading: boolean;
}) {
  return (
    <Card title={title}>
      {loading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : (
        <dl>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-1 text-sm">
            <dt className="font-semibold text-slate-300">Signal</dt>
            <dd>
              <ProgressBar
                percent={signalPercent(signal?.bars)}
                colorClass={signalColor(signal?.bars)}
                label={signalLabel(signal?.bars)}
              />
            </dd>
            <dd />
          </div>
          <MetricRow
            label="Band"
            value={formatBands(signal?.bands)}
            info={{ title: "Band", body: bandInfo }}
          />
          <MetricRow
            label="RSRP"
            value={signal ? `${signal.rsrp} dBm` : "N/A"}
            info={METRIC_INFO.rsrp}
          />
          <MetricRow
            label="RSRQ"
            value={signal ? `${signal.rsrq} dB` : "N/A"}
            info={METRIC_INFO.rsrq}
          />
          <MetricRow
            label="SINR"
            value={signal ? `${signal.sinr} dB` : "N/A"}
            info={METRIC_INFO.sinr}
          />
        </dl>
      )}
    </Card>
  );
}

export function SignalPage() {
  const user = useRequireAuth();
  const [gatewayInfo, setGatewayInfo] = useState<GatewayInfo | null>(null);
  // Sequence guard so a slower, older response can never overwrite newer
  // data (e.g. when a manual refresh overlaps an in-flight poll).
  const requestSeq = useRef(0);

  usePolling(
    useCallback(async () => {
      const seq = ++requestSeq.current;
      try {
        const info = await getGatewayInfo();
        if (seq === requestSeq.current) setGatewayInfo(info);
      } catch {
        // Transient poll failures keep the last good data on screen.
      }
    }, []),
    5000,
    user !== null,
  );

  const loading = gatewayInfo === null;
  const device = gatewayInfo?.device;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Gateway">
          {loading || !device ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : (
            <dl>
              <DetailRow label="HWVersion">{device.hardwareVersion}</DetailRow>
              <DetailRow label="MAC">{device.macId}</DetailRow>
              <DetailRow label="Manufacturer">{device.manufacturer}</DetailRow>
              <DetailRow label="Model">{device.model}</DetailRow>
              <DetailRow label="SN">{device.serial}</DetailRow>
              <DetailRow label="Firmware">{device.softwareVersion}</DetailRow>
            </dl>
          )}
        </Card>
        <SignalCard
          title="LTE"
          bandInfo={BAND_INFO["4g"]}
          signal={gatewayInfo?.signal["4g"]}
          loading={loading}
        />
        <SignalCard
          title="5G"
          bandInfo={BAND_INFO["5g"]}
          signal={gatewayInfo?.signal["5g"]}
          loading={loading}
        />
      </div>
      <p className="text-sm text-slate-400">Refreshes every 5 seconds</p>
    </div>
  );
}
