// Köye ilk girişte Dilbaz'la kısa tur: anlattığı yer parlar (ekranın kalanı kararır), İleri / Turu geç.
// Hedef bulunamazsa (örn. henüz hasat yoksa) balon ortada, parlatma olmadan gösterilir.
import { useLayoutEffect, useState } from "react";
import Mascot from "../../components/Mascot";
import { Button } from "../../components/ui";

const STEPS = [
  { target: null, mood: "wave", text: "Hoş geldin! Burası benim köyüm. Sen kelime öğrendikçe birlikte büyüteceğiz. Sana kısaca göstereyim." },
  { target: '[data-tour="balance"]', mood: "happy", text: "Bu senin puanın. Kart kaydırıp soru çözdükçe kazanırsın. Köyü bu puanla büyütürsün." },
  { target: '[data-tour="harvest"]', mood: "cheer", text: "Günün kart hedefini bitirdiğin günler binalar ürün verir. Balonlara dokunup puanı toplarsın. Çalışmadığın gün hasat çıkmaz!" },
  { target: '[data-villager="merchant"]', mood: "happy", text: "Bu Tomas. Köylülere dokun, öğrendiğin dilde sohbet et. Arkadaşlık kalpleri arttıkça hikâyeleri açılır." },
  { target: '[data-tour="orders"]', mood: "think", text: "Köylülerin her gün bir isteği var: kart kaydır, soru çöz, kelime öğren. Bitirince buradan teslim et." },
  { target: '[data-tour="shop"]', mood: "cheer", text: "Bina, süs ve yol buradan alınır. Yeni binalarla yeni köylüler gelir." },
  { target: '[data-tour="help"]', mood: "happy", text: "Ne yapacağını unutursan bu soru işaretine bas. O an en iyi ne yapacağını söylerim." },
  { target: null, mood: "cheer", text: "Haritayı parmağınla kaydır, iki parmakla yakınlaştır. Hadi başlayalım!" },
];

const PAD = 8;

export default function VillageTour({ onDone }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  // Hedefin yerini ölç (ekran döner ya da boyut değişirse yeniden).
  useLayoutEffect(() => {
    const measure = () => {
      const root = document.querySelector(".village-full");
      const el = step.target ? document.querySelector(step.target) : null;
      if (!root || !el) return setRect(null);
      const r = el.getBoundingClientRect();
      const o = root.getBoundingClientRect();
      if (r.width === 0 || r.bottom < o.top || r.top > o.bottom) return setRect(null);
      setRect({ left: r.left - o.left - PAD, top: r.top - o.top - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2, mid: r.top + r.height / 2 - o.top, h: o.height });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [step.target]);

  // Balon, parlayan yerin ters yarısında dursun.
  const place = rect ? (rect.mid > rect.h / 2 ? "top" : "bottom") : "center";

  return (
    <div className="vtour" role="dialog" aria-modal="true" aria-label="Köy turu">
      {rect ? (
        <div className="vtour-spot" style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }} />
      ) : (
        <div className="vtour-dim" />
      )}
      <div className={`vtour-card is-${place}`}>
        <Mascot mood={step.mood} size={64} talking />
        <div className="vtour-body">
          <p>{step.text}</p>
          <div className="vtour-actions">
            <span className="vtour-count">
              {i + 1}/{STEPS.length}
            </span>
            {!last && (
              <Button size="sm" variant="ghost" onClick={onDone}>
                Turu geç
              </Button>
            )}
            <Button size="sm" onClick={() => (last ? onDone() : setI(i + 1))}>
              {last ? "Başlayalım!" : "İleri"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
