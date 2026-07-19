import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type {
  ClientsResponse,
  Credentials,
  GatewayInfo,
  LoginResponse,
  WifiConfig,
} from "./types";

/**
 * Central HTTP client for the KVD21 TMI v1 API.
 *
 * In development, Vite proxies "/api" to http://192.168.12.1/TMI/v1
 * (see vite.config.ts). In production the app is expected to be served
 * from a host that can reach the gateway on the LAN.
 */
export const api = axios.create({
  baseURL: "/api",
  timeout: 4000,
});

/** Attach or clear the bearer token used by authenticated endpoints. */
export function setAuthToken(token: string | null): void {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

/**
 * Handler invoked when a request fails with 401. It should re-authenticate
 * and return a fresh token, which is then used to retry the request once.
 * Registered by the auth provider so pages never duplicate re-login logic.
 */
let reauthHandler: (() => Promise<string>) | null = null;

export function setReauthHandler(handler: (() => Promise<string>) | null) {
  reauthHandler = handler;
}

/**
 * In-flight re-authentication, shared so concurrent 401 responses trigger
 * a single login instead of N parallel logins racing on the stored token.
 * Cleared once settled so the next 401 after that starts a fresh login.
 */
let reauthPromise: Promise<string> | null = null;

function reauthenticate(): Promise<string> {
  if (!reauthHandler) {
    return Promise.reject(new Error("No re-auth handler is registered"));
  }
  if (!reauthPromise) {
    reauthPromise = reauthHandler().finally(() => {
      reauthPromise = null;
    });
  }
  return reauthPromise;
}

/**
 * Axios rebuilds the config object on every request (mergeConfig), so an
 * identity-based guard (e.g. a WeakSet of seen configs) can never recognize
 * a retried request. This marker travels inside the config and therefore
 * survives the merge, capping every request at exactly one retry.
 */
type RetriableRequestConfig = InternalAxiosRequestConfig & {
  __retriedOnce?: boolean;
};

/**
 * The re-auth login call goes through this same axios instance. Never
 * apply the retry branch to it: a 401 from /auth/login means the stored
 * credential was rejected, and re-authenticating again would recurse
 * without bound and could lock the admin account.
 */
function isLoginRequest(config: AxiosError["config"]): boolean {
  return config?.url?.includes("/auth/login") ?? false;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableRequestConfig | undefined;
    if (
      error.response?.status === 401 &&
      original &&
      !isLoginRequest(original) &&
      !original.__retriedOnce &&
      reauthHandler
    ) {
      original.__retriedOnce = true;
      try {
        const token = await reauthenticate();
        setAuthToken(token);
        original.headers.Authorization = `Bearer ${token}`;
        return await api.request(original);
      } catch {
        // Fall through and reject with the original 401.
      }
    }
    return Promise.reject(error);
  },
);
/** Broad error categories the UI knows how to present. */
export type ApiErrorKind = "auth" | "timeout" | "unreachable" | "unknown";

export function classifyApiError(error: unknown): ApiErrorKind {
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED") return "timeout";
    if (!error.response) return "unreachable";
    if (error.response.status === 401) return "auth";
    if (error.response.status >= 500) return "unreachable";
  }
  return "unknown";
}

export async function login(credentials: Credentials): Promise<string> {
  const { data } = await api.post<LoginResponse>("/auth/login", credentials);
  return data.auth.token;
}

export async function getGatewayInfo(): Promise<GatewayInfo> {
  const { data } = await api.get<GatewayInfo>("/gateway/", {
    params: { get: "all" },
  });
  return data;
}

export async function getWifiConfig(): Promise<WifiConfig> {
  const { data } = await api.get<WifiConfig>("/network/configuration/v2", {
    params: { get: "ap" },
  });
  return data;
}

export async function setWifiConfig(config: WifiConfig): Promise<void> {
  await api.post("/network/configuration/v2", config, {
    params: { set: "ap" },
  });
}

export async function getClients(): Promise<ClientsResponse> {
  const { data } = await api.get<ClientsResponse>("/network/telemetry/", {
    params: { get: "clients" },
  });
  return data;
}

export async function rebootGateway(): Promise<void> {
  await api.post("/gateway/reset", null, { params: { set: "reboot" } });
}

export async function resetAdminPassword(newPassword: string): Promise<void> {
  await api.post("/auth/admin/reset", {
    usernameNew: "admin",
    passwordNew: newPassword,
  });
}
