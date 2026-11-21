import { useEffect, useState } from "react";
import { timeOfDay } from "../data/village";

/** Saate göre "day" | "dusk" | "night". Dakikada bir kontrol edilir; sahne gün batarken kendiliğinden değişir. */
export function useTimeOfDay() {
  const [tod, setTod] = useState(() => timeOfDay());
  useEffect(() => {
    const timer = setInterval(() => setTod(timeOfDay()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return tod;
}
