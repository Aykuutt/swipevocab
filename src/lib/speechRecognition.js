// Tarayıcının ses tanıma servisi (konuşma partnerinde mikrofonla cevap için).

const Recognition =
  typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

export const hasSpeechRecognition = () => !!Recognition;

/**
 * Tek seferlik dinleyici. `onInterim` konuşurken ara metni,
 * `onEnd` kesinleşen metni verir.
 */
export function createListener({ lang = "en-US", onInterim, onEnd, onError }) {
  const rec = new Recognition();
  rec.lang = lang;
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;

  let finalText = "";
  rec.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finalText += r[0].transcript;
      else interim += r[0].transcript;
    }
    onInterim?.((finalText + interim).trim());
  };
  rec.onerror = (e) => onError?.(e.error);
  rec.onend = () => onEnd?.(finalText.trim());

  return {
    start() {
      finalText = "";
      rec.start();
    },
    stop() {
      rec.stop();
    },
    abort() {
      rec.onend = null;
      rec.abort();
    },
  };
}
