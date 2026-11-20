import { useState } from "react";
import Icon from "../../../components/Icon";
import Mascot from "../../../components/Mascot";
import { Button } from "../../../components/ui";
import { SCENARIOS } from "../../../data/scenarios";
import { useVoiceInfo } from "../../../hooks/useVoiceInfo";
import { useLanguage } from "../../../state/AppContext";

/** Senaryo seçimi ve gizlilik bilgilendirmesi. */
export default function PartnerSetup({ level, onStart, onClose }) {
  const [selectedId, setSelectedId] = useState(SCENARIOS[0].id);
  const scenario = SCENARIOS.find((s) => s.id === selectedId);
  const noVoice = useVoiceInfo().status === "missing";
  const language = useLanguage();

  return (
    <div className="partner">
      <div className="partner-top">
        <button type="button" className="icon-btn" aria-label="Kapat" onClick={onClose}>
          <Icon name="close" size={22} />
        </button>
        <h1 className="partner-title">Konuşma partneri</h1>
      </div>

      <div className="partner-scroll">
        <div className="partner-hero">
          <Mascot mood="wave" size={84} />
          <p>Kart'la {language.name} sohbet et. Yazarak ya da konuşarak cevap ver, hata yaparsan kısa bir ipucu alırsın.</p>
        </div>

        <p className="partner-notice">
          <Icon name="info" size={16} />
          <span>
            Yapay zekayla konuşuyorsun, karşında insan yok. Yazdıkların yapay zekaya gönderilir, sesin tarayıcının ses
            tanıma servisine gidebilir. Biz kaydını saklamıyoruz. Kişisel bilgilerini yazma.
          </span>
        </p>

        {noVoice && (
          <p className="partner-notice partner-notice-warn">
            <Icon name="info" size={16} />
            <span>
              Cihazında {language.name} ses yok, bu yüzden yapay zekanın cümleleri sesli okunamaz (Türkçe sesle okumak
              telaffuzunu bozar). Yazarak konuşabilirsin. Ses eklemek için Ayarlar, Okuma sesi bölümüne bak.
            </span>
          </p>
        )}

        <h2 className="group-title">Nerede konuşalım?</h2>
        <div className="goal-list" role="radiogroup" aria-label="Senaryo">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={selectedId === s.id}
              className={`goal ${selectedId === s.id ? "is-selected" : ""}`}
              onClick={() => setSelectedId(s.id)}
            >
              <span className="goal-icon">
                <Icon name={s.icon} size={22} />
              </span>
              <span className="goal-text">
                <strong>{s.title}</strong>
                <span>{s.hint}</span>
              </span>
            </button>
          ))}
        </div>

        <p className="partner-level">
          Seviyen <strong>{level}</strong>. Sorular buna göre ayarlanır.
        </p>
      </div>

      <div className="partner-footer">
        <Button size="lg" block onClick={() => onStart(scenario)}>
          Konuşmayı başlat
        </Button>
      </div>
    </div>
  );
}
