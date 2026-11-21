// Köy binalarının çizimleri. Her bina 0 (boş arsa) ile 3. seviye arasında farklı görünür.
// Renkler sabittir: köy sahnesi kendi gün/gece rengine sahip, uygulama temasından bağımsızdır.
// `lit`: gece pencereler yanar.

const C = {
  wall: "#f0e4cc",
  wallShade: "#dccdae",
  roof: "#c4694c",
  roofDark: "#a4533a",
  wood: "#8b6b4b",
  door: "#6a4a35",
  glass: "#bcd8ea",
  lit: "#ffd98a",
  leaf: "#6aa86a",
  leafDark: "#4d8a52",
  soil: "#7a5a40",
  stone: "#cfd3d6",
  stoneDark: "#a9aeb3",
  water: "#7cc4e8",
  red: "#d6604a",
  cream: "#f3ead7",
  gold: "#e8b04a",
};

const Shadow = () => <ellipse cx="48" cy="86" rx="34" ry="5" fill="rgba(0,0,0,0.18)" />;
const Window = ({ x, y, w = 10, h = 10, lit }) => (
  <g>
    {lit && <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} rx="4" fill={C.lit} opacity="0.28" />}
    <rect x={x} y={y} width={w} height={h} rx="2" fill={lit ? C.lit : C.glass} stroke={C.wood} strokeWidth="1.2" />
    <path d={`M${x + w / 2} ${y} V${y + h} M${x} ${y + h / 2} H${x + w}`} stroke={C.wood} strokeWidth="0.9" />
  </g>
);
const Door = ({ x, y = 62, w = 12, h = 20 }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx="2" fill={C.door} />
    <circle cx={x + w - 3} cy={y + h / 2} r="1.1" fill={C.gold} />
  </g>
);
const Smoke = ({ x, y }) => (
  <g fill="#ffffff" opacity="0.55">
    <circle cx={x} cy={y} r="3" />
    <circle cx={x + 3} cy={y - 7} r="4" />
    <circle cx={x + 1} cy={y - 15} r="3" />
  </g>
);

/* ---------- Ev ---------- */
function Home({ level, lit }) {
  if (level === 1) {
    return (
      <g>
        <rect x="24" y="48" width="48" height="34" fill={C.wall} />
        <path d="M16 50 L48 24 L80 50 Z" fill={C.roof} />
        <Door x={42} />
        <Window x={28} y={56} lit={lit} />
        <Window x={58} y={56} lit={lit} />
      </g>
    );
  }
  if (level === 2) {
    return (
      <g>
        <rect x="62" y="18" width="8" height="18" fill={C.roofDark} />
        <rect x="18" y="42" width="60" height="40" fill={C.wall} />
        <path d="M10 44 L48 14 L86 44 Z" fill={C.roof} />
        <rect x="18" y="76" width="60" height="6" fill={C.wallShade} />
        <Door x={42} />
        <Window x={24} y={52} lit={lit} />
        <Window x={62} y={52} lit={lit} />
        <Smoke x={66} y={14} />
      </g>
    );
  }
  return (
    <g>
      <rect x="64" y="6" width="8" height="20" fill={C.roofDark} />
      <rect x="18" y="30" width="60" height="52" fill={C.wall} />
      <path d="M10 32 L48 6 L86 32 Z" fill={C.roof} />
      <rect x="18" y="58" width="60" height="3" fill={C.wallShade} />
      <rect x="36" y="52" width="24" height="3" fill={C.wood} />
      <Window x={24} y={38} lit={lit} />
      <Window x={62} y={38} lit={lit} />
      <Window x={43} y={36} lit={lit} />
      <Door x={42} y={64} />
      <Window x={24} y={66} lit={lit} />
      <Window x={62} y={66} lit={lit} />
      <Smoke x={68} y={4} />
    </g>
  );
}

/* ---------- Pazar ---------- */
function Awning({ x0, x1, y0, y1, stripes }) {
  const w = (x1 - x0) / stripes;
  return (
    <g>
      {Array.from({ length: stripes }, (_, i) => (
        <path
          key={i}
          d={`M${x0 + i * w} ${y0} H${x0 + (i + 1) * w} L${x0 + (i + 1) * w - 2} ${y1} H${x0 + i * w + 2} Z`}
          fill={i % 2 ? C.cream : C.red}
        />
      ))}
    </g>
  );
}
const Crate = ({ x, y, fruit }) => (
  <g>
    <rect x={x} y={y} width="14" height="10" rx="1.5" fill={C.wood} />
    <circle cx={x + 4} cy={y} r="3.2" fill={fruit} />
    <circle cx={x + 10} cy={y - 0.5} r="3.2" fill={fruit} opacity="0.9" />
  </g>
);

function Market({ level, lit }) {
  if (level === 1) {
    return (
      <g>
        <rect x="22" y="44" width="3" height="38" fill={C.wood} />
        <rect x="71" y="44" width="3" height="38" fill={C.wood} />
        <Awning x0={16} x1={80} y0={36} y1={50} stripes={6} />
        <rect x="20" y="64" width="56" height="18" fill={C.wood} />
        <Crate x={26} y={56} fruit={C.red} />
        <Crate x={52} y={56} fruit="#e8a23a" />
      </g>
    );
  }
  if (level === 2) {
    return (
      <g>
        <rect x="14" y="40" width="3" height="42" fill={C.wood} />
        <rect x="79" y="40" width="3" height="42" fill={C.wood} />
        <Awning x0={8} x1={88} y0={30} y1={46} stripes={8} />
        <rect x="12" y="62" width="72" height="20" fill={C.wood} />
        <Crate x={18} y={54} fruit={C.red} />
        <Crate x={41} y={54} fruit="#e8a23a" />
        <Crate x={64} y={54} fruit={C.leaf} />
        <circle cx="48" cy="22" r="6" fill={C.gold} />
      </g>
    );
  }
  return (
    <g>
      <rect x="12" y="40" width="72" height="42" fill={C.wall} />
      <path d="M8 42 L48 20 L88 42 Z" fill={C.roof} />
      <Awning x0={14} x1={82} y0={46} y1={58} stripes={8} />
      <rect x="46" y="4" width="2" height="18" fill={C.wood} />
      <path d="M48 5 L62 9 L48 13 Z" fill={C.red} />
      <Window x={20} y={64} w={12} lit={lit} />
      <Window x={64} y={64} w={12} lit={lit} />
      <Door x={42} y={62} w={14} />
      <Crate x={22} y={74} fruit={C.red} />
      <Crate x={60} y={74} fruit="#e8a23a" />
    </g>
  );
}

/* ---------- Fırın ---------- */
function Bakery({ level, lit }) {
  if (level === 1) {
    return (
      <g>
        <rect x="58" y="30" width="8" height="22" fill={C.roofDark} />
        <rect x="26" y="52" width="44" height="30" fill={C.wall} />
        <path d="M20 54 L48 32 L76 54 Z" fill={C.roof} />
        <Door x={34} y={62} w={11} h={20} />
        <Window x={52} y={60} lit={lit} />
        <Smoke x={62} y={26} />
      </g>
    );
  }
  if (level === 2) {
    return (
      <g>
        <rect x="64" y="22" width="9" height="26" fill={C.roofDark} />
        <rect x="18" y="46" width="60" height="36" fill={C.wall} />
        <path d="M12 48 L48 22 L84 48 Z" fill={C.roof} />
        <circle cx="48" cy="40" r="7" fill={C.cream} stroke={C.wood} strokeWidth="1.2" />
        <ellipse cx="48" cy="40" rx="4.5" ry="2.8" fill={C.gold} />
        <Door x={26} y={62} w={12} h={20} />
        <Window x={50} y={58} w={14} h={12} lit={lit} />
        <Smoke x={68} y={18} />
      </g>
    );
  }
  return (
    <g>
      <rect x="66" y="14" width="9" height="30" fill={C.roofDark} />
      <rect x="14" y="44" width="68" height="38" fill={C.wall} />
      <path d="M8 46 L48 18 L88 46 Z" fill={C.roof} />
      <circle cx="48" cy="36" r="7" fill={C.cream} stroke={C.wood} strokeWidth="1.2" />
      <ellipse cx="48" cy="36" rx="4.5" ry="2.8" fill={C.gold} />
      <Awning x0={18} x1={60} y0={54} y1={64} stripes={6} />
      <Window x={20} y={66} w={32} h={14} lit={lit} />
      <Door x={62} y={60} w={13} h={22} />
      <Smoke x={70} y={10} />
    </g>
  );
}

/* ---------- Bahçe ---------- */
const Plant = ({ x, y, s = 1, color = C.leaf }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M0 0 V-8" stroke={C.leafDark} strokeWidth="1.6" strokeLinecap="round" />
    <ellipse cx="-3.5" cy="-8" rx="3.6" ry="2.2" fill={color} transform="rotate(-30 -3.5 -8)" />
    <ellipse cx="3.5" cy="-9" rx="3.6" ry="2.2" fill={color} transform="rotate(30 3.5 -9)" />
  </g>
);

function Garden({ level }) {
  if (level === 1) {
    return (
      <g>
        <rect x="16" y="58" width="64" height="24" rx="4" fill={C.soil} />
        {[24, 40, 56, 72].map((x) => (
          <Plant key={x} x={x} y={72} />
        ))}
      </g>
    );
  }
  if (level === 2) {
    return (
      <g>
        <rect x="10" y="52" width="76" height="30" rx="4" fill={C.soil} />
        {[18, 32, 46, 60, 74].map((x) => (
          <Plant key={x} x={x} y={64} s={1.2} />
        ))}
        {[24, 40, 56, 70].map((x, i) => (
          <circle key={x} cx={x} cy={76} r="3" fill={i % 2 ? "#e8a23a" : C.red} />
        ))}
        <path d="M8 52 H88 M8 44 H88" stroke={C.wood} strokeWidth="2" />
        {[8, 28, 48, 68, 88].map((x) => (
          <rect key={x} x={x - 1.5} y="40" width="3" height="16" fill={C.wood} />
        ))}
      </g>
    );
  }
  return (
    <g>
      <rect x="10" y="40" width="54" height="42" rx="3" fill="#cfe7ee" opacity="0.8" stroke={C.stoneDark} strokeWidth="1.5" />
      <path d="M10 56 H64 M10 70 H64 M28 40 V82 M46 40 V82" stroke={C.stoneDark} strokeWidth="1" />
      <path d="M8 42 L37 26 L66 42 Z" fill="#a9d3dd" stroke={C.stoneDark} strokeWidth="1.2" />
      {[20, 37, 54].map((x) => (
        <Plant key={x} x={x} y={80} s={1.1} color={C.leafDark} />
      ))}
      <rect x="76" y="56" width="4" height="26" fill={C.wood} />
      <circle cx="78" cy="48" r="15" fill={C.leaf} />
      <circle cx="70" cy="54" r="9" fill={C.leafDark} />
      <circle cx="74" cy="44" r="2.4" fill={C.red} />
      <circle cx="83" cy="52" r="2.4" fill={C.red} />
    </g>
  );
}

/* ---------- Çeşme ---------- */
function Fountain({ level }) {
  if (level === 1) {
    return (
      <g>
        <ellipse cx="48" cy="76" rx="30" ry="10" fill={C.stoneDark} />
        <ellipse cx="48" cy="72" rx="30" ry="10" fill={C.stone} />
        <ellipse cx="48" cy="72" rx="23" ry="6.5" fill={C.water} />
      </g>
    );
  }
  if (level === 2) {
    return (
      <g>
        <ellipse cx="48" cy="78" rx="34" ry="10" fill={C.stoneDark} />
        <ellipse cx="48" cy="74" rx="34" ry="10" fill={C.stone} />
        <ellipse cx="48" cy="74" rx="27" ry="6.5" fill={C.water} />
        <rect x="44" y="42" width="8" height="32" fill={C.stone} />
        <ellipse cx="48" cy="42" rx="12" ry="3.5" fill={C.stoneDark} />
        <path d="M48 40 Q40 28 33 44 M48 40 Q56 28 63 44" fill="none" stroke={C.water} strokeWidth="2.4" strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g>
      <ellipse cx="48" cy="80" rx="38" ry="10" fill={C.stoneDark} />
      <ellipse cx="48" cy="76" rx="38" ry="10" fill={C.stone} />
      <ellipse cx="48" cy="76" rx="31" ry="6.5" fill={C.water} />
      <rect x="44" y="40" width="8" height="36" fill={C.stone} />
      <ellipse cx="48" cy="56" rx="19" ry="5" fill={C.stoneDark} />
      <ellipse cx="48" cy="54" rx="19" ry="5" fill={C.stone} />
      <ellipse cx="48" cy="54" rx="14" ry="3" fill={C.water} />
      <ellipse cx="48" cy="38" rx="9" ry="3" fill={C.stoneDark} />
      <path d="M48 36 Q40 20 31 40 M48 36 Q56 20 65 40 M48 34 V18" fill="none" stroke={C.water} strokeWidth="2.4" strokeLinecap="round" />
      <g fill="#ffffff">
        <circle cx="32" cy="22" r="1.6" />
        <circle cx="66" cy="24" r="1.6" />
        <circle cx="48" cy="12" r="1.8" />
      </g>
    </g>
  );
}

/* ---------- Boş arsa ---------- */
function Plot({ id }) {
  return (
    <g>
      <ellipse cx="48" cy="74" rx="32" ry="10" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeDasharray="4 4" />
      <rect x="45" y="46" width="3" height="28" fill={C.wood} />
      <rect x="34" y="42" width="26" height="12" rx="2" fill={C.cream} stroke={C.wood} strokeWidth="1.2" />
      {id === "garden" ? (
        <path d="M47 51 V45 M44 47 Q47 44 47 47 Q47 44 50 46" stroke={C.leafDark} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M43 48 H55 M49 44 V52" stroke={C.wood} strokeWidth="1.6" strokeLinecap="round" />
      )}
    </g>
  );
}

const ART = { home: Home, market: Market, bakery: Bakery, garden: Garden, fountain: Fountain };

export default function BuildingArt({ id, level, lit = false, size = 84 }) {
  const Art = ART[id];
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} aria-hidden="true" focusable="false">
      {level > 0 && id !== "fountain" && id !== "garden" && <Shadow />}
      {level === 0 ? <Plot id={id} /> : <Art level={level} lit={lit} />}
    </svg>
  );
}
