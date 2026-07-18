import { useEffect, useRef } from "react";

/**
 * Invoke `callback` immediately and then every `intervalMs` while `active`.
 * The interval is cleared on unmount or when any input changes.
 */
export function usePolling(
  callback: () => void,
  intervalMs: number,
  active = true,
): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!active) return;
    savedCallback.current();
    const id = setInterval(() => savedCallback.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, active]);
}
