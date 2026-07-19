import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePolling } from "./usePolling";

describe("usePolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("invokes immediately and then on the interval", async () => {
    const callback = vi.fn().mockResolvedValue(undefined);
    renderHook(() => usePolling(callback, 1000));

    expect(callback).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it("does nothing while inactive", async () => {
    const callback = vi.fn().mockResolvedValue(undefined);
    renderHook(() => usePolling(callback, 1000, false));

    await vi.advanceTimersByTimeAsync(5000);
    expect(callback).not.toHaveBeenCalled();
  });

  it("never overlaps in-flight callbacks, however long they take", async () => {
    let resolveFirst!: () => void;
    const callback = vi
      .fn<() => Promise<void>>()
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValue(undefined);
    renderHook(() => usePolling(callback, 1000));

    expect(callback).toHaveBeenCalledTimes(1);
    // The interval elapses five times while the first call is in flight.
    await vi.advanceTimersByTimeAsync(5000);
    expect(callback).toHaveBeenCalledTimes(1);

    // Once it settles, the next tick is scheduled one interval later.
    resolveFirst();
    await vi.advanceTimersByTimeAsync(0);
    expect(callback).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(999);
    expect(callback).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("keeps polling after a callback rejection", async () => {
    const callback = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValue(undefined);
    renderHook(() => usePolling(callback, 1000));

    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it("stops scheduling after unmount", async () => {
    const callback = vi.fn().mockResolvedValue(undefined);
    const { unmount } = renderHook(() => usePolling(callback, 1000));

    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(2);

    unmount();
    await vi.advanceTimersByTimeAsync(5000);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("does not schedule another tick if unmounted while a call is in flight", async () => {
    let resolveInFlight!: () => void;
    const callback = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveInFlight = resolve;
        }),
    );
    const { unmount } = renderHook(() => usePolling(callback, 1000));

    unmount();
    resolveInFlight();
    await vi.advanceTimersByTimeAsync(5000);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
