// İlk girişte Dilbaz'la uygulamalı tanıtım: kullanıcı ilk kartını gerçekten çevirir ve kaydırır, Dilbaz ne
// olduğunu anlatır; sonra günlük hedef halkasını ve alttaki menüyü gösterir. Yalnızca yeni kullanıcıya bir kez çıkar.
import { useLayoutEffect, useState } from "react";
import Mascot from "../../components/Mascot";
import { Button } from "../../components/ui";

const RESULT = {
  keep: "Süper! Bildiğin kelimeyi unutmaman için ara ara tekrar sorarım.",
  discard: "Sorun değil, öğrenmek için buradayız! Bilmediklerini kartlar bitince kısa sorularla pekiştireceğiz.",
  unsure: "Tamam, bu kelimeyi yakında tekrar göstereceğim. Emin olana kadar çalışırız.",
};

/** Kullanıcının bir şey yapması beklenen adımlarda (wait) ekran kararmaz, kart kullanılabilir. */
function steps(lastDir) {
  return [
    { target: null, mood: "wave", text: "Merhaba, ben Dilbaz! Uygulama nasıl çalışıyor, ilk kartında birlikte görelim. 30 saniye sürer." },
    { target: ".deck-stage", wait: "flip", hand: "tap", mood: "happy", text: "Bu bir kelime kartı. Anlamını görmek için karta dokun." },
    {
      target: ".deck-stage",
      wait: "swipe",
      hand: "swipe",
      mood: "think",
      text: "Şimdi karar ver: biliyorsan sağa, bilmiyorsan sola kaydır. Emin değilsen yukarı. Alttaki düğmeler de aynı işi yapar.",
    },
    { target: ".today", spot: true, mood: "cheer", text: `${RESULT[lastDir] || RESULT.keep} Bu halka günlük hedefin. Bitirince serin artar, köyün hasat verir.` },
    { target: ".tabbar", spot: true, mood: "happy", text: "Altta: Yol'da dersler, Oyun'da yarışmalar, Köy'de puanınla kendi köyünü kurarsın, Profil'de arkadaşların. Hadi başlayalım!" },
  ];
}

const PAD = 6;

export default function LearnCoach({ step: i, lastDir, onNext, onDone }) {
  const step = steps(lastDir)[i];
  const total = steps(lastDir).length;
  const last = i === total - 1;
  const [rect, setRect] = useState(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = step.target ? document.querySelector(step.target) : null;
      if (!el) return setRect(null);
      const r = el.getBoundingClientRect();
      setRect({ left: r.left - PAD, top: r.top - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2, mid: r.top + r.height / 2 });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [step.target]);

  const place = !rect ? "center" : rect.mid > window.innerHeight / 2 ? "top" : "bottom";
  const interactive = !!step.wait;

  return (
    <div className={`vtour lcoach ${interactive ? "is-passthrough" : ""}`} role="dialog" aria-label="Uygulama tanıtımı">
      {!interactive && (rect && step.spot ? <div className="vtour-spot" style={rect} /> : <div className="vtour-dim" />)}
      {interactive && rect && (
        <div className={`lcoach-hand is-${step.hand}`} style={{ left: rect.left + rect.width / 2, top: rect.top + rect.height * 0.55 }} aria-hidden="true">
          👆
        </div>
      )}
      <div className={`vtour-card is-${interactive ? "top" : place}`}>
        <Mascot mood={step.mood} size={64} talking />
        <div className="vtour-body">
          <p>{step.text}</p>
          <div className="vtour-actions">
            <span className="vtour-count">
              {i + 1}/{total}
            </span>
            {!last && (
              <Button size="sm" variant="ghost" onClick={onDone}>
                Geç
              </Button>
            )}
            {!interactive && (
              <Button size="sm" onClick={last ? onDone : onNext}>
                {last ? "Başlayalım!" : i === 0 ? "Göster" : "İleri"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
