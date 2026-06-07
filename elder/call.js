// AUTO-GENERATED from elder/call.jsx by `npm run build:jsx` — edit the .jsx, not this file.
const CALL_STEPS = [
  { role: "ai", zh: "\u65E9\u6668\u9EC3\u5A46\u5A46\uFF01\u6211\u4FC2\u5EB7\u6A4B\u5605\u5BB6\u6B23\u3002\u4ECA\u65E5\u6253\u569F\u554F\u5019\u4F60 \u{1F60A}", en: "Good morning Mrs Wong! It's Ka-yan from CareBridge, calling to check in.", cap: null },
  { role: "you", zh: "\u65E9\u6668\u5440\u3002", en: "Good morning.", cap: null },
  { role: "ai", zh: "\u4ECA\u671D\u98DF\u5497\u85E5\u672A\u5440\uFF1F", en: "Have you taken your medicine this morning?", cap: null },
  { role: "you", zh: "\u98DF\u5497\u5587\uFF0C\u5571\u5571\u7528\u5497\u5438\u5165\u5668\u3002", en: "Yes, I just used my inhaler.", cap: { key: "med", state: "on", v: "Inhaler taken \xB7 \u5DF2\u670D\u85E5" } },
  { role: "ai", zh: "\u597D\u53FB\u5440\uFF01\u98DF\u5497\u65E9\u9910\u672A\uFF1F", en: "Well done! Have you had breakfast?", cap: null },
  { role: "you", zh: "\u98DF\u5497\u7897\u7CA5\u3002", en: "I had a bowl of congee.", cap: { key: "meal", state: "on", v: "Congee \xB7 \u98DF\u5497\u7CA5" } },
  { role: "ai", zh: "\u8D77\u8EAB\u55F0\u9663\u6709\u5187\u5514\u8212\u670D\u5440\uFF1F", en: "Any discomfort when you got up?", cap: null },
  { role: "you", zh: "\u8D77\u8EAB\u6709\u5C11\u5C11\u982D\u6688\uFF0C\u800C\u5BB6\u597D\u8FD4\u5572\u3002", en: "A little dizzy getting up, better now.", cap: { key: "dizzy", state: "flag", v: "Dizziness on standing \xB7 \u8D77\u8EAB\u982D\u6688" } },
  { role: "ai", zh: "\u660E\u767D\uFF0C\u6211\u6703\u8A71\u7540\u793E\u5DE5\u77E5\u3002\u4ECA\u65E5\u6709\u5187\u884C\u4E0B\uFF1F", en: "I see \u2014 I'll let your nurse know. Did you move around today?", cap: null },
  { role: "you", zh: "\u55BA\u5C4B\u4F01\u884C\u5497\u5169\u500B\u5708\u3002", en: "I walked a couple of laps at home.", cap: { key: "walk", state: "on", v: "Light activity \xB7 \u5BA4\u5167\u6D3B\u52D5" } },
  { role: "ai", zh: "\u7793\u5F97\u597D\u5514\u597D\uFF1F", en: "Did you sleep well?", cap: null },
  { role: "you", zh: "\u7793\u5F97\u5E7E\u597D\u3002", en: "I slept quite well.", cap: { key: "sleep", state: "on", v: "Slept well \xB7 \u7761\u7720\u826F\u597D" } },
  { role: "ai", zh: "\u591A\u8B1D\u4F60\u9EC3\u5A46\u5A46\uFF0C\u8A18\u5F97\u591A\u98F2\u6C34\uFF0C\u6162\u6162\u8D77\u8EAB\u3002\u807D\u65E5\u518D\u50BE\uFF01", en: "Thank you Mrs Wong. Drink water and rise slowly. Talk tomorrow!", cap: { sync: true } }
];
const CAP_ITEMS = [
  { key: "med", ic: "pill", en: "Medication", zh: "\u670D\u85E5" },
  { key: "meal", ic: "meal", en: "Meals", zh: "\u9032\u98DF" },
  { key: "walk", ic: "walk", en: "Mobility", zh: "\u6D3B\u52D5" },
  { key: "sleep", ic: "sleep", en: "Sleep", zh: "\u7761\u7720" },
  { key: "dizzy", ic: "alert", en: "Symptom flag", zh: "\u75C7\u72C0\u63D0\u793A" }
];
function ElderCall() {
  const [lang, setLang] = React.useState("zh");
  const [phase, setPhase] = React.useState("incoming");
  const [step, setStep] = React.useState(-1);
  const [playing, setPlaying] = React.useState(false);
  const t = (en, zh) => lang === "zh" ? zh : en;
  const captured = {};
  let synced = false;
  for (let i = 0; i <= step; i++) {
    const c = CALL_STEPS[i] && CALL_STEPS[i].cap;
    if (c) {
      if (c.sync) synced = true;
      else captured[c.key] = c;
    }
  }
  React.useEffect(() => {
    if (!playing || phase !== "call") return;
    if (step >= CALL_STEPS.length - 1) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(() => setStep((s) => s + 1), step < 0 ? 400 : 2100);
    return () => clearTimeout(id);
  }, [playing, step, phase]);
  const accept = () => {
    setPhase("call");
    setStep(0);
    setPlaying(true);
  };
  const restart = () => {
    setStep(0);
    setPlaying(true);
  };
  const cur = step >= 0 ? CALL_STEPS[step] : null;
  let lastAI = null, lastYou = null;
  for (let i = 0; i <= step; i++) {
    if (CALL_STEPS[i].role === "ai") {
      lastAI = CALL_STEPS[i];
      lastYou = null;
    } else lastYou = CALL_STEPS[i];
  }
  return /* @__PURE__ */ React.createElement("div", { className: "call-stage" }, /* @__PURE__ */ React.createElement("div", { className: "clang" }, /* @__PURE__ */ React.createElement("button", { className: lang === "zh" ? "on" : "", onClick: () => setLang("zh") }, "\u4E2D"), /* @__PURE__ */ React.createElement("button", { className: lang === "en" ? "on" : "", onClick: () => setLang("en") }, "EN")), /* @__PURE__ */ React.createElement("div", { className: "ctitle" }, /* @__PURE__ */ React.createElement("h1", null, t("The daily call \u2014 no app, no friction", "\u6BCF\u65E5\u4E00\u901A\u96FB\u8A71 \u2014 \u5514\u4F7F App")), /* @__PURE__ */ React.createElement("p", null, t("The elder simply answers the phone. A warm, simple check-in in Cantonese quietly turns into the structured data the nurse and family rely on.", "\u9577\u8005\u53EA\u9700\u63A5\u807D\u96FB\u8A71\u3002\u4E00\u6BB5\u89AA\u5207\u7684\u5EE3\u6771\u8A71\u554F\u5019\uFF0C\u6084\u6084\u8B8A\u6210\u793E\u5DE5\u8207\u5BB6\u5C6C\u501A\u8CF4\u7684\u7D50\u69CB\u5316\u8A18\u9304\u3002"))), /* @__PURE__ */ React.createElement("div", { className: "call-grid" }, /* @__PURE__ */ React.createElement("div", { className: "cphone" }, /* @__PURE__ */ React.createElement("div", { className: "notch" }), phase === "incoming" ? /* @__PURE__ */ React.createElement("div", { className: "cincoming" }, /* @__PURE__ */ React.createElement("div", { className: "clabel" }, t("Incoming call \xB7 daily check-in", "\u4F86\u96FB \xB7 \u6BCF\u65E5\u554F\u5019")), /* @__PURE__ */ React.createElement("div", { className: "cava" }, "\u5EB7"), /* @__PURE__ */ React.createElement("div", { className: "cname" }, "CareBridge"), /* @__PURE__ */ React.createElement("div", { className: "csub zh" }, t("CareBridge daily call", "\u5EB7\u6A4B\u6BCF\u65E5\u96FB\u8A71")), /* @__PURE__ */ React.createElement("div", { className: "cbtns" }, /* @__PURE__ */ React.createElement("div", { className: "cbtnwrap" }, /* @__PURE__ */ React.createElement("button", { className: "cbtn decline" }, I.x), t("Decline", "\u62D2\u63A5")), /* @__PURE__ */ React.createElement("div", { className: "cbtnwrap" }, /* @__PURE__ */ React.createElement("button", { className: "cbtn accept", onClick: accept }, I.phone), t("Answer", "\u63A5\u807D")))) : synced ? /* @__PURE__ */ React.createElement("div", { className: "cdone" }, /* @__PURE__ */ React.createElement("div", { className: "cdone-check" }, /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "#fff", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M20 6 9 17l-5-5" }))), /* @__PURE__ */ React.createElement("div", { className: "cdone-title" }, t("Call complete", "\u901A\u8A71\u5B8C\u6210")), /* @__PURE__ */ React.createElement("div", { className: "cdone-sub" }, t("2 min 3 sec \xB7 synced to dashboard", "2\u52063\u79D2 \xB7 \u5DF2\u540C\u6B65\u81F3\u5100\u8868\u677F")), /* @__PURE__ */ React.createElement("div", { className: "cdone-items" }, [
    { ic: "pill", en: "Medication taken", zh: "\u5DF2\u670D\u85E5", ok: true },
    { ic: "meal", en: "Had breakfast", zh: "\u5DF2\u9032\u98DF", ok: true },
    { ic: "walk", en: "Light mobility", zh: "\u6709\u8F15\u5FAE\u6D3B\u52D5", ok: true },
    { ic: "sleep", en: "Slept well", zh: "\u7761\u7720\u826F\u597D", ok: true },
    { ic: "alert", en: "Dizziness flagged", zh: "\u982D\u6688\u5DF2\u63D0\u793A", ok: false }
  ].map((item) => /* @__PURE__ */ React.createElement("div", { key: item.ic, className: "cdone-row " + (item.ok ? "ok" : "flag") }, /* @__PURE__ */ React.createElement("div", { className: "cdone-ic" }, I[item.ic]), /* @__PURE__ */ React.createElement("span", null, t(item.en, item.zh)), /* @__PURE__ */ React.createElement("div", { className: "cdone-st" }, item.ok ? I.check : I.alert)))), /* @__PURE__ */ React.createElement("button", { className: "cdone-replay", onClick: () => {
    setPhase("incoming");
    setStep(-1);
    setPlaying(false);
  } }, t("Replay", "\u91CD\u64AD"))) : /* @__PURE__ */ React.createElement("div", { className: "cincall" }, /* @__PURE__ */ React.createElement("div", { className: "ctop" }, /* @__PURE__ */ React.createElement("div", { className: "cst zh" }, t("CareBridge \xB7 on call", "\u5EB7\u6A4B \xB7 \u901A\u8A71\u4E2D")), /* @__PURE__ */ React.createElement("div", { className: "ctime" }, String(Math.floor((step + 1) * 9 / 60)).padStart(1, "0"), ":", String((step + 1) * 9 % 60).padStart(2, "0"))), /* @__PURE__ */ React.createElement("div", { className: "miniava" }, "\u5EB7"), /* @__PURE__ */ React.createElement("div", { className: "cwave" }, [12, 20, 8, 24, 14, 22, 10, 18, 12].map((h, i) => /* @__PURE__ */ React.createElement("span", { key: i, style: { height: h, animationDelay: `${i * 0.08}s` } }))), lastAI && /* @__PURE__ */ React.createElement("div", { className: "cqbox" }, /* @__PURE__ */ React.createElement("div", { className: "crole" }, t("CareBridge", "\u5EB7\u6A4B")), /* @__PURE__ */ React.createElement("div", { className: "cq" }, lang === "zh" ? lastAI.zh : lastAI.en), /* @__PURE__ */ React.createElement("div", { className: "cqen" }, lang === "zh" ? lastAI.en : lastAI.zh)), lastYou && /* @__PURE__ */ React.createElement("div", { className: "cqbox cans" }, /* @__PURE__ */ React.createElement("div", { className: "crole" }, t("Mrs Wong", "\u9EC3\u5A46\u5A46")), /* @__PURE__ */ React.createElement("div", { className: "cq" }, lang === "zh" ? lastYou.zh : lastYou.en), /* @__PURE__ */ React.createElement("div", { className: "cqen" }, lang === "zh" ? lastYou.en : lastYou.zh)), /* @__PURE__ */ React.createElement("div", { className: "cendbar" }, /* @__PURE__ */ React.createElement("button", { className: "cendbtn", onClick: () => {
    setPhase("incoming");
    setStep(-1);
    setPlaying(false);
  } }, I.phone)))), /* @__PURE__ */ React.createElement("div", { className: "cap" }, /* @__PURE__ */ React.createElement("h3", null, I.spark, " ", t("Captured automatically", "\u81EA\u52D5\u8A18\u9304"), " ", /* @__PURE__ */ React.createElement("span", { className: "zh" }, t("\xB7 structured from the call", "\xB7 \u7531\u901A\u8A71\u6574\u7406"))), /* @__PURE__ */ React.createElement("p", { className: "capsub" }, t("Every answer maps to a daily activity or a clinical flag \u2014 no typing, no app for the elder.", "\u6BCF\u500B\u7B54\u6848\u5C0D\u61C9\u4E00\u9805\u65E5\u5E38\u6D3B\u52D5\u6216\u81E8\u5E8A\u63D0\u793A \u2014 \u9577\u8005\u7121\u9700\u6253\u5B57\u6216\u5B89\u88DD\u7A0B\u5F0F\u3002")), CAP_ITEMS.map((item) => {
    const c = captured[item.key];
    const isFlag = item.key === "dizzy";
    const cls = c ? isFlag ? "flag" : "on" : "pending";
    return /* @__PURE__ */ React.createElement("div", { key: item.key, className: "caprow " + cls }, /* @__PURE__ */ React.createElement("div", { className: "capi" }, I[item.ic]), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "capl" }, t(item.en, item.zh)), /* @__PURE__ */ React.createElement("div", { className: "capv" }, c ? lang === "zh" ? c.v.split("\xB7")[1] || c.v : c.v.split("\xB7")[0] : t("Waiting\u2026", "\u7B49\u5F85\u4E2D\u2026"))), /* @__PURE__ */ React.createElement("div", { className: "capstate" }, c ? isFlag ? I.alert : I.check : ""));
  }), /* @__PURE__ */ React.createElement("div", { className: "capsync " + (synced ? "on" : "") }, /* @__PURE__ */ React.createElement("div", { className: "syncava" }, "\u66FE"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "synct" }, t("Synced to Karen's dashboard", "\u5DF2\u540C\u6B65\u81F3\u793E\u5DE5"), " ", /* @__PURE__ */ React.createElement("span", { className: "zh" })), /* @__PURE__ */ React.createElement("div", { className: "syncs" }, synced ? t("Wong Mei-ling \xB7 flag raised: dizziness", "\u9EC3\u7F8E\u73B2 \xB7 \u5DF2\u6A19\u8A18\uFF1A\u982D\u6688") : t("Will update the moment the call ends", "\u901A\u8A71\u7D50\u675F\u5373\u6642\u66F4\u65B0")))))), /* @__PURE__ */ React.createElement("div", { className: "cctrls" }, /* @__PURE__ */ React.createElement("button", { className: "cctrl", onClick: () => setStep((s) => Math.max(0, s - 1)), disabled: phase !== "call" }, I.arrowL), phase === "incoming" ? /* @__PURE__ */ React.createElement("button", { className: "cctrl cplay", onClick: accept }, I.phone) : step >= CALL_STEPS.length - 1 ? /* @__PURE__ */ React.createElement("button", { className: "cctrl cplay", onClick: restart }, /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", width: "22", fill: "none", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5" }))) : /* @__PURE__ */ React.createElement("button", { className: "cctrl cplay", onClick: () => setPlaying((p) => !p) }, playing ? /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", width: "22", fill: "#fff" }, /* @__PURE__ */ React.createElement("rect", { x: "6", y: "5", width: "4", height: "14", rx: "1" }), /* @__PURE__ */ React.createElement("rect", { x: "14", y: "5", width: "4", height: "14", rx: "1" })) : /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", width: "22", fill: "#fff" }, /* @__PURE__ */ React.createElement("path", { d: "M7 5l12 7-12 7z" }))), /* @__PURE__ */ React.createElement("button", { className: "cctrl", onClick: () => setStep((s) => Math.min(CALL_STEPS.length - 1, s + 1)), disabled: phase !== "call" }, I.chevron), phase === "call" && !synced ? /* @__PURE__ */ React.createElement("div", { className: "cstepbar", title: `${Math.min(step + 1, CALL_STEPS.length)} / ${CALL_STEPS.length}` }, /* @__PURE__ */ React.createElement("div", { className: "cstepfill", style: { width: `${Math.min(100, (step + 1) / CALL_STEPS.length * 100)}%` } })) : /* @__PURE__ */ React.createElement("span", { className: "cprog" }, phase === "incoming" ? t("Press answer to begin", "\u6309\u63A5\u807D\u958B\u59CB") : t("Call complete", "\u901A\u8A71\u5B8C\u6210"))));
}
ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(ElderCall, null));
