/**
 * Type definitions for the Arcadyan KVD21 TMI v1 API.
 *
 * These mirror the payloads returned by the gateway endpoints documented in
 * the README. Optional fields reflect values that disappear depending on
 * radio state (e.g. the 5G section when no NR connection is active).
 */

/** POST /auth/login response */
export interface LoginResponse {
  auth: {
    token: string;
  };
}

/** A single cellular signal block (LTE or 5G NR). */
export interface CellSignal {
  bands: string | string[];
  rsrp: number;
  rsrq: number;
  sinr: number;
  bars: number;
}

/** GET /gateway?get=all response */
export interface GatewayInfo {
  device: {
    hardwareVersion: string;
    macId: string;
    manufacturer: string;
    model: string;
    serial: string;
    softwareVersion: string;
  };
  signal: {
    "4g"?: CellSignal;
    "5g"?: CellSignal;
  };
}

export type EncryptionVersion = "WPA2/WPA3" | "WPA/WPA2" | "WPA2" | string;

/** One SSID entry inside the Wi-Fi configuration. */
export interface SsidConfig {
  "2.4ghzSsid": boolean;
  "5.0ghzSsid": boolean;
  encryptionMode: string;
  encryptionVersion: EncryptionVersion;
  guest: boolean;
  isBroadcastEnabled: boolean;
  ssidName: string;
  wpaKey: string;
}

/** GET/POST /network/configuration/v2?get=ap / ?set=ap */
export interface WifiConfig {
  ssids: SsidConfig[];
}

/** A client device connected to the gateway. */
export interface ClientDevice {
  name?: string;
  connected: boolean;
  ipv4?: string;
  mac: string;
}

export type ClientInterface = "2.4ghz" | "5.0ghz" | "ethernet";

/** GET /network/telemetry?get=clients response */
export interface ClientsResponse {
  clients: Record<ClientInterface, ClientDevice[]>;
}

export interface Credentials {
  username: string;
  password: string;
}
