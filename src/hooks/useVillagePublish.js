// Hesaplı kullanıcının köy vitrinini (arkadaşlara görünen kopya) güncel tutar.
// Köy, ad, seri ya da dil değişince birkaç saniye sonra gönderilir; değişmeyen bilgi tekrar gönderilmez.
import { useEffect, useRef, useState } from "react";
import { FEATURES } from "../config";
import { publicInfo, publishVillage } from "../lib/friends";

const DELAY_MS = 4000;

export function useVillagePublish(state, active, streak) {
  const [code, setCode] = useState(null);
  const sent = useRef("");
  const user = state.user;
  const enabled = FEATURES.friends && active && !!user && !user.guest;
  const info = enabled ? publicInfo(state, streak) : null;
  const key = info ? JSON.stringify(info) : "";

  useEffect(() => {
    if (!key || key === sent.current) return;
    const timer = setTimeout(async () => {
      try {
        const c = await publishVillage(JSON.parse(key));
        sent.current = key;
        setCode(c);
      } catch {
        // bağlantı yoksa bir sonraki değişiklikte yeniden denenir
      }
    }, sent.current ? DELAY_MS : 300);
    return () => clearTimeout(timer);
  }, [key]);

  return enabled ? code : null;
}
