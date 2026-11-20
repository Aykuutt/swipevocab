import { useEffect, useState } from "react";
import { getVoiceStatus, listEnglishVoices } from "../lib/speech";

/** Cihazdaki İngilizce ses durumunu izler; sesler geç yüklenirse güncellenir. */
export function useVoiceInfo() {
  const read = () => ({ ...getVoiceStatus(), voices: listEnglishVoices() });
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
  }, []);
  return info;
}
