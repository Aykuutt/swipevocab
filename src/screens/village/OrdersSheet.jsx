// Siparişler: her köylünün bugünkü isteği, ilerlemesi ve teslim düğmesi. Siparişler her gün kendiliğinden yenilenir.
import Icon from "../../components/Icon";
import { Button, ProgressBar } from "../../components/ui";
import { ORDER_KINDS, claimReward, orderDone, orderProgress, orderText, weeklyDaysLeft, weeklyText } from "../../data/orders";
import Mascot from "../../components/Mascot";
import { availableVillagers, heartsFor, talkState } from "../../data/villagers";
import { useApp } from "../../state/AppContext";
import { VillagerPortrait } from "./villagerArt";

/** Dilbaz'ın haftalık büyük siparişi: listenin en üstünde. */
function WeeklyCard() {
  const { state, actions } = useApp();
  const w = state.village.weekly;
  if (!w) return null;
  const progress = orderProgress(state, w);
  const done = orderDone(state, w);
  const left = weeklyDaysLeft(state);
  return (
    <section className={`vweekly ${w.claimed ? "is-claimed" : ""} ${done && !w.claimed ? "is-ready" : ""}`} aria-label="Haftalık büyük sipariş">
      <Mascot mood={done ? "cheer" : "happy"} size={46} />
      <div className="vorder-body">
        <strong>
          Haftalık büyük sipariş <small>{w.claimed ? "gelecek hafta yenisi" : left <= 1 ? "bugün son gün" : `${left} gün kaldı`}</small>
        </strong>
        <span>{weeklyText(w)}</span>
        <div className="vorder-bar">
          <ProgressBar value={(progress / w.target) * 100} tone={done ? "mint" : "amber"} label="Haftalık sipariş" />
          <small>
            {progress}/{w.target}
          </small>
        </div>
      </div>
      <div className="vorder-side">
        {w.claimed ? (
          <span className="pill pill-mint">Teslim edildi</span>
        ) : (
          <>
            <span className="vorder-reward">
              <Icon name="star" size={14} filled />
              {w.reward}
            </span>
            <Button size="sm" disabled={!done} onClick={() => actions.claimWeekly()}>
              Teslim et
            </Button>
          </>
        )}
      </div>
    </section>
  );
}

export default function OrdersSheet({ onClose }) {
  const { state, actions } = useApp();
  const rows = availableVillagers(state.village)
    .map((villager) => ({ villager, order: state.village.orders?.[villager.id] }))
    .filter((r) => r.order);

  return (
    <div className="vshop" role="dialog" aria-label="Siparişler">
      <div className="vshop-head">
        <h2>Siparişler</h2>
        <span className="vshop-balance">
          <Icon name="star" size={16} filled />
          {state.xp}
        </span>
        <button type="button" className="icon-btn" aria-label="Siparişleri kapat" onClick={onClose}>
          <Icon name="close" size={20} />
        </button>
      </div>
      <WeeklyCard />
      <p className="vorders-hint">Köylüler her gün yeni bir şey ister. Öğrenerek bitir, teslim et: puan ve arkadaşlık kazan.</p>
      <ul className="vorders">
        {rows.map(({ villager, order }) => {
          const progress = orderProgress(state, order);
          const done = orderDone(state, order);
          const hearts = heartsFor(talkState(state.village, villager.id).talks);
          return (
            <li key={villager.id} className={`vorder ${order.claimed ? "is-claimed" : ""} ${done && !order.claimed ? "is-ready" : ""}`}>
              <VillagerPortrait id={villager.id} size={36} />
              <div className="vorder-body">
                <strong>
                  {villager.name} <small>{villager.role}</small>
                </strong>
                <span>{orderText(order)}</span>
                <div className="vorder-bar">
                  <ProgressBar value={(progress / order.target) * 100} tone={done ? "mint" : "violet"} label={`${villager.name} siparişi`} />
                  <small>
                    {progress}/{order.target} {ORDER_KINDS[order.kind].unit}
                  </small>
                </div>
                <span className="vorder-hearts" aria-label={`${hearts} kalp`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Icon key={i} name="heart" size={11} filled={i < hearts} />
                  ))}
                </span>
              </div>
              <div className="vorder-side">
                {order.claimed ? (
                  <span className="pill pill-mint">Teslim edildi</span>
                ) : (
                  <>
                    <span className="vorder-reward">
                      <Icon name="star" size={14} filled />
                      {claimReward(state, villager.id, order)}
                    </span>
                    <Button size="sm" disabled={!done} onClick={() => actions.claimOrder(villager.id)}>
                      Teslim et
                    </Button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {rows.length === 0 && <p className="vorders-hint">Henüz sipariş yok. Biraz sonra tekrar bak.</p>}
    </div>
  );
}
