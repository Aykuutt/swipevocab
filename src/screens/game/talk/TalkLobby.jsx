import { useState } from "react";
import Icon from "../../../components/Icon";
import Mascot from "../../../components/Mascot";
import { Button } from "../../../components/ui";

const RULES = [
  "Saygılı ol. Hakaret, taciz ve uygunsuz içerik hesabın kapanmasına yol açar.",
  "Telefon, adres, sosyal medya gibi kişisel bilgilerini paylaşma.",
  "Rahatsız olursan görüşmeyi hemen bitir, kişiyi şikayet et ve engelle.",
  "Görüşmeler kaydedilmez; karşı taraf sadece takma adını ve seviyeni görür.",
];

/** Canlı konuşmaya giriş: kurallar, 18+ onayı ve başlatma. */
export default function TalkLobby({ level, consented, onConsent, onStart, onClose }) {
  const [checked, setChecked] = useState(consented);

  return (
    <div className="partner">
      <div className="partner-top">
        <button type="button" className="icon-btn" aria-label="Kapat" onClick={onClose}>
          <Icon name="close" size={22} />
        </button>
        <h1 className="partner-title">Canlı konuşma</h1>
      </div>

      <div className="partner-scroll">
        <div className="partner-hero">
          <Mascot mood="wave" size={84} />
          <p>
            Seviyene yakın biriyle sesli konuş. Ekrandaki sorular ve hedef kelimeler sohbeti yönlendirir; kullandığın her
            kelime puan kazandırır.
          </p>
        </div>

        <h2 className="group-title">Kurallar</h2>
        <ul className="talk-rules">
          {RULES.map((r) => (
            <li key={r}>
              <Icon name="check" size={14} />
              <span>{r}</span>
            </li>
          ))}
        </ul>

        {!consented && (
          <label className="talk-consent">
            <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
            <span>18 yaşından büyüğüm ve kurallara uyacağım.</span>
          </label>
        )}

        <p className="partner-level">
          Seviyen <strong>{level}</strong>. Seviyesi sana yakın biriyle eşleşirsin.
        </p>
      </div>

      <div className="partner-footer">
        <Button
          size="lg"
          block
          icon="mic"
          disabled={!consented && !checked}
          onClick={() => {
            if (!consented) onConsent();
            onStart();
          }}
        >
          Partner bul
        </Button>
      </div>
    </div>
  );
}
