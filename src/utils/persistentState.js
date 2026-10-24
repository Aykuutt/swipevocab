import { useEffect, useState } from "react";

const STORAGE_PREFIX = "swipevocab:";

export function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (saved !== null) return JSON.parse(saved);
    } catch {
      // Storage may be unavailable or contain invalid data; use the default.
    }
    return typeof initialValue === "function" ? initialValue() : initialValue;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
    } catch {
      // Keep the app usable when storage is blocked or full.
    }
  }, [key, value]);

  return [value, setValue];
}

