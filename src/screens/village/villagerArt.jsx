// Köylü karakterleri: ayakları (0,0)'da duran küçük çizimler. Her birinin kıyafeti mesleğine göre değişir.
// `alert`: "talk" bugün konuşulmadıysa sohbet balonu, "order" teslim edilecek sipariş varsa turuncu ünlem.

const LOOK = {
  merchant: { skin: "#f0c9a0", body: "#4a7bd0", pants: "#3d3a52", hair: "#5a3e2b" },
  baker: { skin: "#f6d3b0", body: "#f4efe4", pants: "#7a6a5a", hair: "#b0562f" },
  gardener: { skin: "#e3b48a", body: "#5e9a4e", pants: "#6b5238", hair: "#4a3a2a" },
  traveler: { skin: "#d9a57c", body: "#c8763a", pants: "#4a5a6a", hair: "#2f2a26" },
  librarian: { skin: "#f3d0b4", body: "#7a5bb0", pants: "#3f3a4f", hair: "#8a4a2a" },
};

function Hat({ id }) {
  if (id === "baker") {
    return (
      <g>
        <rect x="-8" y="-52" width="16" height="9" rx="2" fill="#ffffff" stroke="#c9c2b4" strokeWidth="0.8" />
        <circle cx="-5.5" cy="-55" r="5.2" fill="#ffffff" stroke="#c9c2b4" strokeWidth="0.8" />
        <circle cx="0" cy="-57.5" r="5.8" fill="#ffffff" stroke="#c9c2b4" strokeWidth="0.8" />
        <circle cx="5.5" cy="-55" r="5.2" fill="#ffffff" stroke="#c9c2b4" strokeWidth="0.8" />
      </g>
    );
  }
  if (id === "gardener") {
    return (
      <g>
        <ellipse cx="0" cy="-42" rx="15" ry="4.4" fill="#e3c76f" stroke="#b79a4a" strokeWidth="0.8" />
        <path d="M-8 -42 Q-7 -52 0 -52 Q7 -52 8 -42 Z" fill="#ecd283" stroke="#b79a4a" strokeWidth="0.8" />
        <rect x="-8" y="-45" width="16" height="3" fill="#8a5a3a" />
      </g>
    );
  }
  if (id === "traveler") {
    return (
      <g>
        <ellipse cx="0" cy="-42" rx="14" ry="3.8" fill="#6f4a2e" stroke="#4f3420" strokeWidth="0.8" />
        <path d="M-8 -42 Q-8 -52 0 -52 Q8 -52 8 -42 Z" fill="#8a5d3a" stroke="#4f3420" strokeWidth="0.8" />
        <rect x="-8" y="-45" width="16" height="2.6" fill="#c8553d" />
      </g>
    );
  }
  if (id === "librarian") {
    return (
      <g>
        <circle cx="0" cy="-46" r="5" fill="#8a4a2a" />
        <g fill="none" stroke="#2b1f1a" strokeWidth="0.9">
          <circle cx="-3.4" cy="-35" r="2.6" />
          <circle cx="3.4" cy="-35" r="2.6" />
          <line x1="-0.8" y1="-35" x2="0.8" y2="-35" />
        </g>
      </g>
    );
  }
  return (
    <g>
      <path d="M-9.5 -42 Q-9 -51 0 -51 Q9 -51 9.5 -42 Z" fill="#c8553d" stroke="#9b3f2c" strokeWidth="0.8" />
      <rect x="-3" y="-44" width="15" height="3" rx="1.4" fill="#9b3f2c" />
    </g>
  );
}

export default function VillagerArt({ id, alert = false }) {
  const c = LOOK[id] ?? LOOK.merchant;
  return (
    <g>
      <ellipse cx="0" cy="3" rx="11" ry="5" fill="#1c2b14" opacity="0.25" />
      <g className="iso-villager">
        <rect x="-6.5" y="-9" width="5.4" height="11" rx="2.4" fill={c.pants} />
        <rect x="1.1" y="-9" width="5.4" height="11" rx="2.4" fill={c.pants} />
        <rect x="-9.5" y="-27" width="19" height="20" rx="7" fill={c.body} stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" />
        {id === "baker" && <rect x="-6" y="-22" width="12" height="14" rx="3" fill="#e4dccb" />}
        {id === "merchant" && <path d="M-9.5 -20 H9.5 V-12 H-9.5 Z" fill="#d6b27a" opacity="0.9" />}
        {id === "gardener" && <path d="M-9.5 -16 H9.5 V-8 H-9.5 Z" fill="#6b5238" opacity="0.55" />}
        {id === "traveler" && <path d="M-6 -27 L6 -9 M6 -27 L-6 -9" stroke="#6f4a2e" strokeWidth="2" />}
        {id === "librarian" && <rect x="7" y="-22" width="7" height="9" rx="1" fill="#3d5a8a" stroke="#22365a" strokeWidth="0.7" />}
        <rect x="-13" y="-25" width="5" height="14" rx="2.5" fill={c.body} stroke="rgba(0,0,0,0.15)" strokeWidth="0.7" />
        <rect x="8" y="-25" width="5" height="14" rx="2.5" fill={c.body} stroke="rgba(0,0,0,0.15)" strokeWidth="0.7" />
        <circle cx="-10.5" cy="-10" r="2.8" fill={c.skin} />
        <circle cx="10.5" cy="-10" r="2.8" fill={c.skin} />
        <circle cx="0" cy="-35" r="9" fill={c.skin} stroke="rgba(0,0,0,0.15)" strokeWidth="0.7" />
        <path d={`M-9 -37 Q-9 -44 0 -44 Q9 -44 9 -37 Q5 -41 0 -41 Q-5 -41 -9 -37 Z`} fill={c.hair} />
        <circle cx="-3.2" cy="-35" r="1.2" fill="#2b1f1a" />
        <circle cx="3.2" cy="-35" r="1.2" fill="#2b1f1a" />
        <path d="M-3 -31 Q0 -28.5 3 -31" fill="none" stroke="#2b1f1a" strokeWidth="1.1" strokeLinecap="round" />
        <Hat id={id} />
      </g>
      {alert && (
        <g transform="translate(0 -72)">
          <g className="iso-alert">
            <rect x="-15" y="-11" width="30" height="21" rx="10" fill={alert === "order" ? "#ffb84d" : "#ffffff"} stroke={alert === "order" ? "#b97f1a" : "#6a5bf5"} strokeWidth="1.8" />
            <polygon points="-4,10 4,10 0,17" fill={alert === "order" ? "#ffb84d" : "#ffffff"} stroke={alert === "order" ? "#b97f1a" : "#6a5bf5"} strokeWidth="1.8" strokeLinejoin="round" />
            <rect x="-5" y="9" width="10" height="3" fill={alert === "order" ? "#ffb84d" : "#ffffff"} />
            {alert === "order" ? (
              <text x="0" y="5.5" textAnchor="middle" fontSize="16" fontWeight="900" fill="#3a2400">
                !
              </text>
            ) : (
              <>
                <circle cx="-6" cy="0" r="2.2" fill="#6a5bf5" />
                <circle cx="0" cy="0" r="2.2" fill="#6a5bf5" />
                <circle cx="6" cy="0" r="2.2" fill="#6a5bf5" />
              </>
            )}
          </g>
        </g>
      )}
    </g>
  );
}

/** Küçük, bağımsız portre (sohbet başlığı için). */
export function VillagerPortrait({ id, size = 56 }) {
  return (
    <svg viewBox="-22 -64 44 74" width={size} height={size * (74 / 44)} aria-hidden="true" focusable="false">
      <VillagerArt id={id} />
    </svg>
  );
}
