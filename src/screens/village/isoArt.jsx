// İzometrik (Township gibi çapraz bakış) çizimler. Her nesne kendi köşesi (0,0) olacak biçimde
// yerel koordinatlarda çizilir; harita onu kare konumuna taşır. Renkler sabittir: köy sahnesi
// kendi gün/gece rengine sahip, uygulama temasından bağımsızdır.
//
// Koordinatlar: p(a, b, z): a = x yönünde (sağ-aşağı) kare, b = y yönünde (sol-aşağı) kare, z = yükseklik (piksel).
import { TYPES } from "../../data/village";

export const TW = 64; // bir karenin ekrandaki genişliği
export const TH = 32; // ve yüksekliği (2:1 izometrik)

export const p = (a, b, z = 0) => [((a - b) * TW) / 2, ((a + b) * TH) / 2 - z];
const pts = (list) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
const EDGE = "rgba(40, 24, 20, 0.28)";

const Poly = ({ list, fill, stroke = EDGE, sw = 0.8, opacity }) => (
  <polygon points={pts(list)} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" opacity={opacity} />
);

/** Yerde duran yassı karo (yol, tarla zemini...). */
export const Flat = ({ a0, b0, w, d, z = 0, fill, stroke, sw }) => (
  <Poly list={[p(a0, b0, z), p(a0 + w, b0, z), p(a0 + w, b0 + d, z), p(a0, b0 + d, z)]} fill={fill} stroke={stroke} sw={sw} />
);

/** Dikdörtgen prizma: sol duvar, sağ duvar, üst. c: { left, right, top } */
function Box({ a0, b0, w, d, h, z = 0, c, opacity }) {
  return (
    <g opacity={opacity}>
      <Poly list={[p(a0, b0 + d, z), p(a0 + w, b0 + d, z), p(a0 + w, b0 + d, z + h), p(a0, b0 + d, z + h)]} fill={c.left} />
      <Poly list={[p(a0 + w, b0 + d, z), p(a0 + w, b0, z), p(a0 + w, b0, z + h), p(a0 + w, b0 + d, z + h)]} fill={c.right} />
      <Poly list={[p(a0, b0, z + h), p(a0 + w, b0, z + h), p(a0 + w, b0 + d, z + h), p(a0, b0 + d, z + h)]} fill={c.top} />
    </g>
  );
}

// Duvar üzerinde dikdörtgen: u0..u1 genişlikte, v0..v1 yükseklikte (0-1 oranları).
const wallL = (a0, b0, w, d, z, h, u0, u1, v0, v1) => [
  p(a0 + u0 * w, b0 + d, z + v0 * h),
  p(a0 + u1 * w, b0 + d, z + v0 * h),
  p(a0 + u1 * w, b0 + d, z + v1 * h),
  p(a0 + u0 * w, b0 + d, z + v1 * h),
];
const wallR = (a0, b0, w, d, z, h, u0, u1, v0, v1) => [
  p(a0 + w, b0 + d - u0 * d, z + v0 * h),
  p(a0 + w, b0 + d - u1 * d, z + v0 * h),
  p(a0 + w, b0 + d - u1 * d, z + v1 * h),
  p(a0 + w, b0 + d - u0 * d, z + v1 * h),
];

const Window = ({ list, lit }) => (
  <g>
    <Poly list={list} fill={lit ? "#ffd98a" : "#a9cde3"} stroke="#6b4f3a" sw={1.1} />
    <line
      x1={(list[0][0] + list[3][0]) / 2}
      y1={(list[0][1] + list[3][1]) / 2}
      x2={(list[1][0] + list[2][0]) / 2}
      y2={(list[1][1] + list[2][1]) / 2}
      stroke="#6b4f3a"
      strokeWidth="0.9"
    />
  </g>
);

/** Beşik çatı: sırt x yönünde. Sağda üçgen duvar (alınlık) görünür. z: duvar üstü, rh: çatı yüksekliği. */
function Gable({ a0, b0, w, d, z, rh, o = 0.14, roof, roofDark, gable }) {
  const ym = b0 + d / 2;
  const xa = a0 - o;
  const xb = a0 + w + o;
  const ya = b0 - o;
  const yb = b0 + d + o;
  return (
    <g>
      <Poly list={[p(xa, ya, z), p(xb, ya, z), p(xb, ym, z + rh), p(xa, ym, z + rh)]} fill={roofDark} />
      <Poly list={[p(a0 + w, b0, z), p(a0 + w, b0 + d, z), p(a0 + w, ym, z + rh)]} fill={gable} />
      <Poly list={[p(xa, yb, z), p(xb, yb, z), p(xb, ym, z + rh), p(xa, ym, z + rh)]} fill={roof} />
      <polyline points={pts([p(xa, ym, z + rh), p(xb, ym, z + rh)])} stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" fill="none" />
    </g>
  );
}

const Chimney = ({ a0, b0, z, h = 22 }) => (
  <Box a0={a0} b0={b0} w={0.24} d={0.24} h={h} z={z} c={{ left: "#b0573f", right: "#8e4430", top: "#c9694f" }} />
);

const Smoke = ({ a, b, z }) => {
  const [x, y] = p(a, b, z);
  return (
    <g fill="#fff" opacity="0.6" className="iso-smoke">
      <circle cx={x} cy={y - 4} r="4" />
      <circle cx={x + 4} cy={y - 13} r="5" />
      <circle cx={x + 1} cy={y - 24} r="4" />
    </g>
  );
};

const Shadow = ({ rx = 56, ry = 26, cx = 0, cy = 32, opacity = 0.2 }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#1c2b14" opacity={opacity} />
);

/** Eğik tente (ön kenar aşağıda): şeritli. */
function Awning({ a0, a1, b0, b1, zHigh, zLow, stripes = 6, c1 = "#d6604a", c2 = "#f6ecd8" }) {
  const sw = (a1 - a0) / stripes;
  return (
    <g>
      {Array.from({ length: stripes }, (_, i) => {
        const x0 = a0 + i * sw;
        const x1 = x0 + sw;
        return (
          <Poly
            key={i}
            list={[p(x0, b0, zHigh), p(x1, b0, zHigh), p(x1, b1, zLow), p(x0, b1, zLow)]}
            fill={i % 2 ? c2 : c1}
            stroke="rgba(0,0,0,0.12)"
            sw={0.5}
          />
        );
      })}
    </g>
  );
}

const Crate = ({ a, b, fruit, z = 0 }) => {
  const [cx, cy] = p(a + 0.14, b + 0.14, z + 10);
  return (
    <g>
      <Box a0={a} b0={b} w={0.28} d={0.28} h={10} z={z} c={{ left: "#a07a52", right: "#86623f", top: "#b88f62" }} />
      <circle cx={cx - 3} cy={cy} r="3.6" fill={fruit} />
      <circle cx={cx + 3} cy={cy - 1} r="3.6" fill={fruit} opacity="0.92" />
    </g>
  );
};

/* ---------- Ev ---------- */
const HOME = { left: "#f1e6cf", right: "#d9c9a6", top: "#f6eedc" };

function Home({ level, lit }) {
  const a0 = 0.18;
  const b0 = 0.18;
  const w = 1.64;
  const d = 1.64;
  const h = level === 1 ? 34 : level === 2 ? 42 : 66;
  const rh = level === 1 ? 24 : level === 2 ? 28 : 32;
  return (
    <g>
      <Shadow />
      <Box a0={a0} b0={b0} w={w} d={d} h={h} c={HOME} />
      {level === 3 && (
        <>
          <Poly list={wallL(a0, b0, w, d, 0, h, 0, 1, 0.47, 0.52)} fill="#c9b78f" stroke="none" />
          <Poly list={wallR(a0, b0, w, d, 0, h, 0, 1, 0.47, 0.52)} fill="#b8a67e" stroke="none" />
        </>
      )}
      <Gable a0={a0} b0={b0} w={w} d={d} z={h} rh={rh} roof="#c8664a" roofDark="#a8523a" gable={HOME.right} />
      {level >= 2 && <Chimney a0={a0 + w * 0.62} b0={b0 + d * 0.22} z={h + 6} h={level === 3 ? 26 : 20} />}
      {level >= 2 && <Smoke a={a0 + w * 0.74} b={b0 + d * 0.34} z={h + 6 + (level === 3 ? 26 : 20)} />}
      <Poly list={wallL(a0, b0, w, d, 0, h, 0.4, 0.6, 0, level === 3 ? 0.3 : 0.58)} fill="#6a4a35" />
      {level === 1 && (
        <>
          <Window list={wallL(a0, b0, w, d, 0, h, 0.09, 0.28, 0.4, 0.8)} lit={lit} />
          <Window list={wallL(a0, b0, w, d, 0, h, 0.72, 0.91, 0.4, 0.8)} lit={lit} />
          <Window list={wallR(a0, b0, w, d, 0, h, 0.38, 0.62, 0.4, 0.8)} lit={lit} />
        </>
      )}
      {level === 2 && (
        <>
          <Window list={wallL(a0, b0, w, d, 0, h, 0.08, 0.28, 0.38, 0.82)} lit={lit} />
          <Window list={wallL(a0, b0, w, d, 0, h, 0.72, 0.92, 0.38, 0.82)} lit={lit} />
          <Window list={wallR(a0, b0, w, d, 0, h, 0.15, 0.4, 0.38, 0.82)} lit={lit} />
          <Window list={wallR(a0, b0, w, d, 0, h, 0.6, 0.85, 0.38, 0.82)} lit={lit} />
        </>
      )}
      {level === 3 && (
        <>
          <Window list={wallL(a0, b0, w, d, 0, h, 0.08, 0.26, 0.18, 0.4)} lit={lit} />
          <Window list={wallL(a0, b0, w, d, 0, h, 0.74, 0.92, 0.18, 0.4)} lit={lit} />
          <Window list={wallL(a0, b0, w, d, 0, h, 0.08, 0.26, 0.62, 0.9)} lit={lit} />
          <Window list={wallL(a0, b0, w, d, 0, h, 0.4, 0.6, 0.62, 0.9)} lit={lit} />
          <Window list={wallL(a0, b0, w, d, 0, h, 0.74, 0.92, 0.62, 0.9)} lit={lit} />
          <Window list={wallR(a0, b0, w, d, 0, h, 0.12, 0.38, 0.18, 0.4)} lit={lit} />
          <Window list={wallR(a0, b0, w, d, 0, h, 0.62, 0.88, 0.18, 0.4)} lit={lit} />
          <Window list={wallR(a0, b0, w, d, 0, h, 0.12, 0.38, 0.62, 0.9)} lit={lit} />
          <Window list={wallR(a0, b0, w, d, 0, h, 0.62, 0.88, 0.62, 0.9)} lit={lit} />
          <Box a0={0.52} b0={1.82} w={0.96} d={0.2} h={5} c={{ left: "#b99b78", right: "#9d8160", top: "#cdb18c" }} />
        </>
      )}
    </g>
  );
}

/* ---------- Pazar ---------- */
function Market({ level, lit }) {
  const wood = { left: "#9c7a54", right: "#7f6240", top: "#b58f62" };
  if (level === 3) {
    const a0 = 0.16;
    const b0 = 0.2;
    const w = 1.68;
    const d = 1.4;
    const h = 36;
    return (
      <g>
        <Shadow />
        <Box a0={a0} b0={b0} w={w} d={d} h={h} c={{ left: "#f0e2c6", right: "#d6c19a", top: "#f5ebd4" }} />
        <Gable a0={a0} b0={b0} w={w} d={d} z={h} rh={26} roof="#c75a43" roofDark="#a64832" gable="#d6c19a" />
        <Awning a0={a0 + 0.04} a1={a0 + w - 0.04} b0={b0 + d} b1={b0 + d + 0.42} zHigh={h * 0.62} zLow={h * 0.4} stripes={8} />
        <Window list={wallR(a0, b0, w, d, 0, h, 0.3, 0.7, 0.35, 0.8)} lit={lit} />
        <Poly list={wallL(a0, b0, w, d, 0, h, 0.42, 0.58, 0, 0.34)} fill="#6a4a35" />
        <Crate a={0.3} b={b0 + d + 0.1} fruit="#d6604a" />
        <Crate a={1.35} b={b0 + d + 0.1} fruit="#e8a23a" />
        <Box a0={a0 + w * 0.5} b0={b0 + 0.3} w={0.05} d={0.05} h={70} c={{ left: "#6a4a35", right: "#553a28", top: "#6a4a35" }} />
        <Poly list={[p(a0 + w * 0.5 + 0.05, b0 + 0.32, 70), p(a0 + w * 0.5 + 0.05, b0 + 0.32, 58), p(a0 + w * 0.5 + 0.62, b0 + 0.32, 64)]} fill="#d6604a" />
      </g>
    );
  }
  const wide = level === 2;
  const a0 = wide ? 0.12 : 0.28;
  const a1 = wide ? 1.88 : 1.72;
  const posts = wide ? [0.14, 1.0, 1.86] : [0.3, 1.7];
  return (
    <g>
      <Shadow />
      {/* tezgâh */}
      <Box a0={a0 + 0.08} b0={1.0} w={a1 - a0 - 0.16} d={0.5} h={14} c={wood} />
      {/* direkler */}
      {posts.map((a) => (
        <g key={a}>
          <Box a0={a} b0={0.32} w={0.06} d={0.06} h={34} c={wood} />
          <Box a0={a} b0={1.5} w={0.06} d={0.06} h={30} c={wood} />
        </g>
      ))}
      <Awning a0={a0} a1={a1} b0={0.26} b1={1.62} zHigh={42} zLow={30} stripes={wide ? 8 : 6} />
      <Crate a={a0 + 0.1} b={1.04} fruit="#d6604a" z={14} />
      <Crate a={a0 + 0.62} b={1.04} fruit="#e8a23a" z={14} />
      {wide && <Crate a={a0 + 1.2} b={1.04} fruit="#6aa86a" z={14} />}
      <Crate a={0.12} b={1.62} fruit="#d6604a" />
      {wide && <Crate a={1.52} b={1.62} fruit="#e8a23a" />}
    </g>
  );
}

/* ---------- Fırın ---------- */
const BAKE = { left: "#f4dfb6", right: "#dcc08c", top: "#f8e9c6" };

function Bakery({ level, lit }) {
  const a0 = 0.18;
  const b0 = 0.18;
  const w = 1.64;
  const d = 1.64;
  const h = level === 1 ? 32 : level === 2 ? 38 : 44;
  return (
    <g>
      <Shadow />
      <Box a0={a0} b0={b0} w={w} d={d} h={h} c={BAKE} />
      <Gable a0={a0} b0={b0} w={w} d={d} z={h} rh={22} roof="#b94f3b" roofDark="#983f2e" gable={BAKE.right} />
      <Chimney a0={a0 + w * 0.6} b0={b0 + d * 0.2} z={h + 4} h={level === 3 ? 34 : 26} />
      <Smoke a={a0 + w * 0.72} b={b0 + d * 0.32} z={h + 4 + (level === 3 ? 34 : 26)} />
      {level === 1 && (
        <>
          <Poly list={wallL(a0, b0, w, d, 0, h, 0.12, 0.3, 0, 0.62)} fill="#6a4a35" />
          <Window list={wallL(a0, b0, w, d, 0, h, 0.52, 0.86, 0.3, 0.74)} lit={lit} />
        </>
      )}
      {level >= 2 && (
        <>
          <Poly list={wallL(a0, b0, w, d, 0, h, 0.1, 0.27, 0, 0.6)} fill="#6a4a35" />
          <Awning a0={a0 + 0.4} a1={a0 + w - 0.06} b0={b0 + d} b1={b0 + d + 0.36} zHigh={h * 0.62} zLow={h * 0.42} stripes={6} c1="#c8664a" c2="#f6ecd8" />
          <Window list={wallL(a0, b0, w, d, 0, h, 0.4, 0.92, 0.12, 0.38)} lit={lit || level === 3} />
          <Window list={wallR(a0, b0, w, d, 0, h, 0.3, 0.7, 0.35, 0.78)} lit={lit} />
        </>
      )}
      {/* ekmek tabelası */}
      {(() => {
        const [sx, sy] = p(a0 + w * 0.5, b0 + d + 0.02, h * 0.78);
        return (
          <g>
            <circle cx={sx} cy={sy} r="9" fill="#f6ecd8" stroke="#6a4a35" strokeWidth="1.4" />
            <ellipse cx={sx} cy={sy} rx="5.4" ry="3.4" fill="#e0a548" />
            <path d={`M${sx - 2} ${sy - 1.5} l2 1.6 M${sx + 1} ${sy - 2} l2 1.6`} stroke="#b97a2a" strokeWidth="0.9" />
          </g>
        );
      })()}
    </g>
  );
}

/* ---------- Bahçe ---------- */
const Plant = ({ a, b, s = 1, color = "#6aa86a", fruit }) => {
  const [x, y] = p(a, b, 0);
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s})`}>
      <ellipse cx="0" cy="1" rx="5" ry="2.2" fill="rgba(0,0,0,0.18)" />
      <ellipse cx="-3.5" cy="-5" rx="3.6" ry="6" fill={color} transform="rotate(-24 -3.5 -5)" />
      <ellipse cx="3.5" cy="-6" rx="3.6" ry="6.4" fill={color} transform="rotate(24 3.5 -6)" />
      <ellipse cx="0" cy="-8" rx="3.2" ry="6" fill="#4f9158" />
      {fruit && <circle cx="1" cy="-10" r="2.4" fill={fruit} />}
    </g>
  );
};

function Garden({ level, lit }) {
  const soil = "#7a5a40";
  const rows = [0.5, 1.0, 1.5];
  const cols = [0.42, 0.8, 1.18, 1.56];
  if (level === 3) {
    const a0 = 0.16;
    const b0 = 0.16;
    const w = 1.68;
    const d = 1.68;
    const h = 36;
    return (
      <g>
        <Shadow />
        <Flat a0={0.08} b0={0.08} w={1.84} d={1.84} fill={soil} />
        {rows.flatMap((b) => cols.map((a) => <Plant key={`${a}-${b}`} a={a} b={b} s={0.9} fruit="#d6604a" />))}
        <Box a0={a0} b0={b0} w={w} d={d} h={h} c={{ left: "#cfe8ee", right: "#b4d3dc", top: "#dcf0f3" }} opacity={0.5} />
        <Gable a0={a0} b0={b0} w={w} d={d} z={h} rh={22} o={0.05} roof="#d7ecf1" roofDark="#bcd9e0" gable="#b4d3dc" />
        {/* çerçeve çizgileri */}
        {[0.33, 0.66].map((u) => (
          <g key={u} stroke="#8aa9b2" strokeWidth="1.1" fill="none">
            <polyline points={pts([p(a0 + u * w, b0 + d, 0), p(a0 + u * w, b0 + d, h)])} />
            <polyline points={pts([p(a0 + w, b0 + d - u * d, 0), p(a0 + w, b0 + d - u * d, h)])} />
          </g>
        ))}
        <polyline points={pts([p(a0, b0 + d, h * 0.5), p(a0 + w, b0 + d, h * 0.5), p(a0 + w, b0, h * 0.5)])} stroke="#8aa9b2" strokeWidth="1.1" fill="none" />
        {lit && <ellipse {...{ cx: p(1, 1, 18)[0], cy: p(1, 1, 18)[1], rx: 46, ry: 26 }} fill="#ffe9a0" opacity="0.18" />}
      </g>
    );
  }
  return (
    <g>
      <Shadow rx={52} ry={24} />
      <Flat a0={0.08} b0={0.08} w={1.84} d={1.84} fill={soil} />
      {rows.map((b) => (
        <polyline key={b} points={pts([p(0.2, b + 0.18, 0), p(1.8, b + 0.18, 0)])} stroke="rgba(0,0,0,0.18)" strokeWidth="2" />
      ))}
      {rows.flatMap((b) =>
        cols.map((a) => (
          <Plant
            key={`${a}-${b}`}
            a={a}
            b={b}
            s={level === 1 ? 0.8 : 1}
            color={level === 1 ? "#7ab870" : "#6aa86a"}
            fruit={level === 2 ? ((a + b) * 10) % 2 < 1 ? "#d6604a" : "#e8a23a" : undefined}
          />
        ))
      )}
      {level === 2 &&
        [0.06, 0.7, 1.34, 1.94].map((a) => (
          <Box key={a} a0={a - 0.03} b0={1.92} w={0.06} d={0.06} h={14} c={{ left: "#a07a52", right: "#86623f", top: "#b88f62" }} />
        ))}
      {level === 2 && (
        <polyline points={pts([p(0.03, 1.95, 10), p(1.97, 1.95, 10)])} stroke="#a07a52" strokeWidth="2.4" fill="none" />
      )}
    </g>
  );
}

/* ---------- Çeşme ---------- */
function Fountain({ level }) {
  const [cx, cy] = p(1, 1, 0);
  const stone = "#d3d6d8";
  const stoneDark = "#a8adb1";
  return (
    <g>
      <Shadow rx={62} ry={30} cy={cy + 4} />
      <ellipse cx={cx} cy={cy + 9} rx={58} ry={29} fill={stoneDark} />
      <ellipse cx={cx} cy={cy + 2} rx={58} ry={29} fill={stone} stroke={EDGE} strokeWidth="0.8" />
      <ellipse cx={cx} cy={cy + 2} rx={47} ry={23} fill="#7cc4e8" />
      <ellipse cx={cx - 8} cy={cy - 2} rx={24} ry={9} fill="#a8dcf2" opacity="0.65" />
      {level >= 2 && (
        <g>
          <rect x={cx - 5} y={cy - 40} width="10" height="40" rx="2" fill={stone} stroke={EDGE} strokeWidth="0.7" />
          <ellipse cx={cx} cy={cy - 40} rx="20" ry="8" fill={stoneDark} />
          <ellipse cx={cx} cy={cy - 43} rx="20" ry="8" fill={stone} stroke={EDGE} strokeWidth="0.7" />
          <ellipse cx={cx} cy={cy - 43} rx="15" ry="5.6" fill="#7cc4e8" />
        </g>
      )}
      {level === 3 && (
        <g>
          <rect x={cx - 3} y={cy - 70} width="6" height="30" rx="2" fill={stone} stroke={EDGE} strokeWidth="0.6" />
          <ellipse cx={cx} cy={cy - 70} rx="10" ry="4" fill={stone} stroke={EDGE} strokeWidth="0.6" />
          <circle cx={cx} cy={cy - 78} r="4" fill="#ffd36e" />
        </g>
      )}
      <g fill="none" stroke="#bfe6f6" strokeWidth="2.4" strokeLinecap="round" opacity="0.95">
        {level === 1 && <path d={`M${cx - 8} ${cy - 2} q8 -20 16 0`} />}
        {level === 2 && (
          <>
            <path d={`M${cx} ${cy - 46} q-14 -12 -24 14`} />
            <path d={`M${cx} ${cy - 46} q14 -12 24 14`} />
          </>
        )}
        {level === 3 && (
          <>
            <path d={`M${cx} ${cy - 78} q-18 -10 -30 26`} />
            <path d={`M${cx} ${cy - 78} q18 -10 30 26`} />
            <path d={`M${cx} ${cy - 78} V${cy - 50}`} />
          </>
        )}
      </g>
      {level === 3 && (
        <g fill="#fff">
          <circle cx={cx - 34} cy={cy - 30} r="1.6" />
          <circle cx={cx + 36} cy={cy - 28} r="1.6" />
          <circle cx={cx + 14} cy={cy - 82} r="1.8" />
        </g>
      )}
    </g>
  );
}

/* ---------- Süsler ---------- */
function Tree({ variant = 0 }) {
  const [cx, cy] = p(0.5, 0.5, 0);
  const tones = [
    ["#3f7d46", "#4f9158", "#69ad69"],
    ["#4b8a3c", "#5ea14b", "#7bbd5f"],
  ][variant % 2];
  return (
    <g>
      <ellipse cx={cx} cy={cy + 4} rx="17" ry="8" fill="#1c2b14" opacity="0.22" />
      <rect x={cx - 3.2} y={cy - 20} width="6.4" height="22" rx="2" fill="#7a5a40" />
      <ellipse cx={cx} cy={cy - 32} rx="21" ry="18" fill={tones[0]} />
      <ellipse cx={cx - 4} cy={cy - 37} rx="17" ry="14" fill={tones[1]} />
      <ellipse cx={cx - 8} cy={cy - 42} rx="10" ry="8" fill={tones[2]} />
    </g>
  );
}

function Pine() {
  const [cx, cy] = p(0.5, 0.5, 0);
  return (
    <g>
      <ellipse cx={cx} cy={cy + 4} rx="15" ry="7" fill="#1c2b14" opacity="0.22" />
      <rect x={cx - 2.6} y={cy - 10} width="5.2" height="12" fill="#6e5036" />
      <polygon points={`${cx - 19},${cy - 8} ${cx + 19},${cy - 8} ${cx},${cy - 36}`} fill="#2f6b49" />
      <polygon points={`${cx - 15},${cy - 24} ${cx + 15},${cy - 24} ${cx},${cy - 50}`} fill="#3a7d57" />
      <polygon points={`${cx - 10},${cy - 40} ${cx + 10},${cy - 40} ${cx},${cy - 62}`} fill="#4a9168" />
    </g>
  );
}

function Flowers() {
  const dots = [
    [0.3, 0.3, "#e0587a"],
    [0.65, 0.35, "#f3c64a"],
    [0.4, 0.65, "#f3c64a"],
    [0.72, 0.7, "#e0587a"],
    [0.52, 0.5, "#ffffff"],
  ];
  return (
    <g>
      <Flat a0={0.06} b0={0.06} w={0.88} d={0.88} fill="#7a5a40" />
      <Flat a0={0.12} b0={0.12} w={0.76} d={0.76} fill="#5f9a52" />
      {dots.map(([a, b, color]) => {
        const [x, y] = p(a, b, 0);
        return (
          <g key={`${a}-${b}`}>
            <path d={`M${x} ${y} v-5`} stroke="#3f7d46" strokeWidth="1.4" />
            <circle cx={x} cy={y - 7} r="3.2" fill={color} />
            <circle cx={x} cy={y - 7} r="1.1" fill="#f6d46a" />
          </g>
        );
      })}
    </g>
  );
}

function Hedge() {
  return (
    <g>
      <Shadow rx={26} ry={12} cx={0} cy={16} opacity={0.18} />
      <Box a0={0.1} b0={0.1} w={0.8} d={0.8} h={18} c={{ left: "#4f9158", right: "#3f7d46", top: "#69ad69" }} />
      <g fill="#7ec177" opacity="0.7">
        {[
          [0.3, 0.5],
          [0.6, 0.35],
          [0.5, 0.75],
        ].map(([a, b]) => {
          const [x, y] = p(a, b, 18);
          return <circle key={`${a}${b}`} cx={x} cy={y} r="2.6" />;
        })}
      </g>
    </g>
  );
}

function Bench() {
  const wood = { left: "#a07a52", right: "#86623f", top: "#b88f62" };
  return (
    <g>
      <Shadow rx={24} ry={11} cy={16} opacity={0.18} />
      <Box a0={0.14} b0={0.52} w={0.72} d={0.06} h={3} z={9} c={wood} />
      <Box a0={0.14} b0={0.34} w={0.72} d={0.3} h={4} z={7} c={wood} />
      <Box a0={0.16} b0={0.4} w={0.06} d={0.06} h={7} c={wood} />
      <Box a0={0.78} b0={0.4} w={0.06} d={0.06} h={7} c={wood} />
      <Box a0={0.14} b0={0.3} w={0.72} d={0.05} h={12} z={11} c={wood} />
    </g>
  );
}

function Lamp({ lit }) {
  const [cx, cy] = p(0.5, 0.5, 0);
  return (
    <g>
      <ellipse cx={cx} cy={cy + 3} rx="9" ry="4" fill="#1c2b14" opacity="0.22" />
      {lit && <circle cx={cx} cy={cy - 46} r="30" fill="#ffd36e" opacity="0.22" />}
      <rect x={cx - 2} y={cy - 44} width="4" height="46" rx="1.5" fill="#4a4a55" />
      <rect x={cx - 5} y={cy - 4} width="10" height="6" rx="2" fill="#4a4a55" />
      <rect x={cx - 6} y={cy - 54} width="12" height="12" rx="3" fill={lit ? "#ffe9a0" : "#e8e1c8"} stroke="#4a4a55" strokeWidth="1.4" />
      <polygon points={`${cx - 8},${cy - 54} ${cx + 8},${cy - 54} ${cx},${cy - 61}`} fill="#4a4a55" />
    </g>
  );
}

function Road() {
  return (
    <g>
      <Flat a0={0} b0={0} w={1} d={1} fill="#d9c9a0" stroke="rgba(120, 96, 60, 0.4)" sw={0.9} />
      <Flat a0={0.12} b0={0.12} w={0.76} d={0.76} fill="#e4d6b0" stroke="rgba(120, 96, 60, 0.18)" sw={0.6} />
    </g>
  );
}

/** Taş (haritanın yabani çevresi için). */
export function Rock() {
  const [cx, cy] = p(0.5, 0.5, 0);
  return (
    <g>
      <ellipse cx={cx} cy={cy + 3} rx="14" ry="6" fill="#1c2b14" opacity="0.22" />
      <polygon points={`${cx - 14},${cy + 1} ${cx - 8},${cy - 12} ${cx + 4},${cy - 15} ${cx + 14},${cy - 2} ${cx + 10},${cy + 3}`} fill="#9aa0a4" stroke={EDGE} strokeWidth="0.8" />
      <polygon points={`${cx - 8},${cy - 12} ${cx + 4},${cy - 15} ${cx + 1},${cy - 6} ${cx - 9},${cy - 5}`} fill="#b9bfc3" />
    </g>
  );
}

const ART = { home: Home, market: Market, bakery: Bakery, garden: Garden, fountain: Fountain };

/** Bir nesnenin çizimi (yerel koordinatlarda, köşesi 0,0). lit: gece ışıkları yansın. */
export function ItemArt({ type, level = 1, lit = false, variant = 0 }) {
  if (ART[type]) {
    const Art = ART[type];
    return <Art level={level} lit={lit} />;
  }
  switch (type) {
    case "tree":
      return <Tree variant={variant} />;
    case "pine":
      return <Pine />;
    case "flowers":
      return <Flowers />;
    case "hedge":
      return <Hedge />;
    case "bench":
      return <Bench />;
    case "lamp":
      return <Lamp lit={lit} />;
    case "road":
      return <Road />;
    default:
      return null;
  }
}

/** Yere yassı serilen türler (yol, çiçek tarhı): her zaman diğer nesnelerin altında çizilir. */
export const isFlat = (type) => type === "road" || type === "flowers";

/** Dükkân ve bina sayfası için küçük, bağımsız önizleme. */
export function ItemPreview({ type, level = 1, lit = false, size = 84 }) {
  const t = TYPES[type];
  const big = t.w > 1;
  const view = big ? "-72 -96 144 168" : "-44 -78 88 112";
  // Yerel (0,0) köşe; nesneyi önizlemede ortala.
  const [ox, oy] = p(t.w / 2, t.d / 2, 0);
  return (
    <svg viewBox={view} width={size} height={size} aria-hidden="true" focusable="false">
      <g transform={`translate(${-ox} ${-oy + (big ? 6 : 12)})`}>
        <ItemArt type={type} level={level} lit={lit} />
      </g>
    </svg>
  );
}
