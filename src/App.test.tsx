import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import * as api from "./lib/api";

vi.mock("./lib/api", () => ({
  login: vi.fn(),
  setAuthToken: vi.fn(),
  setReauthHandler: vi.fn(),
  classifyApiError: vi.fn(),
  getGatewayInfo: vi.fn(),
  getWifiConfig: vi.fn(),
  getClients: vi.fn(),
  setWifiConfig: vi.fn(),
  rebootGateway: vi.fn(),
  resetAdminPassword: vi.fn(),
}));

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("application navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.login).mockResolvedValue("test-token");
    // Hold reads in flight so navigation can be checked without modem fixtures.
    vi.mocked(api.getGatewayInfo).mockImplementation(
      () => new Promise(() => {}),
    );
    vi.mocked(api.getWifiConfig).mockImplementation(
      () => new Promise(() => {}),
    );
    vi.mocked(api.getClients).mockImplementation(() => new Promise(() => {}));
  });

  it.each(["/", "/wifi", "/system", "/unknown"])(
    "redirects an unauthenticated visit to %s before polling the gateway",
    async (path) => {
      renderApp(path);

      expect(
        await screen.findByRole("heading", { name: "Log In" }),
      ).toBeVisible();
      expect(api.getGatewayInfo).not.toHaveBeenCalled();
      expect(api.getWifiConfig).not.toHaveBeenCalled();
      expect(api.getClients).not.toHaveBeenCalled();
      expect(
        screen.queryByRole("link", { name: "Logout" }),
      ).not.toBeInTheDocument();
    },
  );

  it("logs in, navigates desktop and mobile links, and logs out", async () => {
    const user = userEvent.setup();
    renderApp("/login");

    await user.type(screen.getByLabelText("Password"), "synthetic-password");
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(api.getGatewayInfo).toHaveBeenCalledOnce());
    expect(api.login).toHaveBeenCalledWith({
      username: "admin",
      password: "synthetic-password",
    });
    expect(screen.getByRole("link", { name: "Signal" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await user.click(screen.getByRole("link", { name: "System" }));
    expect(screen.getByLabelText("Current Password")).toBeVisible();
    expect(screen.getByRole("link", { name: "System" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await waitFor(() => expect(api.getClients).toHaveBeenCalledOnce());

    const menu = screen.getByRole("button", { name: "Open menu" });
    await user.click(menu);
    expect(menu).toHaveAttribute("aria-expanded", "true");
    const wifiLinks = screen.getAllByRole("link", { name: "WiFi" });
    expect(wifiLinks).toHaveLength(2);
    await user.click(wifiLinks[1]);
    await waitFor(() => expect(api.getWifiConfig).toHaveBeenCalledOnce());
    expect(menu).toHaveAttribute("aria-expanded", "false");
    expect(screen.getAllByRole("link", { name: "WiFi" })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "WiFi" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await user.click(screen.getByRole("link", { name: "Logout" }));
    expect(
      await screen.findByRole("heading", { name: "Log In" }),
    ).toBeVisible();
    expect(api.setAuthToken).toHaveBeenLastCalledWith(null);
    expect(
      screen.queryByRole("link", { name: "System" }),
    ).not.toBeInTheDocument();
  });
});
