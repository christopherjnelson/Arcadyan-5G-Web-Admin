import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../context/AuthContext";
import * as api from "../lib/api";
import { LoginPage } from "./LoginPage";

vi.mock("../lib/api", () => ({
  login: vi.fn(),
  setAuthToken: vi.fn(),
  setReauthHandler: vi.fn(),
  classifyApiError: vi.fn(),
}));

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the login form", () => {
    renderLogin();
    expect(
      screen.getByRole("heading", { name: /log in/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeDisabled();
    expect(screen.getByLabelText(/password/i)).toBeEnabled();
  });

  it("shows an invalid-password alert on a 401", async () => {
    vi.mocked(api.login).mockRejectedValue(new Error("unauthorized"));
    vi.mocked(api.classifyApiError).mockReturnValue("auth");

    renderLogin();
    await userEvent.type(screen.getByLabelText(/password/i), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() =>
      expect(screen.getByText("Invalid Password")).toBeInTheDocument(),
    );
  });

  it("shows a gateway alert when the device is unreachable", async () => {
    vi.mocked(api.login).mockRejectedValue(new Error("timeout"));
    vi.mocked(api.classifyApiError).mockReturnValue("timeout");

    renderLogin();
    await userEvent.type(screen.getByLabelText(/password/i), "whatever1");
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() =>
      expect(
        screen.getByText("Unable to connect to Gateway"),
      ).toBeInTheDocument(),
    );
  });
});
