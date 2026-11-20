import { useEffect, useRef, useState } from "react";

/**
 * Bir sayı değiştiğinde kısa süreliğine { dir: "up" | "down", delta, key } döner.
 * Puan ve can sayaçlarındaki zıplama animasyonu için kullanılır.
 */
export function useValueDelta(value, duration = 700) {
  const prev = useRef(value);
  const [delta, setDelta] = useState(null);
  useEffect(() => {
    if (value === prev.current) return;
    const diff = value - prev.current;
    prev.current = value;
    setDelta({ dir: diff > 0 ? "up" : "down", delta: Math.abs(diff), key: Math.random() });
    const timer = setTimeout(() => setDelta(null), duration);
    return () => clearTimeout(timer);
  }, [value, duration]);
  return delta;
}
