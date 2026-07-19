import { describe, expect, it } from "vitest";
import { describeJsonShape, isAllowedMethodAndPath } from "./diagnostics";

describe("hardware validation safety helpers", () => {
  it("allows GET and only the normal login POST", () => {
    expect(
      isAllowedMethodAndPath("GET", "http://127.0.0.1:5173/api/gateway/"),
    ).toBe(true);
    expect(
      isAllowedMethodAndPath("POST", "http://127.0.0.1:5173/api/auth/login"),
    ).toBe(true);
    expect(
      isAllowedMethodAndPath(
        "POST",
        "http://127.0.0.1:5173/api/auth/login?unexpected=true",
      ),
    ).toBe(false);

    for (const [method, path] of [
      ["POST", "/api/network/configuration/v2?set=ap"],
      ["POST", "/api/gateway/reset?set=reboot"],
      ["PUT", "/api/anything"],
      ["PATCH", "/api/anything"],
      ["DELETE", "/api/anything"],
    ]) {
      expect(
        isAllowedMethodAndPath(method, `http://127.0.0.1:5173${path}`),
      ).toBe(false);
    }
  });

  it("keeps response field names and types without retaining values", () => {
    const source = {
      device: { serial: "sensitive-value", count: 3 },
      clients: [{ mac: "sensitive-value", connected: true }],
    };

    const serialized = JSON.stringify(describeJsonShape(source));
    expect(serialized).toContain("serial");
    expect(serialized).toContain("connected");
    expect(serialized).not.toContain("sensitive-value");
    expect(serialized).not.toContain('"count":3');
  });
});
