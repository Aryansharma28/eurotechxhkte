/* CareBridge — Family app (adult child view, API-connected) */

const ACTS_FAM = [
  { key: "med",   en: "Medication", zh: "服藥",   ic: "pill"  },
  { key: "meal",  en: "Meals",      zh: "進食",   ic: "meal"  },
  { key: "walk",  en: "Mobility",   zh: "活動",   ic: "walk"  },
  { key: "water", en: "Hydration",  zh: "飲水",   ic: "water" },
  { key: "sleep", en: "Sleep",      zh: "睡眠",   ic: "sleep" },
  { key: "mood",  en: "Mood",       zh: "情緒",   ic: "mood"  },
]

// ── Login screen ──────────────────────────────────────────────────────────────
function FamilyLogin({ onLogin }) {
  const [email, setEmail] = React.useState("family-wong@carebridge.hk")
  const [pass, setPass]   = React.useState("hackathon123")
  const [loading, setLoading] = React.useState(false)
  const [err, setErr]     = React.useState(null)

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setErr(null)
    try {
      await API.signIn(email, pass)
      onLogin()
    } catch (ex) {
      setErr(ex.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "36px 24px", background: "#F2F2F7" }}>
      {/* logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }}>
        <img src="logo.svg" alt="CareBridge" style={{ height: 36, width: "auto", flexShrink: 0 }} />
        <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.03em" }}>CareBridge <span style={{ fontWeight: 500, color: "var(--ink-soft)", fontSize: 14, fontFamily: "var(--hk)" }}>康橋</span></span>
      </div>

      <h2 style={{ fontSize: 28, marginBottom: 6, letterSpacing: "-0.03em" }}>Family sign in</h2>
      <p style={{ color: "var(--ink-soft)", fontSize: 15, marginBottom: 32, lineHeight: 1.5 }}>View your parent's daily updates</p>

      {/* iOS grouped form fields */}
      <form onSubmit={submit}>
        <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ padding: "12px 16px", borderBottom: "0.5px solid rgba(60,60,67,0.18)" }}>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Email</div>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="family@carebridge.hk"
              style={{ width: "100%", padding: 0, fontSize: 16, background: "none", border: "none", outline: "none" }} />
          </div>
          <div style={{ padding: "12px 16px" }}>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Password</div>
            <input value={pass} onChange={e => setPass(e.target.value)} type="password" required placeholder="••••••••"
              style={{ width: "100%", padding: 0, fontSize: 16, background: "none", border: "none", outline: "none" }} />
          </div>
        </div>

        {err && <p style={{ color: "var(--risk)", fontSize: 13, marginBottom: 16, padding: "11px 14px", background: "var(--risk-bg)", borderRadius: 10 }}>{err}</p>}

        <button type="submit" className="btn primary" style={{ width: "100%", padding: 15, fontSize: 17, borderRadius: 13 }} disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div style={{ marginTop: 28, padding: "14px 16px", background: "rgba(116,116,128,0.08)", borderRadius: 12 }}>
        <p style={{ color: "var(--ink-faint)", fontSize: 11, fontFamily: "var(--mono)", lineHeight: 1.7, margin: 0 }}>
          <span style={{ display: "block", color: "var(--ink-soft)", fontWeight: 600, marginBottom: 4, fontSize: 12 }}>Demo · password: hackathon123</span>
          family-wong@carebridge.hk<br/>
          family-chan@carebridge.hk · family-lee@carebridge.hk
        </p>
      </div>
    </div>
  )
}

// ── Voice health insight card ─────────────────────────────────────────────────
function VoiceInsight({ elderId, firstName, lang }) {
  const bm = (typeof BIOMARKERS !== "undefined") && BIOMARKERS[elderId]
  if (!bm) return null
  const t = (en, zh) => lang === "zh" ? zh : en
  const level = bm.alertLevel
  const name = firstName || t("They", "長者")

  const msg = !level
    ? t(`${name}'s voice patterns are stable this week. No changes from the baseline.`,
        `${name}本週語音模式穩定，未發現與基準的偏差。`)
    : level === "watch"
    ? t(`We've noticed a slight change in ${name}'s speech patterns this week. The care team is monitoring closely.`,
        `本週${name}語音模式有輕微變化，護理團隊正密切跟進。`)
    : t(`The care team has flagged a notable change in ${name}'s voice. Karen is following up directly.`,
        `護理團隊已標記${name}語音模式的重要變化，家欣正直接跟進。`)

  const borderColor = !level ? "var(--stable)" : level === "watch" ? "var(--watch)" : "var(--risk)"
  const bgColor     = !level ? "var(--stable-bg)" : level === "watch" ? "var(--watch-bg)" : "var(--risk-bg)"

  return (
    <div className="fam-card" style={{ borderLeft: `3px solid ${borderColor}`, background: bgColor, marginTop: 0 }}>
      <div className="fct" style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: borderColor, display: "flex" }}>{!level ? I.check : I.alert}</span>
        {t("Voice health", "語音健康")}
      </div>
      <div style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6 }}>{msg}</div>
      <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 8, fontFamily: "var(--mono)" }}>
        {t("Illustrative sample — not from a live call yet", "示例數據 — 暫未來自實時通話")}
      </div>
    </div>
  )
}

// ── Main family app ───────────────────────────────────────────────────────────
function FamilyApp() {
  const [lang, setLang]       = React.useState("en")
  const [authed, setAuthed]   = React.useState(false)
  const [checking, setChecking] = React.useState(true)
  const [data, setData]       = React.useState(null)
  const [loading, setLoading] = React.useState(false)
  const [err, setErr]         = React.useState(null)
  const [showAllPlan, setShowAllPlan] = React.useState(false)

  const t = (en, zh) => (lang === "zh" ? zh : en)

  React.useEffect(() => {
    API.restoreSession().then(session => {
      if (session && session.role === 'family') { setAuthed(true); loadData() }
      else {
        if (session) API.signOut()
        setChecking(false)
      }
    })
  }, [])

  async function loadData() {
    setLoading(true); setErr(null)
    try {
      const d = await API.get("/api/family/elder")
      setData(d)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false); setChecking(false)
    }
  }

  function handleLogin() { setAuthed(true); loadData() }

  async function signOut() {
    await API.signOut(); setAuthed(false); setData(null)
  }

  if (checking) return (
    <div style={{ padding: "70px 16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
      {[100, 160, 130, 110].map((h, i) => (
        <div key={i} className="skeleton" style={{ height: h }} />
      ))}
    </div>
  )
  if (!authed) return <FamilyLogin onLogin={handleLogin} />

  const elder       = data?.elder || {}
  const acts        = data?.today_activities || []
  const call        = data?.today_call || null
  const openFlags   = data?.open_flags || []
  const recentCalls = data?.recent_calls || []
  const familyMember = data?.family_member || {}
  const rawPlan     = data?.care_plan || []
  const worker      = data?.worker || {}

  const carePlan = Object.values(rawPlan.reduce((acc, p) => {
    const key = (p.text_en || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').slice(0, 28).trim()
    if (!acc[key]) acc[key] = p
    return acc
  }, {}))
  const pendingPlan = carePlan.filter(p => !p.done)
  const visiblePlan = showAllPlan ? carePlan : pendingPlan.slice(0, 4)

  const childFirst   = familyMember.name_en?.split(" ")[0] || "Hi"
  const childFirstZh = familyMember.name_zh?.slice(1) || ""

  const callTime = call?.completed_at
    ? new Date(call.completed_at).toLocaleTimeString("en-HK", { hour: "2-digit", minute: "2-digit" })
    : null

  const allDone = acts.length > 0 && acts.every(a => a.status === "done")
  const statusText = t(
    openFlags.length ? "One thing to know 💛" : allDone ? "She's okay today 💚" : "Checking in today…",
    openFlags.length ? "有一件事 💛" : allDone ? "今日狀態不錯 💚" : "今日跟進中…"
  )

  const today = new Date()
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (6 - i))
    return d.toISOString().split("T")[0]
  })
  function callStateFor(dateStr) {
    const c = recentCalls.find(c => c.scheduled_at?.startsWith(dateStr))
    return c?.state === "done"
  }

  if (loading) return (
    <div style={{ padding: "70px 16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
      {[100, 160, 130, 110].map((h, i) => (
        <div key={i} className="skeleton" style={{ height: h }} />
      ))}
    </div>
  )
  if (err) return <div style={{ padding: "70px 16px", color: "var(--risk)", fontSize: 14 }}>{err}</div>

  return (
    <div className="fam">
      <div className="fam-scroll">

        {/* ── iOS Nav Bar (sticky, blurred) ── */}
        <div className="fam-nav">
          <div className="fam-head">
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <img src="logo.svg" alt="CareBridge" style={{ height: 24, width: "auto", flexShrink: 0 }} />
              <div className="fam-hi">
                {t("Good morning, ", "早晨，")}
                <b>{t(childFirst, childFirstZh)}</b>
              </div>
            </div>
            <div className="fam-top-right">
              <div className="fam-lang">
                <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
                <button className={lang === "zh" ? "on" : ""} onClick={() => setLang("zh")}>中</button>
              </div>
              <button onClick={signOut} className="fam-signout">{t("Sign out", "登出")}</button>
            </div>
          </div>
        </div>

        {/* ── Hero card ── */}
        <div className="fam-hero" style={{ marginTop: 16 }}>
          <div className="fav">
            <span className="ava">{elder.name_zh?.[0] || "?"}</span>
            <div>
              <div className="fnm">{t(elder.name_en, elder.name_zh)}</div>
              <div className="fsub">{t(`Day ${elder.day_since_discharge || "?"} home · ${elder.dx_en || ""}`, `在家第 ${elder.day_since_discharge || "?"}天 · ${elder.dx_zh || ""}`)}</div>
            </div>
          </div>
          <div className="fstatus">{statusText}</div>
          {/* activity completion pill */}
          {(() => {
            const doneN = acts.filter(a => a.status === "done").length
            const total = ACTS_FAM.length
            const pct = total > 0 ? Math.round((doneN / total) * 100) : 0
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, marginBottom: 4 }}>
                <div style={{ flex: 1, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.22)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "#fff", borderRadius: 4, transition: "width .5s ease" }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.90)", whiteSpace: "nowrap" }}>
                  {doneN}/{total} {t("done", "完成")}
                </span>
              </div>
            )
          })()}
          {callTime && <span className="fwhen">{I.phone}{t(`Check-in call done · ${callTime}`, `已完成今早通話 · ${callTime}`)}</span>}
          {!callTime && call?.state === "missed" && <span className="fwhen missed">{I.phoneMissed}{t("Missed today's call", "今日電話未接")}</span>}
        </div>

        {/* ── Flag note ── */}
        {openFlags.length > 0 && (
          <div className="fam-note">
            <div className="ni">{I.alert}</div>
            <div>
              <div className="nt">{t("One thing to know", "一件事")}</div>
              <div className="nb">{t(openFlags[0].label_en, openFlags[0].label_zh)}</div>
            </div>
          </div>
        )}

        {/* ── Call summary ── */}
        {call?.summary_en && (
          <React.Fragment>
            <div className="fam-sec-gap" />
            <div className="fam-sec-label">{t("From today's call", "今早通話摘要")}</div>
            <div className="fam-card">
              <div className="fsummary">"{t(call.summary_en, call.summary_zh)}"</div>
            </div>
          </React.Fragment>
        )}

        {/* ── Voice insight ── */}
        <VoiceInsight elderId={elder.id} firstName={elder.name_en?.split(" ")[0]} lang={lang} />

        {/* ── Activities (iOS list rows) ── */}
        <div className="fam-sec-gap" />
        <div className="fam-sec-label">{t("Today's activities", "今日活動")}</div>
        <div className="fam-group">
          {ACTS_FAM.map((a, i) => {
            const rec = acts.find(r => r.activity_key === a.key)
            const state = rec ? (rec.status === "done" ? "done" : "missed") : "pending"
            const last = i === ACTS_FAM.length - 1
            const note = rec?.notes_en || rec?.notes || null
            return (
              <div key={a.key} className={"fam-row" + (last ? " fam-row-last" : "")}>
                <div className={"fam-act-icon " + state}>
                  {I[a.ic]}
                  {state === "done" && <span className="fam-act-check">{I.check}</span>}
                </div>
                <div className="fam-row-body">
                  <div className="fam-row-title">{t(a.en, a.zh)}</div>
                  {note && <div className="fam-row-sub">{note}</div>}
                </div>
                <div className={"fam-row-value " + state}>
                  {state === "done" ? t("Done", "完成") : state === "missed" ? t("Missed", "未完成") : "—"}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Care plan to-do ── */}
        {carePlan.length > 0 && (
          <React.Fragment>
            <div className="fam-sec-gap" />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px 6px" }}>
              <div className="fam-sec-label" style={{ padding: 0 }}>
                {t(`${elder.name_en?.split(" ")[0] || "Parent"}'s to-do`, `${elder.name_zh || "長者"}的待辦`)}
              </div>
              {(pendingPlan.length > 4 || carePlan.some(p => p.done)) && (
                <button onClick={() => setShowAllPlan(v => !v)} className="fam-signout" style={{ color: "var(--calm)" }}>
                  {showAllPlan ? t("Less", "收起") : t(`All ${carePlan.length}`, `全部 ${carePlan.length}`)}
                </button>
              )}
            </div>
            <div className="fam-group">
              {visiblePlan.map((p, i) => (
                <div key={i} className={"fam-todo" + (p.done ? " done" : "") + (i === visiblePlan.length - 1 ? " fam-todo-last" : "")}>
                  <span className="ftcheck">{p.done ? I.check : null}</span>
                  <span className="ftt">{t(p.text_en, p.text_zh)}</span>
                </div>
              ))}
              {pendingPlan.length === 0 && (
                <div className="fam-empty">{t("All care plan items complete ✓", "所有照顧計劃已完成 ✓")}</div>
              )}
            </div>
          </React.Fragment>
        )}

        {/* ── Week check-ins ── */}
        <div className="fam-sec-gap" />
        <div className="fam-sec-label">{t("Check-ins this week", "本週通話")}</div>
        <div className="fam-group" style={{ padding: "12px 8px 8px" }}>
          <div className="fam-week">
            {weekDates.map((d, i) => {
              const done = callStateFor(d)
              const dayNum = new Date(d + "T12:00:00").getDate()
              const isToday = i === 6
              return (
                <div key={d} className={"fam-day " + (isToday ? "today" : "")}>
                  <span className="fd">{t(["M","T","W","T","F","S","S"][i], ["一","二","三","四","五","六","日"][i])}</span>
                  <span className={"fdot " + (done ? "done" : "")}>
                    {done ? I.check : <span style={{ fontSize: 11, fontWeight: 600, color: isToday ? "var(--green)" : "var(--ink-faint)", lineHeight: 1 }}>{dayNum}</span>}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="fam-sec-gap" />

      </div>

      {/* ── iOS Toolbar (bottom, blurred) ── */}
      <div className="fam-actions">
        <a href={elder.phone ? `tel:${elder.phone}` : undefined} className="fam-btn call">
          {I.phone}{t(`Call ${elder.name_en?.split(" ")[0] || ""}`, `電話${elder.name_zh || ""}`)}
        </a>
        <a href={worker.phone ? `tel:${worker.phone}` : undefined} className="fam-btn msg">
          {I.phone}{t(`Call ${worker.name_en?.split(" ")[0] || "Nurse"}`, `聯絡${worker.name_zh || "護士"}`)}
        </a>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <div className="fam-stage">
    <IOSDevice width={390} height={800}>
      <FamilyApp />
    </IOSDevice>
    <div className="fam-cap">CareBridge · <b>Family app</b> — the adult child's view of their parent</div>
  </div>
)
