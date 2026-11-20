import { useEffect, useReducer } from "react";
import { formatCountdown } from "../lib/time";
import { useApp } from "../state/AppContext";

/** Bir sonraki canın gelmesine kalan süre; saniyede bir güncellenir. */
export default function HeartTimer({ className = "" }) {
  const { state, getNow } = useApp();
  const [, rerender] = useReducer((n) => n + 1, 0);

  useEffect(() => {
    if (state.regenAt === null) return;
    const timer = setInterval(rerender, 1000);
    return () => clearInterval(timer);
  }, [state.regenAt]);

  if (state.regenAt === null) return null;
  return <span className={`heart-timer ${className}`}>{formatCountdown(state.regenAt - getNow())}</span>;
}
