// Yolun arka planındaki sahneler: her konunun (ve içindeki her ünitenin) kendi süsleri vardır.
// Şekiller currentColor ile boyanır; renk konudan ve temadan gelir.
import { TOPICS } from "../../data/topics";

const S = { viewBox: "0 0 56 56", width: "100%", height: "100%", fill: "currentColor", "aria-hidden": true };
const line = { fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round" };

const SHAPES = {
  house: (
    <svg {...S}>
      <path fillRule="evenodd" d="M8 28 L28 10 L48 28 V48 H8 Z M24 34 H33 V48 H24 Z" />
    </svg>
  ),
  tree: (
    <svg {...S}>
      <circle cx="28" cy="22" r="16" />
      <rect x="25" y="34" width="6" height="16" rx="2" />
    </svg>
  ),
  sun: (
    <svg {...S}>
      <circle cx="28" cy="28" r="10" />
      <g {...line}>
        <path d="M28 6 V12 M28 44 V50 M6 28 H12 M44 28 H50 M12 12 L16 16 M40 40 L44 44 M44 12 L40 16 M16 40 L12 44" />
      </g>
    </svg>
  ),
  cloud: (
    <svg {...S}>
      <path d="M14 42 a10 10 0 0 1 1.5-19.9 A13 13 0 0 1 40 19 a11.5 11.5 0 0 1 2 23 Z" />
    </svg>
  ),
  plane: (
    <svg {...S}>
      <path d="M5 30 L51 12 L39 46 L30 35 L21 41 L19 29 Z" />
    </svg>
  ),
  mountain: (
    <svg {...S}>
      <path d="M3 48 L21 16 L31 32 L38 23 L53 48 Z" />
    </svg>
  ),
  sprout: (
    <svg {...S}>
      <path d="M28 52 V28" {...line} />
      <path d="M28 32 C14 32 9 21 11 11 C25 11 31 19 28 32 Z" />
      <path d="M28 38 C41 38 47 29 45 20 C35 20 28 27 28 38 Z" />
    </svg>
  ),
  flower: (
    <svg {...S}>
      <g>
        <ellipse cx="28" cy="13" rx="7" ry="10" />
        <ellipse cx="28" cy="13" rx="7" ry="10" transform="rotate(72 28 24)" />
        <ellipse cx="28" cy="13" rx="7" ry="10" transform="rotate(144 28 24)" />
        <ellipse cx="28" cy="13" rx="7" ry="10" transform="rotate(216 28 24)" />
        <ellipse cx="28" cy="13" rx="7" ry="10" transform="rotate(288 28 24)" />
      </g>
      <path d="M28 32 V52" {...line} />
    </svg>
  ),
  building: (
    <svg {...S}>
      <path
        fillRule="evenodd"
        d="M10 52 V10 H34 V52 Z M16 16 H21 V22 H16 Z M24 16 H29 V22 H24 Z M16 28 H21 V34 H16 Z M24 28 H29 V34 H24 Z M16 40 H21 V46 H16 Z M24 40 H29 V46 H24 Z"
      />
      <path d="M37 52 V28 H50 V52 Z" />
    </svg>
  ),
  chart: (
    <svg {...S}>
      <rect x="7" y="32" width="11" height="20" rx="3" />
      <rect x="23" y="20" width="11" height="32" rx="3" />
      <rect x="39" y="8" width="11" height="44" rx="3" />
    </svg>
  ),
  star: (
    <svg {...S}>
      <path d="M28 5 L34.6 20.4 L51 22 L38.6 33 L42.2 49 L28 40.6 L13.8 49 L17.4 33 L5 22 L21.4 20.4 Z" />
    </svg>
  ),
  book: (
    <svg {...S}>
      <path d="M6 12 H25 Q28 12 28 15 V47 Q26 44 23 44 H6 Z" />
      <path d="M50 12 H31 Q28 12 28 15 V47 Q30 44 33 44 H50 Z" />
    </svg>
  ),
  planet: (
    <svg {...S}>
      <circle cx="28" cy="28" r="13" />
      <ellipse cx="28" cy="28" rx="25" ry="8" transform="rotate(-20 28 28)" {...line} />
    </svg>
  ),
};

// Her konu için üç farklı süs; üniteler sırayla bunları kullanır.
const TOPIC_SHAPES = {
  daily: ["house", "tree", "sun"],
  travel: ["cloud", "plane", "mountain"],
  growth: ["sprout", "flower", "tree"],
  work: ["building", "chart", "building"],
  academic: ["star", "book", "planet"],
};

/** `items`: PathMap'in yerleşim listesi. Konu bantlarını ve yan süsleri çizer. */
export default function PathScenery({ items, height, unitGap, centerX }) {
  const sections = items.filter((i) => i.kind === "section");
  const units = items.filter((i) => i.kind === "unit");

  const bands = sections.map((sec, i) => {
    const top = Math.max(0, sec.y - 12);
    const bottom = i + 1 < sections.length ? sections[i + 1].y - 12 : height;
    return { topic: sec.topic, top, height: bottom - top };
  });

  const decos = [];
  units.forEach((u, n) => {
    const shapes = TOPIC_SHAPES[u.unit.topic] || TOPIC_SHAPES.daily;
    const next = units[n + 1];
    // Ana süs: yolun karşı yanında.
    const left = u.cx > centerX ? true : u.cx < centerX ? false : n % 2 === 0;
    decos.push({ key: `a-${u.unit.id}`, shape: shapes[(u.index + u.unit.number) % shapes.length], top: u.y + 2, left, size: 58, topic: u.unit.topic });
    // Küçük süs: iki ünite arasında, yine yolun karşı yanında.
    if (next && next.unit.topic === u.unit.topic) {
      const avg = (u.cx + next.cx) / 2;
      const smallLeft = avg > centerX ? true : avg < centerX ? false : n % 2 === 1;
      decos.push({
        key: `b-${u.unit.id}`,
        shape: shapes[(u.index + 1) % shapes.length],
        top: u.y + unitGap / 2 + 18,
        left: smallLeft,
        size: 34,
        topic: u.unit.topic,
      });
    }
  });

  return (
    <div className="path-scenes" style={{ height }} aria-hidden="true">
      {bands.map((b) => (
        <div
          key={b.topic}
          className="path-scene"
          style={{ top: b.top, height: b.height, "--topic": TOPICS[b.topic].color }}
        />
      ))}
      {decos.map((d) => (
        <span
          key={d.key}
          className="scene-deco"
          style={{
            top: d.top,
            [d.left ? "left" : "right"]: d.size > 40 ? "3%" : "9%",
            width: d.size,
            height: d.size,
            "--topic": TOPICS[d.topic].color,
          }}
        >
          {SHAPES[d.shape]}
        </span>
      ))}
    </div>
  );
}
