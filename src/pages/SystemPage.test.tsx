import { useEffect } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../context/AuthContext";
import { useAuth } from "../hooks/useAuth";
import * as api from "../lib/api";
import { SystemPage } from "./SystemPage";

vi.mock("../lib/api", () => ({
  login: vi.fn(),
  setAuthToken: vi.fn(),
  setReauthHandler: vi.fn(),
  getClients: vi.fn(),
  rebootGateway: vi.fn(),
  resetAdminPassword: vi.fn(),
}));

const CURRENT_PASSWORD = "current-password";
const NEW_PASSWORD = "brand-new-password";

/** Logs in once, then renders the page under test. */
function Authenticated() {
  const { user, login } = useAuth();
  useEffect(() => {
    if (!user) void login(CURRENT_PASSWORD).catch(() => {});
  }, [user, login]);
  return <SystemPage />;
}

async function renderSystemPage() {
  await act(async () => {
    render(
      <MemoryRouter initialEntries={["/system"]}>
        <AuthProvider>
          <Authenticated />
        </AuthProvider>
      </MemoryRouter>,
    );
  });
  // Polling only starts once the login above has committed.
  await waitFor(() => expect(api.getClients).toHaveBeenCalled());
}

async function submitPasswordForm(current: string, next: string) {
  await userEvent.type(screen.getByLabelText("Current Password"), current);
  await userEvent.type(screen.getByLabelText("New Password"), next);
  await userEvent.click(screen.getByRole("button", { name: /save changes/i }));
}

describe("SystemPage password change", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.login).mockResolvedValue("token-1");
    // Keep the clients poll pending so it never disturbs the form.
    vi.mocked(api.getClients).mockReturnValue(new Promise(() => {}));
  });

  it("refreshes the stored credential after a successful password change", async () => {
    vi.mocked(api.resetAdminPassword).mockResolvedValue(undefined);
    await renderSystemPage();

    await submitPasswordForm(CURRENT_PASSWORD, NEW_PASSWORD);

    await screen.findByText(/Password updated/);
    expect(api.resetAdminPassword).toHaveBeenCalledWith(NEW_PASSWORD);
    // The context re-authenticates so re-auth and the current-password
    // check both use the new password from now on.
    expect(api.login).toHaveBeenLastCalledWith({
      username: "admin",
      password: NEW_PASSWORD,
    });

    // The old password must no longer pass the current-password check.
    await submitPasswordForm(CURRENT_PASSWORD, NEW_PASSWORD);
    await screen.findByText("Current password is wrong.");
    expect(api.resetAdminPassword).toHaveBeenCalledTimes(1);
  });

  it("rejects the change when the current password does not match", async () => {
    await renderSystemPage();

    await submitPasswordForm("not-the-password", NEW_PASSWORD);

    await screen.findByText("Current password is wrong.");
    expect(api.resetAdminPassword).not.toHaveBeenCalled();
  });

  it("shows an error and keeps the old credential when the reset request fails", async () => {
    vi.mocked(api.resetAdminPassword).mockRejectedValue(new Error("500"));
    await renderSystemPage();

    await submitPasswordForm(CURRENT_PASSWORD, NEW_PASSWORD);

    await screen.findByText(/Failed to update password/);
    // Only the initial login happened; no re-login with the new password.
    expect(api.login).toHaveBeenCalledTimes(1);
    expect(api.login).toHaveBeenLastCalledWith({
      username: "admin",
      password: CURRENT_PASSWORD,
    });
  });
});
