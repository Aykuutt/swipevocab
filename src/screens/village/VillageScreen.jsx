// "Köy" sekmesi: Dilbaz'ın köyü, tam ekran. Haritada bina, süs ve yol yerleştirilir, taşınır, satılır;
// binalara girilip yükseltme ve hasat yönetilir. Pazar eski Mağaza'nın yerini alır.
import { useRef, useState } from "react";
import Icon from "../../components/Icon";
import { Button } from "../../components/ui";
import {
  EXPAND_STEP,
  SIDES,
  TYPES,
  buyBlock,
  buyPrice,
  canPlace,
  canSell,
  expandBlock,
  expandCost,
  expandRequirement,
  homeLevel,
  isBuilding,
  itemById,
  lockedHarvests,
  pendingHarvests,
  sellValue,
  villageLevel,
} from "../../data/village";
import { useTimeOfDay } from "../../hooks/useTimeOfDay";
import { mascotSay } from "../../lib/mascot";
import { useApp } from "../../state/AppContext";
import { claimableOrders, weeklyClaimable } from "../../data/orders";
import { availableVillagers, heartsFor, talkState } from "../../data/villagers";
import { storyChapter } from "../../data/stories";
import BuildingPage, { effectText } from "./BuildingPage";
import { ItemPreview } from "./isoArt";
import OrdersSheet from "./OrdersSheet";
import VillageMap from "./VillageMap";
import VillageShop from "./VillageShop";
import VillagerTalk from "./VillagerTalk";
import VillageHelp from "./VillageHelp";
import VillageTour from "./VillageTour";

const KART_LINES = [
  "Köyümüz her gün biraz daha güzelleşiyor.",
  "Bir binayı yükseltmek için puan topla.",
  "Gece olunca pencereler yanıyor, fark ettin mi?",
  "Yol döşersen köy daha derli toplu görünür.",
  "Ağaç dikmeyi unutma, hepsi çok ucuz!",
];

export default function VillageScreen() {
  const { state, actions, goTo, leaveVillage, villageTarget, setVillageTarget } = useApp();
  const mapRef = useRef(null);
  const tod = useTimeOfDay();
  const [selectedId, setSelectedId] = useState(null);
  const [placing, setPlacing] = useState(null); // { type, x, y, moveId?, level? }
  const [shopOpen, setShopOpen] = useState(false);
  const [pageId, setPageId] = useState(null);
  const [confirmSell, setConfirmSell] = useState(false);
  const [talkId, setTalkId] = useState(null);
  const [expandSide, setExpandSide] = useState(null);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  // İlk girişte tur kendiliğinden açılır; "Turu tekrar izle" ile yeniden.
  const [tourAgain, setTourAgain] = useState(false);
  const tourOpen = tourAgain || !state.village.tour;

  const { village } = state;
  const pending = pendingHarvests(state);
  const pendingTotal = pending.reduce((n, h) => n + h.amount, 0);
  const pendingMap = Object.fromEntries(pending.map((h) => [h.id, h.amount]));
  // Çalışılmadıysa hasat kilitli: günün kart hedefini bitirmesi gerekir.
  const locked = lockedHarvests(state);
  const lockedTotal = locked.reduce((n, h) => n + h.amount, 0);
  const goal = state.settings.dailyGoal;

  // Bugün henüz konuşulmamış köylüler: başlarında sohbet balonu çıkar.
  const claimable = new Set(claimableOrders(state).map((x) => x.villager.id));
  const claimCount = claimable.size + (weeklyClaimable(state) ? 1 : 0);
  const alerts = new Map(
    availableVillagers(village).flatMap((v) =>
      claimable.has(v.id)
        ? [[v.id, "order"]]
        : talkState(village, v.id).last !== state.day
          ? [[v.id, storyChapter(village, v.id, heartsFor(talkState(village, v.id).talks)) !== null ? "story" : "talk"]]
          : []
    )
  );

  // Arazi genişletme işaretleri: her kenar için bedel ve engel.
  const expansions = village.expansions ?? 0;
  const expandInfo = Object.fromEntries(
    SIDES.map(({ id }) => [id, { cost: expandCost(expansions), block: expandBlock(state, id), need: expandRequirement(expansions) }])
  );

  const selected = selectedId ? itemById(village, selectedId) : null;
  const pageItem = itemById(village, pageId ?? villageTarget);
  const closePage = () => {
    setPageId(null);
    setVillageTarget(null);
  };

  /* ---------- yerleştirme ---------- */
  const startPlacing = (type) => {
    const pos = mapRef.current.suggest(type);
    setPlacing({ type, ...pos });
    setShopOpen(false);
    setSelectedId(null);
    setExpandSide(null);
  };
  const startMove = (item) => {
    setPlacing({ type: item.type, x: item.x, y: item.y, moveId: item.id, level: item.level });
    setSelectedId(null);
    setConfirmSell(false);
  };
  const placeOk = placing ? canPlace(village, placing.type, placing.x, placing.y, placing.moveId ?? null) : false;
  const placeBlock = placing && !placing.moveId ? buyBlock(state, placing.type) : null;

  const confirmPlace = () => {
    if (!placing || !placeOk || placeBlock) return;
    const t = TYPES[placing.type];
    if (placing.moveId) {
      actions.moveItem(placing.moveId, placing.x, placing.y);
      setSelectedId(placing.moveId);
      setPlacing(null);
      return;
    }
    if (!actions.placeItem(placing.type, placing.x, placing.y)) return;
    // Yol döşerken devam et: hayalet bir yana kayar.
    if (t.kind === "road") {
      setPlacing({ ...placing, x: placing.x + 1 });
    } else {
      setPlacing(null);
    }
  };

  const sell = () => {
    if (!selected) return;
    actions.sellItem(selected.id);
    setSelectedId(null);
    setConfirmSell(false);
  };

  const kartSays = () => {
    if (lockedTotal > 0) {
      mascotSay("Bugün çalışmadın, fırınlar soğuk! Kartlarını bitir, hasat açılsın.", { mood: "think" });
      return;
    }
    const text = pendingTotal > 0 ? "Hasat zamanı! Bekleyen puanlar var." : KART_LINES[Math.floor(Math.random() * KART_LINES.length)];
    mascotSay(text, { mood: pendingTotal > 0 ? "cheer" : "happy" });
  };

  const exit = leaveVillage;

  const selType = selected && TYPES[selected.type];
  const placeType = placing && TYPES[placing.type];

  return (
    <div className={`village-full tod-${tod}`}>
      <VillageMap
        ref={mapRef}
        village={village}
        tod={tod}
        pending={pendingMap}
        alerts={alerts}
        selectedId={selectedId}
        placing={placing}
        expand={expandInfo}
        expandSide={expandSide}
        onExpand={(side) => {
          setSelectedId(null);
          setConfirmSell(false);
          setExpandSide(side);
        }}
        onSelect={(id) => {
          setSelectedId(id);
          setConfirmSell(false);
          setExpandSide(null);
        }}
        onGhost={(pos) => setPlacing((p) => (p ? { ...p, ...pos } : p))}
        onHarvest={(id) => actions.harvest(id)}
        onKart={kartSays}
        onVillager={(vid) => {
          setSelectedId(null);
          setTalkId(vid);
        }}
      />

      <div className="vhud-top">
        <button type="button" className="vhud-btn" aria-label="Köyden çık" onClick={exit}>
          <Icon name="close" size={22} />
        </button>
        <div className="vhud-title">
          <strong>Dilbaz'ın köyü</strong>
          <span>Köy seviyesi {villageLevel(village)}</span>
        </div>
        <button type="button" className="vhud-btn vhud-help" aria-label="Ne yapmalıyım?" data-tour="help" onClick={() => setHelpOpen(true)}>
          ?
        </button>
        <div className="vhud-balance" aria-label={`${state.xp} puan`} data-tour="balance">
          <Icon name="star" size={18} filled />
          {state.xp}
        </div>
      </div>

      {pendingTotal > 0 && !placing && (
        <button type="button" className="vhud-harvest" data-tour="harvest" onClick={() => actions.harvest()}>
          <Icon name="star" size={16} filled />
          Hepsini topla (+{pendingTotal})
        </button>
      )}

      {lockedTotal > 0 && !placing && (
        <button type="button" className="vhud-harvest is-locked" data-tour="harvest" onClick={() => goTo("learn")}>
          <Icon name="lock" size={15} />
          Hasat için bugünkü kartları bitir ({Math.min(state.swipedToday, goal)}/{goal})
        </button>
      )}

      <div className="vhud-zoom">
        <button type="button" className="vhud-btn" aria-label="Yakınlaştır" onClick={() => mapRef.current.zoomBy(1.25)}>
          +
        </button>
        <button type="button" className="vhud-btn" aria-label="Uzaklaştır" onClick={() => mapRef.current.zoomBy(0.8)}>
          −
        </button>
      </div>

      {/* alt çubuk: yerleştirme, seçim ya da ana düğmeler */}
      {placing ? (
        <div className="vbar" role="group" aria-label="Yerleştirme">
          <div className="vbar-info">
            <ItemPreview type={placing.type} level={placing.level ?? 1} size={46} />
            <div>
              <strong>{placeType.name}</strong>
              <span>
                {placing.moveId
                  ? "Yeni yerine sürükle ya da dokun."
                  : placeBlock === "xp"
                    ? "Puan yetmiyor."
                    : `${buyPrice(placing.type, village)} puan · sürükle ya da dokun`}
              </span>
            </div>
          </div>
          <div className="vbar-actions">
            <Button variant="success" disabled={!placeOk || !!placeBlock} onClick={confirmPlace}>
              {placing.moveId ? "Taşı" : "Onayla"}
            </Button>
            <Button variant="secondary" onClick={() => setPlacing(null)}>
              {placeType.kind === "road" && !placing.moveId ? "Bitir" : "İptal"}
            </Button>
          </div>
          {!placeOk && <p className="vbar-note">Buraya konamaz: dolu ya da arazinin dışında.</p>}
        </div>
      ) : expandSide ? (
        <div className="vbar" role="group" aria-label="Arazi genişletme">
          <div className="vbar-info">
            <div>
              <strong>Araziyi genişlet</strong>
              <span>
                {SIDES.find((s) => s.id === expandSide).label} tarafa {EXPAND_STEP} sıra yeni toprak. Ağaçlar temizlenir, yeni yere bina koyabilirsin.
              </span>
            </div>
          </div>
          <div className="vbar-actions">
            <Button
              variant="success"
              disabled={!!expandInfo[expandSide].block}
              onClick={() => {
                if (actions.expandLand(expandSide)) setExpandSide(null);
              }}
            >
              Genişlet ({expandInfo[expandSide].cost} puan)
            </Button>
            <Button variant="secondary" onClick={() => setExpandSide(null)}>
              Vazgeç
            </Button>
          </div>
          {expandInfo[expandSide].block === "level" && <p className="vbar-note">Önce evi {expandInfo[expandSide].need}. seviyeye yükselt (şu an {homeLevel(village)}).</p>}
          {expandInfo[expandSide].block === "xp" && <p className="vbar-note">{expandInfo[expandSide].cost - state.xp} puan daha lazım.</p>}
        </div>
      ) : selected ? (
        <div className="vbar" role="group" aria-label={selType.name}>
          <div className="vbar-info">
            <ItemPreview type={selected.type} level={selected.level} size={46} />
            <div>
              <strong>{selType.name}</strong>
              <span>
                {isBuilding(selected.type) ? `Seviye ${selected.level} · ${effectText(selected.type, selected.level)}` : selType.kind === "road" ? "Yürüyüş yolu" : "Süs"}
              </span>
            </div>
            <button type="button" className="icon-btn" aria-label="Seçimi kapat" onClick={() => setSelectedId(null)}>
              <Icon name="close" size={18} />
            </button>
          </div>
          <div className="vbar-actions">
            {isBuilding(selected.type) && <Button onClick={() => setPageId(selected.id)}>Gir</Button>}
            <Button variant="secondary" onClick={() => startMove(selected)}>
              Taşı
            </Button>
            {canSell(selected) &&
              (confirmSell ? (
                <>
                  <Button variant="danger" onClick={sell}>
                    Sat (+{sellValue(selected)})
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmSell(false)}>
                    Vazgeç
                  </Button>
                </>
              ) : (
                <Button variant="secondary" onClick={() => setConfirmSell(true)}>
                  Sat
                </Button>
              ))}
          </div>
        </div>
      ) : (
        <div className="vbar vbar-main">
          <Button size="lg" variant="secondary" icon="check" data-tour="orders" onClick={() => setOrdersOpen(true)}>
            Siparişler
            {claimCount > 0 && <span className="vbtn-badge">{claimCount}</span>}
          </Button>
          <Button size="lg" icon="store" data-tour="shop" onClick={() => setShopOpen(true)}>
            Dükkân
          </Button>
        </div>
      )}

      {ordersOpen && <OrdersSheet onClose={() => setOrdersOpen(false)} />}
      {helpOpen && (
        <VillageHelp
          onClose={() => setHelpOpen(false)}
          onTour={() => {
            setHelpOpen(false);
            setTourAgain(true);
          }}
          onAction={(a) => {
            setHelpOpen(false);
            if (a === "orders") setOrdersOpen(true);
            else if (a === "harvest") actions.harvest();
            else if (a === "learn") goTo("learn");
            else if (a === "shop") setShopOpen(true);
            else if (a === "home") setPageId("home");
          }}
        />
      )}
      {tourOpen && !placing && !shopOpen && !ordersOpen && !talkId && !pageItem && (
        <VillageTour
          onDone={() => {
            setTourAgain(false);
            actions.finishVillageTour();
          }}
        />
      )}
      {shopOpen && <VillageShop state={state} onPick={startPlacing} onClose={() => setShopOpen(false)} />}
      {talkId && <VillagerTalk key={talkId} id={talkId} onClose={() => setTalkId(null)} />}
      {pageItem && <BuildingPage id={pageItem.id} onClose={closePage} />}
    </div>
  );
}
