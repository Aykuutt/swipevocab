// Köyün tam ekran izometrik haritası: parmakla kaydır, iki parmakla yakınlaştır, nesneye dokun,
// yerleştirirken hayaleti sürükle. Kamera React durumunda değil doğrudan DOM'da tutulur (akıcı kaydırma için).
import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef } from "react";
import Mascot from "../../components/Mascot";
import { MAP_MAX, MAP_MIN, MAP_SIZE, SIDES, TYPES, canPlace, expandStrip } from "../../data/village";
import { availableVillagers } from "../../data/villagers";
import { Flat, ItemArt, Rock, TH, TW, isFlat, p } from "./isoArt";
import VillagerArt from "./villagerArt";

const N = MAP_SIZE;
const WORLD_W = N * TW;
const OX = WORLD_W / 2;
const OY = 190; // üstte uzun binalara yer
const WORLD_H = OY + N * TH + 120;
const MIN_K = 0.32;
const MAX_K = 1.7;
const TAP_SLOP = 7; // bu kadar piksel içindeki hareket dokunma sayılır

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
// Izgara koordinatından (negatif olabilir) harita içi izometrik noktaya.
const q = (gx, gy, z = 0) => p(gx - MAP_MIN, gy - MAP_MIN, z);
const at = (gx, gy, z = 0) => `translate(${OX + q(gx, gy, z)[0]} ${OY + q(gx, gy, z)[1]})`;

/* ---------- zemin (yalnızca arazi değişince yeniden çizilir) ---------- */
const diamond = (x, y, w, d) => [q(x, y), q(x + w, y), q(x + w, y + d), q(x, y + d)].map((q) => q.join(",")).join(" ");

const Ground = memo(function Ground({ land }) {
  const tiles = [];
  for (let gy = MAP_MIN; gy < MAP_MAX; gy++) {
    for (let gx = MAP_MIN; gx < MAP_MAX; gx++) {
      const inside = gx >= land.x0 && gx < land.x1 && gy >= land.y0 && gy < land.y1;
      const even = (gx + gy) % 2 === 0;
      const fill = inside ? (even ? "#9bd37d" : "#92cc74") : even ? "#7fb868" : "#78b062";
      tiles.push(<polygon key={`${gx}-${gy}`} points={diamond(gx, gy, 1, 1)} fill={fill} />);
    }
  }
  const lowL = [q(MAP_MIN, MAP_MAX), q(MAP_MAX, MAP_MAX), q(MAP_MAX, MAP_MAX, -26), q(MAP_MIN, MAP_MAX, -26)].map((q) => q.join(",")).join(" ");
  const lowR = [q(MAP_MAX, MAP_MAX), q(MAP_MAX, MAP_MIN), q(MAP_MAX, MAP_MIN, -26), q(MAP_MAX, MAP_MAX, -26)].map((q) => q.join(",")).join(" ");
  return (
    <g transform={`translate(${OX} ${OY})`}>
      <polygon points={lowL} fill="#8c6c4b" />
      <polygon points={lowR} fill="#755a3e" />
      {tiles}
      <polygon points={diamond(land.x0, land.y0, land.x1 - land.x0, land.y1 - land.y0)} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.4" strokeDasharray="7 6" />
    </g>
  );
});

const GridLines = memo(function GridLines({ land }) {
  const lines = [];
  for (let gx = land.x0; gx <= land.x1; gx++) lines.push(<line key={`a${gx}`} x1={q(gx, land.y0)[0]} y1={q(gx, land.y0)[1]} x2={q(gx, land.y1)[0]} y2={q(gx, land.y1)[1]} />);
  for (let gy = land.y0; gy <= land.y1; gy++) lines.push(<line key={`b${gy}`} x1={q(land.x0, gy)[0]} y1={q(land.x0, gy)[1]} x2={q(land.x1, gy)[0]} y2={q(land.x1, gy)[1]} />);
  return (
    <g transform={`translate(${OX} ${OY})`} stroke="rgba(255,255,255,0.28)" strokeWidth="1" pointerEvents="none">
      {lines}
    </g>
  );
});

// Arazi dışındaki yabani çevre: deterministik ağaç, çam ve taşlar.
function scenery(land) {
  const list = [];
  for (let gy = MAP_MIN; gy < MAP_MAX; gy++) {
    for (let gx = MAP_MIN; gx < MAP_MAX; gx++) {
      if (gx >= land.x0 && gx < land.x1 && gy >= land.y0 && gy < land.y1) continue;
      const h = (Math.imul(gx + 11, 73856093) ^ Math.imul(gy + 7, 19349663)) >>> 0;
      const r = h % 100;
      const type = r < 22 ? "tree" : r < 34 ? "pine" : r < 39 ? "rock" : null;
      if (type) list.push({ key: `w-${gx}-${gy}`, type, x: gx, y: gy, w: 1, d: 1, variant: h % 2, wild: true });
    }
  }
  return list;
}

const Entry = memo(function Entry({ type, level, lit, variant, id, x, y }) {
  return (
    <g transform={at(x, y)} data-item={id}>
      {type === "rock" ? <Rock /> : <ItemArt type={type} level={level} lit={lit} variant={variant} />}
    </g>
  );
});

/** Her köylünün bulunduğu kare: kendi binasının yanında, boş bir yerde. */
function villagerSpots(village, kart) {
  const standing = village.items.filter((i) => !isFlat(i.type));
  const { x0, y0, x1, y1 } = village.land;
  const covered = (x, y) => standing.some((i) => x >= i.x && x < i.x + TYPES[i.type].w && y >= i.y && y < i.y + TYPES[i.type].d);
  const used = new Set(kart ? [kart.join(",")] : []);
  const spots = {};
  for (const v of availableVillagers(village)) {
    const b = village.items.find((i) => i.type === v.building);
    if (!b) continue;
    const t = TYPES[b.type];
    const around = [
      [b.x + t.w, b.y + t.d - 1],
      [b.x + t.w, b.y],
      [b.x - 1, b.y + t.d - 1],
      [b.x + t.w - 1, b.y + t.d],
      [b.x, b.y + t.d],
      [b.x - 1, b.y],
    ];
    const spot = around.find(([x, y]) => x >= x0 && x < x1 && y >= y0 && y < y1 && !covered(x, y) && !used.has(`${x},${y}`));
    if (spot) {
      spots[v.id] = spot;
      used.add(spot.join(","));
    }
  }
  return spots;
}

const BUBBLE_Y = { home: 112, market: 96, bakery: 108, garden: 66, fountain: 96 };

const VillageMap = forwardRef(function VillageMap(
  { village, tod, pending, alerts, expand, expandSide, selectedId, placing, onSelect, onGhost, onHarvest, onKart, onVillager, onExpand },
  ref
) {
  const box = useRef(null);
  const world = useRef(null);
  const cam = useRef({ x: 0, y: 0, k: 0.5 });
  const latest = useRef({});
  latest.current = { village, placing, onSelect, onGhost, onHarvest, onKart, onVillager, onExpand };

  const lit = tod === "night";

  /* ---------- çizim listesi ---------- */
  const wild = useMemo(() => scenery(village.land), [village.land]);
  const kart = useMemo(() => {
    // Evin önünde, yolun üstünde durur; yer doluysa yanındaki karelere kayar.
    const home = village.items.find((i) => i.type === "home");
    if (!home) return undefined;
    const standing = village.items.filter((i) => !isFlat(i.type));
    return [
      [home.x + 2, home.y + 2],
      [home.x + 1, home.y + 2],
      [home.x + 3, home.y + 2],
      [home.x + 2, home.y + 3],
      [home.x + 3, home.y + 3],
    ].find(([x, y]) => standing.every((i) => x < i.x || x >= i.x + TYPES[i.type].w || y < i.y || y >= i.y + TYPES[i.type].d));
  }, [village.items]);

  const spots = useMemo(() => villagerSpots(village, kart), [village, kart]);

  const { flat, standing } = useMemo(() => {
    const movingId = placing?.moveId;
    const items = village.items
      .filter((i) => i.id !== movingId)
      .map((i) => ({ key: i.id, id: i.id, type: i.type, x: i.x, y: i.y, w: TYPES[i.type].w, d: TYPES[i.type].d, level: i.level, variant: (i.x * 3 + i.y) % 2 }));
    const all = [...items, ...wild.map((s) => ({ ...s, id: s.key }))];
    const depth = (e) => e.x + e.w - 1 + (e.y + e.d - 1);
    const flatList = all.filter((e) => isFlat(e.type));
    const standList = all.filter((e) => !isFlat(e.type));
    if (kart) standList.push({ key: "kart", id: "kart", type: "kart", x: kart[0], y: kart[1], w: 1, d: 1 });
    for (const [vid, [vx, vy]] of Object.entries(spots)) {
      standList.push({ key: `v-${vid}`, id: `v-${vid}`, type: "villager", villager: vid, x: vx, y: vy, w: 1, d: 1 });
    }
    standList.sort((a, b) => depth(a) - depth(b) || a.y - b.y);
    return { flat: flatList, standing: standList };
  }, [village.items, wild, placing?.moveId, kart, spots]);

  /* ---------- kamera ---------- */
  const apply = useCallback(() => {
    const { x, y, k } = cam.current;
    if (world.current) world.current.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
  }, []);

  const landCenter = useCallback(() => {
    const { land } = latest.current.village;
    const [sx, sy] = q((land.x0 + land.x1) / 2, (land.y0 + land.y1) / 2);
    return [OX + sx, OY + sy];
  }, []);

  const keepInView = useCallback(() => {
    const el = box.current;
    if (!el) return;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    const c = cam.current;
    c.k = clamp(c.k, MIN_K, MAX_K);
    const [lx, ly] = landCenter();
    c.x = clamp(c.x, cw * 0.08 - lx * c.k, cw * 0.92 - lx * c.k);
    c.y = clamp(c.y, ch * 0.1 - ly * c.k, ch * 0.9 - ly * c.k);
  }, [landCenter]);

  const fit = useCallback(() => {
    const el = box.current;
    if (!el) return;
    const { land } = latest.current.village;
    const diamondW = ((land.x1 - land.x0 + (land.y1 - land.y0)) * TW) / 2;
    // Başlangıçta yakından başla: ev ve pazarın çevresi görünsün, arazinin kalanı için kaydırılır.
    const k = clamp((el.clientWidth * 1.5) / diamondW, MIN_K, MAX_K);
    const core = latest.current.village.items.filter((i) => i.type === "home" || i.type === "market");
    const [fx, fy] = core.length
      ? q(
          core.reduce((n, i) => n + i.x + TYPES[i.type].w / 2, 0) / core.length,
          core.reduce((n, i) => n + i.y + TYPES[i.type].d / 2, 0) / core.length
        )
      : q((land.x0 + land.x1) / 2, (land.y0 + land.y1) / 2);
    cam.current = { k, x: el.clientWidth / 2 - (OX + fx) * k, y: el.clientHeight * 0.45 - (OY + fy) * k };
    keepInView();
    apply();
  }, [apply, keepInView]);

  useLayoutEffect(() => {
    fit();
  }, [fit]);

  const toGrid = useCallback((cx, cy) => {
    const r = box.current.getBoundingClientRect();
    const { x, y, k } = cam.current;
    const u = ((cx - r.left - x) / k - OX) / (TW / 2);
    const v = ((cy - r.top - y) / k - OY) / (TH / 2);
    return [(u + v) / 2 + MAP_MIN, (v - u) / 2 + MAP_MIN];
  }, []);

  const zoomAt = useCallback(
    (cx, cy, factor) => {
      const r = box.current.getBoundingClientRect();
      const c = cam.current;
      const wx = (cx - r.left - c.x) / c.k;
      const wy = (cy - r.top - c.y) / c.k;
      c.k = clamp(c.k * factor, MIN_K, MAX_K);
      c.x = cx - r.left - wx * c.k;
      c.y = cy - r.top - wy * c.k;
      keepInView();
      apply();
    },
    [apply, keepInView]
  );

  useImperativeHandle(
    ref,
    () => ({
      /** Ekranın ortasına en yakın, yerleştirilebilir kareyi bulur. */
      suggest(type) {
        const el = box.current;
        const r = el.getBoundingClientRect();
        const [gx, gy] = toGrid(r.left + r.width / 2, r.top + r.height / 2);
        const t = TYPES[type];
        const v = latest.current.village;
        const cx = Math.round(gx - t.w / 2);
        const cy = Math.round(gy - t.d / 2);
        for (let ring = 0; ring < 12; ring++) {
          for (let dy = -ring; dy <= ring; dy++) {
            for (let dx = -ring; dx <= ring; dx++) {
              if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
              if (canPlace(v, type, cx + dx, cy + dy)) return { x: cx + dx, y: cy + dy };
            }
          }
        }
        return { x: v.land.x0, y: v.land.y0 };
      },
      zoomBy(f) {
        const r = box.current.getBoundingClientRect();
        zoomAt(r.left + r.width / 2, r.top + r.height / 2, f);
      },
      recenter: fit,
    }),
    [toGrid, zoomAt, fit]
  );

  /* ---------- dokunma ve hareketler ---------- */
  useEffect(() => {
    const el = box.current;
    const ptrs = new Map();
    let g = null;

    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

    const ghostAt = (clientX, clientY, touch) => {
      const pl = latest.current.placing;
      if (!pl) return;
      const t = TYPES[pl.type];
      const [gx, gy] = toGrid(clientX, clientY - (touch ? 38 : 0)); // parmağın altında kalmasın
      latest.current.onGhost({ x: Math.round(gx - t.w / 2), y: Math.round(gy - t.d / 2) });
    };

    const tap = (e, gesture) => {
      const L = latest.current;
      const target = gesture.target;
      const bubble = target.closest?.("[data-harvest]");
      if (bubble) return L.onHarvest(bubble.dataset.harvest);
      if (target.closest?.("[data-kart]")) return L.onKart();
      const ex = target.closest?.("[data-expand]");
      if (ex && !L.placing) return L.onExpand(ex.dataset.expand);
      const vil = target.closest?.("[data-villager]");
      if (vil && !L.placing) return L.onVillager(vil.dataset.villager);
      if (L.placing) return ghostAt(e.clientX, e.clientY, false);
      const hit = target.closest?.("[data-item]");
      if (hit && !hit.dataset.item.startsWith("w-")) return L.onSelect(hit.dataset.item);
      const [gx, gy] = toGrid(e.clientX, e.clientY);
      const tx = Math.floor(gx);
      const ty = Math.floor(gy);
      const found = L.village.items.find((i) => {
        const t = TYPES[i.type];
        return tx >= i.x && tx < i.x + t.w && ty >= i.y && ty < i.y + t.d;
      });
      L.onSelect(found ? found.id : null);
    };

    const onDown = (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) {
        g = {
          sx: e.clientX,
          sy: e.clientY,
          cx: cam.current.x,
          cy: cam.current.y,
          moved: false,
          target: e.target,
          ghost: !!latest.current.placing && !!e.target.closest?.("[data-ghost]"),
          touch: e.pointerType === "touch",
        };
      } else if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        g = { pinch: true, moved: true, d0: dist(a, b), k0: cam.current.k, m0: mid(a, b), cx0: cam.current.x, cy0: cam.current.y };
      }
    };

    const onMove = (e) => {
      if (!ptrs.has(e.pointerId) || !g) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (g.pinch) {
        if (ptrs.size < 2) return;
        const [a, b] = [...ptrs.values()];
        const r = el.getBoundingClientRect();
        const k = clamp(g.k0 * (dist(a, b) / g.d0), MIN_K, MAX_K);
        const wx = (g.m0.x - r.left - g.cx0) / g.k0;
        const wy = (g.m0.y - r.top - g.cy0) / g.k0;
        const m = mid(a, b);
        cam.current.k = k;
        cam.current.x = m.x - r.left - wx * k;
        cam.current.y = m.y - r.top - wy * k;
        keepInView();
        apply();
        return;
      }
      const dx = e.clientX - g.sx;
      const dy = e.clientY - g.sy;
      if (!g.moved && Math.hypot(dx, dy) > TAP_SLOP) g.moved = true;
      if (!g.moved) return;
      if (g.ghost) {
        ghostAt(e.clientX, e.clientY, g.touch);
      } else {
        cam.current.x = g.cx + dx;
        cam.current.y = g.cy + dy;
        keepInView();
        apply();
      }
    };

    const onUp = (e) => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.delete(e.pointerId);
      if (g && !g.pinch && !g.moved && ptrs.size === 0 && e.type === "pointerup") tap(e, g);
      if (ptrs.size === 0) g = null;
      else if (g?.pinch) g = { moved: true, dead: true };
    };

    const onWheel = (e) => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0014));
    };

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, [apply, keepInView, toGrid, zoomAt]);

  /* ---------- hayalet, seçim ve hasat baloncukları ---------- */
  const ghost = placing && TYPES[placing.type];
  const ghostOk = !!ghost && canPlace(village, placing.type, placing.x, placing.y, placing.moveId ?? null);
  const selected = selectedId && village.items.find((i) => i.id === selectedId);
  const selType = selected && TYPES[selected.type];
  const ready = pending ?? {};

  return (
    <div ref={box} className={`vmap tod-${tod}`}>
      <div ref={world} className="vmap-world" style={{ width: WORLD_W, height: WORLD_H }}>
        <svg width={WORLD_W} height={WORLD_H} viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}>
          <Ground land={village.land} />
          {placing && <GridLines land={village.land} />}

          {expandSide && (
            <g transform={`translate(${OX} ${OY})`} pointerEvents="none">
              <polygon
                points={(() => {
                  const s = expandStrip(village.land, expandSide);
                  return diamond(s.x0, s.y0, s.x1 - s.x0, s.y1 - s.y0);
                })()}
                fill="rgba(255,255,255,0.3)"
                stroke="#fff"
                strokeWidth="2.6"
                strokeDasharray="8 6"
              />
            </g>
          )}

          {flat.map((e) => (
            <Entry key={e.key} id={e.id} type={e.type} level={e.level} lit={lit} variant={e.variant} x={e.x} y={e.y} />
          ))}

          {selected && (
            <g transform={at(selected.x, selected.y)} pointerEvents="none">
              <Flat a0={0} b0={0} w={selType.w} d={selType.d} fill="rgba(255,255,255,0.22)" stroke="#fff" sw={2.4} />
            </g>
          )}
          {ghost && (
            <g transform={at(placing.x, placing.y)} pointerEvents="none">
              <Flat a0={0} b0={0} w={ghost.w} d={ghost.d} fill={ghostOk ? "rgba(70,200,110,0.5)" : "rgba(230,70,60,0.5)"} stroke={ghostOk ? "#3fdc7a" : "#ff6b5d"} sw={2.4} />
            </g>
          )}

          {standing.map((e) =>
            e.type === "villager" ? (
              <g key={e.key} transform={at(e.x + 0.5, e.y + 0.5)} data-villager={e.villager}>
                <rect x="-16" y="-70" width="32" height="76" fill="transparent" />
                <VillagerArt id={e.villager} alert={!!alerts?.has(e.villager)} />
              </g>
            ) : e.type === "kart" ? (
              <g key="kart" transform={at(e.x + 0.5, e.y + 0.5)} data-kart="1">
                <ellipse cx="0" cy="4" rx="14" ry="6" fill="#1c2b14" opacity="0.25" />
                <g className="iso-kart" transform="translate(-26 -52)">
                  <Mascot mood={Object.keys(ready).length ? "cheer" : "happy"} size={52} />
                </g>
              </g>
            ) : (
              <Entry key={e.key} id={e.id} type={e.type} level={e.level} lit={lit} variant={e.variant} x={e.x} y={e.y} />
            )
          )}

          {ghost && (
            <g transform={at(placing.x, placing.y)} data-ghost="1" opacity={ghostOk ? 0.92 : 0.6}>
              {/* dokunma alanı: parmağı kaçırmamak için hayaletin altında büyük bir karo */}
              <Flat a0={-0.5} b0={-0.5} w={ghost.w + 1} d={ghost.d + 1} fill="rgba(0,0,0,0.001)" stroke="none" />
              <ItemArt type={placing.type} level={placing.level ?? 1} lit={lit} />
            </g>
          )}

          {!placing &&
            expand &&
            SIDES.map(({ id }) => {
              const info = expand[id];
              if (!info || info.block === "edge") return null;
              const { land } = village;
              const mx = Math.floor((land.x0 + land.x1) / 2);
              const my = Math.floor((land.y0 + land.y1) / 2);
              const tile = { x0: [land.x0 - 1, my], y0: [mx, land.y0 - 1], x1: [land.x1, my], y1: [mx, land.y1] }[id];
              const [ex, ey] = q(tile[0] + 0.5, tile[1] + 0.5, 36);
              const locked = info.block === "level";
              const label = locked ? `Ev ${info.need}` : info.cost;
              return (
                <g key={`x-${id}`} transform={`translate(${OX + ex} ${OY + ey})`} data-expand={id}>
                  <g className="iso-harvest">
                    <rect x="-34" y="-14" width="68" height="28" rx="14" fill={locked ? "#8d96a8" : "#3fae7a"} stroke="#fff" strokeWidth="2" />
                    <path d="M-24 3 q0 -9 7 -9 q7 0 7 9 z M-17 3 v5" fill="#fff" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
                    <text x="10" y="5.5" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff">
                      {label}
                    </text>
                    <polygon points="-5,14 5,14 0,21" fill={locked ? "#8d96a8" : "#3fae7a"} stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
                  </g>
                </g>
              );
            })}

          {village.items.map((i) => {
            const amount = ready[i.id];
            if (!amount || i.id === placing?.moveId) return null;
            const t = TYPES[i.type];
            const [bx, by] = q(i.x + t.w / 2, i.y + t.d / 2, BUBBLE_Y[i.type] ?? 90);
            return (
              <g key={`h-${i.id}`} transform={`translate(${OX + bx} ${OY + by})`} data-harvest={i.id}>
                {/* animasyon iç grupta: CSS transform dış grubun konum özniteliğini ezmesin */}
                <g className="iso-harvest">
                  <rect x="-24" y="-13" width="48" height="26" rx="13" fill="#ffb84d" stroke="#b97f1a" strokeWidth="1.6" />
                  <circle cx="-12" cy="0" r="6" fill="#fff3c9" stroke="#b97f1a" strokeWidth="1" />
                  <text x="4" y="5" textAnchor="middle" fontSize="14" fontWeight="800" fill="#3a2400">
                    +{amount}
                  </text>
                  <polygon points="-5,13 5,13 0,20" fill="#ffb84d" stroke="#b97f1a" strokeWidth="1.2" />
                </g>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="vmap-tint" aria-hidden="true" />
    </div>
  );
});

export default VillageMap;
