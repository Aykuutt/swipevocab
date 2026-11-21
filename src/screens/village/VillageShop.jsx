// Köy dükkânı: bina, süs ve yol satın alma. Seçilen nesne haritaya yerleştirilir; puan yerleştirince harcanır.
import { useState } from "react";
import Icon from "../../components/Icon";
import { SHOP_TABS, TYPES, buyBlock, buyPrice, itemsOfType } from "../../data/village";
import { ItemPreview } from "./isoArt";

function effect(t) {
  if (t.harvest) return `Çalıştığın gün ${t.harvest[0]} puan`;
  if (t.needFriends) return `${t.needFriends} arkadaşla açılır`;
  if (t.kind === "road") return "Yürüyüş yolu";
  return "Süs";
}

export default function VillageShop({ state, onPick, onClose }) {
  const [tab, setTab] = useState("buildings");
  const types = Object.values(TYPES).filter((t) => t.shop === tab);

  return (
    <div className="vshop" role="dialog" aria-label="Köy dükkânı">
      <div className="vshop-head">
        <h2>Dükkân</h2>
        <span className="vshop-balance">
          <Icon name="star" size={16} filled />
          {state.xp}
        </span>
        <button type="button" className="icon-btn" aria-label="Dükkânı kapat" onClick={onClose}>
          <Icon name="close" size={20} />
        </button>
      </div>
      <div className="vshop-tabs" role="tablist">
        {SHOP_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`vshop-tab ${tab === t.id ? "is-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <ul className="vshop-grid">
        {types.map((t) => {
          const block = buyBlock(state, t.id);
          const owned = itemsOfType(state.village, t.id).length;
          const price = buyPrice(t.id, state.village);
          return (
            <li key={t.id}>
              <button type="button" className={`vshop-card ${block ? "is-blocked" : ""}`} disabled={!!block} onClick={() => onPick(t.id)}>
                <span className="vshop-art">
                  <ItemPreview type={t.id} size={t.w > 1 ? 78 : 62} />
                </span>
                <strong>{t.name}</strong>
                <span className="vshop-effect">{effect(t)}</span>
                <span className={`vshop-price ${block === "xp" ? "is-short" : ""}`}>
                  {block === "max" ? (
                    `Tamam (${owned}/${t.max})`
                  ) : block === "friends" ? (
                    <>
                      <Icon name="lock" size={13} />
                      {t.needFriends} arkadaş
                    </>
                  ) : price === 0 ? (
                    "Ücretsiz"
                  ) : block === "home" ? (
                    <>
                      <Icon name="lock" size={13} />
                      Ev {t.needHome}. seviye
                    </>
                  ) : (
                    <>
                      <Icon name="star" size={14} filled />
                      {price}
                    </>
                  )}
                </span>
                {t.max < 60 && block !== "max" && (
                  <span className="vshop-count">
                    {owned}/{t.max}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
