// 24x24 çizgi ikonlar. Yeni ikon eklemek için ICONS'a bir giriş ekle.

const dot = (cx, cy) => <circle cx={cx} cy={cy} r="0.9" fill="currentColor" />;
const HEART = "M12 20.5s-7.5-4.8-9.3-9.6C1.4 7.3 3.6 4 7 4c2.1 0 3.6 1.1 5 3.1C13.4 5.1 14.9 4 17 4c3.4 0 5.6 3.3 4.3 6.9-1.8 4.8-9.3 9.6-9.3 9.6z";

const ICONS = {
  learn: (
    <>
      <rect x="4" y="8" width="13" height="12" rx="2.5" />
      <path d="M8 4.5h9.5A2.5 2.5 0 0 1 20 7v9" />
    </>
  ),
  path: (
    <>
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" />
    </>
  ),
  game: (
    <>
      <rect x="3" y="8" width="18" height="10" rx="5" />
      <path d="M8 11v4M6 13h4" />
      {dot(15.5, 12)}
      {dot(18, 14)}
    </>
  ),
  store: (
    <>
      <path d="M5 8h14l-1 12H6L5 8z" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" />
    </>
  ),
  chart: <path d="M6 20v-7M12 20V5M18 20v-10" strokeWidth="2.6" />,
  sliders: (
    <>
      <path d="M4 7h9M19 7h1M4 17h1M11 17h9" />
      <circle cx="16" cy="7" r="2.2" />
      <circle cx="8" cy="17" r="2.2" />
    </>
  ),
  heart: <path d={HEART} />,
  heartBroken: (
    <>
      <path d={HEART} />
      <path d="M12 7.1l-2 3.6 3 2.2-1.6 3.7" />
    </>
  ),
  flame: (
    <path d="M12 3c.9 3.3 5.5 5.3 5.5 10.2a5.5 5.5 0 0 1-11 0c0-2.2 1-3.5 2.2-4.6.1 1.8.9 2.9 2 3.2C10.3 8.7 10.6 5.7 12 3z" />
  ),
  star: <path d="M12 3.2l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.2l-5.4 2.9 1-6.1L3.2 9.7l6.1-.9L12 3.2z" />,
  bolt: <path d="M13 2.5L5 14h6l-1 7.5L19 10h-6.2L13 2.5z" />,
  crown: <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z" />,
  snow: (
    <>
      <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" />
      <path d="M9.5 4.5L12 6.5l2.5-2M9.5 19.5L12 17.5l2.5 2" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2.2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4z" />
      <path d="M8 6H5.5A2.5 2.5 0 0 0 8 10.5M16 6h2.5A2.5 2.5 0 0 1 16 10.5M12 13v4M8.5 20h7M10 17h4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5z" />
      <path d="M8 7.5h7" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2.2" />
      <path d="M4 10h16M8 3v4M16 3v4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" />,
  home: <path d="M3.5 11L12 3.5 20.5 11M5.5 9.8V20h5v-6h3v6h5V9.8" />,
  plane: <path d="M10.5 13.5L3 11l1.2-2.2 8 .8 4.3-5.6 2.2.7-2 6.7 4.8 2.4-.6 2.1-6.2-1-4.2 6.1-2.1-.6.5-6.9z" />,
  sprout: (
    <>
      <path d="M12 21v-9" />
      <path d="M12 13c0-4 3-6 7.5-6 0 4.2-3 6-7.5 6z" />
      <path d="M12 15.5c0-3-2-5-6-5 0 3.2 2 5 6 5z" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2.2" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 13h18" />
    </>
  ),
  cap: (
    <>
      <path d="M2 9l10-5 10 5-10 5L2 9z" />
      <path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" />
    </>
  ),
  send: <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" strokeWidth="2.6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  speaker: (
    <>
      <path d="M4 9.5v5h4L13 19V5L8 9.5H4z" />
      <path d="M16.5 9a4.2 4.2 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  replay: <path d="M20 12a8 8 0 1 1-2.4-5.7M20 4v5h-5" />,
  restart: <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v5h5" />,
  question: (
    <>
      <path d="M9.2 9a3 3 0 1 1 4.6 2.5c-1 .7-1.8 1.3-1.8 2.7" />
      {dot(12, 17.5)}
    </>
  ),
  chevronDown: <path d="M6 9l6 6 6-6" />,
  chevronUp: <path d="M6 15l6-6 6 6" />,
  chevronLeft: <path d="M15 6l-6 6 6 6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.2" />
      <path d="M3 7.5l9 6 9-6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.8 3.6-6 8-6s8 2.2 8 6" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M2 12s3.5-7 10-7c2 0 3.7.7 5.2 1.6M22 12s-3.5 7-10 7c-2 0-3.7-.7-5.2-1.6" />
      <path d="M4 4l16 16" />
    </>
  ),
  logout: <path d="M10 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H10M15 8l4 4-4 4M19 12H9" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      {dot(12, 8)}
    </>
  ),
};

export default function Icon({ name, size = 20, filled = false, className = "", title }) {
  const shape = ICONS[name];
  if (!shape) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`icon ${className}`}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title && <title>{title}</title>}
      {shape}
    </svg>
  );
}
