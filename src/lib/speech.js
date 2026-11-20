// Sesli okuma.
// Öncelik sırası:
//   1. Cihazda İngilizce bir ses varsa tarayıcının konuşma sentezi.
//   2. Yoksa, metnin hazır kaydı varsa public/audio altındaki mp3.
//   3. İkisi de yoksa okunmaz; Türkçe sesle yanlış telaffuz öğretmemek için.
import { WORDS } from "../data/words";

/* ---------- Hazır ses kayıtları ---------- */

const normalize = (text) => text.trim().toLowerCase();

// Yalnızca 1-90 arası kelimelerin public/audio altında kaydı var.
const LAST_RECORDED_ID = 90;

// "negotiate" -> "w/1", örnek cümle -> "s/1"
const CLIP_IDS = Object.fromEntries(
  WORDS.filter((w) => w.id <= LAST_RECORDED_ID).flatMap((w) => [
    [normalize(w.word), `w/${w.id}`],
    [normalize(w.example), `s/${w.id}`],
  ])
);

const hasClip = (text) => Object.prototype.hasOwnProperty.call(CLIP_IDS, normalize(text));

async function fetchClip(id) {
  const res = await fetch(`${import.meta.env.BASE_URL}audio/${id}.mp3`);
  if (!res.ok) throw new Error("clip fetch failed");
  return res.arrayBuffer();
}

const decodedClips = new Map();
function getClipBuffer(text, ctx) {
  const id = CLIP_IDS[normalize(text)];
  if (!id) return Promise.reject(new Error("no clip"));
  if (!decodedClips.has(id)) {
    const promise = fetchClip(id).then((buf) => ctx.decodeAudioData(buf));
    promise.catch(() => decodedClips.delete(id));
    decodedClips.set(id, promise);
  }
  return decodedClips.get(id);
}

/* ---------- Web Audio ---------- */

let audioCtx = null;
export function getAudioContext() {
  try {
    if (!audioCtx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

let currentSource = null;
function stopClip() {
  if (!currentSource) return;
  try {
    currentSource.onended = null;
    currentSource.stop();
  } catch {
    // zaten durmuş
  }
  currentSource = null;
}

/** Hazır kaydı çalar. Dönen fonksiyon çalmayı iptal eder. */
function playClip(text, { onStart, onEnd, onFail }) {
  const ctx = getAudioContext();
  if (!ctx) {
    onFail?.();
    return () => {};
  }
  let cancelled = false;
  getClipBuffer(text, ctx)
    .then((buffer) => {
      if (cancelled) return;
      stopClip();
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => {
        if (currentSource === source) currentSource = null;
        if (!cancelled) onEnd?.();
      };
      currentSource = source;
      source.start();
      onStart?.(buffer.duration);
    })
    .catch(() => {
      if (!cancelled) onFail?.();
    });
  return () => {
    cancelled = true;
    stopClip();
  };
}

/* ---------- Konuşma sentezi ---------- */

export const hasSpeechSynthesis = () =>
  typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

const isEnglish = (voice) => (voice.lang || "").replace("_", "-").toLowerCase().startsWith("en");

/** Doğal ve ABD/İngiltere İngilizcesi sesleri öne alır. */
function pickBestVoice(voices) {
  const score = (v) => {
    const lang = (v.lang || "").replace("_", "-").toLowerCase();
    if (!lang.startsWith("en")) return -1;
    let s = lang === "en-us" ? 30 : lang === "en-gb" ? 25 : 10;
    if (/natural|neural|online/i.test(v.name)) s += 20;
    if (/google/i.test(v.name)) s += 10;
    if (/microsoft/i.test(v.name)) s += 5;
    return s;
  };
  let best = null;
  let bestScore = -1;
  for (const v of voices || []) {
    const s = score(v);
    if (s > bestScore) {
      best = v;
      bestScore = s;
    }
  }
  return best;
}

let cachedVoice; // undefined: henüz seçilmedi
let preferredVoiceURI = null;

if (hasSpeechSynthesis()) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener?.("voiceschanged", () => {
    cachedVoice = undefined;
  });
}

/** Ayarlardan seçilen ses. Boşsa otomatik seçilir. */
export function setPreferredVoice(uri) {
  preferredVoiceURI = uri || null;
  cachedVoice = undefined;
}

function getVoice() {
  if (!hasSpeechSynthesis()) return null;
  if (cachedVoice === undefined) {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    cachedVoice =
      (preferredVoiceURI && voices.find((v) => v.voiceURI === preferredVoiceURI && isEnglish(v))) ||
      pickBestVoice(voices);
  }
  return cachedVoice;
}

export function listEnglishVoices() {
  if (!hasSpeechSynthesis()) return [];
  return window.speechSynthesis
    .getVoices()
    .filter(isEnglish)
    .map((v) => ({ uri: v.voiceURI, name: v.name, lang: v.lang }));
}

/**
 * Cihazdaki ses durumu.
 * status: "ready" (İngilizce ses var), "missing" (yok), "unknown" (sesler henüz yüklenmedi)
 */
export function getVoiceStatus() {
  const empty = { total: 0, english: 0, name: null, lang: null };
  if (!hasSpeechSynthesis()) return { status: "missing", ...empty };
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return { status: "unknown", ...empty };
  const voice = getVoice();
  return {
    status: voice ? "ready" : "missing",
    total: voices.length,
    english: voices.filter(isEnglish).length,
    name: voice ? voice.name : null,
    lang: voice ? voice.lang : null,
  };
}

const hasEnglishVoice = () => getVoiceStatus().status === "ready";

/** İngilizce ses bulunamadığında arayüze haber veren olay. */
export const NO_ENGLISH_VOICE_EVENT = "sv:no-english-voice";
function announceNoEnglishVoice() {
  try {
    window.dispatchEvent(new CustomEvent(NO_ENGLISH_VOICE_EVENT));
  } catch {
    // eski tarayıcı
  }
}

function makeUtterance(text, rate) {
  const u = new SpeechSynthesisUtterance(text);
  const voice = getVoice();
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang;
  } else {
    u.lang = "en-US";
  }
  u.rate = rate;
  return u;
}

function speakWithSynth(text, rate) {
  try {
    const u = makeUtterance(text, rate);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    // yok say
  }
}

/** Okumayı tamamen durdurur. */
export function stopSpeaking() {
  stopClip();
  if (hasSpeechSynthesis()) window.speechSynthesis.cancel();
}

/** Bir kelimeyi ya da cümleyi okur. */
export function speak(text, rate = 0.92) {
  stopClip();
  if (hasSpeechSynthesis() && hasEnglishVoice()) {
    speakWithSynth(text, rate);
    return;
  }
  if (hasClip(text)) {
    playClip(text, {
      onFail: () => hasSpeechSynthesis() && getVoiceStatus().status === "unknown" && speakWithSynth(text, rate),
    });
    return;
  }
  if (hasSpeechSynthesis()) {
    if (getVoiceStatus().status === "missing") {
      announceNoEnglishVoice();
      return;
    }
    speakWithSynth(text, rate);
  }
}

/**
 * Cümleyi okurken o an okunan kelimenin sırasını `onWord` ile bildirir.
 * Ses yoksa kelimeleri tahmini bir hızla sırayla vurgular.
 * Dönen fonksiyon okumayı iptal eder.
 */
export function speakAlong(text, { onWord, onEnd, rate = 0.85 }) {
  const wordStarts = [];
  text.replace(/\S+/g, (match, index) => {
    wordStarts.push(index);
    return match;
  });

  const timers = [];
  let finished = false;
  let gotBoundary = false;
  let started = false;
  const clearTimers = () => timers.forEach(clearTimeout);

  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimers();
    onEnd?.();
  };

  // Sessiz yedek: dakikada ~150 kelime hızında vurgula.
  const simulate = () => {
    if (finished) return;
    const step = 60_000 / (150 * rate);
    wordStarts.forEach((_, i) => timers.push(setTimeout(() => !finished && onWord?.(i), i * step)));
    timers.push(setTimeout(finish, wordStarts.length * step + 300));
  };

  if (!(hasSpeechSynthesis() && hasEnglishVoice()) && hasClip(text)) {
    const cancelClip = playClip(text, {
      onStart: (duration) => {
        wordStarts.forEach((start, i) =>
          timers.push(setTimeout(() => !finished && onWord?.(i), (start / text.length) * duration * 1000))
        );
      },
      onEnd: finish,
      onFail: simulate,
    });
    return () => {
      finished = true;
      clearTimers();
      cancelClip();
    };
  }

  if (!hasSpeechSynthesis() || getVoiceStatus().status === "missing") {
    if (hasSpeechSynthesis()) announceNoEnglishVoice();
    simulate();
    return () => {
      finished = true;
      clearTimers();
    };
  }

  try {
    const u = makeUtterance(text, rate);
    u.onstart = () => {
      started = true;
    };
    u.onboundary = (e) => {
      gotBoundary = true;
      let idx = 0;
      for (let i = 0; i < wordStarts.length; i++) if (wordStarts[i] <= e.charIndex) idx = i;
      onWord?.(idx);
    };
    u.onend = finish;
    u.onerror = finish;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);

    // Okuma hiç başlamazsa sessiz yedeğe geç.
    timers.push(
      setTimeout(() => {
        if (!started && !finished) {
          window.speechSynthesis.cancel();
          simulate();
        }
      }, 1200)
    );
    // Başladı ama kelime sınırı olayı gelmiyorsa vurgulamayı tahminle yap.
    timers.push(
      setTimeout(() => {
        if (started && !gotBoundary && !finished) {
          const step = 60_000 / (150 * rate);
          wordStarts.forEach((_, i) => timers.push(setTimeout(() => !finished && onWord?.(i), i * step)));
        }
      }, 1500)
    );
  } catch {
    simulate();
  }

  return () => {
    finished = true;
    clearTimers();
    stopSpeaking();
  };
}
