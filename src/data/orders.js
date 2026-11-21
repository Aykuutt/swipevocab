// Köylü siparişleri: her köylü her gün öğrenmeyle ilgili bir iş ister (soru çöz, kart kaydır, kelime öğren, ünite bitir).
// Siparişler elle yazılmaz, kurallardan kendiliğinden üretilir ve hiç bitmez: tür, günün tarihinden seçilir,
// hedef oyuncunun seviyesine göre büyür. Böylece uygulama her gün yeni bir görev sunar.
//
// İlerleme `state.counters` içindeki ömür boyu sayaçlardan ölçülür (siparişin oluştuğu andaki değer `base`'tir).
import { availableVillagers, getVillager, heartBonus, talkState } from "./villagers";
import { villageLevel } from "./village";
import { weekOfDay } from "../lib/time";

export const ORDER_KINDS = {
  correct: { base: 5, step: 2, reward: (n) => n + 4, text: (n) => `Bugün ${n} soruyu doğru cevapla.`, unit: "doğru cevap" },
  cards: { base: 8, step: 2, reward: (n) => Math.round(n * 0.75) + 3, text: (n) => `${n} kelime kartı kaydır.`, unit: "kart" },
  learned: { base: 2, step: 1, reward: (n) => n * 3 + 3, text: (n) => `${n} yeni kelime öğren.`, unit: "kelime" },
  units: { base: 1, step: 0, reward: (n) => n * 15, text: (n) => (n === 1 ? "Yoldan bir üniteyi bitir." : `Yoldan ${n} üniteyi bitir.`), unit: "ünite" },
};

// Hangi köylü ne ister: mesleğine yakın işler.
export const ORDER_PREFS = {
  merchant: ["correct", "cards"],
  baker: ["learned", "units", "correct"],
  gardener: ["cards", "learned", "correct"],
  traveler: ["units", "cards", "correct"],
  librarian: ["learned", "correct", "units"],
};

const hash = (text) => {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
};

/** Zorluk kademesi (0-5): köy büyüdükçe ve kelime öğrendikçe artar. */
export const orderTier = (state) =>
  Math.min(5, Math.floor(villageLevel(state.village) / 4) + Math.floor((state.counters?.learned ?? 0) / 40));

/** Bugünün siparişi: aynı gün ve köylü için hep aynı tür çıkar. */
export function makeOrder(state, villager) {
  const prefs = ORDER_PREFS[villager.id] ?? Object.keys(ORDER_KINDS);
  const kind = prefs[hash(`${state.day}:${villager.id}`) % prefs.length];
  const k = ORDER_KINDS[kind];
  const tier = orderTier(state);
  const target = kind === "units" ? 1 + Math.floor(tier / 3) : k.base + k.step * tier;
  return { kind, target, base: state.counters?.[kind] ?? 0, reward: k.reward(target), day: state.day, claimed: false };
}

export const orderProgress = (state, order) =>
  Math.min(order.target, Math.max(0, (state.counters?.[order.kind] ?? 0) - order.base));
export const orderDone = (state, order) => orderProgress(state, order) >= order.target;
export const orderText = (order) => ORDER_KINDS[order.kind].text(order.target);

/** Yeni sipariş gerekir mi? Eski gün ve (teslim edilmiş ya da bitmemiş) sipariş yenilenir; bitmiş ama teslim edilmemiş durur. */
export const needsNewOrder = (state, order) =>
  !order || (order.day !== state.day && (order.claimed || !orderDone(state, order)));

/** Teslim edilmeyi bekleyen (bitmiş) siparişler: [{ villager, order }] */
export function claimableOrders(state) {
  return availableVillagers(state.village)
    .map((villager) => ({ villager, order: state.village.orders?.[villager.id] }))
    .filter(({ order }) => order && !order.claimed && orderDone(state, order));
}

/** Teslimde verilecek toplam puan: sipariş ödülü + yeni kalp kazanılıyorsa bonus. */
export function claimReward(state, villagerId, order) {
  return order.reward + heartBonus(talkState(state.village, villagerId).talks);
}

/* ---------- haftalık büyük sipariş ---------- */
// Dilbaz her hafta tek ve büyük bir iş ister. Tür haftaya göre döner, hedef ve ödül oyuncunun kademesiyle büyür.
// Hafta bitince bitmemişse yenisi gelir; bitmiş ama teslim edilmemişse teslim edilene kadar durur.
export const WEEKLY_KINDS = {
  learned: { target: (t) => 12 + 3 * t, text: (n) => `Bu hafta ${n} yeni kelime öğren.` },
  correct: { target: (t) => 40 + 10 * t, text: (n) => `Bu hafta ${n} soruyu doğru cevapla.` },
  units: { target: (t) => 3 + Math.floor(t / 2), text: (n) => `Bu hafta yoldan ${n} ünite bitir.` },
  cards: { target: (t) => 50 + 10 * t, text: (n) => `Bu hafta ${n} kelime kartı kaydır.` },
};
const WEEKLY_ORDER = ["learned", "correct", "units", "cards"];
export const weeklyReward = (tier) => 60 + 10 * tier;

export function makeWeekly(state) {
  const week = weekOfDay(state.day);
  const kind = WEEKLY_ORDER[hash(`week:${week}`) % WEEKLY_ORDER.length];
  const tier = orderTier(state);
  const target = WEEKLY_KINDS[kind].target(tier);
  return { kind, target, base: state.counters?.[kind] ?? 0, reward: weeklyReward(tier), week, claimed: false };
}

export const weeklyText = (w) => WEEKLY_KINDS[w.kind].text(w.target);
export const needsNewWeekly = (state, w) =>
  !w || (w.week !== weekOfDay(state.day) && (w.claimed || !orderDone(state, w)));
export const weeklyClaimable = (state) => {
  const w = state.village?.weekly;
  return !!w && !w.claimed && orderDone(state, w);
};
/** Bu haftanın bitmesine kalan gün (bugün dahil). */
export const weeklyDaysLeft = (state) => weekOfDay(state.day) * 7 - state.day + 1;

export { getVillager };
