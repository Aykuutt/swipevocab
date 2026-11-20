// Kısa ses efektleri; dosya gerektirmez, osilatörle üretilir.
import { getAudioContext } from "./speech";

export function playSfx(kind) {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime;

    if (kind === "correct") {
      osc.frequency.setValueAtTime(523.25, t);
      osc.frequency.setValueAtTime(783.99, t + 0.09);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.start(t);
      osc.stop(t + 0.22);
    } else if (kind === "wrong") {
      osc.type = "square";
      osc.frequency.setValueAtTime(180, t);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.start(t);
      osc.stop(t + 0.18);
    } else if (kind === "levelup") {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => osc.frequency.setValueAtTime(f, t + i * 0.09));
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.start(t);
      osc.stop(t + 0.4);
    }
  } catch {
    // ses kapalı ya da desteklenmiyor
  }
}
