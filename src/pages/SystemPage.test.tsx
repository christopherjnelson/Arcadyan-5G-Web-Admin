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

async function submitPasswordForm(
  current: string,
  next: string,
  confirm: string = next,
) {
  await userEvent.type(screen.getByLabelText("Current Password"), current);
  await userEvent.type(screen.getByLabelText("New Password"), next);
  if (confirm) {
    await userEvent.type(
      screen.getByLabelText("Confirm New Password"),
      confirm,
    );
  }
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

  it("clears both new-password fields after a successful change", async () => {
    vi.mocked(api.resetAdminPassword).mockResolvedValue(undefined);
    await renderSystemPage();

    await submitPasswordForm(CURRENT_PASSWORD, NEW_PASSWORD);

    await screen.findByText(/Password updated/);
    expect(screen.getByLabelText("New Password")).toHaveValue("");
    expect(screen.getByLabelText("Confirm New Password")).toHaveValue("");
  });

  it("blocks the request and explains why when the new passwords differ", async () => {
    await renderSystemPage();

    await submitPasswordForm(CURRENT_PASSWORD, NEW_PASSWORD, "different-pass");

    expect(
      await screen.findByText("New passwords do not match."),
    ).toBeVisible();
    const confirmInput = screen.getByLabelText("Confirm New Password");
    expect(confirmInput).toHaveAttribute("aria-invalid", "true");
    expect(confirmInput).toHaveAccessibleDescription(
      "New passwords do not match.",
    );
    expect(api.resetAdminPassword).not.toHaveBeenCalled();
  });

  it("requires the confirmation to be filled in before submitting", async () => {
    await renderSystemPage();

    await submitPasswordForm(CURRENT_PASSWORD, NEW_PASSWORD, "");

    expect(screen.getByLabelText("Confirm New Password")).toHaveValue("");
    expect(api.resetAdminPassword).not.toHaveBeenCalled();
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
    // A gateway failure must not wipe what the user typed.
    expect(screen.getByLabelText("New Password")).toHaveValue(NEW_PASSWORD);
    expect(screen.getByLabelText("Confirm New Password")).toHaveValue(
      NEW_PASSWORD,
    );
  });

  it("gives every password field a label and its own visibility toggle", async () => {
    await renderSystemPage();

    expect(screen.getByLabelText("Current Password")).toBeInTheDocument();
    expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm New Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Show current password" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Show new password" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Show confirm new password" }),
    ).toBeInTheDocument();
  });
});
