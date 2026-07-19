import { AxiosError } from "axios";
import type {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Capture the axios instance created inside ./api so tests can drive all
// HTTP traffic through a mocked adapter instead of the network.
const { instances } = vi.hoisted(() => ({ instances: [] as AxiosInstance[] }));

vi.mock("axios", async (importOriginal) => {
  const actual = await importOriginal<typeof import("axios")>();
  return {
    ...actual,
    default: {
      ...actual.default,
      create: (...args: Parameters<typeof actual.default.create>) => {
        const instance = actual.default.create(...args);
        instances.push(instance);
        return instance;
      },
    },
  };
});

import {
  getClients,
  getWifiConfig,
  login,
  setAuthToken,
  setReauthHandler,
} from "./api";

const instance = instances[0];

type Adapter = (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>;

let adapter: ReturnType<typeof vi.fn<Adapter>>;

function ok(
  config: InternalAxiosRequestConfig,
  data: unknown,
): AxiosResponse {
  return { status: 200, statusText: "OK", headers: {}, config, data };
}

function unauthorized(config: InternalAxiosRequestConfig): Promise<never> {
  return Promise.reject(
    new AxiosError("Request failed with status code 401", "ERR_BAD_REQUEST", config, null, {
      status: 401,
      statusText: "Unauthorized",
      headers: {},
      config,
      data: {},
    }),
  );
}

const CREDENTIALS = { username: "admin", password: "test-password" };

function loginCalls() {
  return adapter.mock.calls.filter(([config]) => config.url === "/auth/login");
}

beforeEach(() => {
  adapter = vi.fn<Adapter>();
  instance.defaults.adapter = adapter;
  setReauthHandler(null);
  setAuthToken(null);
});

describe("401 response handling", () => {
  it("does not re-authenticate or retry when /auth/login itself returns 401", async () => {
    const reauth = vi.fn().mockResolvedValue("fresh-token");
    setReauthHandler(reauth);
    adapter.mockImplementation((config) => unauthorized(config));

    await expect(login(CREDENTIALS)).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(reauth).not.toHaveBeenCalled();
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it("re-authenticates once and retries the original request on 401", async () => {
    setReauthHandler(() => login(CREDENTIALS));
    adapter.mockImplementation((config) => {
      if (config.url === "/auth/login") {
        return Promise.resolve(ok(config, { auth: { token: "fresh-token" } }));
      }
      if (config.headers.get("Authorization") !== "Bearer fresh-token") {
        return unauthorized(config);
      }
      return Promise.resolve(
        ok(config, {
          clients: { "2.4ghz": [], "5.0ghz": [], ethernet: [] },
        }),
      );
    });

    const data = await getClients();

    expect(data.clients.ethernet).toEqual([]);
    // Original request, re-auth login, retried request.
    expect(adapter).toHaveBeenCalledTimes(3);
    const retried = adapter.mock.calls[2][0];
    expect(retried.url).toBe("/network/telemetry/");
    expect(retried.headers.get("Authorization")).toBe("Bearer fresh-token");
    expect(instance.defaults.headers.common.Authorization).toBe(
      "Bearer fresh-token",
    );
  });

  it("shares a single login between concurrent 401 responses", async () => {
    const reauth = vi.fn(() => login(CREDENTIALS));
    setReauthHandler(reauth);
    adapter.mockImplementation((config) => {
      if (config.url === "/auth/login") {
        return Promise.resolve(ok(config, { auth: { token: "fresh-token" } }));
      }
      if (config.headers.get("Authorization") !== "Bearer fresh-token") {
        return unauthorized(config);
      }
      return Promise.resolve(ok(config, { url: config.url }));
    });

    const [clients, wifi] = await Promise.all([getClients(), getWifiConfig()]);

    expect(clients).toEqual({ url: "/network/telemetry/" });
    expect(wifi).toEqual({ url: "/network/configuration/v2" });
    expect(reauth).toHaveBeenCalledTimes(1);
    expect(loginCalls()).toHaveLength(1);
    // Two originals + one login + two retries.
    expect(adapter).toHaveBeenCalledTimes(5);
  });

  it("retries a request only once, even if the retry also returns 401", async () => {
    setReauthHandler(() => login(CREDENTIALS));
    adapter.mockImplementation((config) =>
      config.url === "/auth/login"
        ? Promise.resolve(ok(config, { auth: { token: "fresh-token" } }))
        : unauthorized(config),
    );

    await expect(getClients()).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(loginCalls()).toHaveLength(1);
    // Original request plus exactly one retry.
    expect(adapter).toHaveBeenCalledTimes(3);
  });

  it("rejects with the original 401 when re-authentication fails, without looping on /auth/login", async () => {
    setReauthHandler(() => login(CREDENTIALS));
    // Every request 401s: the stored credential is no longer valid.
    adapter.mockImplementation((config) => unauthorized(config));

    await expect(getClients()).rejects.toMatchObject({
      response: { status: 401 },
    });
    // A second login call would mean the interceptor recursed on /auth/login.
    expect(loginCalls()).toHaveLength(1);
    expect(adapter).toHaveBeenCalledTimes(2);
  });

  it("passes a 401 through untouched when no re-auth handler is registered", async () => {
    adapter.mockImplementation((config) => unauthorized(config));

    await expect(getClients()).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(adapter).toHaveBeenCalledTimes(1);
  });
});
