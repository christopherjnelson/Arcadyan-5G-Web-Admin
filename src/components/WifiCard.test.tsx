import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SsidConfig, WifiBandConfig, WifiConfig } from "../lib/types";
import { WifiCard } from "./WifiCard";

vi.mock("../lib/api", () => ({
  setWifiConfig: vi.fn(),
}));

function bandConfig(isRadioEnabled: boolean): WifiBandConfig {
  return {
    airtimeFairness: true,
    channel: "Auto",
    channelBandwidth: "Auto",
    isMUMIMOEnabled: true,
    isRadioEnabled,
    isWMMEnabled: true,
    maxClients: 128,
    mode: "auto",
    transmissionPower: "100%",
  };
}

function ssidConfig(overrides: Partial<SsidConfig> = {}): SsidConfig {
  return {
    "2.4ghzSsid": true,
    "5.0ghzSsid": true,
    encryptionMode: "AES",
    encryptionVersion: "WPA2/WPA3",
    guest: false,
    isBroadcastEnabled: true,
    ssidName: "Test SSID",
    wpaKey: "test-password",
    ...overrides,
  };
}

function renderCard(config: WifiConfig) {
  render(
    <WifiCard
      index={0}
      ssid={config.ssids[0]}
      wifiConfig={config}
      onSaved={() => {}}
    />,
  );
}

function detailValue(label: string): string {
  const term = screen.getByText(label, { selector: "dt" });
  const value = term.nextElementSibling;
  expect(value, `${label} row should have a value`).not.toBeNull();
  return value!.textContent ?? "";
}

describe("WifiCard radio state", () => {
  it("reports global radio state from the top-level band flags, not per-SSID band membership (regression: issue #4)", () => {
    // The historical issue: both radios were disabled at the top level while
    // the SSID remained a member of both bands. Reading the per-SSID flags
    // made the UI wrongly report both radios as "enabled".
    const config: WifiConfig = {
      "2.4ghz": bandConfig(false),
      "5.0ghz": bandConfig(false),
      ssids: [ssidConfig({ "2.4ghzSsid": true, "5.0ghzSsid": true })],
    };

    renderCard(config);

    expect(detailValue("2.4GHz Radio")).toBe("disabled");
    expect(detailValue("5 GHz Radio")).toBe("disabled");
    expect(detailValue("2.4GHz SSID")).toBe("enabled");
    expect(detailValue("5 GHz SSID")).toBe("enabled");
  });

  it("shows per-SSID band membership independently of the radio state", () => {
    const config: WifiConfig = {
      "2.4ghz": bandConfig(true),
      "5.0ghz": bandConfig(true),
      ssids: [ssidConfig({ "2.4ghzSsid": true, "5.0ghzSsid": false })],
    };

    renderCard(config);

    expect(detailValue("2.4GHz Radio")).toBe("enabled");
    expect(detailValue("5 GHz Radio")).toBe("enabled");
    expect(detailValue("2.4GHz SSID")).toBe("enabled");
    expect(detailValue("5 GHz SSID")).toBe("disabled");
  });
});
