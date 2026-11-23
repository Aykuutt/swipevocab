// Google AdSense reklam alanı. Yayıncı ya da birim kimliği ayarlı değilse (bkz. config.js ADS) hiçbir şey çizmez.
// Reklamlar yalnızca kart kaydırma ve ders gibi öğrenme anlarının DIŞINDA (ör. ünite bitiş ekranı) gösterilir.
// Kişiselleştirme onayı AdSense'in kendi onay penceresiyle sorulur (AdSense > Gizlilik ve mesajlaşma).
import { useEffect, useRef } from "react";
import { ADS, FEATURES } from "../config";
import { useApp } from "../state/AppContext";

export default function AdSlot({ slot, className = "" }) {
  const { state } = useApp();
  const pushed = useRef(false);
  const id = ADS.slots[slot];
  const hidden = !ADS.client || !id || (FEATURES.pro && state.isPro);

  useEffect(() => {
    if (hidden || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // reklam engelleyici ya da bağlantı yoksa alan boş kalır
    }
  }, [hidden]);

  if (hidden) return null;
  return (
    <div className={`ad-slot ${className}`}>
      <span className="ad-label">Reklam</span>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADS.client}
        data-ad-slot={id}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
