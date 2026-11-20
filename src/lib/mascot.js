// Maskot Kart'ın ekranın köşesinden konuşma balonuyla belirmesi.
// Uygulamanın herhangi bir yerinden: mascotSay("Harika!", { mood: "cheer" })

export const MASCOT_EVENT = "sv:mascot";

/**
 * @param {string} text  balonda görünecek metin
 * @param {{ mood?: "happy"|"cheer"|"sad"|"wave"|"think", duration?: number }} [options]
 */
export function mascotSay(text, { mood = "happy", duration = 4500 } = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MASCOT_EVENT, { detail: { text, mood, duration, key: Date.now() } }));
}
