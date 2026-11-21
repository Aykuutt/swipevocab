// Bir binanın içi: seviye, etkisi, hasat, yükseltme (ve Pazar'da dükkân).
import Icon from "../../components/Icon";
import { Button, Group, Overlay, Row } from "../../components/ui";
import {
  MAX_LEVEL,
  TYPES,
  harvestAmount,
  homeLevel,
  itemById,
  pendingHarvests,
  upgradeBlock,
  upgradeCost,
} from "../../data/village";
import { useTimeOfDay } from "../../hooks/useTimeOfDay";
import { useApp } from "../../state/AppContext";
import { ItemPreview } from "./isoArt";
import MarketPanel from "./MarketPanel";

/** Bir seviyedeki etkinin tek cümlelik anlatımı. */
export function effectText(type, level) {
  const t = TYPES[type];
  if (level === 0) return "Henüz kurulmadı.";
  if (type === "home") return `Diğer binalar en fazla ${Math.min(MAX_LEVEL, level + 1)}. seviyeye çıkabilir.`;
  if (type === "market") {
    const d = Math.round((t.discount[level - 1] ?? 0) * 100);
    return d > 0 ? `Pazar fiyatlarında %${d} indirim.` : "Henüz indirim yok.";
  }
  return `Günde ${t.harvest[level - 1]} puan hasat edilir.`;
}

export default function BuildingPage({ id, onClose }) {
  const { state, actions } = useApp();
  const tod = useTimeOfDay();
  const item = itemById(state.village, id);
  if (!item) return null; // satıldıysa sayfa boş kalmasın

  const t = TYPES[item.type];
  const level = item.level;
  const block = upgradeBlock(state, id);
  const cost = upgradeCost(item);
  const ready = pendingHarvests(state).find((h) => h.id === id);
  const hasHarvest = !!t.harvest;

  const reason =
    block === "max"
      ? "En üst seviyedesin."
      : block === "cap"
        ? `Önce evi ${homeLevel(state.village) + 1}. seviyeye yükselt.`
        : block === "xp"
          ? `${cost - state.xp} puan daha lazım.`
          : null;

  return (
    <Overlay label={t.name}>
      <div className="screen building-page">
        <div className="settings-head">
          <button type="button" className="icon-btn" aria-label="Köye dön" onClick={onClose}>
            <Icon name="chevronLeft" size={22} />
          </button>
          <h1 className="screen-title">{t.name}</h1>
        </div>

        <div className={`building-stage tod-${tod}`}>
          <ItemPreview type={item.type} level={level} lit={tod === "night"} size={190} />
        </div>

        <div className="building-level">
          <span className="badge-pips" role="img" aria-label={`${level} / ${MAX_LEVEL} seviye`}>
            {Array.from({ length: MAX_LEVEL }, (_, i) => (
              <i key={i} className={i < level ? "on" : ""} />
            ))}
          </span>
          <span>{`Seviye ${level} / ${MAX_LEVEL}`}</span>
        </div>
        <p className="building-role">{t.role}</p>

        <Group title="Etki">
          <Row icon="check" tone="mint" title="Şu an" desc={effectText(item.type, level)} />
          {level < MAX_LEVEL && (
            <Row icon="chevronUp" tone="amber" title={`Sonraki seviye (${level + 1})`} desc={effectText(item.type, level + 1)} />
          )}
        </Group>

        {hasHarvest && (
          <Group title="Hasat">
            <Row
              icon="star"
              tone="amber"
              title={ready ? `Bugünkü hasat: +${harvestAmount(item)} puan` : "Bugünkü hasat alındı"}
              desc={ready ? "Hazır, topla." : "Yarın yeniden hazır olur."}
            >
              <Button size="sm" disabled={!ready} onClick={() => actions.harvest(id)}>
                Topla
              </Button>
            </Row>
          </Group>
        )}

        {cost !== null && (
          <Group title="Yükseltme">
            <li className="upgrade-card">
              <div className="upgrade-cost">
                <Icon name="star" size={18} filled />
                <strong>{cost}</strong>
                <span>puan · şu an {state.xp} puanın var</span>
              </div>
              <Button size="lg" block disabled={!!block} onClick={() => actions.upgradeBuilding(id)}>
                {level + 1}. seviyeye yükselt
              </Button>
              {reason && <p className="upgrade-reason">{reason}</p>}
            </li>
          </Group>
        )}
        {cost === null && <p className="upgrade-reason">En üst seviyedesin, tebrikler!</p>}

        {item.type === "market" && <MarketPanel />}
      </div>
    </Overlay>
  );
}
