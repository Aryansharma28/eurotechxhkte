// AUTO-GENERATED from sw/neuro.jsx by `npm run build:jsx` — edit the .jsx, not this file.
function Sparkline({ values, width = 80, height = 32, level }) {
  if (!values || values.length < 2) return React.createElement("svg", { width: width != null ? width : "100%", height });
  const mn = Math.min(...values);
  const mx = Math.max(...values);
  const rng = mx - mn || 1;
  const pad = 3;
  const vw = width != null ? width : 200;
  const xf = (i) => (i / (values.length - 1) * (vw - pad * 2) + pad).toFixed(1);
  const yf = (v) => (height - pad - (v - mn) / rng * (height - pad * 2)).toFixed(1);
  const pts = values.map((v, i) => `${xf(i)},${yf(v)}`).join(" L ");
  const color = level === "risk" ? "var(--risk)" : level === "watch" ? "var(--watch)" : "var(--stable)";
  const lx = xf(values.length - 1);
  const ly = yf(values[values.length - 1]);
  const svgProps = width == null ? { viewBox: `0 0 ${vw} ${height}`, style: { display: "block", width: "100%", height, overflow: "visible" } } : { width, height, style: { display: "block", overflow: "visible" } };
  return /* @__PURE__ */ React.createElement("svg", { ...svgProps }, /* @__PURE__ */ React.createElement(
    "path",
    {
      d: `M ${pts}`,
      fill: "none",
      stroke: color,
      strokeWidth: 1.8,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      opacity: 0.8
    }
  ), /* @__PURE__ */ React.createElement("circle", { cx: lx, cy: ly, r: 2.8, fill: color }));
}
function MetricCol({ metricKey, values, today, level, baseline, lang }) {
  const t = NEURO_THRESHOLDS[metricKey];
  if (!t) return null;
  const label = L(lang, t.label_en, t.label_zh);
  const valStr = metricKey === "pauses" ? today.toFixed(2) : String(today);
  const delta = today - baseline[metricKey];
  const pct = Math.abs(delta / (baseline[metricKey] || 1) * 100).toFixed(0);
  const worse = t.higherBetter ? delta < 0 : delta > 0;
  const numColor = level === "risk" ? "var(--risk-ink)" : level === "watch" ? "var(--watch-ink)" : "var(--ink)";
  const trendColor = level === "ok" ? "var(--ink-faint)" : level === "watch" ? "var(--watch-ink)" : "var(--risk-ink)";
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 76 } }, /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 10,
    color: "var(--ink-faint)",
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    textAlign: "center",
    whiteSpace: "nowrap"
  } }, label), /* @__PURE__ */ React.createElement(Sparkline, { values, width: 80, height: 32, level }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 1 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16, fontWeight: 800, fontFamily: "var(--mono)", color: numColor, lineHeight: 1 } }, valStr, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9, fontWeight: 500, color: "var(--ink-faint)", marginLeft: 2 } }, t.unit)), +pct > 2 ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 600, color: trendColor, fontFamily: "var(--mono)" } }, worse ? "\u2193" : "\u2191", " ", pct, "%") : /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "var(--ink-faint)" } }, "stable")), level !== "ok" && /* @__PURE__ */ React.createElement("span", { className: "pill " + level, style: { fontSize: 9, padding: "1px 6px" } }, /* @__PURE__ */ React.createElement("span", { className: "dot" }), level));
}
const NEURO_MSGS = {
  chan: {
    en: "Speech rate \u221218 %, tremor 6.2 (risk), fluency 41 (risk) \u2014 consider urgent review",
    zh: "\u8A9E\u901F\u4E0B\u964D18%\uFF0C\u8072\u986B6.2\uFF08\u9AD8\u5371\uFF09\uFF0C\u6D41\u66A2\u5EA641\uFF08\u9AD8\u5371\uFF09\u2014 \u8003\u616E\u7DCA\u6025\u8907\u8A3A"
  },
  cheung: {
    en: "Fluency trending to 52 (watch), pause ratio 0.28 (watch) \u2014 monitor word-finding",
    zh: "\u6D41\u66A2\u5EA6\u964D\u81F352\uFF08\u7559\u610F\uFF09\uFF0C\u505C\u9813\u73870.28\uFF08\u7559\u610F\uFF09\u2014 \u7559\u610F\u627E\u8A5E\u56F0\u96E3"
  }
};
function ElderNeuroCard({ elder, bm, lang, onOpen }) {
  const r = RISK[elder.risk_tier] || RISK.stable;
  const neuroLevel = bm.alertLevel;
  const msg = NEURO_MSGS[elder.id];
  return /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: "16px 20px", cursor: "pointer" }, onClick: () => onOpen(elder.id) }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14 } }, /* @__PURE__ */ React.createElement(Avatar, { name: elder.name_zh, size: 40 }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 15 } }, L(lang, elder.name_en, elder.name_zh)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--ink-soft)" } }, elder.age, L(lang, "", "\u6B72"), " \xB7 ", L(lang, elder.dx_en, elder.dx_zh))), /* @__PURE__ */ React.createElement(Pill, { kind: r.cls }, L(lang, r.en, r.zh)), neuroLevel && /* @__PURE__ */ React.createElement(Pill, { kind: neuroLevel, dot: false }, neuroLevel === "risk" ? L(lang, "\u26A0 Neuro risk", "\u26A0 \u795E\u7D93\u9AD8\u5371") : L(lang, "\xB7 Neuro watch", "\xB7 \u795E\u7D93\u7559\u610F"))), neuroLevel && msg && /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
    marginBottom: 14,
    padding: "9px 12px",
    borderRadius: 10,
    background: neuroLevel === "risk" ? "var(--risk-bg)" : "var(--watch-bg)"
  } }, /* @__PURE__ */ React.createElement("span", { style: { color: neuroLevel === "risk" ? "var(--risk)" : "var(--watch)", flexShrink: 0, marginTop: 1 } }, I.alert), /* @__PURE__ */ React.createElement("span", { style: {
    fontSize: 13,
    lineHeight: 1.45,
    color: neuroLevel === "risk" ? "var(--risk-ink)" : "var(--watch-ink)"
  } }, L(lang, msg.en, msg.zh))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 14, marginBottom: 14 } }, ["parkinson", "neuroDec"].map((k) => {
    const t = NEURO_THRESHOLDS[k];
    if (!t) return null;
    const values = bm.days.map((d) => d[k]);
    const level = bm.metricAlerts[k];
    const today = bm.today[k];
    const numColor = level === "risk" ? "var(--risk-ink)" : level === "watch" ? "var(--watch-ink)" : "var(--ink)";
    return /* @__PURE__ */ React.createElement("div", { key: k, style: { flex: 1, display: "flex", flexDirection: "column", gap: 4 } }, /* @__PURE__ */ React.createElement("div", { style: {
      fontSize: 10,
      color: "var(--ink-faint)",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.05em"
    } }, L(lang, t.label_en, t.label_zh)), /* @__PURE__ */ React.createElement(Sparkline, { values, width: null, height: 44, level, fill: true }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 22, fontWeight: 800, fontFamily: "var(--mono)", color: numColor, lineHeight: 1 } }, today), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "var(--ink-faint)" } }, t.unit), level !== "ok" && /* @__PURE__ */ React.createElement("span", { className: "pill " + level, style: { fontSize: 9, padding: "1px 7px", marginLeft: 4 } }, /* @__PURE__ */ React.createElement("span", { className: "dot" }), level)));
  })), /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    gap: 8,
    paddingTop: 10,
    borderTop: "0.5px solid var(--line-soft)",
    flexWrap: "wrap"
  } }, ["rate", "pauses", "pitch", "tremor", "fluency"].map((k) => /* @__PURE__ */ React.createElement(
    MetricCol,
    {
      key: k,
      metricKey: k,
      values: bm.week.map((d) => d[k]),
      today: bm.today[k],
      level: bm.metricAlerts[k],
      baseline: bm.baseline,
      lang
    }
  ))), /* @__PURE__ */ React.createElement("div", { style: {
    marginTop: 10,
    paddingTop: 8,
    borderTop: "1px solid var(--line-soft)",
    fontSize: 11,
    color: "var(--ink-faint)",
    fontFamily: "var(--mono)"
  } }, L(
    lang,
    "Top: 14-day composite signals \xB7 bottom: acoustic inputs \xB7 baseline = days 1\u20137",
    "\u4E0A\uFF1A14\u5929\u7D9C\u5408\u4FE1\u865F \xB7 \u4E0B\uFF1A\u8072\u5B78\u8F38\u5165 \xB7 \u57FA\u6E96\uFF1D\u7B2C1\u20137\u5929"
  )));
}
function NeuroView({ elders, lang, onOpen }) {
  const alertElders = elders.filter((e) => {
    var _a;
    return (_a = BIOMARKERS[e.id]) == null ? void 0 : _a.alertLevel;
  });
  return /* @__PURE__ */ React.createElement("div", { className: "content" }, /* @__PURE__ */ React.createElement("div", { style: {
    marginBottom: 20,
    padding: "14px 20px",
    borderRadius: 14,
    background: "var(--calm-bg)",
    border: "1px solid oklch(0.87 0.04 242)"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    fontWeight: 700,
    fontSize: 15,
    color: "var(--calm)",
    marginBottom: 6,
    display: "flex",
    alignItems: "center",
    gap: 8
  } }, I.wave, " ", L(lang, "Neurological Voice Biomarkers", "\u795E\u7D93\u8A9E\u97F3\u751F\u7269\u6A19\u8A8C")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.6 } }, L(
    lang,
    "Five acoustic markers extracted from each daily call. Deviations from each person's 14-day baseline can flag early signs of Parkinson's or cognitive decline.",
    "\u6BCF\u6B21\u6BCF\u65E5\u901A\u8A71\u63D0\u53D6\u4E94\u9805\u8072\u5B78\u6A19\u8A8C\uFF0C\u8207\u500B\u4EBA14\u5929\u57FA\u6E96\u7684\u504F\u5DEE\u53EF\u6A19\u793A\u5E15\u91D1\u905C\u75C7\u6216\u8A8D\u77E5\u8870\u9000\u7684\u65E9\u671F\u8DE1\u8C61\u3002"
  )), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 20, marginTop: 10, flexWrap: "wrap" } }, Object.entries(NEURO_THRESHOLDS).map(([k, t]) => /* @__PURE__ */ React.createElement("div", { key: k, style: { fontSize: 11, color: "var(--ink-faint)" } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700 } }, L(lang, t.label_en, t.label_zh)), " ", t.higherBetter ? L(lang, `watch <${t.watchBelow} ${t.unit}`, `\u7559\u610F <${t.watchBelow}`) : L(lang, `watch >${t.watchAbove}`, `\u7559\u610F >${t.watchAbove}`))))), alertElders.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 24 } }, /* @__PURE__ */ React.createElement("div", { className: "sec-title", style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement("h2", null, L(lang, "Neuro alerts", "\u795E\u7D93\u63D0\u793A")), /* @__PURE__ */ React.createElement("span", { className: "sub" }, L(
    lang,
    `${alertElders.length} elder${alertElders.length > 1 ? "s" : ""} need attention`,
    `${alertElders.length}\u4F4D\u9577\u8005\u9700\u8981\u6CE8\u610F`
  ))), /* @__PURE__ */ React.createElement("div", { className: "alerts" }, alertElders.map((e) => {
    const bm = BIOMARKERS[e.id];
    const msg = NEURO_MSGS[e.id];
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: e.id,
        className: "alert card " + bm.alertLevel,
        style: { cursor: "pointer" },
        onClick: () => onOpen(e.id)
      },
      /* @__PURE__ */ React.createElement("div", { className: "aic" }, I.alert),
      /* @__PURE__ */ React.createElement("div", { className: "atxt" }, /* @__PURE__ */ React.createElement("div", { className: "atop" }, /* @__PURE__ */ React.createElement("span", { className: "anm" }, L(lang, e.name_en, e.name_zh)), /* @__PURE__ */ React.createElement(Pill, { kind: bm.alertLevel, dot: false }, bm.alertLevel === "risk" ? L(lang, "Neuro risk", "\u795E\u7D93\u9AD8\u5371") : L(lang, "Neuro watch", "\u795E\u7D93\u7559\u610F"))), msg && /* @__PURE__ */ React.createElement("div", { className: "amsg" }, L(lang, msg.en, msg.zh))),
      /* @__PURE__ */ React.createElement("span", { className: "ago" }, I.chevron)
    );
  }))), /* @__PURE__ */ React.createElement("div", { className: "sec-title", style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("h2", null, L(lang, "All elders \u2014 voice trends", "\u6240\u6709\u9577\u8005 \u2014 \u8A9E\u97F3\u8DA8\u52E2")), /* @__PURE__ */ React.createElement("span", { className: "sub" }, L(
    lang,
    "Sparklines = last 7 days \xB7 % change vs personal baseline",
    "\u8DA8\u52E2\u5716\uFF1D\u904E\u53BB7\u5929 \xB7 \u767E\u5206\u6BD4\u8B8A\u5316\u5C0D\u6BD4\u500B\u4EBA\u57FA\u6E96"
  ))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } }, elders.map((e) => {
    const bm = BIOMARKERS[e.id];
    if (!bm) return null;
    return /* @__PURE__ */ React.createElement(ElderNeuroCard, { key: e.id, elder: e, bm, lang, onOpen });
  })));
}
Object.assign(window, { NeuroView });
