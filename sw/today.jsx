/* CareBridge — Today view, caseload cards, alerts, visits */

function ActRow({ week, lang }) {
  // last column = today; show today's state per activity
  return (
    <div className="actrow">
      {ACTS.map((a, i) => {
        const today = week[i][6];
        const state = today === 1 ? "done" : today === 0 ? "missed" : "pending";
        return <ActGlyph key={a.key} icon={I[a.ic]} state={state} label={L(lang, a.en, a.zh)} />;
      })}
    </div>
  );
}

function ElderCard({ e, lang, onOpen }) {
  const r = RISK[e.risk];
  return (
    <div className="ecard card" onClick={() => onOpen(e.id)}>
      <div className="ehead">
        <Avatar name={e.zh} size={46} />
        <div style={{ flex: 1 }}>
          <div className="enm">{L(lang, e.name, e.zh)}</div>
          <div className="ezh">{L(lang, e.zh, e.name)} · {e.age}{L(lang, "", "歲")}</div>
          <div className="emeta">{L(lang, `Day ${e.day} · ${e.dx}`, `出院第 ${e.day} 天 · ${e.dxZh}`)}</div>
        </div>
      </div>

      <div className="erow">
        <Pill kind={r.cls}>{L(lang, r.en, r.zh)}</Pill>
        <span className={"callstat " + (e.call.state === "done" ? "done" : "missed")}>
          {e.call.state === "done" ? I.phone : I.phoneMissed}
          {e.call.state === "done" ? L(lang, `Call ${e.call.time}`, `已致電 ${e.call.time}`) : L(lang, "Missed call", "未接電話")}
        </span>
      </div>

      <ActRow week={e.week} lang={lang} />

      <div className="flagline">
        <span className="fdot" style={{ background: `var(--${r.cls === "stable" ? "stable" : r.cls === "watch" ? "watch" : "risk"})` }}></span>
        <span>{L(lang, e.call.flag, e.call.flagZh)}</span>
      </div>
    </div>
  );
}

function TodayView({ lang, onOpen, onVisit }) {
  const counts = {
    stable: ELDERS.filter(e => e.risk === "stable").length,
    watch:  ELDERS.filter(e => e.risk === "watch").length,
    risk:   ELDERS.filter(e => e.risk === "risk").length,
    calls:  ELDERS.filter(e => e.call.state === "done").length,
  };

  // alerts derived from elders needing attention
  const alerts = [
    { id: "chan", kind: "risk",  name: "Chan Kwok-keung", zh: "陳國強",
      en: "Missed daily call + weight up 1.8 kg in 3 days. Possible fluid overload.",
      zhMsg: "未接每日電話兼 3 日內體重升 1.8 公斤，疑似積水。", time: "20m ago", timeZh: "20 分鐘前" },
    { id: "wong", kind: "watch", name: "Wong Mei-ling", zh: "黃美玲",
      en: "Reported mild dizziness when standing. Lives alone — falls risk.",
      zhMsg: "起身時感輕微頭暈，獨居 — 有跌倒風險。", time: "1h ago", timeZh: "1 小時前" },
    { id: "cheung", kind: "watch", name: "Cheung Chi-ming", zh: "張志明",
      en: "Missed morning medication — 3rd time this week.", zhMsg: "漏服早上藥物 — 本週第 3 次。", time: "1h ago", timeZh: "1 小時前" },
  ];

  return (
    <div className="content">
      <div className="kpis">
        <div className="kpi k-stable card"><div className="ki">{I.heart}</div><div className="kn">{counts.stable}</div><div className="kl">{L(lang,"Stable","穩定")}</div></div>
        <div className="kpi k-watch card"><div className="ki">{I.alert}</div><div className="kn">{counts.watch}</div><div className="kl">{L(lang,"Watch","留意")}</div></div>
        <div className="kpi k-risk card"><div className="ki">{I.alert}</div><div className="kn">{counts.risk}</div><div className="kl">{L(lang,"At risk","高危")}</div></div>
        <div className="kpi k-call card"><div className="ki">{I.phone}</div><div className="kn">{counts.calls}/5</div><div className="kl">{L(lang,"Calls done","已致電")}</div></div>
        <div className="kpi k-visit card"><div className="ki">{I.map}</div><div className="kn">{VISITS.length}</div><div className="kl">{L(lang,"Visits today","今日家訪")}</div></div>
      </div>

      <div className="grid-2">
        <div>
          <div className="sec-title">
            <h2>{L(lang, "Needs your attention", "需要跟進")}</h2>
            <span className="sub">{L(lang, `${alerts.length} flags this morning`, `今早 ${alerts.length} 項提示`)}</span>
          </div>
          <div className="alerts">
            {alerts.map(a => (
              <div key={a.id} className={"alert card " + a.kind} onClick={() => onOpen(a.id)}>
                <div className="aic">{a.kind === "risk" ? I.alert : I.bell}</div>
                <div className="atxt">
                  <div className="atop">
                    <span className="anm">{L(lang, a.name, a.zh)}</span>
                    <Pill kind={a.kind} dot={false}>{a.kind === "risk" ? L(lang,"Urgent","緊急") : L(lang,"Watch","留意")}</Pill>
                    <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--ink-faint)", fontFamily: "var(--mono)" }}>{L(lang, a.time, a.timeZh)}</span>
                  </div>
                  <div className="amsg">{L(lang, a.en, a.zhMsg)}</div>
                </div>
                <span className="ago">{I.chevron}</span>
              </div>
            ))}
          </div>

          <div className="sec-title">
            <h2>{L(lang, "My caseload", "我的個案")}</h2>
            <span className="sub">{L(lang, "5 elders · sorted by risk", "5 位長者 · 按風險排序")}</span>
          </div>
          <div className="caseload">
            {[...ELDERS].sort((a,b)=>({risk:0,watch:1,stable:2}[a.risk]-{risk:0,watch:1,stable:2}[b.risk]))
              .map(e => <ElderCard key={e.id} e={e} lang={lang} onOpen={onOpen} />)}
          </div>
        </div>

        <div>
          <div className="sec-title"><h2>{L(lang, "Today's visits", "今日家訪")}</h2></div>
          <div className="vpanel card">
            {VISITS.map(v => {
              const e = ELDERS.find(x => x.id === v.elder);
              return (
                <div key={v.id} className={"visit " + v.state} onClick={() => onVisit(v.elder)}>
                  <span className="vtime">{v.time}</span>
                  <span className="vbar"></span>
                  <div style={{ flex: 1 }}>
                    <div className="vname">{L(lang, e.name, e.zh)}</div>
                    <div className="vtype">{L(lang, v.type, v.typeZh)}</div>
                    <div className="vwhere">{I.map} {v.where}</div>
                  </div>
                  {v.state === "due" && <Pill kind="risk" dot={false}>{L(lang,"Due now","即將")}</Pill>}
                </div>
              );
            })}
            <button className="btn primary" style={{ width: "calc(100% - 8px)", margin: "8px 4px 4px" }}>{I.plus}{L(lang, "Schedule a visit", "新增家訪")}</button>
          </div>

          <div className="sec-title" style={{ marginTop: 24 }}><h2>{L(lang, "Programme pulse", "計劃概況")}</h2></div>
          <div className="card" style={{ padding: 18 }}>
            <PulseStat lang={lang} label={L(lang,"Avg. activity adherence","平均活動依從")} value="86%" trend="+4%" good />
            <PulseStat lang={lang} label={L(lang,"Calls answered (7d)","7 天接聽率")} value="91%" trend="+2%" good />
            <PulseStat lang={lang} label={L(lang,"Readmissions avoided","避免再入院")} value="2" trend={L(lang,"this month","本月")} good />
            <PulseStat lang={lang} label={L(lang,"Graduating soon","即將結案")} value="1" trend="何婉華" last />
          </div>
        </div>
      </div>
    </div>
  );
}

function PulseStat({ label, value, trend, good, last }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 2px", borderBottom: last ? "none" : "1px solid var(--line-soft)" }}>
      <span style={{ fontSize: 13.5, color: "var(--ink-soft)" }}>{label}</span>
      <span style={{ display:"flex", alignItems:"baseline", gap: 8 }}>
        <span style={{ fontSize: 18, fontWeight: 800, fontFamily:"var(--mono)" }}>{value}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: good ? "var(--green)" : "var(--ink-faint)", fontFamily:"var(--hk)" }}>{trend}</span>
      </span>
    </div>
  );
}

Object.assign(window, { TodayView });
