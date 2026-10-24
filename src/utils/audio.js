export function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    const now = ctx.currentTime;
    if (type === "correct") {
      o.frequency.setValueAtTime(523.25, now);
      o.frequency.setValueAtTime(783.99, now + 0.09);
      g.gain.setValueAtTime(0.08, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      o.start(now);
      o.stop(now + 0.22);
    } else if (type === "wrong") {
      o.type = "square";
      o.frequency.setValueAtTime(180, now);
      g.gain.setValueAtTime(0.06, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      o.start(now);
      o.stop(now + 0.18);
    } else if (type === "levelup") {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        o.frequency.setValueAtTime(f, now + i * 0.09);
      });
      g.gain.setValueAtTime(0.08, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      o.start(now);
      o.stop(now + 0.4);
    }
  } catch (e) {
    /* ses desteklenmiyor olabilir, sessizce geç */
  }
}

export function speak(text) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.92;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch (e) {
    /* konuşma sentezi desteklenmiyor olabilir */
  }
}

