/* CareBridge — Elder daily call: interactive walkthrough */

const CALL_STEPS = [
  { role: "ai",  zh: "早晨黃婆婆！我係康橋嘅家欣。今日打嚟問候你 😊", en: "Good morning Mrs Wong! It's Ka-yan from CareBridge, calling to check in.", cap: null },
  { role: "you", zh: "早晨呀。", en: "Good morning.", cap: null },
  { role: "ai",  zh: "今朝食咗藥未呀？", en: "Have you taken your medicine this morning?", cap: null },
  { role: "you", zh: "食咗喇，啱啱用咗吸入器。", en: "Yes, I just used my inhaler.", cap: { key: "med", state: "on", v: "Inhaler taken · 已服藥" } },
  { role: "ai",  zh: "好叻呀！食咗早餐未？", en: "Well done! Have you had breakfast?", cap: null },
  { role: "you", zh: "食咗碗粥。", en: "I had a bowl of congee.", cap: { key: "meal", state: "on", v: "Congee · 食咗粥" } },
  { role: "ai",  zh: "起身嗰陣有冇唔舒服呀？", en: "Any discomfort when you got up?", cap: null },
  { role: "you", zh: "起身有少少頭暈，而家好返啲。", en: "A little dizzy getting up, better now.", cap: { key: "dizzy", state: "flag", v: "Dizziness on standing · 起身頭暈" } },
  { role: "ai",  zh: "明白，我會話畀社工知。今日有冇行下？", en: "I see — I'll let your nurse know. Did you move around today?", cap: null },
  { role: "you", zh: "喺屋企行咗兩個圈。", en: "I walked a couple of laps at home.", cap: { key: "walk", state: "on", v: "Light activity · 室內活動" } },
  { role: "ai",  zh: "瞓得好唔好？", en: "Did you sleep well?", cap: null },
  { role: "you", zh: "瞓得幾好。", en: "I slept quite well.", cap: { key: "sleep", state: "on", v: "Slept well · 睡眠良好" } },
  { role: "ai",  zh: "多謝你黃婆婆，記得多飲水，慢慢起身。聽日再傾！", en: "Thank you Mrs Wong. Drink water and rise slowly. Talk tomorrow!", cap: { sync: true } },
];

const CAP_ITEMS = [
  { key: "med",   ic: "pill",  en: "Medication", zh: "服藥" },
  { key: "meal",  ic: "meal",  en: "Meals",      zh: "進食" },
  { key: "walk",  ic: "walk",  en: "Mobility",   zh: "活動" },
  { key: "sleep", ic: "sleep", en: "Sleep",      zh: "睡眠" },
  { key: "dizzy", ic: "alert", en: "Symptom flag", zh: "症狀提示" },
];

function ElderCall() {
  const [lang, setLang] = React.useState("zh");
  const [phase, setPhase] = React.useState("incoming"); // incoming | call
  const [step, setStep] = React.useState(-1);
  const [playing, setPlaying] = React.useState(false);
  const t = (en, zh) => (lang === "zh" ? zh : en);

  // captured state derived from steps up to current
  const captured = {};
  let synced = false;
  for (let i = 0; i <= step; i++) {
    const c = CALL_STEPS[i] && CALL_STEPS[i].cap;
    if (c) { if (c.sync) synced = true; else captured[c.key] = c; }
  }

  React.useEffect(() => {
    if (!playing || phase !== "call") return;
    if (step >= CALL_STEPS.length - 1) { setPlaying(false); return; }
    const id = setTimeout(() => setStep(s => s + 1), step < 0 ? 400 : 2100);
    return () => clearTimeout(id);
  }, [playing, step, phase]);

  const accept = () => { setPhase("call"); setStep(0); setPlaying(true); };
  const restart = () => { setStep(0); setPlaying(true); };

  const cur = step >= 0 ? CALL_STEPS[step] : null;
  // for display: show last AI question + last YOU answer
  let lastAI = null, lastYou = null;
  for (let i = 0; i <= step; i++) {
    if (CALL_STEPS[i].role === "ai") { lastAI = CALL_STEPS[i]; lastYou = null; }
    else lastYou = CALL_STEPS[i];
  }

  return (
    <div className="call-stage">
      <div className="clang">
        <button className={lang === "zh" ? "on" : ""} onClick={() => setLang("zh")}>中</button>
        <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
      </div>

      <div className="ctitle">
        <h1>{t("The daily call — no app, no friction", "每日一通電話 — 唔使 App")}</h1>
        <p>{t("The elder simply answers the phone. A warm, simple check-in in Cantonese quietly turns into the structured data the nurse and family rely on.", "長者只需接聽電話。一段親切的廣東話問候，悄悄變成社工與家屬倚賴的結構化記錄。")}</p>
      </div>

      <div className="call-grid">
        {/* phone */}
        <div className="cphone">
          <div className="notch"></div>
          {phase === "incoming" ? (
            <div className="cincoming">
              <div className="clabel">{t("Incoming call · daily check-in", "來電 · 每日問候")}</div>
              <div className="cava">康</div>
              <div className="cname">CareBridge</div>
              <div className="csub zh">{t("CareBridge daily call", "康橋每日電話")}</div>
              <div className="cbtns">
                <div className="cbtnwrap"><button className="cbtn decline">{I.x}</button>{t("Decline", "拒接")}</div>
                <div className="cbtnwrap"><button className="cbtn accept" onClick={accept}>{I.phone}</button>{t("Answer", "接聽")}</div>
              </div>
            </div>
          ) : synced ? (
            <div className="cdone">
              <div className="cdone-check">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              </div>
              <div className="cdone-title">{t("Call complete", "通話完成")}</div>
              <div className="cdone-sub">{t("2 min 3 sec · synced to dashboard", "2分3秒 · 已同步至儀表板")}</div>
              <div className="cdone-items">
                {[
                  { ic: "pill",  en: "Medication taken",   zh: "已服藥",   ok: true  },
                  { ic: "meal",  en: "Had breakfast",       zh: "已進食",   ok: true  },
                  { ic: "walk",  en: "Light mobility",      zh: "有輕微活動", ok: true  },
                  { ic: "sleep", en: "Slept well",          zh: "睡眠良好", ok: true  },
                  { ic: "alert", en: "Dizziness flagged",   zh: "頭暈已提示", ok: false },
                ].map(item => (
                  <div key={item.ic} className={"cdone-row " + (item.ok ? "ok" : "flag")}>
                    <div className="cdone-ic">{I[item.ic]}</div>
                    <span>{t(item.en, item.zh)}</span>
                    <div className="cdone-st">{item.ok ? I.check : I.alert}</div>
                  </div>
                ))}
              </div>
              <button className="cdone-replay" onClick={() => { setPhase("incoming"); setStep(-1); setPlaying(false); }}>
                {t("Replay", "重播")}
              </button>
            </div>
          ) : (
            <div className="cincall">
              <div className="ctop">
                <div className="cst zh">{t("CareBridge · on call", "康橋 · 通話中")}</div>
                <div className="ctime">{String(Math.floor((step+1)*9/60)).padStart(1,'0')}:{String(((step+1)*9)%60).padStart(2,'0')}</div>
              </div>
              <div className="miniava">康</div>
              <div className="cwave">{[12,20,8,24,14,22,10,18,12].map((h,i)=><span key={i} style={{height:h,animationDelay:`${i*0.08}s`}}></span>)}</div>

              {lastAI && (
                <div className="cqbox">
                  <div className="crole">{t("CareBridge", "康橋")}</div>
                  <div className="cq">{lang==="zh"?lastAI.zh:lastAI.en}</div>
                  <div className="cqen">{lang==="zh"?lastAI.en:lastAI.zh}</div>
                </div>
              )}
              {lastYou && (
                <div className="cqbox cans">
                  <div className="crole">{t("Mrs Wong", "黃婆婆")}</div>
                  <div className="cq">{lang==="zh"?lastYou.zh:lastYou.en}</div>
                  <div className="cqen">{lang==="zh"?lastYou.en:lastYou.zh}</div>
                </div>
              )}

              <div className="cendbar">
                <button className="cendbtn" onClick={() => { setPhase("incoming"); setStep(-1); setPlaying(false); }}>{I.phone}</button>
              </div>
            </div>
          )}
        </div>

        {/* capture panel */}
        <div className="cap">
          <h3>{I.spark} {t("Captured automatically", "自動記錄")} <span className="zh">{t("· structured from the call", "· 由通話整理")}</span></h3>
          <p className="capsub">{t("Every answer maps to a daily activity or a clinical flag — no typing, no app for the elder.", "每個答案對應一項日常活動或臨床提示 — 長者無需打字或安裝程式。")}</p>

          {CAP_ITEMS.map(item => {
            const c = captured[item.key];
            const isFlag = item.key === "dizzy";
            const cls = c ? (isFlag ? "flag" : "on") : "pending";
            return (
              <div key={item.key} className={"caprow " + cls}>
                <div className="capi">{I[item.ic]}</div>
                <div>
                  <div className="capl">{t(item.en, item.zh)}</div>
                  <div className="capv">{c ? (lang==="zh"? c.v.split("·")[1]||c.v : c.v.split("·")[0]) : t("Waiting…", "等待中…")}</div>
                </div>
                <div className="capstate">{c ? (isFlag ? I.alert : I.check) : ""}</div>
              </div>
            );
          })}

          <div className={"capsync " + (synced ? "on" : "")}>
            <div className="syncava">曾</div>
            <div>
              <div className="synct">{t("Synced to Karen's dashboard", "已同步至社工")} <span className="zh"></span></div>
              <div className="syncs">{synced ? t("Wong Mei-ling · flag raised: dizziness", "黃美玲 · 已標記：頭暈") : t("Will update the moment the call ends", "通話結束即時更新")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* controls */}
      <div className="cctrls">
        <button className="cctrl" onClick={() => setStep(s => Math.max(0, s-1))} disabled={phase!=="call"}>{I.arrowL}</button>
        {phase === "incoming"
          ? <button className="cctrl cplay" onClick={accept}>{I.phone}</button>
          : (step >= CALL_STEPS.length-1
              ? <button className="cctrl cplay" onClick={restart}><svg viewBox="0 0 24 24" width="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5"/></svg></button>
              : <button className="cctrl cplay" onClick={() => setPlaying(p => !p)}>{playing ? <svg viewBox="0 0 24 24" width="22" fill="#fff"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg> : <svg viewBox="0 0 24 24" width="22" fill="#fff"><path d="M7 5l12 7-12 7z"/></svg>}</button>)}
        <button className="cctrl" onClick={() => setStep(s => Math.min(CALL_STEPS.length-1, s+1))} disabled={phase!=="call"}>{I.chevron}</button>
        <span className="cprog">{phase==="call" ? `${Math.min(step+1, CALL_STEPS.length)} / ${CALL_STEPS.length}` : t("Press answer to begin","按接聽開始")}</span>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ElderCall />);
