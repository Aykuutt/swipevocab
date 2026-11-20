import { useEffect, useState } from "react";
import { getVoiceStatus, listLanguageVoices } from "../lib/speech";
import { useLanguage } from "../state/AppContext";

/** Cihazdaki, öğrenilen dildeki ses durumunu izler; sesler geç yüklenirse güncellenir. */
export function useVoiceInfo() {
  const language = useLanguage().id;
  const read = () => ({ ...getVoiceStatus(), voices: listLanguageVoices() });
  const [info, setInfo] = useState(read);
  useEffect(() => {
    const update = () => setInfo(read());
    update();
    const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
    synth?.addEventListener?.("voiceschanged", update);
    const timer = setTimeout(update, 1200);
    return () => {
      clearTimeout(timer);
      synth?.removeEventListener?.("voiceschanged", update);
    };
  }, [language]);
  return info;
}
