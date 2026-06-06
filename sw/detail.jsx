/* CareBridge — Elder detail drawer + tablet visit mode */

function WeekCalendar({ e, lang }) {
  return (
    <div className="wkcal">
      <table className="wktable">
        <thead>
          <tr>
            <th></th>
            {DAYS.map((d, i) => (
              <th key={i} className={i === 6 ? "today" : ""}>{L(lang, d, "週" + DAYS_ZH[i])}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ACTS.map((a, ri) => (
            <tr key={a.key}>
              <td className="rowlbl">{I[a.ic]} {L(lang, a.en, a.zh)}</td>
              {e.week[ri].map((v, ci) => (
                <td key={ci}>
                  <span className={"cell " + (v === 1 ? "done" : "miss") + (ci === 6 ? " todaycol" : "")}>
                    {v === 1 ? I.check : I.x}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ElderDetail({ id, lang, onClose, onVisit }) {
  const e = ELDERS.find(x => x.id === id);
  if (!e) return null;
  const r = RISK[e.risk];
  const tagIcon = { call: I.phone, miss: I.phoneMissed, family: I.heart, visit: I.map };

  return (
    <div className="drawer-scrim scrim" onClick={onClose}>
      <div className="drawer" onClick={ev => ev.stopPropagation()}>
        <div className="dh">
          <div className="dh-top">
            <button className="iconbtn" onClick={onClose}>{I.x}</button>
            <Pill kind={r.cls}>{L(lang, r.en, r.zh)}</Pill>
          </div>
          <div className="dh-id">
            <Avatar name={e.zh} size={62} />
            <div style={{ flex: 1 }}>
              <div className="dnm">{L(lang, e.name, e.zh)} <span className="dzh">{L(lang, e.zh, e.name)}</span></div>
              <div className="dmeta">{e.age}{L(lang, " yrs", " 歲")} · {L(lang, e.sex === "F" ? "Female" : "Male", e.sex === "F" ? "女" : "男")} · {L(lang, `Discharged ${e.day} days ago`, `出院第 ${e.day} 天`)} · {L(lang, e.lives, e.livesZh)}</div>
            </div>
          </div>
          <div className="dh-actions">
            <button className="btn primary" onClick={() => onVisit(e.id)}>{I.map}{L(lang, "Start home visit", "開始家訪")}</button>
            <button className="btn ghost">{I.phone}{L(lang, "Call now", "立即致電")}</button>
            <button className="btn ghost">{I.note}{L(lang, "Add note", "新增記錄")}</button>
          </div>
        </div>

        <div className="dbody">
          {/* risk banner */}
          <div className={"riskbanner " + r.cls}>
            <div className="aic" style={{ color: r.cls === "stable" ? "var(--green-ink)" : r.cls === "watch" ? "var(--watch-ink)" : "var(--risk-ink)" }}>{I.alert}</div>
            <div>
              <div className="rt">{L(lang, "Care signal · ", "照顧提示 · ")}{L(lang, r.en, r.zh)}</div>
              <div className="rb">{L(lang, e.riskNote, e.riskNoteZh)}</div>
            </div>
          </div>

          <div className="dcard card">
            <h3>{I.cal} {L(lang, "This week's daily activities", "本週每日活動")}</h3>
            <WeekCalendar e={e} lang={lang} />
          </div>

          <div className="dcard card">
            <h3>{I.trend} {L(lang, "Latest vitals", "最新生命表徵")}</h3>
            <div className="vitals">
              {e.vitals.map(v => (
                <div key={v.k} className={"vital " + v.t}>
                  <div className="vk">{v.k}</div>
                  <div className="vv">{v.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="dcard card">
            <h3>{I.clock} {L(lang, "Recent check-ins", "近期跟進")}</h3>
            <div className="tl">
              {e.timeline.map((t, i) => (
                <div key={i} className="tli">
                  <div className={"tdot " + t.tag}>{tagIcon[t.tag]}</div>
                  <div>
                    <div className="ttime">{t.time}</div>
                    <div className="ttxt">{L(lang, t.en, t.zh)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dcard card">
            <h3>{I.check} {L(lang, "Care plan", "照顧計劃")}</h3>
            <div className="plan">
              {e.plan.map((p, i) => (
                <div key={i} className={"planitem " + (p.done ? "done" : "")}>
                  <span className="pcheck">{p.done && I.check}</span>
                  <span className="pt">{p.t}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="dcard card">
            <h3>{I.chat} {L(lang, "Family contact", "家屬聯絡")}</h3>
            <div className="contact">
              <div className="cinfo">
                <div className="cn">{L(lang, e.family.name, e.family.zh)}</div>
                <div className="cp">{e.family.phone}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="iconbtn">{I.phone}</button>
                <button className="iconbtn">{I.chat}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- tablet home-visit mode ---------- */
function VisitMode({ id, lang, onClose }) {
  const e = ELDERS.find(x => x.id === id);
  const [checked, setChecked] = React.useState({});
  const [note, setNote] = React.useState("");
  if (!e) return null;
  const toggle = k => setChecked(c => ({ ...c, [k]: !c[k] }));

  return (
    <div className="visitmode">
      <div className="vm-bar">
        <div className="vm-id">
          <Avatar name={e.zh} size={46} />
          <div>
            <div className="vm-nm">{L(lang, e.name, e.zh)} · {L(lang, "Home visit", "家訪")}</div>
            <div className="vm-sub">{L(lang, `Day ${e.day} · ${e.dx} · ${e.lives}`, `出院第 ${e.day} 天 · ${e.dxZh} · ${e.livesZh}`)}</div>
          </div>
        </div>
        <button className="btn ghost" onClick={onClose} style={{ background: "oklch(1 0 0 / 0.15)", color: "#fff", borderColor: "transparent" }}>{I.x}{L(lang, "End visit", "結束家訪")}</button>
      </div>

      <div className="vm-body">
        <div className="vm-card card">
          <h3>{L(lang, "Check today's activities", "勾選今日活動")}</h3>
          <div className="adlbtns">
            {ACTS.map(a => (
              <button key={a.key} className={"adlbtn " + (checked[a.key] ? "on" : "")} onClick={() => toggle(a.key)}>
                <span className="adli">{I[a.ic]}</span>
                {L(lang, a.en, a.zh)}
                <span className="adlcheck">{checked[a.key] && I.check}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="vm-card card">
            <h3>{L(lang, "Visit notes", "家訪記錄")}</h3>
            <textarea className="notearea" value={note} onChange={ev => setNote(ev.target.value)}
              placeholder={L(lang, "How is the home environment? Any new concerns? Medication count…", "居家環境如何？有何新顧慮？藥物點算…")}></textarea>
            <div className="imgslot" style={{ height: 90, marginTop: 12 }}>{L(lang, "+ photo of medication / home", "+ 藥物 / 居所相片")}</div>
          </div>
          <div className="vm-card card">
            <h3>{L(lang, "Quick flags", "快速標記")}</h3>
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
              {[[L(lang,"Falls hazard","跌倒危機"),"watch"],[L(lang,"Needs GP","需見醫生"),"risk"],[L(lang,"Low food stock","糧食不足"),"watch"],[L(lang,"Doing well","狀態良好"),"stable"]].map(([t,k]) => (
                <button key={t} className={"pill " + k} style={{ cursor: "pointer", padding: "9px 14px", fontSize: 14, border: "none" }}><span className="dot"></span>{t}</button>
              ))}
            </div>
            <button className="btn primary" style={{ width: "100%", marginTop: 18, padding: "14px" }}>{I.check}{L(lang, "Save visit & sync", "儲存並同步")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ElderDetail, VisitMode });
