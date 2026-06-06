/* CareBridge — icon set + small UI atoms (React, global scope) */

const Icon = ({ d, size = 20, sw = 2, fill = "none", ...p }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={fill} stroke={fill === "none" ? "currentColor" : "none"}
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...p}>{d}</svg>
);

const I = {
  home:   <Icon d={<><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></>} />,
  people: <Icon d={<><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 6a3 3 0 0 1 0 6"/><path d="M18 20a6 6 0 0 0-3-5"/></>} />,
  visit:  <Icon d={<><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><circle cx="12" cy="14" r="2.2"/></>} />,
  bell:   <Icon d={<><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 20a2 2 0 0 0 4 0"/></>} />,
  chat:   <Icon d={<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.3A8 8 0 1 1 21 12z"/>} />,
  phone:  <Icon d={<path d="M5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 3 6.2 2 2 0 0 1 5 4z"/>} />,
  phoneMissed: <Icon d={<><path d="M5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 3 6.2 2 2 0 0 1 5 4z"/><path d="M16 3l5 5M21 3l-5 5"/></>} />,
  pill:   <Icon d={<><rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(45 12 12)"/><path d="M8.5 8.5l7 7"/></>} />,
  meal:   <Icon d={<><path d="M5 3v7a2 2 0 0 0 4 0V3M7 11v10"/><path d="M16 3c-1.5 0-2.5 2-2.5 5s1 4 2.5 4 2.5-1 2.5-4-1-5-2.5-5zM16 16v5"/></>} />,
  walk:   <Icon d={<><circle cx="13" cy="4" r="1.6"/><path d="M12 8l-2 4 3 2 1 6M10 12l-3 1M13 14l3 3"/></>} />,
  sleep:  <Icon d={<path d="M20 14a8 8 0 1 1-9.8-9.8A7 7 0 0 0 20 14z"/>} />,
  mood:   <Icon d={<><circle cx="12" cy="12" r="9"/><path d="M8.5 14a4 4 0 0 0 7 0"/><path d="M9 9.5h.01M15 9.5h.01"/></>} />,
  water:  <Icon d={<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>} />,
  heart:  <Icon d={<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/>} />,
  drop:   <Icon d={<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>} />,
  weight: <Icon d={<><rect x="3" y="6" width="18" height="14" rx="3"/><path d="M9 6a3 3 0 0 1 6 0"/></>} />,
  check:  <Icon d={<path d="M4 12l5 5L20 6"/>} sw={2.4} />,
  x:      <Icon d={<path d="M6 6l12 12M18 6L6 18"/>} />,
  alert:  <Icon d={<><path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/></>} />,
  clock:  <Icon d={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>} />,
  chevron:<Icon d={<path d="M9 6l6 6-6 6"/>} />,
  arrowL: <Icon d={<path d="M15 6l-6 6 6 6"/>} />,
  plus:   <Icon d={<path d="M12 5v14M5 12h14"/>} />,
  search: <Icon d={<><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></>} />,
  note:   <Icon d={<><path d="M5 3h11l3 3v15H5z"/><path d="M9 9h7M9 13h7M9 17h4"/></>} />,
  map:    <Icon d={<><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.4"/></>} />,
  cal:    <Icon d={<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>} />,
  trend:  <Icon d={<path d="M3 17l6-6 4 4 8-8"/>} />,
  spark:  <Icon d={<path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z"/>} />,
};

/* status helpers */
const RISK = {
  stable: { cls: "stable", en: "Stable", zh: "穩定" },
  watch:  { cls: "watch",  en: "Watch",  zh: "留意" },
  risk:   { cls: "risk",   en: "At risk", zh: "高危" },
};

function Pill({ kind = "ghost", children, dot = true }) {
  return <span className={"pill " + kind}>{dot && <span className="dot"></span>}{children}</span>;
}

function Avatar({ name, size = 44, src }) {
  const ch = name ? name[0] : "·";
  return <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.42 }}>{src ? <img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : ch}</span>;
}

/* tiny activity glyph chip with done / missed / pending state */
function ActGlyph({ icon, state, label }) {
  return (
    <span className={"actglyph " + state} title={label}>
      {state === "missed" ? I.x : icon}
    </span>
  );
}

/* L: bilingual label helper based on lang */
function L(lang, en, zh) { return lang === "zh" ? zh : en; }

Object.assign(window, { Icon, I, RISK, Pill, Avatar, ActGlyph, L });
