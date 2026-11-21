// "Köy" sekmesi: Kart'ın köyü. Puanlarla bina kurulur ve yükseltilir; Pazar eski Mağaza'nın yerini alır.
import { useState } from "react";
import Icon from "../../components/Icon";
import { Button } from "../../components/ui";
import {
  BUILDINGS,
  MAX_VILLAGE_LEVEL,
  levelOf,
  pendingHarvests,
  upgradeBlock,
  upgradeCost,
  villageLevel,
} from "../../data/village";
import { useApp } from "../../state/AppContext";
import BuildingPage from "./BuildingPage";
import BuildingArt from "./buildingArt";
import VillageScene from "./VillageScene";

/** Listede bir binanın durumu: hasat, yükseltme bedeli ya da engel. */
function statusLine(state, b) {
  const level = levelOf(state.village, b.id);
  const ready = pendingHarvests(state).find((h) => h.id === b.id);
  if (ready) return { text: `+${ready.amount} puan hasat bekliyor`, tone: "amber" };
  const cost = upgradeCost(b.id, level);
  if (cost === null) return { text: "En üst seviye", tone: "mint" };
  const block = upgradeBlock(state, b.id);
  if (block === null) return { text: `${level === 0 ? "Kurulabilir" : "Yükseltilebilir"}: ${cost} puan`, tone: "mint" };
  if (block === "cap") return { text: "Önce evi yükselt", tone: "dim" };
  return { text: `${level === 0 ? "Kurulum" : "Yükseltme"}: ${cost} puan`, tone: "dim" };
}

export default function VillageScreen() {
  const { state, actions, villageTarget, setVillageTarget } = useApp();
  const [open, setOpen] = useState(null); // açık bina
  const current = open ?? villageTarget; // başka ekrandan "Pazar'a git" ile de açılabilir
  const close = () => {
    setOpen(null);
    setVillageTarget(null);
  };

  const pending = pendingHarvests(state);
  const pendingTotal = pending.reduce((n, h) => n + h.amount, 0);

  return (
    <div className="screen village">
      <div className="village-head">
        <div>
          <h1 className="screen-title">Kart'ın köyü</h1>
          <p className="screen-sub">
            Köy seviyesi {villageLevel(state.village)}/{MAX_VILLAGE_LEVEL}
          </p>
        </div>
        <div className="balance balance-compact">
          <Icon name="star" size={18} filled />
          <strong>{state.xp}</strong>
        </div>
      </div>

      {pendingTotal > 0 && (
        <Button block variant="success" icon="star" onClick={() => actions.harvest()}>
          Hepsini topla (+{pendingTotal} puan)
        </Button>
      )}

      <VillageScene state={state} onOpen={setOpen} />

      <h2 className="group-title">Binalar</h2>
      <ul className="vlist">
        {BUILDINGS.map((b) => {
          const level = levelOf(state.village, b.id);
          const st = statusLine(state, b);
          return (
            <li key={b.id}>
              <button type="button" className="vlist-row" onClick={() => setOpen(b.id)}>
                <span className="vlist-art">
                  <BuildingArt id={b.id} level={level} size={46} />
                </span>
                <span className="vlist-text">
                  <strong>{b.name}</strong>
                  <span className={`vlist-status is-${st.tone}`}>{st.text}</span>
                </span>
                <span className="vlist-level">{level === 0 ? "Arsa" : `Sv. ${level}`}</span>
                <Icon name="chevronRight" size={18} className="row-chevron" />
              </button>
            </li>
          );
        })}
      </ul>
      <p className="group-hint">
        Puanı kelime öğrenerek, oyun oynayarak ve ünite bitirerek kazanırsın. Her gün binalardan hasat toplamayı
        unutma.
      </p>

      {current && <BuildingPage id={current} onClose={close} />}
    </div>
  );
}
