import { describe, expect, it } from "vitest";
import { formatBands, signalColor, signalLabel, signalPercent } from "./signal";

describe("signalLabel", () => {
  it("maps bar ratings to labels", () => {
    expect(signalLabel(0)).toBe("Offline");
    expect(signalLabel(1)).toBe("Poor");
    expect(signalLabel(2)).toBe("Fair");
    expect(signalLabel(3)).toBe("Good");
    expect(signalLabel(4)).toBe("Very Good");
    expect(signalLabel(5)).toBe("Excellent");
  });

  it("treats a missing signal as offline", () => {
    expect(signalLabel(undefined)).toBe("Offline");
  });
});

describe("signalPercent", () => {
  it("scales bars to a 0-100 percentage", () => {
    expect(signalPercent(5)).toBe(100);
    expect(signalPercent(3)).toBe(60);
    expect(signalPercent(undefined)).toBe(0);
  });
});

describe("signalColor", () => {
  it("returns a tailwind class per rating tier", () => {
    expect(signalColor(5)).toBe("bg-sky-500");
    expect(signalColor(4)).toBe("bg-emerald-500");
    expect(signalColor(2)).toBe("bg-amber-500");
    expect(signalColor(1)).toBe("bg-rose-600");
    expect(signalColor(undefined)).toBe("bg-rose-600");
  });
});

describe("formatBands", () => {
  it("joins band arrays", () => {
    expect(formatBands(["n41", "n71"])).toBe("n41, n71");
  });

  it("passes through strings and handles undefined", () => {
    expect(formatBands("B2")).toBe("B2");
    expect(formatBands(undefined)).toBe("N/A");
  });
});
