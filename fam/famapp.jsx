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
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "32px 24px", background: "var(--bg)" }}>
      <div className="brand" style={{ marginBottom: 32, gap: 10 }}>
        <span className="mark"></span> CareBridge <span className="zh">康橋</span>
      </div>
      <h2 style={{ fontSize: 22, marginBottom: 6 }}>Family sign in</h2>
      <p style={{ color: "var(--ink-soft)", fontSize: 14, marginBottom: 28 }}>View your parent's daily updates</p>

      <form onSubmit={submit}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
          style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--line)",
                   fontFamily: "var(--sans)", fontSize: 15, marginBottom: 16, boxSizing: "border-box", background: "var(--surface)" }} />

        <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Password</label>
        <input value={pass} onChange={e => setPass(e.target.value)} type="password" required
          style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--line)",
                   fontFamily: "var(--sans)", fontSize: 15, marginBottom: 24, boxSizing: "border-box", background: "var(--surface)" }} />

        {err && <p style={{ color: "var(--risk)", fontSize: 13, marginBottom: 14 }}>{err}</p>}
        <button type="submit" className="btn primary" style={{ width: "100%", padding: 14 }} disabled={loading}>
          {loading ? "Signing in…" : "Sign in →"}
        </button>
      </form>
      <p style={{ color: "var(--ink-faint)", fontSize: 11, marginTop: 20, fontFamily: "var(--mono)", lineHeight: 1.6 }}>
        Demo logins (password: hackathon123):<br/>
        family-wong@carebridge.hk · family-chan@carebridge.hk<br/>
        family-lee@carebridge.hk · family-cheung@carebridge.hk · family-ho@carebridge.hk
      </p>
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

  const t = (en, zh) => (lang === "zh" ? zh : en)

  React.useEffect(() => {
    API.restoreSession().then(session => {
      if (session) { setAuthed(true); loadData() }
      else setChecking(false)
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

  if (checking) return <div style={{ padding: 40, color: "var(--ink-faint)" }}>Loading…</div>
  if (!authed)  return <FamilyLogin onLogin={handleLogin} />

  const elder     = data?.elder || {}
  const acts      = data?.today_activities || []
  const call      = data?.today_call || null
  const openFlags = data?.open_flags || []
  const recentCalls = data?.recent_calls || []
  const familyMember = data?.family_member || {}

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

  if (loading) return <div style={{ padding: 40, color: "var(--ink-faint)" }}>Loading…</div>
  if (err)     return <div style={{ padding: 40, color: "var(--risk)" }}>{err}</div>

  return (
    <div className="fam">
      <div className="fam-scroll">
        <div className="fam-head">
          <div className="fam-hi">{t("Good morning, ", "早晨，")}<b>{t(childFirst, childFirstZh)}</b></div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div className="fam-lang">
              <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
              <button className={lang === "zh" ? "on" : ""} onClick={() => setLang("zh")}>中</button>
            </div>
            <button onClick={signOut} style={{ fontSize: 12, color: "var(--ink-faint)", background: "none", border: "none", cursor: "pointer" }}>Sign out</button>
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

        {/* how to help */}
        <div className="fam-help">
          <div className="fht">{t("How you can help today", "今日你可以點幫手")}</div>
          <div className="fhb">{t("Check in with a quick call. Remind them to drink plenty of water and take any medications.",
            "打個電話問候一下，提醒多飲水、按時服藥。")}</div>
        </div>
      </div>

      {/* sticky actions */}
      <div className="fam-actions">
        <button className="fam-btn call">{I.phone}{t(`Call ${elder.name_en?.split(" ")[0] || ""}`, `打電話畀${elder.name_zh || ""}`)}</button>
        <button className="fam-btn msg">{I.chat}{t("Message nurse", "聯絡社工")}</button>
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
