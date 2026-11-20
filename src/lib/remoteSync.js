// SQL Server ilerleme eşitlemesi (istemci tarafı).
// Sunucu: api/progress.js (Vercel) ya da server/local-sql-api.mjs (yerel köprü).
// Kimlik, hesap açılınca üretilen rastgele bir UUID'dir (state.profileId);
// tahmin edilemez olduğu için başkası bu ilerlemeyi okuyamaz.

const ENDPOINT = "/api/progress";

export const newProfileId = () => window.crypto.randomUUID();

/** Sunucudaki kaydı getirir: { profile, state } ya da hata. */
export async function fetchRemoteProgress(profileId) {
  const res = await fetch(`${ENDPOINT}?profileId=${encodeURIComponent(profileId)}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`progress fetch failed: ${res.status}`);
  return res.json();
}

/** İlerlemeyi sunucuya yazar. */
export async function pushRemoteProgress(profileId, state) {
  const res = await fetch(ENDPOINT, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      profileId,
      profile: {
        displayName: state.user?.name || "Sen",
        learningGoal: state.goal || "general",
        placementLevel: state.placementLevel || "A1",
      },
      state,
    }),
  });
  if (!res.ok) throw new Error(`progress save failed: ${res.status}`);
}
