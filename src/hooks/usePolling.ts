import { useEffect, useRef } from "react";

/**
 * Invoke `callback` immediately and then every `intervalMs` while `active`.
 *
 * Each tick waits for the previous callback to settle before the next one
 * is scheduled, so polls never overlap — even when a request chain (with
 * the 401 re-auth retry) outlasts the interval. Overlapping chains could
 * resolve out of order and let older data overwrite fresher state. A
 * rejected callback never breaks the schedule, and no further ticks are
 * scheduled once the hook is cleaned up.
 */
export function usePolling(
  callback: () => Promise<unknown> | void,
  intervalMs: number,
  active = true,
): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick() {
      try {
        await savedCallback.current();
      } catch {
        // Callbacks are expected to handle their own errors; a rejection
        // must never break the polling schedule.
      }
      if (!cancelled) {
        timer = setTimeout(() => void tick(), intervalMs);
      }
    }

    void tick();
    return () => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [intervalMs, active]);
}
