/** Diziyi karıştırılmış yeni bir kopya olarak döner (Fisher-Yates). */
export function shuffle(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Diziden rastgele `count` öğe seçer. */
export function sample(list, count) {
  return shuffle(list).slice(0, count);
}

export const unique = (list) => [...new Set(list)];

export const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
