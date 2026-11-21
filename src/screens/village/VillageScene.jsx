// Köy sahnesi: saate göre gündüz / akşam / gece, tepeler, yol, binalar ve zeminde yürüyen Kart.
import { useEffect, useState } from "react";
import Mascot from "../../components/Mascot";
import { BUILDINGS, levelOf, pendingHarvests, timeOfDay } from "../../data/village";
import { mascotSay } from "../../lib/mascot";
import BuildingArt from "./buildingArt";

// Binaların sahnedeki yeri: x sahne genişliğinin yüzdesi (bina ortası), y üstten piksel.
const POS = {
  home: { x: 26, y: 64 },
  bakery: { x: 75, y: 56 },
  garden: { x: 24, y: 176 },
  fountain: { x: 51, y: 196 },
  market: { x: 78, y: 172 },
};

const LINES = [
  "Köyümüz her gün biraz daha güzelleşiyor.",
  "Bir binayı yükseltmek için puan topla.",
  "Bugün kaç kelime öğrendin?",
  "Gece olunca pencereler yanıyor, fark ettin mi?",
  "Fırından ekmek kokusu geliyor!",
];

/** Saat başı değil, dakikada bir kontrol: gündüz akşama dönerken sahne kendiliğinden değişir. */
export function useTimeOfDay() {
  const [tod, setTod] = useState(() => timeOfDay());
  useEffect(() => {
    const timer = setInterval(() => setTod(timeOfDay()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return tod;
}

export default function VillageScene({ state, onOpen }) {
  const tod = useTimeOfDay();
  const pending = Object.fromEntries(pendingHarvests(state).map((h) => [h.id, h.amount]));
  const hasPending = Object.keys(pending).length > 0;

  const talk = () => {
    const text = hasPending ? "Hasat zamanı! Bekleyen puanlar var." : LINES[Math.floor(Math.random() * LINES.length)];
    mascotSay(text, { mood: hasPending ? "cheer" : "happy" });
  };

  return (
    <div className={`village-scene tod-${tod}`}>
      <div className="vs-orb" aria-hidden="true" />
      {tod === "night" && <div className="vs-stars" aria-hidden="true" />}
      {tod !== "night" && (
        <>
          <span className="vs-cloud vs-cloud-1" aria-hidden="true" />
          <span className="vs-cloud vs-cloud-2" aria-hidden="true" />
        </>
      )}

      <svg className="vs-land" viewBox="0 0 400 372" preserveAspectRatio="none" aria-hidden="true">
        <path className="vs-hill-far" d="M0 150 Q60 96 140 132 T290 118 T400 138 V372 H0 Z" />
        <path className="vs-hill-near" d="M0 196 Q90 150 200 182 T400 172 V372 H0 Z" />
        <path className="vs-ground" d="M0 226 Q200 204 400 230 V372 H0 Z" />
        <path className="vs-road-edge" d="M-10 332 Q120 292 200 312 T410 300 M200 250 Q198 282 204 310" />
        <path className="vs-road" d="M-10 332 Q120 292 200 312 T410 300 M200 250 Q198 282 204 310" />
      </svg>

      {BUILDINGS.map((b) => {
        const level = levelOf(state.village, b.id);
        const ready = pending[b.id];
        return (
          <button
            key={b.id}
            type="button"
            className={`vb ${level === 0 ? "is-plot" : ""}`}
            style={{ left: `${POS[b.id].x}%`, top: POS[b.id].y }}
            onClick={() => onOpen(b.id)}
            aria-label={`${b.name}, ${level === 0 ? "boş arsa" : `${level}. seviye`}${ready ? `, ${ready} puan hasat bekliyor` : ""}`}
          >
            {ready && <span className="vb-harvest">+{ready}</span>}
            <BuildingArt id={b.id} level={level} lit={tod === "night"} />
            <span className="vb-label">
              {b.short}
              {level > 0 && <i>{level}</i>}
            </span>
          </button>
        );
      })}

      <button type="button" className="village-kart" onClick={talk} aria-label="Kart ile konuş">
        <Mascot mood={hasPending ? "cheer" : "happy"} size={50} />
      </button>
    </div>
  );
}
