// Arkadaşlar ve köy ziyareti (sunucu tarafı: supabase/friends.sql).
// Yalnızca hesabı olanlar içindir. Arkadaşlara görünen: ad, köy haritası, köy seviyesi, seri ve dil.
// E-posta ve kelimeler paylaşılmaz.
import { villageLevel } from "../data/village";
import { supabase } from "./supabase";

export class FriendsError extends Error {}

const fail = (error) => {
  if (error?.code === "PGRST202" || /function .* does not exist|schema cache/i.test(error?.message || "")) {
    return new FriendsError("Arkadaşlar şu an kullanılamıyor. Biraz sonra tekrar dene.");
  }
  if (/fetch|network/i.test(error?.message || "")) return new FriendsError("İnternet bağlantını kontrol et.");
  return new FriendsError("Bir şeyler ters gitti, tekrar dene.");
};

/** Köyün arkadaşlara gösterilecek kopyası: yalnızca harita (sohbet, sipariş, hasat bilgisi yok). */
export function villageSnapshot(village) {
  return {
    items: village.items.map(({ type, x, y, level }) => ({ type, x, y, level })),
    land: village.land,
    expansions: village.expansions ?? 0,
  };
}

/** Vitrin için özet: değişince yeniden gönderilir. */
export function publicInfo(state, streak) {
  return {
    p_name: state.user?.name || "Oyuncu",
    p_snapshot: villageSnapshot(state.village),
    p_level: villageLevel(state.village),
    p_streak: streak,
    p_language: state.language,
  };
}

/** Kendi köy vitrinini günceller; arkadaş kodunu döndürür. */
export async function publishVillage(info) {
  const { data, error } = await supabase.rpc("village_publish", info);
  if (error) throw fail(error);
  return data;
}

/** Kodla arkadaş isteği: sent | accepted | already | self | not_found | limit */
export async function sendFriendRequest(code) {
  const clean = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(clean)) return "invalid";
  const { data, error } = await supabase.rpc("friend_request", { p_code: clean });
  if (error) throw fail(error);
  return data;
}

export async function respondFriendRequest(fromId, accept) {
  const { error } = await supabase.rpc("friend_respond", { p_from: fromId, p_accept: accept });
  if (error) throw fail(error);
}

export async function removeFriend(otherId) {
  const { error } = await supabase.rpc("friend_remove", { p_other: otherId });
  if (error) throw fail(error);
}

/** Gelen arkadaşlık isteği sayısı (bildirim noktası için). */
export async function countIncoming() {
  const { data, error } = await supabase.rpc("friend_incoming");
  if (error) throw fail(error);
  return data?.length ?? 0;
}

/** Arkadaşlar, gelen ve gönderilen istekler, bugün beğenilenler ve son gelen beğeniler. */
export async function loadFriends(userId) {
  const [friends, incoming, outgoing, likes] = await Promise.all([
    supabase.from("village_public").select("user_id, display_name, level, streak, language, updated_at").neq("user_id", userId),
    supabase.rpc("friend_incoming"),
    supabase.from("friend_requests").select("to_id").eq("from_id", userId),
    supabase.from("village_likes").select("from_id, to_id, day, created_at").order("created_at", { ascending: false }).limit(60),
  ]);
  const err = friends.error || incoming.error || outgoing.error || likes.error;
  if (err) throw fail(err);
  const names = new Map(friends.data.map((f) => [f.user_id, f.display_name]));
  const today = new Date().toISOString().slice(0, 10); // sunucunun günü (UTC) ile aynı biçim
  return {
    friends: friends.data.sort((a, b) => a.display_name.localeCompare(b.display_name, "tr")),
    incoming: incoming.data ?? [],
    outgoingCount: outgoing.data.length,
    likedToday: new Set(likes.data.filter((l) => l.from_id === userId && l.day === today).map((l) => l.to_id)),
    received: likes.data
      .filter((l) => l.to_id === userId)
      .slice(0, 10)
      .map((l) => ({ ...l, name: names.get(l.from_id) ?? "Eski bir arkadaş" })),
  };
}

/** Bir arkadaşın köyü (vitrin kopyası). */
export async function loadFriendVillage(friendId) {
  const { data, error } = await supabase.from("village_public").select("*").eq("user_id", friendId).maybeSingle();
  if (error) throw fail(error);
  return data;
}

/** Arkadaşın köyünü beğen (günde bir). Zaten beğenildiyse sessizce geçer. */
export async function likeVillage(userId, friendId) {
  const { error } = await supabase.from("village_likes").insert({ from_id: userId, to_id: friendId });
  if (error && error.code !== "23505") throw fail(error);
}

/** Vitrin kopyasını haritanın beklediği köy biçimine çevirir (salt görüntüleme). */
export function snapshotToVillage(snapshot) {
  const items = (snapshot?.items ?? []).map((i, n) => ({ id: `f-${n}`, ...i }));
  return {
    v: 2,
    items,
    nextId: items.length + 1,
    land: snapshot?.land ?? { x0: 4, y0: 4, x1: 16, y1: 16 },
    collected: {},
    villagers: {},
    expansions: snapshot?.expansions ?? 0,
    orders: {},
  };
}
