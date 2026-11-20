// "Kart" maskotu: defter kağıdı biçiminde bir karakter.
// mood: happy | cheer | sad | wave | think

const ARMS = {
  happy: ["M20 78 L8 96", "M100 78 L112 96"],
  cheer: ["M20 70 L6 42", "M100 70 L114 42"],
  sad: ["M20 80 L12 104", "M100 80 L108 104"],
  wave: ["M20 78 L8 96", "M100 72 L114 48"],
  think: ["M20 78 L8 96", "M100 78 L112 96"],
};

function Eyes({ mood }) {
  if (mood === "cheer") {
    return (
      <g className="m-line m-eyes-arc">
        <path d="M40 64 Q46 55 52 64" />
        <path d="M68 64 Q74 55 80 64" />
      </g>
    );
  }
  const look = mood === "think" ? { x: 2, y: -2 } : { x: 0, y: 0 };
  return (
    <g className="mascot-eyes">
      <ellipse className="m-ink" cx="46" cy="62" rx="5.2" ry="7.2" />
      <ellipse className="m-ink" cx="74" cy="62" rx="5.2" ry="7.2" />
      <circle className="m-white" cx={47.6 + look.x} cy={59.4 + look.y} r="1.9" />
      <circle className="m-white" cx={75.6 + look.x} cy={59.4 + look.y} r="1.9" />
    </g>
  );
}

function Brows({ mood }) {
  if (mood === "sad") {
    return (
      <g className="m-line m-brows">
        <path d="M38 52 L52 47" />
        <path d="M68 47 L82 52" />
      </g>
    );
  }
  if (mood === "think") {
    return (
      <g className="m-line m-brows">
        <path d="M38 50 L52 50" />
        <path d="M68 46 L82 50" />
      </g>
    );
  }
  return null;
}

function Mouth({ mood }) {
  if (mood === "cheer") {
    return (
      <g className="m-mouth">
        <path className="m-ink" d="M46 75 Q60 99 74 75 Z" />
        <path className="m-tongue" d="M52 88 Q60 82 68 88 Q60 95 52 88 Z" />
      </g>
    );
  }
  if (mood === "sad") return <path className="m-line m-mouth" d="M51 85 Q60 76 69 85" />;
  if (mood === "think") return <path className="m-line m-mouth" d="M52 82 L64 80" />;
  return <path className="m-line m-mouth" d="M49 77 Q60 89 71 77" />;
}

export default function Mascot({ mood = "happy", size = 96, className = "", talking = false }) {
  const arms = ARMS[mood] || ARMS.happy;
  return (
    <svg
      className={`mascot mascot-${mood} ${talking ? "mascot-talking" : ""} ${className}`}
      viewBox="0 0 120 140"
      width={size}
      height={(size * 140) / 120}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse className="m-shadow" cx="60" cy="134" rx="30" ry="4.5" />
      <g className="m-line m-arms">
        <path d={arms[0]} />
        <path className={mood === "wave" ? "m-wave" : undefined} d={arms[1]} />
      </g>
      <rect className="m-foot" x="40" y="116" width="15" height="15" rx="7" />
      <rect className="m-foot" x="65" y="116" width="15" height="15" rx="7" />
      <rect className="m-card" x="20" y="18" width="80" height="102" rx="12" />
      <path className="m-rule m-rule-red" d="M20 44 H100" />
      <path className="m-rule" d="M20 100 H100 M20 110 H100" />
      <g className="m-holes">
        <circle cx="42" cy="29" r="3.4" />
        <circle cx="60" cy="29" r="3.4" />
        <circle cx="78" cy="29" r="3.4" />
      </g>
      <circle className="m-cheek" cx="36" cy="75" r="6.5" />
      <circle className="m-cheek" cx="84" cy="75" r="6.5" />
      <Brows mood={mood} />
      <Eyes mood={mood} />
      <Mouth mood={mood} />
      {mood === "sad" && <path className="m-tear" d="M82 68 Q87 76 82 80 Q77 76 82 68 Z" />}
      {mood === "cheer" && (
        <>
          <path className="m-spark m-spark-a" d="M12 22 l2 -6 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 z" />
          <path
            className="m-spark m-spark-b"
            d="M104 14 l1.6 -5 l1.6 5 l5 1.6 l-5 1.6 l-1.6 5 l-1.6 -5 l-5 -1.6 z"
          />
        </>
      )}
    </svg>
  );
}
