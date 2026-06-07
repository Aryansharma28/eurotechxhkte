// AUTO-GENERATED from fam/famapp.jsx by `npm run build:jsx` — edit the .jsx, not this file.
const ACTS_FAM = [
  { key: "med", en: "Medication", zh: "\u670D\u85E5", ic: "pill" },
  { key: "meal", en: "Meals", zh: "\u9032\u98DF", ic: "meal" },
  { key: "walk", en: "Mobility", zh: "\u6D3B\u52D5", ic: "walk" },
  { key: "water", en: "Hydration", zh: "\u98F2\u6C34", ic: "water" },
  { key: "sleep", en: "Sleep", zh: "\u7761\u7720", ic: "sleep" },
  { key: "mood", en: "Mood", zh: "\u60C5\u7DD2", ic: "mood" }
];
function FamilyLogin({ onLogin }) {
  const [email, setEmail] = React.useState("family-wong@carebridge.hk");
  const [pass, setPass] = React.useState("hackathon123");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState(null);
  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      await API.signIn(email, pass);
      onLogin();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "36px 24px", background: "#F2F2F7" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 36 } }, /* @__PURE__ */ React.createElement("img", { src: "logo.svg", alt: "CareBridge", style: { height: 36, width: "auto", flexShrink: 0 } }), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 800, fontSize: 18, letterSpacing: "-0.03em" } }, "CareBridge ", /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 500, color: "var(--ink-soft)", fontSize: 14, fontFamily: "var(--hk)" } }, "\u5EB7\u6A4B"))), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 28, marginBottom: 6, letterSpacing: "-0.03em" } }, "Family sign in"), /* @__PURE__ */ React.createElement("p", { style: { color: "var(--ink-soft)", fontSize: 15, marginBottom: 32, lineHeight: 1.5 } }, "View your parent's daily updates"), /* @__PURE__ */ React.createElement("form", { onSubmit: submit }, /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", borderRadius: 12, overflow: "hidden", marginBottom: 24 } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 16px", borderBottom: "0.5px solid rgba(60,60,67,0.18)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--ink-soft)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" } }, "Email"), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: email,
      onChange: (e) => setEmail(e.target.value),
      type: "email",
      required: true,
      placeholder: "family@carebridge.hk",
      style: { width: "100%", padding: 0, fontSize: 16, background: "none", border: "none", outline: "none" }
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 16px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--ink-soft)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" } }, "Password"), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: pass,
      onChange: (e) => setPass(e.target.value),
      type: "password",
      required: true,
      placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
      style: { width: "100%", padding: 0, fontSize: 16, background: "none", border: "none", outline: "none" }
    }
  ))), err && /* @__PURE__ */ React.createElement("p", { style: { color: "var(--risk)", fontSize: 13, marginBottom: 16, padding: "11px 14px", background: "var(--risk-bg)", borderRadius: 10 } }, err), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn primary", style: { width: "100%", padding: 15, fontSize: 17, borderRadius: 13 }, disabled: loading }, loading ? "Signing in\u2026" : "Sign in")), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 28, padding: "14px 16px", background: "rgba(116,116,128,0.08)", borderRadius: 12 } }, /* @__PURE__ */ React.createElement("p", { style: { color: "var(--ink-faint)", fontSize: 11, fontFamily: "var(--mono)", lineHeight: 1.7, margin: 0 } }, /* @__PURE__ */ React.createElement("span", { style: { display: "block", color: "var(--ink-soft)", fontWeight: 600, marginBottom: 4, fontSize: 12 } }, "Demo \xB7 password: hackathon123"), "family-wong@carebridge.hk", /* @__PURE__ */ React.createElement("br", null), "family-chan@carebridge.hk \xB7 family-lee@carebridge.hk")));
}
function VoiceInsight({ elderId, firstName, lang }) {
  const bm = typeof BIOMARKERS !== "undefined" && BIOMARKERS[elderId];
  if (!bm) return null;
  const t = (en, zh) => lang === "zh" ? zh : en;
  const level = bm.alertLevel;
  const name = firstName || t("They", "\u9577\u8005");
  const msg = !level ? t(
    `${name}'s voice patterns are stable this week. No changes from the baseline.`,
    `${name}\u672C\u9031\u8A9E\u97F3\u6A21\u5F0F\u7A69\u5B9A\uFF0C\u672A\u767C\u73FE\u8207\u57FA\u6E96\u7684\u504F\u5DEE\u3002`
  ) : level === "watch" ? t(
    `We've noticed a slight change in ${name}'s speech patterns this week. The care team is monitoring closely.`,
    `\u672C\u9031${name}\u8A9E\u97F3\u6A21\u5F0F\u6709\u8F15\u5FAE\u8B8A\u5316\uFF0C\u8B77\u7406\u5718\u968A\u6B63\u5BC6\u5207\u8DDF\u9032\u3002`
  ) : t(
    `The care team has flagged a notable change in ${name}'s voice. Karen is following up directly.`,
    `\u8B77\u7406\u5718\u968A\u5DF2\u6A19\u8A18${name}\u8A9E\u97F3\u6A21\u5F0F\u7684\u91CD\u8981\u8B8A\u5316\uFF0C\u5BB6\u6B23\u6B63\u76F4\u63A5\u8DDF\u9032\u3002`
  );
  const borderColor = !level ? "var(--stable)" : level === "watch" ? "var(--watch)" : "var(--risk)";
  const bgColor = !level ? "var(--stable-bg)" : level === "watch" ? "var(--watch-bg)" : "var(--risk-bg)";
  return /* @__PURE__ */ React.createElement("div", { className: "fam-card", style: { borderLeft: `3px solid ${borderColor}`, background: bgColor, marginTop: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "fct", style: { display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { color: borderColor, display: "flex" } }, !level ? I.check : I.alert), t("Voice health", "\u8A9E\u97F3\u5065\u5EB7")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6 } }, msg), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--ink-faint)", marginTop: 8, fontFamily: "var(--mono)" } }, t("Illustrative sample \u2014 not from a live call yet", "\u793A\u4F8B\u6578\u64DA \u2014 \u66AB\u672A\u4F86\u81EA\u5BE6\u6642\u901A\u8A71")));
}
function FamilyApp() {
  var _a, _b, _c, _d, _e, _f, _g;
  const [lang, setLang] = React.useState("en");
  const [authed, setAuthed] = React.useState(false);
  const [checking, setChecking] = React.useState(true);
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState(null);
  const [showAllPlan, setShowAllPlan] = React.useState(false);
  const t = (en, zh) => lang === "zh" ? zh : en;
  React.useEffect(() => {
    API.restoreSession().then((session) => {
      if (session && session.role === "family") {
        setAuthed(true);
        loadData();
      } else {
        if (session) API.signOut();
        setChecking(false);
      }
    });
  }, []);
  async function loadData(silent) {
    if (!silent) {
      setLoading(true);
      setErr(null);
    }
    try {
      const d = await API.get("/api/family/elder");
      setData(d);
    } catch (e) {
      if (!silent) setErr(e.message);
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
  async function signOut() {
    await API.signOut();
    setAuthed(false);
    setData(null);
  }
  if (checking) return /* @__PURE__ */ React.createElement("div", { style: { padding: "70px 16px 20px", display: "flex", flexDirection: "column", gap: 12 } }, [100, 160, 130, 110].map((h, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "skeleton", style: { height: h } })));
  if (!authed) return /* @__PURE__ */ React.createElement(FamilyLogin, { onLogin: handleLogin });
  const elder = (data == null ? void 0 : data.elder) || {};
  const acts = (data == null ? void 0 : data.today_activities) || [];
  const call = (data == null ? void 0 : data.today_call) || null;
  const openFlags = (data == null ? void 0 : data.open_flags) || [];
  const recentCalls = (data == null ? void 0 : data.recent_calls) || [];
  const familyMember = (data == null ? void 0 : data.family_member) || {};
  const rawPlan = (data == null ? void 0 : data.care_plan) || [];
  const worker = (data == null ? void 0 : data.worker) || {};
  const carePlan = Object.values(rawPlan.reduce((acc, p) => {
    const key = (p.text_en || "").toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").slice(0, 28).trim();
    if (!acc[key]) acc[key] = p;
    return acc;
  }, {}));
  const pendingPlan = carePlan.filter((p) => !p.done);
  const visiblePlan = showAllPlan ? carePlan : pendingPlan.slice(0, 4);
  const childFirst = ((_a = familyMember.name_en) == null ? void 0 : _a.split(" ")[0]) || "Hi";
  const childFirstZh = ((_b = familyMember.name_zh) == null ? void 0 : _b.slice(1)) || "";
  const callTime = (call == null ? void 0 : call.completed_at) ? new Date(call.completed_at).toLocaleTimeString("en-HK", { hour: "2-digit", minute: "2-digit" }) : null;
  const allDone = acts.length > 0 && acts.every((a) => a.status === "done");
  const statusText = t(
    openFlags.length ? "One thing to know \u{1F49B}" : allDone ? "She's okay today \u{1F49A}" : "Checking in today\u2026",
    openFlags.length ? "\u6709\u4E00\u4EF6\u4E8B \u{1F49B}" : allDone ? "\u4ECA\u65E5\u72C0\u614B\u4E0D\u932F \u{1F49A}" : "\u4ECA\u65E5\u8DDF\u9032\u4E2D\u2026"
  );
  const today = /* @__PURE__ */ new Date();
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
  function callStateFor(dateStr) {
    const c = recentCalls.find((c2) => {
      var _a2;
      return (_a2 = c2.scheduled_at) == null ? void 0 : _a2.startsWith(dateStr);
    });
    return (c == null ? void 0 : c.state) === "done";
  }
  if (loading) return /* @__PURE__ */ React.createElement("div", { style: { padding: "70px 16px 20px", display: "flex", flexDirection: "column", gap: 12 } }, [100, 160, 130, 110].map((h, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "skeleton", style: { height: h } })));
  if (err) return /* @__PURE__ */ React.createElement("div", { style: { padding: "70px 16px", color: "var(--risk)", fontSize: 14 } }, err);
  return /* @__PURE__ */ React.createElement("div", { className: "fam" }, /* @__PURE__ */ React.createElement("div", { className: "fam-scroll" }, /* @__PURE__ */ React.createElement("div", { className: "fam-nav" }, /* @__PURE__ */ React.createElement("div", { className: "fam-head" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 7 } }, /* @__PURE__ */ React.createElement("img", { src: "logo.svg", alt: "CareBridge", style: { height: 24, width: "auto", flexShrink: 0 } }), /* @__PURE__ */ React.createElement("div", { className: "fam-hi" }, t("Good morning, ", "\u65E9\u6668\uFF0C"), /* @__PURE__ */ React.createElement("b", null, t(childFirst, childFirstZh)))), /* @__PURE__ */ React.createElement("div", { className: "fam-top-right" }, /* @__PURE__ */ React.createElement("div", { className: "fam-lang" }, /* @__PURE__ */ React.createElement("button", { className: lang === "en" ? "on" : "", onClick: () => setLang("en") }, "EN"), /* @__PURE__ */ React.createElement("button", { className: lang === "zh" ? "on" : "", onClick: () => setLang("zh") }, "\u4E2D")), /* @__PURE__ */ React.createElement("button", { onClick: signOut, className: "fam-signout" }, t("Sign out", "\u767B\u51FA"))))), /* @__PURE__ */ React.createElement("div", { className: "fam-hero", style: { marginTop: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "fav" }, /* @__PURE__ */ React.createElement("span", { className: "ava" }, ((_c = elder.name_zh) == null ? void 0 : _c[0]) || "?"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "fnm" }, t(elder.name_en, elder.name_zh)), /* @__PURE__ */ React.createElement("div", { className: "fsub" }, t(`Day ${elder.day_since_discharge || "?"} home \xB7 ${elder.dx_en || ""}`, `\u5728\u5BB6\u7B2C ${elder.day_since_discharge || "?"}\u5929 \xB7 ${elder.dx_zh || ""}`)))), /* @__PURE__ */ React.createElement("div", { className: "fstatus" }, statusText), (() => {
    const doneN = acts.filter((a) => a.status === "done").length;
    const total = ACTS_FAM.length;
    const pct = total > 0 ? Math.round(doneN / total * 100) : 0;
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginTop: 14, marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.22)", overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: `${pct}%`, background: "#fff", borderRadius: 4, transition: "width .5s ease" } })), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.90)", whiteSpace: "nowrap" } }, doneN, "/", total, " ", t("done", "\u5B8C\u6210")));
  })(), callTime && /* @__PURE__ */ React.createElement("span", { className: "fwhen" }, I.phone, t(`Check-in call done \xB7 ${callTime}`, `\u5DF2\u5B8C\u6210\u4ECA\u65E9\u901A\u8A71 \xB7 ${callTime}`)), !callTime && (call == null ? void 0 : call.state) === "missed" && /* @__PURE__ */ React.createElement("span", { className: "fwhen missed" }, I.phoneMissed, t("Missed today's call", "\u4ECA\u65E5\u96FB\u8A71\u672A\u63A5"))), openFlags.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "fam-note" }, /* @__PURE__ */ React.createElement("div", { className: "ni" }, I.alert), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "nt" }, t("One thing to know", "\u4E00\u4EF6\u4E8B")), /* @__PURE__ */ React.createElement("div", { className: "nb" }, t(openFlags[0].label_en, openFlags[0].label_zh)))), (call == null ? void 0 : call.summary_en) && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "fam-sec-gap" }), /* @__PURE__ */ React.createElement("div", { className: "fam-sec-label" }, t("From today's call", "\u4ECA\u65E9\u901A\u8A71\u6458\u8981")), /* @__PURE__ */ React.createElement("div", { className: "fam-card" }, /* @__PURE__ */ React.createElement("div", { className: "fsummary" }, '"', t(call.summary_en, call.summary_zh), '"'))), /* @__PURE__ */ React.createElement(VoiceInsight, { elderId: elder.id, firstName: (_d = elder.name_en) == null ? void 0 : _d.split(" ")[0], lang }), /* @__PURE__ */ React.createElement("div", { className: "fam-sec-gap" }), /* @__PURE__ */ React.createElement("div", { className: "fam-sec-label" }, t("Today's activities", "\u4ECA\u65E5\u6D3B\u52D5")), /* @__PURE__ */ React.createElement("div", { className: "fam-group" }, ACTS_FAM.map((a, i) => {
    const rec = acts.find((r) => r.activity_key === a.key);
    const state = rec ? rec.status === "done" ? "done" : "missed" : "pending";
    const last = i === ACTS_FAM.length - 1;
    const note = (rec == null ? void 0 : rec.notes_en) || (rec == null ? void 0 : rec.notes) || null;
    return /* @__PURE__ */ React.createElement("div", { key: a.key, className: "fam-row" + (last ? " fam-row-last" : "") }, /* @__PURE__ */ React.createElement("div", { className: "fam-act-icon " + state }, I[a.ic], state === "done" && /* @__PURE__ */ React.createElement("span", { className: "fam-act-check" }, I.check)), /* @__PURE__ */ React.createElement("div", { className: "fam-row-body" }, /* @__PURE__ */ React.createElement("div", { className: "fam-row-title" }, t(a.en, a.zh)), note && /* @__PURE__ */ React.createElement("div", { className: "fam-row-sub" }, note)), /* @__PURE__ */ React.createElement("div", { className: "fam-row-value " + state }, state === "done" ? t("Done", "\u5B8C\u6210") : state === "missed" ? t("Missed", "\u672A\u5B8C\u6210") : "\u2014"));
  })), carePlan.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "fam-sec-gap" }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px 6px" } }, /* @__PURE__ */ React.createElement("div", { className: "fam-sec-label", style: { padding: 0 } }, t(`${((_e = elder.name_en) == null ? void 0 : _e.split(" ")[0]) || "Parent"}'s to-do`, `${elder.name_zh || "\u9577\u8005"}\u7684\u5F85\u8FA6`)), (pendingPlan.length > 4 || carePlan.some((p) => p.done)) && /* @__PURE__ */ React.createElement("button", { onClick: () => setShowAllPlan((v) => !v), className: "fam-signout", style: { color: "var(--calm)" } }, showAllPlan ? t("Less", "\u6536\u8D77") : t(`All ${carePlan.length}`, `\u5168\u90E8 ${carePlan.length}`))), /* @__PURE__ */ React.createElement("div", { className: "fam-group" }, visiblePlan.map((p, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "fam-todo" + (p.done ? " done" : "") + (i === visiblePlan.length - 1 ? " fam-todo-last" : "") }, /* @__PURE__ */ React.createElement("span", { className: "ftcheck" }, p.done ? I.check : null), /* @__PURE__ */ React.createElement("span", { className: "ftt" }, t(p.text_en, p.text_zh)))), pendingPlan.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "fam-empty" }, t("All care plan items complete \u2713", "\u6240\u6709\u7167\u9867\u8A08\u5283\u5DF2\u5B8C\u6210 \u2713")))), /* @__PURE__ */ React.createElement("div", { className: "fam-sec-gap" }), /* @__PURE__ */ React.createElement("div", { className: "fam-sec-label" }, t("Check-ins this week", "\u672C\u9031\u901A\u8A71")), /* @__PURE__ */ React.createElement("div", { className: "fam-group", style: { padding: "12px 8px 8px" } }, /* @__PURE__ */ React.createElement("div", { className: "fam-week" }, weekDates.map((d, i) => {
    const done = callStateFor(d);
    const dayNum = (/* @__PURE__ */ new Date(d + "T12:00:00")).getDate();
    const isToday = i === 6;
    return /* @__PURE__ */ React.createElement("div", { key: d, className: "fam-day " + (isToday ? "today" : "") }, /* @__PURE__ */ React.createElement("span", { className: "fd" }, t(["M", "T", "W", "T", "F", "S", "S"][i], ["\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D", "\u65E5"][i])), /* @__PURE__ */ React.createElement("span", { className: "fdot " + (done ? "done" : "") }, done ? I.check : /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 600, color: isToday ? "var(--green)" : "var(--ink-faint)", lineHeight: 1 } }, dayNum)));
  }))), /* @__PURE__ */ React.createElement("div", { className: "fam-sec-gap" })), /* @__PURE__ */ React.createElement("div", { className: "fam-actions" }, /* @__PURE__ */ React.createElement("a", { href: elder.phone ? `tel:${elder.phone}` : void 0, className: "fam-btn call" }, I.phone, t(`Call ${((_f = elder.name_en) == null ? void 0 : _f.split(" ")[0]) || ""}`, `\u96FB\u8A71${elder.name_zh || ""}`)), /* @__PURE__ */ React.createElement("a", { href: worker.phone ? `tel:${worker.phone}` : void 0, className: "fam-btn msg" }, I.phone, t(`Call ${((_g = worker.name_en) == null ? void 0 : _g.split(" ")[0]) || "Nurse"}`, `\u806F\u7D61${worker.name_zh || "\u8B77\u58EB"}`))));
}
ReactDOM.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ React.createElement("div", { className: "fam-stage" }, /* @__PURE__ */ React.createElement(IOSDevice, { width: 390, height: 800 }, /* @__PURE__ */ React.createElement(FamilyApp, null)), /* @__PURE__ */ React.createElement("div", { className: "fam-cap" }, "CareBridge \xB7 ", /* @__PURE__ */ React.createElement("b", null, "Family app"), " \u2014 the adult child's view of their parent"))
);
