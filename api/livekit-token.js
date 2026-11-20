// Vercel sunucu fonksiyonu: canlı konuşma odası için kısa ömürlü LiveKit anahtarı üretir.
//
// İstek: POST /api/livekit-token, gövde { callId }, başlık "Authorization: Bearer <Supabase erişim anahtarı>"
// Yanıt:  { token, url }
//
// Anahtar yalnızca şu durumda verilir: kullanıcı Supabase'de oturum açmış ve istenen görüşmenin
// iki tarafından biri (talk_calls tablosunun RLS kuralı bunu sağlar), görüşme bitmemiş ve yeni.
// LIVEKIT_API_SECRET yalnızca burada kullanılır, tarayıcıya hiç gitmez.
import { createClient } from "@supabase/supabase-js";
import { AccessToken } from "livekit-server-sdk";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_CALL_AGE_MS = 2 * 60 * 60 * 1000;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const {
    LIVEKIT_URL,
    LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET,
    VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY,
  } = process.env;
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !VITE_SUPABASE_URL || !VITE_SUPABASE_PUBLISHABLE_KEY) {
    return res.status(503).json({ error: "not_configured" });
  }

  const auth = req.headers.authorization || "";
  const jwt = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const callId = req.body?.callId;
  if (!jwt) return res.status(401).json({ error: "unauthorized" });
  if (typeof callId !== "string" || !UUID_RE.test(callId)) return res.status(400).json({ error: "invalid_call" });

  // Kullanıcının kendi anahtarıyla bağlan: RLS kuralları onun adına uygulanır.
  const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
    const user = userData?.user;
    if (userError || !user) return res.status(401).json({ error: "unauthorized" });

    const { data: call, error: callError } = await supabase
      .from("talk_calls")
      .select("room, ended_at, created_at")
      .eq("id", callId)
      .maybeSingle();
    if (callError) throw callError;
    const tooOld = call && Date.now() - new Date(call.created_at).getTime() > MAX_CALL_AGE_MS;
    if (!call || call.ended_at || tooOld) return res.status(403).json({ error: "call_not_available" });

    const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();

    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: user.id,
      name: profile?.display_name || "Kullanıcı",
      ttl: "15m", // odaya katılmak için geçerlilik; bağlantı kurulduktan sonra görüşme sürer
    });
    token.addGrant({ room: call.room, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true });

    return res.status(200).json({ token: await token.toJwt(), url: LIVEKIT_URL });
  } catch (err) {
    console.error("livekit-token failed:", err?.message || err);
    return res.status(500).json({ error: "server_error" });
  }
}
