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
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "36px 24px", background: "var(--bg)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: "var(--green)", display: "grid", placeItems: "center", flexShrink: 0, boxShadow: "0 2px 8px oklch(0.5 0.09 158 / .28)" }}>
          <span style={{ width: 14, height: 14, border: "2.4px solid #fff", borderRadius: "50% 50% 50% 2px", transform: "rotate(45deg)", display: "block" }}></span>
        </span>
        <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em" }}>CareBridge <span style={{ fontWeight: 600, color: "var(--ink-soft)", fontSize: 13.5, fontFamily: "var(--hk)" }}>康橋</span></span>
      </div>

      <h2 style={{ fontSize: 22, marginBottom: 5, letterSpacing: "-0.02em" }}>Family sign in</h2>
      <p style={{ color: "var(--ink-soft)", fontSize: 14, marginBottom: 28 }}>View your parent's daily updates</p>

      <form onSubmit={submit}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 6, letterSpacing: "0.01em" }}>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="family@carebridge.hk"
            style={{ width: "100%", padding: "12px 14px", fontSize: 14.5, boxSizing: "border-box" }} />
        </div>

        <div style={{ marginBottom: 22 }}>
          <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 6, letterSpacing: "0.01em" }}>Password</label>
          <input value={pass} onChange={e => setPass(e.target.value)} type="password" required placeholder="••••••••"
            style={{ width: "100%", padding: "12px 14px", fontSize: 14.5, boxSizing: "border-box" }} />
        </div>

        {err && <p style={{ color: "var(--risk)", fontSize: 13, marginBottom: 14, padding: "10px 12px", background: "var(--risk-bg)", borderRadius: 10 }}>{err}</p>}
        <button type="submit" className="btn primary" style={{ width: "100%", padding: 14, fontSize: 15, borderRadius: 14 }} disabled={loading}>
          {loading ? "Signing in…" : "Sign in →"}
        </button>
      </form>

      <div style={{ marginTop: 24, padding: "16px", background: "var(--bg-sink)", borderRadius: 14, border: "1px solid var(--line-soft)" }}>
        <p style={{ color: "var(--ink-faint)", fontSize: 11, fontFamily: "var(--mono)", lineHeight: 1.7, margin: 0 }}>
          <span style={{ display: "block", color: "var(--ink-soft)", fontWeight: 600, marginBottom: 4, fontSize: 11.5 }}>Demo · password: hackathon123</span>
          family-wong@carebridge.hk<br/>
          family-chan@carebridge.hk · family-lee@carebridge.hk
        </p>
      </div>
    </div>
  )
}

// ── Voice health insight card (plain English, no graphs) ─────────────────────
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

  const borderColor = !level ? "var(--stable)"     : level === "watch" ? "var(--watch)"    : "var(--risk)"
  const bgColor     = !level ? "var(--green-tint)"  : level === "watch" ? "var(--watch-bg)" : "var(--risk-bg)"
  const iconColor   = !level ? "var(--stable)"     : level === "watch" ? "var(--watch)"    : "var(--risk)"

  return (
    <div className="fam-card" style={{ borderLeft: `3px solid ${borderColor}`, background: bgColor }}>
      <div className="fct" style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: iconColor, display: "flex" }}>{!level ? I.check : I.alert}</span>
        {t("Voice health snapshot", "語音健康快照")}
      </div>
      <div style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, marginTop: 6 }}>{msg}</div>
      <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 8, fontFamily: "var(--mono)" }}>
        {t("AI · analysed from daily call · 14-day baseline", "AI · 基於每日通話 · 14天基準")}
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
      // Only auto-auth if the restored session belongs to a family member
      if (session && session.role === 'family') { setAuthed(true); loadData() }
      else {
        if (session) API.signOut() // clear stale worker/other session
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
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 14 }}>
      {[80, 160, 120, 100].map((h, i) => (
        <div key={i} className="skeleton" style={{ height: h, borderRadius: 20 }} />
      ))}
    </div>
  )
  if (!authed)  return <FamilyLogin onLogin={handleLogin} />

  const elder     = data?.elder || {}
  const acts      = data?.today_activities || []
  const call      = data?.today_call || null
  const openFlags = data?.open_flags || []
  const recentCalls = data?.recent_calls || []
  const familyMember = data?.family_member || {}
  const rawPlan   = data?.care_plan || []
  const worker    = data?.worker || {}

  // dedup by normalised text (same seed-safe logic as SW detail)
  const carePlan = Object.values(rawPlan.reduce((acc, p) => {
    const key = (p.text_en || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').slice(0, 28).trim()
    if (!acc[key]) acc[key] = p
    return acc
  }, {}))
  const pendingPlan = carePlan.filter(p => !p.done)
  const visiblePlan = showAllPlan ? carePlan : pendingPlan.slice(0, 4)

  // derive first name from family member name
  const childFirst = familyMember.name_en?.split(" ")[0] || "Hi"
  const childFirstZh = familyMember.name_zh?.slice(1) || ""

  // call done time
  const callTime = call?.completed_at
    ? new Date(call.completed_at).toLocaleTimeString("en-HK", { hour: "2-digit", minute: "2-digit" })
    : null

  // status hero text
  const allDone = acts.length > 0 && acts.every(a => a.status === "done")
  const statusText = t(
    openFlags.length ? "One thing to know 💛" : allDone ? "She's okay today 💚" : "Checking in today…",
    openFlags.length ? "有一件事 💛" : allDone ? "今日狀態不錯 💚" : "今日跟進中…"
  )

  // week grid from recent_calls (last 7)
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
    <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
      {[80, 160, 120, 100].map((h, i) => (
        <div key={i} className="skeleton" style={{ height: h, borderRadius: 20 }} />
      ))}
    </div>
  )
  if (err) return <div style={{ padding: 28, color: "var(--risk)", fontSize: 14 }}>{err}</div>

  return (
    <div className="fam">
      <div className="fam-scroll">
        <div className="fam-head">
          <div className="fam-hi">{t("Good morning, ", "早晨，")}<b>{t(childFirst, childFirstZh)}</b></div>
          <div className="fam-top-right">
            <div className="fam-lang">
              <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
              <button className={lang === "zh" ? "on" : ""} onClick={() => setLang("zh")}>中</button>
            </div>
            <button onClick={signOut} className="fam-signout">Sign out</button>
          </div>
        </div>

        {/* hero */}
        <div className="fam-hero">
          <div className="fav">
            <span className="ava">{elder.name_zh?.[0] || "?"}</span>
            <div>
              <div className="fnm">{t(elder.name_en, elder.name_zh)}</div>
              <div className="fsub">{t(`Day ${elder.day_since_discharge || "?"} home · ${elder.dx_en || ""}`, `在家第 ${elder.day_since_discharge || "?"}天 · ${elder.dx_zh || ""}`)}</div>
            </div>
          </div>
          <div className="fstatus">{statusText}</div>
          {callTime && <span className="fwhen">{I.phone}{t(`Check-in call done · ${callTime}`, `已完成今早通話 · ${callTime}`)}</span>}
          {!callTime && call?.state === "missed" && <span className="fwhen" style={{ color: "var(--risk)" }}>{I.phoneMissed}{t("Missed today's call", "今日電話未接")}</span>}
        </div>

        {/* gentle note if flags */}
        {openFlags.length > 0 && (
          <div className="fam-note">
            <div className="ni">{I.alert}</div>
            <div>
              <div className="nt">{t("One thing to know", "一件事")}</div>
              <div className="nb">{t(openFlags[0].label_en, openFlags[0].label_zh)}</div>
            </div>
          </div>
        )}

        {/* call summary */}
        {call?.summary_en && (
          <div className="fam-card">
            <div className="fct">{t("From today's call", "今早通話摘要")}</div>
            <div className="fsummary">"{t(call.summary_en, call.summary_zh)}"</div>
          </div>
        )}

        <VoiceInsight elderId={elder.id} firstName={elder.name_en?.split(" ")[0]} lang={lang} />

        {/* activities */}
        <div className="fam-card">
          <div className="fct">{t("Today's activities", "今日活動")}</div>
          <div className="fam-acts">
            {ACTS_FAM.map(a => {
              const rec = acts.find(r => r.activity_key === a.key)
              const state = rec ? (rec.status === "done" ? "done" : "missed") : "soft"
              return (
                <div key={a.key} className={"fam-act " + state}>
                  <span className="fai">
                    {I[a.ic]}
                    {state === "done" && <span className="fcheck">{I.check}</span>}
                  </span>
                  <span className="fal">{t(a.en, a.zh)}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* elder to-do */}
        {carePlan.length > 0 && (
          <div className="fam-card">
            <div className="fcard-head">
              <div className="fct">{t(`${elder.name_en?.split(" ")[0] || "Parent"}'s to-do`, `${elder.name_zh || "長者"}的待辦`)}</div>
              {(pendingPlan.length > 4 || carePlan.some(p => p.done)) && (
                <button onClick={() => setShowAllPlan(v => !v)} className="fcard-action">
                  {showAllPlan ? t("Show less", "收起") : t(`See all ${carePlan.length}`, `查看全部 ${carePlan.length}`)}
                </button>
              )}
            </div>
            <div className="fam-todos">
              {visiblePlan.map((p, i) => (
                <div key={i} className={"fam-todo " + (p.done ? "done" : "")}>
                  <span className="ftcheck">{p.done ? I.check : null}</span>
                  <span className="ftt">{t(p.text_en, p.text_zh)}</span>
                </div>
              ))}
              {pendingPlan.length === 0 && (
                <div className="fam-empty">
                  {t("All care plan items complete ✓", "所有照顧計劃已完成 ✓")}
                </div>
              )}
            </div>
          </div>
        )}

        {/* week check-ins */}
        <div className="fam-card">
          <div className="fct">{t("Check-ins this week", "本週通話")}</div>
          <div className="fam-week">
            {weekDates.map((d, i) => {
              const done = callStateFor(d)
              return (
                <div key={d} className={"fam-day " + (i === 6 ? "today" : "")}>
                  <span className="fd">{t(["M","T","W","T","F","S","S"][i], ["一","二","三","四","五","六","日"][i])}</span>
                  <span className={"fdot " + (done ? "done" : "")}>{done ? I.check : ""}</span>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* sticky actions */}
      <div className="fam-actions">
        <a href={elder.phone ? `tel:${elder.phone}` : undefined} className="fam-btn call">{I.phone}{t(`Call ${elder.name_en?.split(" ")[0] || ""}`, `打電話畀${elder.name_zh || ""}`)}</a>
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
