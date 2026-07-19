import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../lib/api";
import type { SsidConfig, WifiBandConfig, WifiConfig } from "../lib/types";
import { WifiSettings } from "./WifiSettings";

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

function wifiConfig(overrides: Partial<WifiConfig> = {}): WifiConfig {
  return {
    "2.4ghz": bandConfig(true),
    "5.0ghz": bandConfig(true),
    ssids: [ssidConfig()],
    ...overrides,
  };
}

function renderSettings(config: WifiConfig) {
  return render(
    <WifiSettings
      index={0}
      ssid={config.ssids[0]}
      wifiConfig={config}
      onSaved={() => {}}
    />,
  );
}

function savedPayload(): WifiConfig {
  expect(api.setWifiConfig).toHaveBeenCalledTimes(1);
  return vi.mocked(api.setWifiConfig).mock.calls[0][0];
}

describe("WifiSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.setWifiConfig).mockResolvedValue(undefined);
  });

  it("maps the global radio controls to the top-level isRadioEnabled flags", async () => {
    const user = userEvent.setup();
    const config = wifiConfig();
    renderSettings(config);

    await user.click(screen.getByRole("switch", { name: "5 GHz Radio" }));
    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    await user.click(screen.getByRole("button", { name: "Disable Radio" }));

    await waitFor(() => expect(api.setWifiConfig).toHaveBeenCalledTimes(1));
    const payload = savedPayload();
    expect(payload["5.0ghz"].isRadioEnabled).toBe(false);
    expect(payload["2.4ghz"].isRadioEnabled).toBe(true);
  });

  it("maps the per-SSID band controls only to membership fields", async () => {
    const user = userEvent.setup();
    renderSettings(wifiConfig());

    await user.click(
      screen.getByRole("switch", { name: "Broadcast this SSID on 5 GHz" }),
    );
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(api.setWifiConfig).toHaveBeenCalledTimes(1));
    const payload = savedPayload();
    expect(payload.ssids[0]["5.0ghzSsid"]).toBe(false);
    expect(payload.ssids[0]["2.4ghzSsid"]).toBe(true);
  });

  it("changing a radio does not modify SSID band membership", async () => {
    const user = userEvent.setup();
    const config = wifiConfig();
    renderSettings(config);

    await user.click(screen.getByRole("switch", { name: "2.4 GHz Radio" }));
    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    await user.click(screen.getByRole("button", { name: "Disable Radio" }));

    await waitFor(() => expect(api.setWifiConfig).toHaveBeenCalledTimes(1));
    expect(savedPayload().ssids).toEqual(config.ssids);
  });

  it("changing SSID band membership does not modify the radios", async () => {
    const user = userEvent.setup();
    const config = wifiConfig();
    renderSettings(config);

    await user.click(
      screen.getByRole("switch", { name: "Broadcast this SSID on 2.4 GHz" }),
    );
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(api.setWifiConfig).toHaveBeenCalledTimes(1));
    const payload = savedPayload();
    expect(payload["2.4ghz"]).toEqual(config["2.4ghz"]);
    expect(payload["5.0ghz"]).toEqual(config["5.0ghz"]);
  });

  it("preserves unmodeled and unrelated configuration properties in the save payload", async () => {
    const user = userEvent.setup();
    // bandSteering was observed live but is not modeled by WifiConfig; the
    // future* fields stand in for any property a newer firmware may add.
    const bandWithExtra = { ...bandConfig(true), futureBandField: "keep-me" };
    const ssidWithExtra = { ...ssidConfig(), futureSsidField: 42 };
    const config = {
      "2.4ghz": bandWithExtra,
      "5.0ghz": bandConfig(true),
      ssids: [ssidWithExtra],
      bandSteering: { isBandSteeringEnabled: true },
    } as WifiConfig;
    renderSettings(config);

    const nameInput = screen.getByLabelText("SSID");
    await user.clear(nameInput);
    await user.type(nameInput, "Renamed SSID");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(api.setWifiConfig).toHaveBeenCalledTimes(1));
    expect(savedPayload()).toEqual({
      ...config,
      ssids: [{ ...config.ssids[0], ssidName: "Renamed SSID" }],
    });
  });

  it("requires explicit confirmation before disabling a radio", async () => {
    const user = userEvent.setup();
    renderSettings(wifiConfig());

    await user.click(screen.getByRole("switch", { name: "5 GHz Radio" }));
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(api.setWifiConfig).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "If your device is connected to the gateway through it, you will be disconnected.",
    );
  });

  it("sends no request when the disable confirmation is cancelled", async () => {
    const user = userEvent.setup();
    renderSettings(wifiConfig());

    await user.click(screen.getByRole("switch", { name: "5 GHz Radio" }));
    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(api.setWifiConfig).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("enabling a radio saves directly without confirmation", async () => {
    const user = userEvent.setup();
    renderSettings(
      wifiConfig({ "2.4ghz": bandConfig(false), "5.0ghz": bandConfig(true) }),
    );

    await user.click(screen.getByRole("switch", { name: "2.4 GHz Radio" }));
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await waitFor(() => expect(api.setWifiConfig).toHaveBeenCalledTimes(1));
    expect(savedPayload()["2.4ghz"].isRadioEnabled).toBe(true);
  });

  it("blocks disabling both radios behind a strong warning and acknowledgment", async () => {
    const user = userEvent.setup();
    renderSettings(wifiConfig());

    await user.click(screen.getByRole("switch", { name: "2.4 GHz Radio" }));
    await user.click(screen.getByRole("switch", { name: "5 GHz Radio" }));
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(api.setWifiConfig).not.toHaveBeenCalled();
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("disables all Wi-Fi on the gateway");

    const confirm = screen.getByRole("button", { name: "Disable All Wi-Fi" });
    expect(confirm).toBeDisabled();

    await user.click(
      screen.getByRole("checkbox", {
        name: "I understand this will turn off all Wi-Fi on the gateway.",
      }),
    );
    expect(confirm).toBeEnabled();
    await user.click(confirm);

    await waitFor(() => expect(api.setWifiConfig).toHaveBeenCalledTimes(1));
    const payload = savedPayload();
    expect(payload["2.4ghz"].isRadioEnabled).toBe(false);
    expect(payload["5.0ghz"].isRadioEnabled).toBe(false);
  });

  it("applies the strong warning even when both radios were already off", async () => {
    const user = userEvent.setup();
    renderSettings(
      wifiConfig({
        "2.4ghz": bandConfig(false),
        "5.0ghz": bandConfig(false),
      }),
    );

    const nameInput = screen.getByLabelText("SSID");
    await user.clear(nameInput);
    await user.type(nameInput, "Renamed SSID");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(api.setWifiConfig).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "disables all Wi-Fi on the gateway",
    );
  });
});
