// Ünitelerin, konuya göre değişen bir manzara içinde zikzak çizen bir yol üzerinde gösterimi.
import { useEffect, useRef } from "react";
import Icon from "../../components/Icon";
import Mascot from "../../components/Mascot";
import { TOPICS } from "../../data/topics";
import { prefersReducedMotion } from "../../lib/random";
import { currentUnitIndex, unitStatus } from "../../state/selectors";
import PathScenery from "./PathScenery";

const MAP_WIDTH = 280;
const NODE_SIZE = 64;
const UNIT_GAP = 140;
const SECTION_GAP = 88;
const ZIGZAG = [0, 46, 74, 46, 0, -46, -74, -46]; // merkezden yatay kayma

/** Konu başlıklarını ve ünite düğümlerini dikey olarak yerleştirir. */
function layout(units) {
  const items = [];
  let y = 8;
  let lastTopic = null;
  units.forEach((unit, index) => {
    if (unit.topic !== lastTopic) {
      items.push({ kind: "section", topic: unit.topic, y });
      y += SECTION_GAP;
      lastTopic = unit.topic;
    }
    const cx = MAP_WIDTH / 2 + ZIGZAG[index % ZIGZAG.length];
    items.push({ kind: "unit", unit, index, cx, y });
    y += UNIT_GAP;
  });
  return { items, height: y + 8 };
}

/** Düğümü kaydırılabilir ekranın ortasına getirir. */
function scrollIntoCenter(el, smooth) {
  const screen = el?.closest(".screen");
  if (!screen) return;
  const box = screen.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const top = screen.scrollTop + (r.top - box.top) - box.height / 2 + r.height / 2;
  screen.scrollTo({ top: Math.max(0, top), behavior: smooth && !prefersReducedMotion() ? "smooth" : "auto" });
}

export default function PathMap({ units, completed, onStart, celebrate }) {
  const { items, height } = layout(units);
  const unitItems = items.filter((i) => i.kind === "unit");
  const nodeRefs = useRef({});
  const currentId = units[currentUnitIndex(units, completed)]?.id;

  useEffect(() => {
    const timer = setTimeout(() => scrollIntoCenter(nodeRefs.current[currentId], false), 50);
    return () => clearTimeout(timer);
    // Yalnızca ilk açılışta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (celebrate?.unlocked) scrollIntoCenter(nodeRefs.current[celebrate.unlocked], true);
  }, [celebrate]);

  const segments = unitItems.slice(0, -1).map((a, i) => {
    const b = unitItems[i + 1];
    const y1 = a.y + NODE_SIZE / 2;
    const y2 = b.y + NODE_SIZE / 2;
    const mid = (y1 + y2) / 2;
    return {
      d: `M ${a.cx} ${y1} C ${a.cx} ${mid}, ${b.cx} ${mid}, ${b.cx} ${y2}`,
      done: completed.includes(a.unit.id),
    };
  });

  return (
    <div className="pathwrap">
      <PathScenery items={items} height={height} unitGap={UNIT_GAP} centerX={MAP_WIDTH / 2} />
      <div className="pathmap" style={{ width: MAP_WIDTH, height }}>
      <svg className="pathmap-lines" width={MAP_WIDTH} height={height} aria-hidden="true">
        {/* önce kenarlar, sonra zemin, en üstte çizgiler: kesişen parçalar birbirini bozmasın */}
        {segments.map((s, i) => (
          <path key={`e${i}`} d={s.d} className="road-edge" />
        ))}
        {segments.map((s, i) => (
          <path key={`b${i}`} d={s.d} className="road-base" />
        ))}
        {segments.map((s, i) => (
          <path key={`d${i}`} d={s.d} className={s.done ? "road-done" : "road-dash"} />
        ))}
      </svg>

      {items.map((item, i) => {
        if (item.kind === "section") {
          const t = TOPICS[item.topic];
          return (
            <div key={`s-${item.topic}`} className="path-section" style={{ top: item.y, "--topic": t.color }}>
              <span className="path-section-pill">
                <Icon name={t.icon} size={16} />
                {t.label}
              </span>
            </div>
          );
        }

        const { unit, index, cx, y } = item;
        const status = unitStatus(units, completed, index);
        const t = TOPICS[unit.topic];
        const anim =
          celebrate?.unlocked === unit.id ? "node-unlock" : celebrate?.done === unit.id ? "node-done" : "";
        const statusText = status === "done" ? "tamamlandı, tekrar et" : status === "current" ? "başla" : "kilitli";
        return (
          <div
            key={unit.id}
            ref={(el) => {
              nodeRefs.current[unit.id] = el;
            }}
            className={`path-node-wrap ${anim}`}
            style={{ left: cx - NODE_SIZE / 2, top: y, "--topic": t.color, "--i": Math.min(i, 10) }}
          >
            {status === "current" && <Mascot mood="happy" size={48} className="path-dilbaz" />}
            <button
              type="button"
              className={`path-node is-${status}`}
              disabled={status === "locked"}
              onClick={() => onStart(unit)}
              aria-label={`${unit.title}, ${statusText}`}
            >
              <Icon
                name={status === "done" ? "check" : status === "locked" ? "lock" : t.icon}
                size={status === "done" ? 30 : 26}
              />
            </button>
            <span className="path-node-label">{unit.title}</span>
          </div>
        );
      })}
      </div>
    </div>
  );
}
