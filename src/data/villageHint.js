// Köyde "Ne yapmalıyım?" ipucu: o an yapılabilecek en mantıklı şeyi seçer (saf fonksiyon, test edilebilir).
// Sıra: teslim edilecek sipariş > toplanacak hasat > kilitli hasat (çalış) > konuşmak isteyen köylü >
// alınabilecek bina > ev yükseltme > arazi genişletme > her şey yolunda.
import { claimableOrders, weeklyClaimable } from "./orders";
import { storyChapter } from "./stories";
import { SIDES, TYPES, buyBlock, expandBlock, expandCost, itemsOfType, lockedHarvests, pendingHarvests, upgradeBlock } from "./village";
import { availableVillagers, heartsFor, talkState } from "./villagers";

/** { text, mood, action? } action: "orders" | "harvest" | "learn" | "shop" | "home" | null */
export function villageHint(state) {
  const { village } = state;

  if (weeklyClaimable(state)) {
    return { text: "Haftalık büyük siparişin tamam! Siparişler'den teslim et, büyük ödül seni bekliyor.", mood: "cheer", action: "orders" };
  }
  const claim = claimableOrders(state);
  if (claim.length > 0) {
    return { text: `${claim[0].villager.name}'in siparişi hazır! Siparişler'den teslim et.`, mood: "cheer", action: "orders" };
  }

  const pending = pendingHarvests(state);
  if (pending.length > 0) {
    const total = pending.reduce((n, h) => n + h.amount, 0);
    return { text: `Hasat hazır: ${total} puan! Binaların üstündeki balonlara dokun ya da "Hepsini topla"ya bas.`, mood: "cheer", action: "harvest" };
  }

  if (lockedHarvests(state).length > 0) {
    const goal = state.settings.dailyGoal;
    return {
      text: `Bugün henüz çalışmadın, fırınlar soğuk! Öğren'de bugünkü kartlarını bitir (${Math.min(state.swipedToday, goal)}/${goal}), hasat açılsın.`,
      mood: "think",
      action: "learn",
    };
  }

  const talkers = availableVillagers(village).filter((v) => talkState(village, v.id).last !== state.day);
  const story = talkers.find((v) => storyChapter(village, v.id, heartsFor(talkState(village, v.id).talks)) !== null);
  if (story) {
    return { text: `${story.name}'in hikâyesinde yeni bir bölüm açıldı! Başında mor yıldız olan ${story.name}'e dokun.`, mood: "cheer", action: null };
  }
  if (talkers.length > 0) {
    return {
      text: `${talkers[0].name} seninle konuşmak istiyor. Haritada ona dokun, öğrendiğin dilde sohbet edin.`,
      mood: "happy",
      action: null,
    };
  }

  const affordable = Object.values(TYPES).find(
    (t) => t.kind === "building" && itemsOfType(village, t.id).length === 0 && buyBlock(state, t.id) === null
  );
  if (affordable) {
    return { text: `${affordable.name} kurmaya puanın yetiyor! Dükkân'dan al, yeni bir köylü de gelsin.`, mood: "cheer", action: "shop" };
  }

  if (upgradeBlock(state, "home") === null) {
    return { text: "Evini yükseltebilirsin! Eve dokun, Gir'e bas. Büyük ev, yeni binaların kilidini açar.", mood: "happy", action: "home" };
  }

  const side = SIDES.find((s) => expandBlock(state, s.id) === null);
  if (side) {
    return {
      text: `Arazini genişletebilirsin (${expandCost(village.expansions ?? 0)} puan). Köyün kenarındaki yeşil işaretlere dokun.`,
      mood: "happy",
      action: null,
    };
  }

  return {
    text: "Bugün köyde her şey yolunda! Kelime öğrendikçe puan kazanır, köyü büyütürsün. Yarın yeni siparişler gelecek.",
    mood: "wave",
    action: "learn",
  };
}
