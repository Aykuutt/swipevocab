// Yapay zeka konuşma partneri: istem (prompt) hazırlama, yanıt ayrıştırma
// ve model erişimi. Model, Claude artifact çalışma ortamının sağladığı
// `window.claude.use("sample")` üzerinden çağrılır; bu ortam yoksa
// konuşma partneri kartı Oyun sekmesinde hiç görünmez.
import { LEVELS, PARTNER } from "../config";
import { getLanguage } from "../data/languages";
import { studyLevelIndex } from "./deck";
import { shuffle } from "./random";
import { containsWord } from "./wordMatch";
import { wordPool } from "../state/selectors";

/** Sohbetin ayarlanacağı CEFR seviyesi. */
export function partnerLevel(state, words) {
  return LEVELS[studyLevelIndex(state, wordPool(state, words))];
}

/**
 * Sohbette kullanılacak çalışma kelimeleri: önce öğrenilmekte olanlar,
 * sonra zamanı gelen tekrarlar; senaryonun konusundakiler öne alınır.
 */
export function pickPracticeWords(state, words, scenario, count = PARTNER.words) {
  const known = new Set(state.knownIds);
  const learning = new Set(state.learningIds);
  const rank = (w) =>
    (learning.has(w.id) ? 0 : known.has(w.id) && state.schedule[w.id]?.due <= state.day ? 1 : known.has(w.id) ? 2 : 3) +
    (w.topic === scenario.topic ? 0 : 2.5) +
    Math.random() * 0.9;
  return shuffle(words)
    .map((w) => ({ w, r: rank(w) }))
    .sort((a, b) => a.r - b.r)
    .slice(0, count)
    .map((x) => x.w);
}

/** Kullanıcının mesajlarında geçen çalışma kelimeleri. */
export function usedPracticeWords(userTexts, practiceWords) {
  const text = userTexts.join(" ").toLowerCase();
  return practiceWords.filter((w) => containsWord(text, w.word));
}

function systemPrompt({ scenario, level, practiceWords, language }) {
  const list = practiceWords.map((w) => w.word).join(", ");
  const lang = getLanguage(language).english;
  return `You are "Kart", a friendly ${lang} conversation partner inside a vocabulary-learning app for Turkish speakers.

Scenario: ${scenario.role}
Learner level (CEFR): ${level}. Match it: simple everyday words and short sentences.

Rules:
- Always reply in ${lang}, in 1 or 2 short sentences, and end with a simple question so the learner keeps talking.
- Stay inside the scenario. This is language practice only. If the learner goes off-topic or asks for anything sexual, violent, hateful or dangerous, politely steer back to the scenario in one sentence.
- Never ask for the learner's real name, address, phone number or any other personal data.
- Naturally use some of these practice words in your own sentences, without forcing all of them: ${list}.
- If the learner writes in Turkish, reply in very simple ${lang}.
- "tip": only if the learner's LAST message has a real grammar or word-choice mistake, write ONE short helpful tip in Turkish that includes the corrected ${lang} sentence. Otherwise use "".
- "tr": a natural Turkish translation of your reply.
- When the learner has 1 message left, wrap up the conversation warmly.

Answer with ONLY a JSON object and nothing else: {"reply": "...", "tr": "...", "tip": "..."}`;
}

/** Sohbet geçmişini modele gönderilecek mesaj listesine çevirir. */
export function buildTurns({ scenario, level, practiceWords, history, language }) {
  const turns = [
    {
      role: "user",
      content: `${systemPrompt({ scenario, level, practiceWords, language })}

Start the conversation now: greet the learner in your role, then ask one simple first question.`,
    },
  ];
  let sent = 0;
  history.forEach((m) => {
    if (m.role === "ai") {
      turns.push({ role: "assistant", content: JSON.stringify({ reply: m.text, tr: m.tr || "", tip: "" }) });
    } else {
      sent += 1;
      turns.push({
        role: "user",
        content: `Learner (${Math.max(0, PARTNER.maxTurns - sent)} messages left): ${m.text}`,
      });
    }
  });
  return turns;
}

function parseJsonReply(text) {
  if (!text) throw new Error("empty");
  const clean = text.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no json");
  return JSON.parse(clean.slice(start, end + 1));
}

function validateReply(obj) {
  if (!obj || typeof obj.reply !== "string" || !obj.reply.trim()) throw new Error("bad reply");
  return {
    reply: obj.reply.trim(),
    tr: typeof obj.tr === "string" ? obj.tr.trim() : "",
    tip: typeof obj.tip === "string" ? obj.tip.trim() : "",
  };
}

let sampler; // undefined: henüz denenmedi, null: kullanılamıyor
/** Model erişimi; yoksa null döner. */
export async function getSampler() {
  if (sampler !== undefined) return sampler;
  try {
    sampler = typeof window !== "undefined" && window.claude?.use ? await window.claude.use("sample") : null;
  } catch {
    sampler = null;
  }
  return sampler;
}

export async function askPartner(sample, turns, signal) {
  const options = { cache: false, modelTier: "quick", signal };
  const raw =
    typeof sample.json === "function" ? await sample.json(turns, options) : parseJsonReply((await sample(turns, options)).text);
  return validateReply(raw);
}

/** Model hatasını kullanıcıya gösterilecek mesaja çevirir. */
export function describePartnerError(err) {
  switch (err?.code) {
    case "cancelled":
      return { message: "", fatal: false };
    case "not_granted":
    case "sampling_disabled":
    case "not_declared":
    case "capability_disabled":
    case "capability_removed":
      return {
        message: "Yapay zeka bu hesapta kullanılamıyor. Konuşma partneri için izin vermen gerekiyor.",
        fatal: true,
      };
    case "rate_limited":
      return { message: "Çok hızlı gittik ya da kullanım sınırına geldin. Biraz bekleyip tekrar dene.", fatal: false };
    case "session_expired":
      return { message: "Oturumun kapanmış. Sayfayı yenileyip tekrar giriş yap.", fatal: false };
    case "refused":
      return { message: "Bu mesaja cevap veremedim. Başka bir şey söylemeyi dene.", fatal: false };
    default:
      return { message: "Bağlantıda bir sorun oldu. Tekrar deneyebilirsin.", fatal: false };
  }
}
