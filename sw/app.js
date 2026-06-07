// AUTO-GENERATED from sw/app.jsx by `npm run build:jsx` — edit the .jsx, not this file.
function LoginScreen({ onLogin }) {
  const [email, setEmail] = React.useState("karen@carebridge.hk");
  const [pass, setPass] = React.useState("hackathon123");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState(null);
  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const result = await API.signIn(email, pass);
      onLogin(result);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", display: "grid", placeItems: "center", background: "#F2F2F7", padding: "24px" } }, /* @__PURE__ */ React.createElement("div", { style: { width: "100%", maxWidth: 400 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 11, marginBottom: 40 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 36, height: 36, borderRadius: 10, background: "var(--green)", display: "grid", placeItems: "center", flexShrink: 0, boxShadow: "0 3px 10px rgba(46,170,91,0.35)" } }, /* @__PURE__ */ React.createElement("span", { style: { width: 15, height: 15, border: "2.6px solid #fff", borderRadius: "50% 50% 50% 2px", transform: "rotate(45deg)", display: "block" } })), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 800, fontSize: 18, letterSpacing: "-0.03em" } }, "CareBridge", " ", /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 500, color: "var(--ink-soft)", fontSize: 14, fontFamily: "var(--hk)" } }, "\u5EB7\u6A4B"))), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 28, marginBottom: 6, letterSpacing: "-0.03em" } }, "Staff sign in"), /* @__PURE__ */ React.createElement("p", { style: { color: "var(--ink-soft)", fontSize: 15, marginBottom: 32, lineHeight: 1.5 } }, "Social worker \xB7 Community nurse"), /* @__PURE__ */ React.createElement("form", { onSubmit: submit }, /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", borderRadius: 12, overflow: "hidden", marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 16px", borderBottom: "0.5px solid rgba(60,60,67,0.18)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "var(--ink-soft)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 } }, "Email"), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: email,
      onChange: (e) => setEmail(e.target.value),
      type: "email",
      required: true,
      placeholder: "you@carebridge.hk",
      style: { width: "100%", padding: 0, fontSize: 16, background: "none", border: "none", outline: "none", borderRadius: 0 }
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 16px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "var(--ink-soft)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 } }, "Password"), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: pass,
      onChange: (e) => setPass(e.target.value),
      type: "password",
      required: true,
      placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
      style: { width: "100%", padding: 0, fontSize: 16, background: "none", border: "none", outline: "none", borderRadius: 0 }
    }
  ))), err && /* @__PURE__ */ React.createElement("div", { style: { color: "var(--risk-ink)", fontSize: 14, marginBottom: 16, padding: "12px 14px", background: "var(--risk-bg)", borderRadius: 10 } }, err), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn primary", style: { width: "100%", padding: "15px", fontSize: 17, borderRadius: 13 }, disabled: loading }, loading ? "Signing in\u2026" : "Sign in")), /* @__PURE__ */ React.createElement("p", { style: { color: "var(--ink-faint)", fontSize: 12, marginTop: 28, textAlign: "center", fontFamily: "var(--mono)", lineHeight: 1.7 } }, "Demo: karen@carebridge.hk \xB7 hackathon123")));
}
function LoadingSkeleton() {
  return /* @__PURE__ */ React.createElement("div", { className: "skeleton-list" }, /* @__PURE__ */ React.createElement("div", { className: "skeleton skeleton-topbar" }), [100, 88, 96].map((h, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "skeleton skeleton-card", style: { height: h } })));
}
function Dashboard() {
  const [lang, setLang] = React.useState("en");
  const [nav, setNav] = React.useState("today");
  const [openId, setOpenId] = React.useState(null);
  const [visitId, setVisitId] = React.useState(null);
  const [authed, setAuthed] = React.useState(false);
  const [checking, setChecking] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [elders, setElders] = React.useState([]);
  const [visits, setVisits] = React.useState([]);
  const [alerts, setAlerts] = React.useState([]);
  React.useEffect(() => {
    API.restoreSession().then((session) => {
      if (session) {
        setAuthed(true);
        loadData();
      } else setChecking(false);
    });
  }, []);
  async function loadData(silent) {
    if (!silent) setLoading(true);
    try {
      const [elderData, visitData, flagData] = await Promise.all([
        API.get("/api/elders"),
        API.get("/api/visits"),
        API.get("/api/flags")
      ]);
      setElders(elderData);
      setVisits(visitData);
      setAlerts(flagData);
    } catch (e) {
      console.error("loadData:", e);
    } finally {
      if (!silent) setLoading(false);
      setChecking(false);
    }
  }
  React.useEffect(() => {
    if (!authed) return;
    const id = setInterval(() => loadData(true), 5e3);
    return () => clearInterval(id);
  }, [authed]);
  function handleLogin() {
    setAuthed(true);
    loadData();
  }
  async function handleSignOut() {
    await API.signOut();
    setAuthed(false);
    setElders([]);
    setVisits([]);
    setAlerts([]);
  }
  if (checking) return /* @__PURE__ */ React.createElement(LoadingSkeleton, null);
  if (!authed) return /* @__PURE__ */ React.createElement(LoginScreen, { onLogin: handleLogin });
  const neuroAlertCount = typeof BIOMARKERS !== "undefined" ? elders.filter((e) => {
    var _a;
    return (_a = BIOMARKERS[e.id]) == null ? void 0 : _a.alertLevel;
  }).length : 0;
  const navItems = [
    { k: "today", en: "Today", zh: "\u4ECA\u65E5", ic: I.home },
    { k: "alerts", en: "Alerts", zh: "\u63D0\u793A", ic: I.bell, badge: alerts.length || null },
    { k: "neuro", en: "Neuro", zh: "\u795E\u7D93", ic: I.wave, badge: neuroAlertCount || null }
  ];
  const today = /* @__PURE__ */ new Date();
  const dateStr = L(
    lang,
    today.toLocaleDateString("en-HK", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    today.toLocaleDateString("zh-HK", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  );
  const titles = {
    today: L(lang, "Good morning, Karen", "\u65E9\u6668\uFF0C\u5BB6\u6B23"),
    alerts: L(lang, "Alerts", "\u63D0\u793A"),
    neuro: L(lang, "Neurological Voice Biomarkers", "\u795E\u7D93\u8A9E\u97F3\u751F\u7269\u6A19\u8A8C")
  };
  return /* @__PURE__ */ React.createElement("div", { className: "app" }, /* @__PURE__ */ React.createElement("aside", { className: "side" }, /* @__PURE__ */ React.createElement("div", { className: "brand" }, /* @__PURE__ */ React.createElement("img", { src: "logo.svg", alt: "CareBridge", className: "brand-logo" }), "CareBridge ", /* @__PURE__ */ React.createElement("span", { className: "zh" }, "\u5EB7\u6A4B")), /* @__PURE__ */ React.createElement("div", { className: "navg" }, navItems.map((n) => /* @__PURE__ */ React.createElement("button", { key: n.k, className: "navi " + (nav === n.k ? "on" : ""), onClick: () => setNav(n.k) }, n.ic, " ", L(lang, n.en, n.zh), n.badge ? /* @__PURE__ */ React.createElement("span", { className: "badge" }, n.badge) : null))), /* @__PURE__ */ React.createElement("div", { className: "spacer" }), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleSignOut,
      className: "btn ghost",
      style: { margin: "0 8px 8px", fontSize: 14, padding: "9px 16px", justifyContent: "flex-start" }
    },
    L(lang, "Sign out", "\u767B\u51FA")
  ), /* @__PURE__ */ React.createElement("div", { className: "workercard" }, /* @__PURE__ */ React.createElement(Avatar, { name: "\u66FE", size: 42 }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "wn" }, L(lang, "Karen Tsang", "\u66FE\u5BB6\u6B23")), /* @__PURE__ */ React.createElement("div", { className: "wr" }, L(lang, "Community geriatric nurse", "\u793E\u5340\u8001\u4EBA\u79D1\u8B77\u58EB"))))), /* @__PURE__ */ React.createElement("div", { className: "main" }, /* @__PURE__ */ React.createElement("div", { className: "topbar" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", null, titles[nav]), /* @__PURE__ */ React.createElement("div", { className: "date" }, dateStr)), /* @__PURE__ */ React.createElement("div", { className: "topctl" }, /* @__PURE__ */ React.createElement("div", { className: "langtog" }, /* @__PURE__ */ React.createElement("button", { className: lang === "en" ? "on" : "", onClick: () => setLang("en") }, "EN"), /* @__PURE__ */ React.createElement("button", { className: lang === "zh" ? "on" : "", onClick: () => setLang("zh") }, "\u4E2D")))), loading && /* @__PURE__ */ React.createElement(LoadingSkeleton, null), !loading && nav === "today" && /* @__PURE__ */ React.createElement(TodayView, { elders, visits, alerts, lang, onOpen: setOpenId, onVisit: setVisitId }), !loading && nav === "alerts" && /* @__PURE__ */ React.createElement(AlertsView, { alerts, lang, onOpen: setOpenId, onReload: loadData }), !loading && nav === "neuro" && /* @__PURE__ */ React.createElement(NeuroView, { elders, lang, onOpen: setOpenId })), openId && /* @__PURE__ */ React.createElement(ElderDetail, { id: openId, lang, onClose: () => setOpenId(null), onVisit: (id) => {
    setOpenId(null);
    setVisitId(id);
  }, onReload: loadData }), visitId && /* @__PURE__ */ React.createElement(VisitMode, { id: visitId, lang, onClose: () => {
    setVisitId(null);
    loadData();
  }, elders }));
}
function CaseloadView({ elders, lang, onOpen }) {
  return /* @__PURE__ */ React.createElement("div", { className: "content" }, /* @__PURE__ */ React.createElement("div", { className: "caseload", style: { gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" } }, elders.map((e) => /* @__PURE__ */ React.createElement(ElderCard, { key: e.id, e, lang, onOpen }))));
}
function VisitsView({ visits, elders, lang, onOpen, onVisit }) {
  return /* @__PURE__ */ React.createElement("div", { className: "content", style: { maxWidth: 760 } }, /* @__PURE__ */ React.createElement("div", { className: "vpanel", style: { padding: 8 } }, visits.map((v) => {
    const e = v.elder || elders.find((x) => x.id === v.elder_id) || {};
    const time = v.scheduled_at ? new Date(v.scheduled_at).toLocaleTimeString("en-HK", { hour: "2-digit", minute: "2-digit" }) : "\u2014";
    return /* @__PURE__ */ React.createElement("div", { key: v.id, className: "visit " + v.state, onClick: () => onVisit(v.elder_id) }, /* @__PURE__ */ React.createElement("span", { className: "vtime" }, time), /* @__PURE__ */ React.createElement("span", { className: "vbar" }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { className: "vname" }, L(lang, e.name_en || v.elder_id, e.name_zh || v.elder_id)), /* @__PURE__ */ React.createElement("div", { className: "vtype" }, L(lang, v.type_en, v.type_zh), " \xB7 ", v.location)), v.state === "due" && /* @__PURE__ */ React.createElement(Pill, { kind: "risk", dot: false }, L(lang, "Due now", "\u5373\u5C07")), /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "btn primary",
        onClick: (ev) => {
          ev.stopPropagation();
          onVisit(v.elder_id);
        },
        style: { padding: "8px 16px", fontSize: 14 }
      },
      L(lang, "Start", "\u958B\u59CB")
    ));
  })));
}
function AlertsView({ alerts, lang, onOpen, onReload }) {
  async function resolve(e, flagId) {
    e.stopPropagation();
    await API.patch(`/api/flags/${flagId}/resolve`, {});
    onReload();
  }
  if (!alerts.length) return /* @__PURE__ */ React.createElement(SimpleNote, { lang, title: L(lang, "All caught up", "\u63D0\u793A\u5DF2\u5168\u90E8\u8655\u7406"), body: L(lang, "No open flags.", "\u6C92\u6709\u5F85\u8655\u7406\u63D0\u793A\u3002") });
  return /* @__PURE__ */ React.createElement("div", { className: "content" }, /* @__PURE__ */ React.createElement("div", { className: "alerts", style: { borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" } }, alerts.map((a) => {
    var _a, _b;
    return /* @__PURE__ */ React.createElement("div", { key: a.id, className: "alert " + a.severity, onClick: () => onOpen(a.elder_id) }, /* @__PURE__ */ React.createElement("div", { className: "aic" }, a.severity === "risk" ? I.alert : I.bell), /* @__PURE__ */ React.createElement("div", { className: "atxt" }, /* @__PURE__ */ React.createElement("div", { className: "atop" }, /* @__PURE__ */ React.createElement("span", { className: "anm" }, L(lang, (_a = a.elder) == null ? void 0 : _a.name_en, (_b = a.elder) == null ? void 0 : _b.name_zh)), /* @__PURE__ */ React.createElement(Pill, { kind: a.severity, dot: false }, a.severity === "risk" ? L(lang, "Urgent", "\u7DCA\u6025") : L(lang, "Watch", "\u7559\u610F")), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto", fontSize: 12, color: "var(--ink-faint)", fontFamily: "var(--mono)" } }, new Date(a.raised_at).toLocaleTimeString("en-HK", { hour: "2-digit", minute: "2-digit" }))), /* @__PURE__ */ React.createElement("div", { className: "amsg" }, a.label_en)), /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "btn ghost",
        style: { fontSize: 13, padding: "7px 14px", flexShrink: 0 },
        onClick: (ev) => resolve(ev, a.id)
      },
      L(lang, "Resolve", "\u89E3\u6C7A")
    ));
  })));
}
function SimpleNote({ title, body }) {
  return /* @__PURE__ */ React.createElement("div", { className: "content" }, /* @__PURE__ */ React.createElement("div", { style: { padding: "40px 32px", textAlign: "center", maxWidth: 500, margin: "24px auto", background: "#fff", borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: 52,
    height: 52,
    borderRadius: 14,
    background: "var(--green-tint)",
    color: "var(--green-ink)",
    display: "grid",
    placeItems: "center",
    margin: "0 auto 20px"
  } }, I.check), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 20, letterSpacing: "-0.025em" } }, title), /* @__PURE__ */ React.createElement("p", { style: { color: "var(--ink-soft)", fontSize: 15, lineHeight: 1.6, marginTop: 10 } }, body)));
}
ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(Dashboard, null));
