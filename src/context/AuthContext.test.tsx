import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "./AuthContext";
import { useAuth } from "../hooks/useAuth";
import * as api from "../lib/api";

vi.mock("../lib/api", () => ({
  login: vi.fn(),
  setAuthToken: vi.fn(),
  setReauthHandler: vi.fn(),
}));

function AuthConsumer() {
  const { user, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="token">{user?.token ?? "none"}</span>
      <button onClick={() => login("hunter2").catch(() => {})}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores the token after a successful login", async () => {
    vi.mocked(api.login).mockResolvedValue("token-123");
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await userEvent.click(screen.getByText("login"));

    await waitFor(() =>
      expect(screen.getByTestId("token")).toHaveTextContent("token-123"),
    );
    expect(api.login).toHaveBeenCalledWith({
      username: "admin",
      password: "hunter2",
    });
    expect(api.setAuthToken).toHaveBeenCalledWith("token-123");
  });

  it("clears the token on logout", async () => {
    vi.mocked(api.login).mockResolvedValue("token-123");
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await userEvent.click(screen.getByText("login"));
    await waitFor(() =>
      expect(screen.getByTestId("token")).toHaveTextContent("token-123"),
    );

    await userEvent.click(screen.getByText("logout"));
    expect(screen.getByTestId("token")).toHaveTextContent("none");
    expect(api.setAuthToken).toHaveBeenLastCalledWith(null);
  });

  it("propagates login failures", async () => {
    vi.mocked(api.login).mockRejectedValue(new Error("401"));
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await userEvent.click(screen.getByText("login"));

    await waitFor(() =>
      expect(screen.getByTestId("token")).toHaveTextContent("none"),
    );
  });
});
