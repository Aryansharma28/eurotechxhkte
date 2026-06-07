// AUTO-GENERATED from sw/today.jsx by `npm run build:jsx` — edit the .jsx, not this file.
function elderViewModel(e) {
  var _a, _b, _c, _d, _e;
  const todayActs = e.today_activities || [];
  const call = e.latest_call || null;
  const openFlags = e.open_flags || [];
  const todayGrid = ACTS.map((a) => {
    const rec = todayActs.find((r) => r.activity_key === a.key);
    return rec ? rec.status === "done" ? 1 : 0 : -1;
  });
  const week = ACTS.map((_, ri) => [0, 0, 0, 0, 0, 0, todayGrid[ri]]);
  const topFlag = openFlags[0];
  return {
    id: e.id,
    name: e.name_en,
    zh: e.name_zh,
    age: e.age,
    sex: e.sex,
    dx: e.dx_en,
    dxZh: e.dx_zh,
    day: (_a = e.day_since_discharge) != null ? _a : 0,
    risk: e.risk_tier,
    lives: e.lives_en,
    livesZh: e.lives_zh,
    riskNote: e.risk_note_en,
    riskNoteZh: e.risk_note_zh,
    call: {
      state: call ? call.state : "scheduled",
      time: (call == null ? void 0 : call.completed_at) ? new Date(call.completed_at).toLocaleTimeString("en-HK", { hour: "2-digit", minute: "2-digit" }) : "\u2014",
      flag: (_c = topFlag == null ? void 0 : topFlag.label_en) != null ? _c : (_b = call == null ? void 0 : call.summary_en) != null ? _b : "\u2014",
      flagZh: (_e = topFlag == null ? void 0 : topFlag.label_zh) != null ? _e : (_d = call == null ? void 0 : call.summary_zh) != null ? _d : "\u2014"
    },
    week,
    // placeholders — detail drawer fetches fresh
    vitals: [],
    plan: [],
    timeline: [],
    family: {}
  };
}
function ActRow({ week, lang }) {
  return /* @__PURE__ */ React.createElement("div", { className: "actrow" }, ACTS.map((a, i) => {
    const today = week[i][6];
    const state = today === 1 ? "done" : today === 0 ? "missed" : "pending";
    return /* @__PURE__ */ React.createElement(ActGlyph, { key: a.key, icon: I[a.ic], state, label: L(lang, a.en, a.zh) });
  }));
}
function ElderCard({ e, lang, onOpen }) {
  const vm = elderViewModel(e);
  const r = RISK[vm.risk] || RISK.stable;
  const neuBm = typeof BIOMARKERS !== "undefined" ? BIOMARKERS[e.id] : null;
  const neuLvl = neuBm == null ? void 0 : neuBm.alertLevel;
  const todayVals = ACTS.map((_, i) => vm.week[i][6]);
  const doneCount = todayVals.filter((v) => v === 1).length;
  const totalActs = ACTS.length;
  const allDone = doneCount === totalActs;
  const nonePending = todayVals.every((v) => v !== -1);
  return /* @__PURE__ */ React.createElement("div", { className: "ecard card", onClick: () => onOpen(e.id) }, /* @__PURE__ */ React.createElement("div", { className: "ehead" }, /* @__PURE__ */ React.createElement(Avatar, { name: vm.zh, size: 46 }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { className: "enm" }, L(lang, vm.name, vm.zh)), /* @__PURE__ */ React.createElement("div", { className: "ezh" }, L(lang, vm.zh, vm.name), " \xB7 ", vm.age, L(lang, "", "\u6B72")), /* @__PURE__ */ React.createElement("div", { className: "emeta" }, L(lang, `Day ${vm.day}/30 \xB7 ${vm.dx}`, `\u51FA\u9662\u7B2C ${vm.day}/30 \u5929 \xB7 ${vm.dxZh}`)), /* @__PURE__ */ React.createElement("div", { className: "edprog", title: `Day ${vm.day} of 30` }, /* @__PURE__ */ React.createElement("div", { className: "edprog-fill", style: { width: `${Math.min(100, Math.round(vm.day / 30 * 100))}%` } }))), /* @__PURE__ */ React.createElement("div", { className: "ecompl" + (allDone ? " all" : ""), title: `${doneCount}/${totalActs} today` }, /* @__PURE__ */ React.createElement("svg", { width: "34", height: "34", viewBox: "0 0 34 34" }, /* @__PURE__ */ React.createElement("circle", { cx: "17", cy: "17", r: "14", fill: "none", stroke: "#E5E5EA", strokeWidth: "3" }), /* @__PURE__ */ React.createElement(
    "circle",
    {
      cx: "17",
      cy: "17",
      r: "14",
      fill: "none",
      stroke: allDone ? "var(--green)" : r.cls === "risk" ? "var(--risk)" : r.cls === "watch" ? "var(--watch)" : "var(--green)",
      strokeWidth: "3",
      strokeLinecap: "round",
      strokeDasharray: `${doneCount / totalActs * 87.96} 87.96`,
      strokeDashoffset: "22",
      style: { transition: "stroke-dasharray .5s ease" }
    }
  )), /* @__PURE__ */ React.createElement("span", { className: "ecompl-n" }, doneCount))), /* @__PURE__ */ React.createElement("div", { className: "erow" }, /* @__PURE__ */ React.createElement(Pill, { kind: r.cls }, L(lang, r.en, r.zh)), /* @__PURE__ */ React.createElement("span", { className: "callstat " + (vm.call.state === "done" ? "done" : "missed") }, vm.call.state === "done" ? I.phone : I.phoneMissed, vm.call.state === "done" ? L(lang, `Call ${vm.call.time}`, `\u5DF2\u81F4\u96FB ${vm.call.time}`) : L(lang, "Missed call", "\u672A\u63A5\u96FB\u8A71"))), /* @__PURE__ */ React.createElement(ActRow, { week: vm.week, lang }), /* @__PURE__ */ React.createElement("div", { className: "flagline" }, /* @__PURE__ */ React.createElement("span", { className: "fdot", style: { background: `var(--${r.cls === "stable" ? "stable" : r.cls === "watch" ? "watch" : "risk"})` } }), /* @__PURE__ */ React.createElement("span", null, L(lang, vm.call.flag, vm.call.flagZh))), neuLvl && /* @__PURE__ */ React.createElement("div", { className: "eneuro eneuro-" + neuLvl }, /* @__PURE__ */ React.createElement("span", { className: "eneuro-ic" }, I.wave), /* @__PURE__ */ React.createElement("span", { className: "eneuro-msg" }, L(lang, "Voice pattern change", "\u8A9E\u97F3\u6A21\u5F0F\u6709\u8B8A")), /* @__PURE__ */ React.createElement("span", { className: "pill " + neuLvl, style: { fontSize: 10, padding: "1px 7px", marginLeft: "auto" } }, neuLvl === "risk" ? L(lang, "Neuro risk", "\u795E\u7D93\u9AD8\u5371") : L(lang, "Watch", "\u7559\u610F"))));
}
const RISK_SORT = { risk: 0, watch: 1, stable: 2 };
function TodayView({ elders, visits, alerts, lang, onOpen, onVisit }) {
  const counts = {
    stable: elders.filter((e) => e.risk_tier === "stable").length,
    watch: elders.filter((e) => e.risk_tier === "watch").length,
    risk: elders.filter((e) => e.risk_tier === "risk").length,
    calls: elders.filter((e) => (e.latest_call || {}).state === "done").length
  };
  const sortedElders = [...elders].sort((a, b) => {
    var _a, _b;
    return ((_a = RISK_SORT[a.risk_tier]) != null ? _a : 3) - ((_b = RISK_SORT[b.risk_tier]) != null ? _b : 3);
  });
  return /* @__PURE__ */ React.createElement("div", { className: "content" }, /* @__PURE__ */ React.createElement("div", { className: "kpis" }, /* @__PURE__ */ React.createElement("div", { className: "kpi k-stable card" }, /* @__PURE__ */ React.createElement("div", { className: "ki" }, I.heart), /* @__PURE__ */ React.createElement("div", { className: "kn" }, counts.stable), /* @__PURE__ */ React.createElement("div", { className: "kl" }, L(lang, "Stable", "\u7A69\u5B9A"))), /* @__PURE__ */ React.createElement("div", { className: "kpi k-watch  card" }, /* @__PURE__ */ React.createElement("div", { className: "ki" }, I.alert), /* @__PURE__ */ React.createElement("div", { className: "kn" }, counts.watch), " ", /* @__PURE__ */ React.createElement("div", { className: "kl" }, L(lang, "Watch", "\u7559\u610F"))), /* @__PURE__ */ React.createElement("div", { className: "kpi k-risk   card" }, /* @__PURE__ */ React.createElement("div", { className: "ki" }, I.alert), /* @__PURE__ */ React.createElement("div", { className: "kn" }, counts.risk), "  ", /* @__PURE__ */ React.createElement("div", { className: "kl" }, L(lang, "At risk", "\u9AD8\u5371"))), /* @__PURE__ */ React.createElement("div", { className: "kpi k-call   card" }, /* @__PURE__ */ React.createElement("div", { className: "ki" }, I.phone), /* @__PURE__ */ React.createElement("div", { className: "kn" }, counts.calls, "/", elders.length), /* @__PURE__ */ React.createElement("div", { className: "kl" }, L(lang, "Calls done", "\u5DF2\u81F4\u96FB"))), /* @__PURE__ */ React.createElement("div", { className: "kpi k-visit  card" }, /* @__PURE__ */ React.createElement("div", { className: "ki" }, I.map), "  ", /* @__PURE__ */ React.createElement("div", { className: "kn" }, visits.length), /* @__PURE__ */ React.createElement("div", { className: "kl" }, L(lang, "Visits today", "\u4ECA\u65E5\u5BB6\u8A2A")))), /* @__PURE__ */ React.createElement("div", { className: "grid-2" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "sec-title" }, /* @__PURE__ */ React.createElement("h2", null, L(lang, "Needs your attention", "\u9700\u8981\u8DDF\u9032")), /* @__PURE__ */ React.createElement("span", { className: "sub" }, L(lang, `${alerts.length} flags`, `${alerts.length} \u9805\u63D0\u793A`))), /* @__PURE__ */ React.createElement("div", { className: "alerts" }, alerts.slice(0, 4).map((a) => {
    var _a, _b;
    return /* @__PURE__ */ React.createElement("div", { key: a.id, className: "alert card " + a.severity, onClick: () => onOpen(a.elder_id) }, /* @__PURE__ */ React.createElement("div", { className: "aic" }, a.severity === "risk" ? I.alert : I.bell), /* @__PURE__ */ React.createElement("div", { className: "atxt" }, /* @__PURE__ */ React.createElement("div", { className: "atop" }, /* @__PURE__ */ React.createElement("span", { className: "anm" }, L(lang, (_a = a.elder) == null ? void 0 : _a.name_en, (_b = a.elder) == null ? void 0 : _b.name_zh)), /* @__PURE__ */ React.createElement(Pill, { kind: a.severity, dot: false }, a.severity === "risk" ? L(lang, "Urgent", "\u7DCA\u6025") : L(lang, "Watch", "\u7559\u610F"))), /* @__PURE__ */ React.createElement("div", { className: "amsg" }, a.label_en)), /* @__PURE__ */ React.createElement("span", { className: "ago" }, I.chevron));
  }), !alerts.length && /* @__PURE__ */ React.createElement("p", { style: { color: "var(--ink-faint)", padding: "12px 0", fontSize: 14 } }, L(lang, "All clear this morning", "\u4ECA\u65E9\u4E00\u5207\u6B63\u5E38"))), /* @__PURE__ */ React.createElement("div", { className: "sec-title" }, /* @__PURE__ */ React.createElement("h2", null, L(lang, "My caseload", "\u6211\u7684\u500B\u6848")), /* @__PURE__ */ React.createElement("span", { className: "sub" }, L(lang, `${elders.length} elders \xB7 sorted by risk`, `${elders.length} \u4F4D\u9577\u8005 \xB7 \u6309\u98A8\u96AA\u6392\u5E8F`))), /* @__PURE__ */ React.createElement("div", { className: "caseload" }, sortedElders.map((e) => /* @__PURE__ */ React.createElement(ElderCard, { key: e.id, e, lang, onOpen })))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "sec-title" }, /* @__PURE__ */ React.createElement("h2", null, L(lang, "Today's visits", "\u4ECA\u65E5\u5BB6\u8A2A"))), /* @__PURE__ */ React.createElement("div", { className: "vpanel card" }, visits.map((v) => {
    const elder = v.elder || {};
    const time = v.scheduled_at ? new Date(v.scheduled_at).toLocaleTimeString("en-HK", { hour: "2-digit", minute: "2-digit" }) : "\u2014";
    return /* @__PURE__ */ React.createElement("div", { key: v.id, className: "visit " + v.state, onClick: () => onVisit(v.elder_id) }, /* @__PURE__ */ React.createElement("span", { className: "vtime" }, time), /* @__PURE__ */ React.createElement("span", { className: "vbar" }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { className: "vname" }, L(lang, elder.name_en || v.elder_id, elder.name_zh || v.elder_id)), /* @__PURE__ */ React.createElement("div", { className: "vtype" }, L(lang, v.type_en, v.type_zh)), /* @__PURE__ */ React.createElement("div", { className: "vwhere" }, I.map, " ", v.location)), v.state === "due" && /* @__PURE__ */ React.createElement(Pill, { kind: "risk", dot: false }, L(lang, "Due now", "\u5373\u5C07")));
  }), /* @__PURE__ */ React.createElement("button", { className: "btn primary", style: { width: "calc(100% - 8px)", margin: "8px 4px 4px" } }, I.plus, L(lang, "Schedule a visit", "\u65B0\u589E\u5BB6\u8A2A"))))));
}
function PulseStat({ label, value, trend, good, last }) {
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 2px", borderBottom: last ? "none" : "1px solid var(--line-soft)" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13.5, color: "var(--ink-soft)" } }, label), /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "baseline", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18, fontWeight: 800, fontFamily: "var(--mono)" } }, value), trend && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 600, color: good ? "var(--green)" : "var(--ink-faint)", fontFamily: "var(--hk)" } }, trend)));
}
Object.assign(window, { TodayView, ElderCard, elderViewModel });
