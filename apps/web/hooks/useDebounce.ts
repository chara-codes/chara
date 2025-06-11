import { useEffect, useState } from "react";

/**
 * Debounce a changing value.
 * Returns the latest `value` after `delay`ms of inactivity.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
