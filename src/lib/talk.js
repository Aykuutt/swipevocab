// Canlı sesli konuşma: eşleştirme, oda anahtarı, engelleme ve şikayet.
// Sunucu tarafı: supabase/talk.sql ve api/livekit-token.js.
import { LEVELS } from "../config";
import { TALK_PROMPTS } from "../data/talkPrompts";
import { supabase } from "./supabase";

export const TALK_REPORT_REASONS = [
  "Hakaret ya da taciz",
  "Uygunsuz içerik",
  "Spam ya da reklam",
  "Konuşmadı / sessiz kaldı",
  "Diğer",
];

/** Diğer kullanıcıların göreceği ad ve seviye. */
export async function upsertProfile(userId, name, level) {
  const display_name = (name || "Kullanıcı").trim().slice(0, 40) || "Kullanıcı";
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, display_name, level, updated_at: new Date().toISOString() });
  if (error) throw error;
}

/**
 * Eşleşme dener. Partner bulunursa { callId, room, partnerId, partnerName, partnerLevel },
 * bulunamazsa null döner (kullanıcı sıraya alınmış olur; birkaç saniyede bir tekrar çağrılmalı).
 * Hesap şikayetler nedeniyle askıdaysa { suspended: true } döner.
 */
export async function findPartner(level) {
  const { data, error } = await supabase.rpc("talk_find_partner", { p_level: level });
  if (error) {
    if (/suspended/.test(error.message || "")) return { suspended: true };
    throw error;
  }
  const row = data?.[0];
  if (!row) return null;
  return {
    callId: row.call_id,
    room: row.room,
    partnerId: row.partner_id,
    partnerName: row.partner_name || "Partner",
    partnerLevel: row.partner_level || "",
  };
}

export async function leaveQueue() {
  await supabase.rpc("talk_leave_queue");
}

export async function endCall(callId) {
  await supabase.rpc("talk_end_call", { p_call: callId });
}

/** Vercel fonksiyonundan bu görüşmenin odasına giriş anahtarı alır. */
export async function fetchRoomToken(callId) {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new Error("no_session");
  const res = await fetch("/api/livekit-token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ callId }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `token_failed_${res.status}`);
  return body; // { token, url }
}

export async function blockUser(blockerId, blockedId) {
  const { error } = await supabase.from("talk_blocks").upsert({ blocker: blockerId, blocked: blockedId });
  if (error) throw error;
}

export async function reportUser(reporterId, reportedId, callId, reason) {
  const { error } = await supabase
    .from("talk_reports")
    .insert({ reporter: reporterId, reported: reportedId, call_id: callId, reason: reason.slice(0, 300) });
  if (error) throw error;
}

/* ---------- İki tarafta aynı kartlar ---------- */

// Görüşme kimliğinden türetilen tohumla her iki taraf aynı soruları ve kelimeleri görür.
function seededRandom(seedText) {
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(list, rand) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Görüşmenin kartları: 6 soru ve 6 hedef kelime. Kelimeler iki tarafın seviyelerinin
 * ortalamasına yakın seçilir; böylece ikisi için de makul olur.
 */
export function cardsForCall(callId, words, levelA, levelB) {
  const rand = seededRandom(callId);
  const a = Math.max(0, LEVELS.indexOf(levelA));
  const b = Math.max(0, LEVELS.indexOf(levelB || levelA));
  const target = (a + b) / 2;
  const prompts = seededShuffle(TALK_PROMPTS, rand).slice(0, 6);
  const sorted = [...words].sort((x, y) => x.id - y.id); // iki tarafta aynı sıra
  const pool = sorted.filter((w) => Math.abs(LEVELS.indexOf(w.level) - target) <= 1);
  const targetWords = seededShuffle(pool.length >= 6 ? pool : sorted, rand).slice(0, 6);
  return { prompts, targetWords };
}
