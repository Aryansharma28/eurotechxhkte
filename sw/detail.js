// AUTO-GENERATED from sw/detail.jsx by `npm run build:jsx` — edit the .jsx, not this file.
function DrawerSparkline({ values, level, width = 64, height = 26 }) {
  if (!values || values.length < 2) return null;
  const mn = Math.min(...values);
  const mx = Math.max(...values);
  const rng = mx - mn || 1;
  const pad = 3;
  const xf = (i) => (i / (values.length - 1) * (width - pad * 2) + pad).toFixed(1);
  const yf = (v) => (height - pad - (v - mn) / rng * (height - pad * 2)).toFixed(1);
  const pts = values.map((v, i) => `${xf(i)},${yf(v)}`).join(" L ");
  const color = level === "risk" ? "var(--risk)" : level === "watch" ? "var(--watch)" : "var(--stable)";
  return /* @__PURE__ */ React.createElement("svg", { width, height, style: { display: "block", overflow: "visible" } }, /* @__PURE__ */ React.createElement("path", { d: `M ${pts}`, fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", opacity: 0.85 }), /* @__PURE__ */ React.createElement("circle", { cx: xf(values.length - 1), cy: yf(values[values.length - 1]), r: 2.5, fill: color }));
}
function WeekCalendar({ activities, lang }) {
  const today = /* @__PURE__ */ new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayLabelsZh = ["\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D", "\u65E5"];
  function getStatus(actKey, date) {
    const rec = activities.find((r) => r.activity_key === actKey && r.record_date === date);
    return rec ? rec.status : "pending";
  }
  return /* @__PURE__ */ React.createElement("div", { className: "wkcal" }, /* @__PURE__ */ React.createElement("table", { className: "wktable" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null), dates.map((d, i) => /* @__PURE__ */ React.createElement("th", { key: d, className: i === 6 ? "today" : "" }, L(lang, dayLabels[i], "\u9031" + dayLabelsZh[i]))))), /* @__PURE__ */ React.createElement("tbody", null, ACTS.map((a) => /* @__PURE__ */ React.createElement("tr", { key: a.key }, /* @__PURE__ */ React.createElement("td", { className: "rowlbl" }, I[a.ic], " ", L(lang, a.en, a.zh)), dates.map((d, ci) => {
    const status = getStatus(a.key, d);
    return /* @__PURE__ */ React.createElement("td", { key: d }, /* @__PURE__ */ React.createElement("span", { className: "cell " + (status === "done" ? "done" : status === "missed" ? "miss" : "pend") + (ci === 6 ? " todaycol" : "") }, status === "done" ? I.check : status === "missed" ? I.x : "\xB7"));
  }))))));
}
function ElderDetail({ id, lang, onClose, onVisit, onReload }) {
  var _a, _b;
  const [detail, setDetail] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState(null);
  React.useEffect(() => {
    setLoading(true);
    setErr(null);
    API.get(`/api/elders/${id}`).then((d) => setDetail(d)).catch((e2) => setErr(e2.message)).finally(() => setLoading(false));
    const poll = setInterval(() => {
      API.get(`/api/elders/${id}`).then((d) => setDetail(d)).catch(() => {
      });
    }, 5e3);
    return () => clearInterval(poll);
  }, [id]);
  if (loading) return /* @__PURE__ */ React.createElement("div", { className: "drawer-scrim scrim", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "drawer", onClick: (ev) => ev.stopPropagation(), style: { display: "grid", placeItems: "center" } }, /* @__PURE__ */ React.createElement("p", { style: { color: "var(--ink-faint)" } }, "Loading\u2026")));
  if (err || !detail) return /* @__PURE__ */ React.createElement("div", { className: "drawer-scrim scrim", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "drawer", onClick: (ev) => ev.stopPropagation(), style: { padding: 40 } }, /* @__PURE__ */ React.createElement("p", { style: { color: "var(--risk)" } }, err || "Not found"), /* @__PURE__ */ React.createElement("button", { className: "btn ghost", onClick: onClose }, "Close")));
  const e = detail;
  const r = RISK[e.risk_tier] || RISK.stable;
  const fam = (e.family || [])[0] || {};
  const tagIcon = { done: I.phone, missed: I.phoneMissed, family: I.heart, visit: I.map, scheduled: I.clock };
  return /* @__PURE__ */ React.createElement("div", { className: "drawer-scrim scrim", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "drawer", onClick: (ev) => ev.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "dh" }, /* @__PURE__ */ React.createElement("div", { className: "dh-top" }, /* @__PURE__ */ React.createElement("button", { className: "iconbtn", onClick: onClose }, I.x), /* @__PURE__ */ React.createElement(Pill, { kind: r.cls }, L(lang, r.en, r.zh))), /* @__PURE__ */ React.createElement("div", { className: "dh-id" }, /* @__PURE__ */ React.createElement(Avatar, { name: e.name_zh, size: 62 }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { className: "dnm" }, L(lang, e.name_en, e.name_zh), " ", /* @__PURE__ */ React.createElement("span", { className: "dzh" }, L(lang, e.name_zh, e.name_en))), /* @__PURE__ */ React.createElement("div", { className: "dmeta" }, e.age, L(lang, " yrs", " \u6B72"), " \xB7 ", L(lang, e.sex === "F" ? "Female" : "Male", e.sex === "F" ? "\u5973" : "\u7537"), " \xB7 ", L(lang, `Discharged ${(_a = e.day_since_discharge) != null ? _a : "?"} days ago`, `\u51FA\u9662\u7B2C ${(_b = e.day_since_discharge) != null ? _b : "?"} \u5929`), " \xB7 ", L(lang, e.lives_en, e.lives_zh)))), /* @__PURE__ */ React.createElement("div", { className: "dh-actions" }, /* @__PURE__ */ React.createElement("button", { className: "btn primary", onClick: () => onVisit(e.id) }, I.map, L(lang, "Start home visit", "\u958B\u59CB\u5BB6\u8A2A")), /* @__PURE__ */ React.createElement("button", { className: "btn ghost" }, I.phone, L(lang, "Call now", "\u7ACB\u5373\u81F4\u96FB")), /* @__PURE__ */ React.createElement("button", { className: "btn ghost" }, I.note, L(lang, "Add note", "\u65B0\u589E\u8A18\u9304")))), /* @__PURE__ */ React.createElement("div", { className: "dbody" }, /* @__PURE__ */ React.createElement("div", { className: "riskbanner " + r.cls }, /* @__PURE__ */ React.createElement("div", { className: "aic", style: { color: r.cls === "stable" ? "var(--green-ink)" : r.cls === "watch" ? "var(--watch-ink)" : "var(--risk-ink)" } }, I.alert), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "rt" }, L(lang, "Care signal \xB7 ", "\u7167\u9867\u63D0\u793A \xB7 "), L(lang, r.en, r.zh)), /* @__PURE__ */ React.createElement("div", { className: "rb" }, L(lang, e.risk_note_en, e.risk_note_zh)))), /* @__PURE__ */ React.createElement("div", { className: "dcard card" }, /* @__PURE__ */ React.createElement("h3", null, I.cal, " ", L(lang, "This week's daily activities", "\u672C\u9031\u6BCF\u65E5\u6D3B\u52D5")), /* @__PURE__ */ React.createElement(WeekCalendar, { activities: e.activities || [], lang })), /* @__PURE__ */ React.createElement("div", { className: "dcard card" }, /* @__PURE__ */ React.createElement("h3", null, I.trend, " ", L(lang, "Latest vitals", "\u6700\u65B0\u751F\u547D\u8868\u5FB5")), /* @__PURE__ */ React.createElement("div", { className: "vitals" }, Object.values((e.vitals || []).reduce((acc, v) => {
    if (!acc[v.vital_key] || v.measured_at > acc[v.vital_key].measured_at) acc[v.vital_key] = v;
    return acc;
  }, {})).map((v) => /* @__PURE__ */ React.createElement("div", { key: v.vital_key, className: "vital " + (v.status || "ok") }, /* @__PURE__ */ React.createElement("div", { className: "vk" }, v.vital_key), /* @__PURE__ */ React.createElement("div", { className: "vv" }, v.value))))), typeof BIOMARKERS !== "undefined" && BIOMARKERS[e.id] && (() => {
    const thresholds = typeof NEURO_THRESHOLDS !== "undefined" ? NEURO_THRESHOLDS : {};
    const keys = typeof BIOMARKER_KEYS !== "undefined" ? BIOMARKER_KEYS : Object.keys(thresholds);
    const liveCalls = (e.recent_calls || []).slice(0, 7).reverse();
    const liveFields = /* @__PURE__ */ new Set();
    if (liveCalls.some((c) => c.pause_ratio != null)) liveFields.add("pauses");
    if (liveCalls.some((c) => c.parkinson_signal != null)) liveFields.add("parkinson");
    if (liveCalls.some((c) => c.neurological_decline_signal != null)) liveFields.add("neuroDec");
    if (liveCalls.some((c) => c.rate != null)) liveFields.add("rate");
    if (liveCalls.some((c) => c.pitch != null)) liveFields.add("pitch");
    if (liveCalls.some((c) => c.tremor != null)) liveFields.add("tremor");
    if (liveCalls.some((c) => c.fluency != null)) liveFields.add("fluency");
    const LIVE_MAP = {
      pauses: "pause_ratio",
      parkinson: "parkinson_signal",
      neuroDec: "neurological_decline_signal",
      rate: "rate",
      pitch: "pitch",
      tremor: "tremor",
      fluency: "fluency"
    };
    let bm = BIOMARKERS[e.id];
    if (liveFields.size > 0) {
      const week = bm.week.map((mockDay, i) => {
        const lc = liveCalls[i];
        if (!lc) return mockDay;
        const merged = { ...mockDay };
        liveFields.forEach((k) => {
          const col = LIVE_MAP[k];
          if (lc[col] != null) merged[k] = lc[col];
        });
        return merged;
      });
      const todayCall = liveCalls[liveCalls.length - 1] || {};
      const todayMerged = { ...bm.today };
      liveFields.forEach((k) => {
        const col = LIVE_MAP[k];
        if (todayCall[col] != null) todayMerged[k] = todayCall[col];
      });
      const updatedAlerts = { ...bm.metricAlerts };
      if (typeof metricLevel === "function") {
        liveFields.forEach((k) => {
          updatedAlerts[k] = metricLevel(k, todayMerged[k]);
        });
      }
      const lvls = Object.values(updatedAlerts);
      bm = {
        ...bm,
        week,
        today: todayMerged,
        metricAlerts: updatedAlerts,
        alertLevel: lvls.includes("risk") ? "risk" : lvls.includes("watch") ? "watch" : null
      };
    }
    return /* @__PURE__ */ React.createElement("div", { className: "dcard card" }, /* @__PURE__ */ React.createElement("h3", { style: { display: "flex", alignItems: "center", gap: 8 } }, I.wave, " ", L(lang, "Voice biomarkers", "\u8A9E\u97F3\u751F\u7269\u6A19\u8A8C"), liveFields.size > 0 && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "var(--stable)", fontWeight: 600, background: "var(--stable-bg)", borderRadius: 6, padding: "2px 7px" } }, "LIVE")), bm.alertLevel && /* @__PURE__ */ React.createElement("div", { className: "riskbanner " + bm.alertLevel, style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "aic", style: { color: bm.alertLevel === "risk" ? "var(--risk-ink)" : "var(--watch-ink)" } }, I.alert), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "rt" }, bm.alertLevel === "risk" ? L(lang, "Notable voice change \u2014 consider review", "\u8A9E\u97F3\u51FA\u73FE\u986F\u8457\u8B8A\u5316 \u2014 \u8003\u616E\u8907\u8A3A") : L(lang, "Voice pattern shift \u2014 monitor closely", "\u8A9E\u97F3\u6A21\u5F0F\u6709\u8F15\u5FAE\u504F\u79FB \u2014 \u5BC6\u5207\u8DDF\u9032")))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, justifyContent: "space-between", flexWrap: "wrap" } }, keys.map((k) => {
      const t = thresholds[k];
      if (!t) return null;
      const values = bm.week.map((d) => d[k]);
      const level = bm.metricAlerts[k];
      const today = bm.today[k];
      const base = bm.baseline[k];
      const delta = today - base;
      const pct = Math.abs(delta / (base || 1) * 100).toFixed(0);
      const worse = t.higherBetter ? delta < 0 : delta > 0;
      const numColor = level === "risk" ? "var(--risk-ink)" : level === "watch" ? "var(--watch-ink)" : "var(--ink)";
      const isLive = liveFields.has(k);
      return /* @__PURE__ */ React.createElement("div", { key: k, style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 58 } }, /* @__PURE__ */ React.createElement("div", { style: {
        fontSize: 10,
        color: "var(--ink-faint)",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        textAlign: "center",
        whiteSpace: "nowrap"
      } }, L(lang, t.label_en, t.label_zh), isLive && /* @__PURE__ */ React.createElement("span", { style: { marginLeft: 3, fontSize: 8, color: "var(--stable)", fontWeight: 900 } }, "\u25CF")), /* @__PURE__ */ React.createElement(DrawerSparkline, { values, level }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 15, fontWeight: 800, fontFamily: "var(--mono)", color: numColor, lineHeight: 1 } }, k === "pauses" ? today.toFixed(2) : String(today), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9, fontWeight: 400, color: "var(--ink-faint)", marginLeft: 2 } }, t.unit)), +pct > 2 ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 600, color: level === "ok" ? "var(--ink-faint)" : numColor, fontFamily: "var(--mono)" } }, worse ? "\u2193" : "\u2191", " ", pct, "%") : /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "var(--ink-faint)" } }, "stable"), level !== "ok" && /* @__PURE__ */ React.createElement("span", { className: "pill " + level, style: { fontSize: 9, padding: "1px 6px" } }, /* @__PURE__ */ React.createElement("span", { className: "dot" }), level));
    })), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, paddingTop: 10, borderTop: "0.5px solid var(--line)", fontSize: 11, color: "var(--ink-faint)", fontFamily: "var(--mono)" } }, liveFields.size > 0 ? L(lang, `\u25CF live \xB7 pause ratio from real calls \xB7 ${liveCalls.length} day window`, `\u25CF \u5BE6\u6642 \xB7 \u505C\u9813\u7387\u4F86\u81EA\u771F\u5BE6\u901A\u8A71 \xB7 ${liveCalls.length} \u5929\u8996\u7A97`) : L(lang, "Baseline data \xB7 \u25CF live metrics appear after calls complete", "\u57FA\u6E96\u6578\u64DA \xB7 \u25CF \u901A\u8A71\u5B8C\u6210\u5F8C\u986F\u793A\u5BE6\u6642\u6307\u6A19")));
  })(), /* @__PURE__ */ React.createElement("div", { className: "dcard card" }, /* @__PURE__ */ React.createElement("h3", null, I.clock, " ", L(lang, "Recent check-ins", "\u8FD1\u671F\u8DDF\u9032")), /* @__PURE__ */ React.createElement("div", { className: "tl" }, (e.recent_calls || []).slice(0, 5).map((c, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "tli" }, /* @__PURE__ */ React.createElement("div", { className: "tdot " + c.state }, tagIcon[c.state] || I.phone), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "ttime" }, new Date(c.scheduled_at).toLocaleDateString("en-HK", { weekday: "short", month: "short", day: "numeric" })), /* @__PURE__ */ React.createElement("div", { className: "ttxt" }, L(lang, c.summary_en || "\u2014", c.summary_zh || "\u2014"))))))), /* @__PURE__ */ React.createElement("div", { className: "dcard card" }, /* @__PURE__ */ React.createElement("h3", null, I.check, " ", L(lang, "Care plan", "\u7167\u9867\u8A08\u5283")), /* @__PURE__ */ React.createElement("div", { className: "plan" }, Object.values((e.care_plan || []).reduce((acc, p) => {
    const key = (p.text_en || "").toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").slice(0, 28).trim();
    if (!acc[key]) acc[key] = p;
    return acc;
  }, {})).map((p, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "planitem " + (p.done ? "done" : "") }, /* @__PURE__ */ React.createElement("span", { className: "pcheck" }, p.done && I.check), /* @__PURE__ */ React.createElement("span", { className: "pt" }, p.text_en))))), /* @__PURE__ */ React.createElement("div", { className: "dcard card" }, /* @__PURE__ */ React.createElement("h3", null, I.chat, " ", L(lang, "Family contact", "\u5BB6\u5C6C\u806F\u7D61")), /* @__PURE__ */ React.createElement("div", { className: "contact" }, /* @__PURE__ */ React.createElement("div", { className: "cinfo" }, /* @__PURE__ */ React.createElement("div", { className: "cn" }, L(lang, fam.name_en, fam.name_zh) || "\u2014"), /* @__PURE__ */ React.createElement("div", { className: "cp" }, fam.phone || "\u2014")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "iconbtn" }, I.phone), /* @__PURE__ */ React.createElement("button", { className: "iconbtn" }, I.chat)))))));
}
function VisitMode({ id, lang, onClose, elders }) {
  const e = (elders || []).find((x) => x.id === id) || {};
  const [checked, setChecked] = React.useState({});
  const [note, setNote] = React.useState("");
  const [flags, setFlags] = React.useState([]);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const toggle = (k) => setChecked((c) => ({ ...c, [k]: !c[k] }));
  const toggleFlag = (f) => setFlags((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);
  async function saveVisit() {
    setSaving(true);
    try {
      const checkedActs = Object.entries(checked).filter(([, v]) => v).map(([k]) => k);
      await API.post("/api/visits", {
        elder_id: id,
        notes: note,
        checked_acts: checkedActs,
        quick_flags: flags
      });
      setSaved(true);
      setTimeout(onClose, 1400);
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  }
  const name = L(lang, e.name_en || id, e.name_zh || id);
  return /* @__PURE__ */ React.createElement("div", { className: "visitmode" }, /* @__PURE__ */ React.createElement("div", { className: "vm-bar" }, /* @__PURE__ */ React.createElement("div", { className: "vm-id" }, /* @__PURE__ */ React.createElement(Avatar, { name: e.name_zh || "?", size: 46 }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "vm-nm" }, name, " \xB7 ", L(lang, "Home visit", "\u5BB6\u8A2A")), /* @__PURE__ */ React.createElement("div", { className: "vm-sub" }, L(lang, `Day ${e.day_since_discharge || "?"} \xB7 ${e.dx_en || ""}`, `\u51FA\u9662\u7B2C ${e.day_since_discharge || "?"} \u5929 \xB7 ${e.dx_zh || ""}`)))), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn ghost",
      onClick: onClose,
      style: { background: "oklch(1 0 0 / 0.15)", color: "#fff", borderColor: "transparent" }
    },
    I.x,
    L(lang, "End visit", "\u7D50\u675F\u5BB6\u8A2A")
  )), /* @__PURE__ */ React.createElement("div", { className: "vm-body" }, /* @__PURE__ */ React.createElement("div", { className: "vm-card card" }, /* @__PURE__ */ React.createElement("h3", null, L(lang, "Check today's activities", "\u52FE\u9078\u4ECA\u65E5\u6D3B\u52D5")), /* @__PURE__ */ React.createElement("div", { className: "adlbtns" }, ACTS.map((a) => /* @__PURE__ */ React.createElement("button", { key: a.key, className: "adlbtn " + (checked[a.key] ? "on" : ""), onClick: () => toggle(a.key) }, /* @__PURE__ */ React.createElement("span", { className: "adli" }, I[a.ic]), L(lang, a.en, a.zh), /* @__PURE__ */ React.createElement("span", { className: "adlcheck" }, checked[a.key] && I.check))))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 20 } }, /* @__PURE__ */ React.createElement("div", { className: "vm-card card" }, /* @__PURE__ */ React.createElement("h3", null, L(lang, "Visit notes", "\u5BB6\u8A2A\u8A18\u9304")), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      className: "notearea",
      value: note,
      onChange: (ev) => setNote(ev.target.value),
      placeholder: L(lang, "How is the home environment? Any new concerns? Medication count\u2026", "\u5C45\u5BB6\u74B0\u5883\u5982\u4F55\uFF1F\u6709\u4F55\u65B0\u9867\u616E\uFF1F\u85E5\u7269\u9EDE\u7B97\u2026")
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "imgslot", style: { height: 90, marginTop: 12 } }, L(lang, "+ photo of medication / home", "+ \u85E5\u7269 / \u5C45\u6240\u76F8\u7247"))), /* @__PURE__ */ React.createElement("div", { className: "vm-card card" }, /* @__PURE__ */ React.createElement("h3", null, L(lang, "Quick flags", "\u5FEB\u901F\u6A19\u8A18")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 16 } }, [[L(lang, "Falls hazard", "\u8DCC\u5012\u5371\u6A5F"), "watch"], [L(lang, "Needs GP", "\u9700\u898B\u91AB\u751F"), "risk"], [L(lang, "Low food stock", "\u7CE7\u98DF\u4E0D\u8DB3"), "watch"], [L(lang, "Doing well", "\u72C0\u614B\u826F\u597D"), "stable"]].map(([t, k]) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: t,
      className: "pill " + (flags.includes(t) ? k : "ghost"),
      style: { cursor: "pointer", padding: "9px 14px", fontSize: 14, border: "1px solid var(--line)" },
      onClick: () => toggleFlag(t)
    },
    /* @__PURE__ */ React.createElement("span", { className: "dot" }),
    t
  ))), saved ? /* @__PURE__ */ React.createElement("div", { className: "btn primary", style: { width: "100%", padding: 14, textAlign: "center", background: "var(--stable)" } }, I.check, " ", L(lang, "Saved!", "\u5DF2\u5132\u5B58\uFF01")) : /* @__PURE__ */ React.createElement("button", { className: "btn primary", style: { width: "100%", padding: 14 }, onClick: saveVisit, disabled: saving }, I.check, saving ? L(lang, "Saving\u2026", "\u5132\u5B58\u4E2D\u2026") : L(lang, "Save visit & sync", "\u5132\u5B58\u4E26\u540C\u6B65"))))));
}
Object.assign(window, { ElderDetail, VisitMode, WeekCalendar });
