// Bir binanın içi: seviye, etkisi, hasat, yükseltme (ve Pazar'da dükkân).
import Icon from "../../components/Icon";
import { Button, Group, Overlay, Row } from "../../components/ui";
import {
  MAX_LEVEL,
  getBuilding,
  harvestAmount,
  levelCap,
  levelOf,
  pendingHarvests,
  upgradeBlock,
  upgradeCost,
} from "../../data/village";
import { useApp } from "../../state/AppContext";
import BuildingArt from "./buildingArt";
import MarketPanel from "./MarketPanel";
import { useTimeOfDay } from "./VillageScene";

/** Bir seviyedeki etkinin tek cümlelik anlatımı. */
function effectText(b, level) {
  if (level === 0) return "Henüz kurulmadı.";
  if (b.id === "home") return `Diğer binalar en fazla ${Math.min(MAX_LEVEL, level + 1)}. seviyeye çıkabilir.`;
  if (b.id === "market") {
    const d = Math.round((b.discount[level - 1] ?? 0) * 100);
    return d > 0 ? `Pazar fiyatlarında %${d} indirim.` : "Henüz indirim yok.";
  }
  return `Günde ${harvestAmount(b.id, level)} puan hasat edilir.`;
}

export default function BuildingPage({ id, onClose }) {
  const { state, actions } = useApp();
  const tod = useTimeOfDay();
  const b = getBuilding(id);
  const level = levelOf(state.village, id);
  const block = upgradeBlock(state, id);
  const cost = upgradeCost(id, level);
  const ready = pendingHarvests(state).find((h) => h.id === id);
  const hasHarvest = !!b.harvest && level > 0;

  const reason =
    block === "max"
      ? "En üst seviyedesin."
      : block === "cap"
        ? `Önce evi ${levelOf(state.village, "home") + 1}. seviyeye yükselt.`
        : block === "xp"
          ? `${cost - state.xp} puan daha lazım.`
          : null;

  return (
    <Overlay label={b.name}>
      <div className="screen building-page">
        <div className="settings-head">
          <button type="button" className="icon-btn" aria-label="Köye dön" onClick={onClose}>
            <Icon name="chevronLeft" size={22} />
          </button>
          <h1 className="screen-title">{b.name}</h1>
        </div>

        <div className={`building-stage tod-${tod}`}>
          <BuildingArt id={id} level={level} lit={tod === "night"} size={160} />
        </div>

        <div className="building-level">
          <span className="badge-pips" role="img" aria-label={`${level} / ${MAX_LEVEL} seviye`}>
            {Array.from({ length: MAX_LEVEL }, (_, i) => (
              <i key={i} className={i < level ? "on" : ""} />
            ))}
          </span>
          <span>{level === 0 ? "Boş arsa" : `Seviye ${level} / ${MAX_LEVEL}`}</span>
        </div>
        <p className="building-role">{b.role}</p>

        <Group title="Etki">
          <Row icon="check" tone="mint" title="Şu an" desc={effectText(b, level)} />
          {level < MAX_LEVEL && (
            <Row icon="chevronUp" tone="amber" title={`Sonraki seviye (${level + 1})`} desc={effectText(b, level + 1)} />
          )}
        </Group>

        {hasHarvest && (
          <Group title="Hasat">
            <Row
              icon="star"
              tone="amber"
              title={ready ? `Bugünkü hasat: +${ready.amount} puan` : "Bugünkü hasat alındı"}
              desc={ready ? "Hazır, topla." : "Yarın yeniden hazır olur."}
            >
              <Button size="sm" disabled={!ready} onClick={() => actions.harvest(id)}>
                Topla
              </Button>
            </Row>
          </Group>
        )}

        {cost !== null && (
          <Group title={level === 0 ? "İnşa" : "Yükseltme"}>
            <li className="upgrade-card">
              <div className="upgrade-cost">
                <Icon name="star" size={18} filled />
                <strong>{cost}</strong>
                <span>puan · şu an {state.xp} puanın var</span>
              </div>
              <Button size="lg" block disabled={!!block} onClick={() => actions.upgradeBuilding(id)}>
                {level === 0 ? "İnşa et" : `${level + 1}. seviyeye yükselt`}
              </Button>
              {reason && <p className="upgrade-reason">{reason}</p>}
              {block === "cap" && levelCap(state.village, id) < MAX_LEVEL && (
                <p className="upgrade-reason">Ev büyüdükçe diğer binalar da büyüyebilir.</p>
              )}
            </li>
          </Group>
        )}
        {cost === null && <p className="upgrade-reason">En üst seviyedesin, tebrikler!</p>}

        {id === "market" && <MarketPanel />}
      </div>
    </Overlay>
  );
}
