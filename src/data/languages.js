// Öğrenilebilen diller. Arayüz her dilde Türkçedir; yalnızca kelimeler, okuma sesi,
// ses tanıma ve konuşma partnerinin dili değişir.
// Yeni dil eklemek için: src/data/langs/<kod>.js dosyasına kelimeleri yaz, buraya bir kayıt ekle
// ve src/lib/words.js içindeki PACKS listesine ekle.
export const LANGUAGES = {
  en: { id: "en", name: "İngilizce", english: "English", code: "EN", speech: "en-US", sample: "Hello! This is how I will read English words." },
  de: { id: "de", name: "Almanca", english: "German", code: "DE", speech: "de-DE", sample: "Hallo! So lese ich die deutschen Wörter vor." },
  es: { id: "es", name: "İspanyolca", english: "Spanish", code: "ES", speech: "es-ES", sample: "¡Hola! Así voy a leer las palabras en español." },
  fr: { id: "fr", name: "Fransızca", english: "French", code: "FR", speech: "fr-FR", sample: "Bonjour ! Voilà comment je vais lire les mots en français." },
};

export const LANGUAGE_ORDER = ["en", "de", "es", "fr"];
export const DEFAULT_LANGUAGE = "en";

export const getLanguage = (id) => LANGUAGES[id] || LANGUAGES[DEFAULT_LANGUAGE];

/** Kartta gösterilen biçim: artikeli olan dillerde "der Tisch", "la mesa". */
export const displayWord = (w) =>
  !w.article ? w.word : w.article.endsWith("'") ? `${w.article}${w.word}` : `${w.article} ${w.word}`;
