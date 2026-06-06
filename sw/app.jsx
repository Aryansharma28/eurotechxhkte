/* CareBridge — social worker dashboard root */

function Dashboard() {
  const [lang, setLang] = React.useState("en");
  const [nav, setNav] = React.useState("today");
  const [openId, setOpenId] = React.useState(null);
  const [visitId, setVisitId] = React.useState(null);

  const navItems = [
    { k: "today",   en: "Today",     zh: "今日",   ic: I.home },
    { k: "caseload",en: "Caseload",  zh: "個案",   ic: I.people },
    { k: "visits",  en: "Visits",    zh: "家訪",   ic: I.visit },
    { k: "alerts",  en: "Alerts",    zh: "提示",   ic: I.bell, badge: 3 },
    { k: "messages",en: "Messages",  zh: "訊息",   ic: I.chat },
  ];

  const today = new Date(2026, 5, 7);
  const dateStr = L(lang,
    today.toLocaleDateString("en-HK", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    today.toLocaleDateString("zh-HK", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));

  const titles = {
    today:   [L(lang, "Good morning, Karen 早晨", "早晨，家欣"), ""],
    caseload:[L(lang, "My caseload", "我的個案"), ""],
    visits:  [L(lang, "Visits", "家訪安排"), ""],
    alerts:  [L(lang, "Alerts", "提示"), ""],
    messages:[L(lang, "Messages", "訊息"), ""],
  };

  return (
    <div className="app">
      {/* sidebar */}
      <aside className="side">
        <div className="brand"><span className="mark"></span> CareBridge <span className="zh">康橋</span></div>
        <div className="navg">
          {navItems.map(n => (
            <button key={n.k} className={"navi " + (nav === n.k ? "on" : "")} onClick={() => setNav(n.k)}>
              {n.ic} {L(lang, n.en, n.zh)}
              {n.badge && <span className="badge">{n.badge}</span>}
            </button>
          ))}
        </div>
        <div className="spacer"></div>
        <div className="workercard">
          <Avatar name={WORKER.zh} size={40} />
          <div>
            <div className="wn">{L(lang, WORKER.name, WORKER.zh)}</div>
            <div className="wr">{L(lang, WORKER.role, WORKER.roleZh)}</div>
          </div>
        </div>
      </aside>

      {/* main */}
      <div className="main">
        <div className="topbar">
          <div>
            <h1>{titles[nav][0]}</h1>
            <div className="date">{dateStr}</div>
          </div>
          <div className="topctl">
            <div className="searchbox">{I.search}<input placeholder={L(lang, "Search elders…", "搜尋長者…")} /></div>
            <div className="langtog">
              <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
              <button className={lang === "zh" ? "on" : ""} onClick={() => setLang("zh")}>中</button>
            </div>
          </div>
        </div>

        {nav === "today" && <TodayView lang={lang} onOpen={setOpenId} onVisit={setVisitId} />}
        {nav === "caseload" && <CaseloadView lang={lang} onOpen={setOpenId} />}
        {nav === "visits" && <VisitsView lang={lang} onOpen={setOpenId} onVisit={setVisitId} />}
        {nav === "alerts" && <SimpleNote lang={lang} title={L(lang,"All caught up on alerts","提示已全部處理")} body={L(lang,"New flags from the daily calls will appear here. Check the Today tab for this morning's three.","每日電話的新提示會在此顯示。今早三項請見「今日」。")} />}
        {nav === "messages" && <SimpleNote lang={lang} title={L(lang,"Messages with families","與家屬的訊息")} body={L(lang,"A lightweight thread with each elder's family lives here in the full build.","完整版本將在此顯示與各家屬的對話。")} />}
      </div>

      {openId && <ElderDetail id={openId} lang={lang} onClose={() => setOpenId(null)} onVisit={(id) => { setOpenId(null); setVisitId(id); }} />}
      {visitId && <VisitMode id={visitId} lang={lang} onClose={() => setVisitId(null)} />}
    </div>
  );
}

function CaseloadView({ lang, onOpen }) {
  return (
    <div className="content">
      <div className="caseload" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}>
        {[...ELDERS].sort((a,b)=>({risk:0,watch:1,stable:2}[a.risk]-{risk:0,watch:1,stable:2}[b.risk]))
          .map(e => <ElderCard key={e.id} e={e} lang={lang} onOpen={onOpen} />)}
      </div>
    </div>
  );
}

function VisitsView({ lang, onOpen, onVisit }) {
  return (
    <div className="content" style={{ maxWidth: 760 }}>
      <div className="card vpanel" style={{ padding: 8 }}>
        {VISITS.map(v => {
          const e = ELDERS.find(x => x.id === v.elder);
          return (
            <div key={v.id} className={"visit " + v.state} onClick={() => onVisit(v.elder)}>
              <span className="vtime">{v.time}</span>
              <span className="vbar"></span>
              <div style={{ flex: 1 }}>
                <div className="vname">{L(lang, e.name, e.zh)}</div>
                <div className="vtype">{L(lang, v.type, v.typeZh)} · {v.where}</div>
              </div>
              {v.state === "due" && <Pill kind="risk" dot={false}>{L(lang,"Due now","即將")}</Pill>}
              <button className="btn primary" onClick={(ev)=>{ev.stopPropagation(); onVisit(v.elder);}} style={{ padding: "8px 14px", fontSize: 14 }}>{L(lang,"Start","開始")}</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SimpleNote({ title, body }) {
  return (
    <div className="content">
      <div className="card" style={{ padding: 40, textAlign: "center", maxWidth: 560, margin: "20px auto" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--green-tint)", color: "var(--green-ink)", display: "grid", placeItems: "center", margin: "0 auto 18px" }}>{I.check}</div>
        <h2 style={{ fontSize: 20 }}>{title}</h2>
        <p style={{ color: "var(--ink-soft)", fontSize: 15, lineHeight: 1.55, marginTop: 10 }}>{body}</p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Dashboard />);
