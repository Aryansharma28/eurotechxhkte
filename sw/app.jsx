/* CareBridge — social worker dashboard root */

// ── Login screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail]   = React.useState('karen@carebridge.hk')
  const [pass, setPass]     = React.useState('hackathon123')
  const [loading, setLoading] = React.useState(false)
  const [err, setErr]       = React.useState(null)

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setErr(null)
    try {
      const result = await API.signIn(email, pass)
      onLogin(result)
    } catch (ex) {
      setErr(ex.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
      <form onSubmit={submit} className="card" style={{ width: 380, padding: 40 }}>
        <div className="brand" style={{ marginBottom: 28, justifyContent: 'center' }}>
          <span className="mark"></span> CareBridge <span className="zh">康橋</span>
        </div>
        <h2 style={{ fontSize: 20, marginBottom: 6 }}>Staff sign in</h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 24 }}>Social worker · Community nurse</p>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--line)',
                   fontFamily: 'var(--sans)', fontSize: 15, marginBottom: 16, boxSizing: 'border-box', background: 'var(--surface)' }} />

        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Password</label>
        <input value={pass} onChange={e => setPass(e.target.value)} type="password" required
          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--line)',
                   fontFamily: 'var(--sans)', fontSize: 15, marginBottom: 24, boxSizing: 'border-box', background: 'var(--surface)' }} />

        {err && <p style={{ color: 'var(--risk)', fontSize: 13, marginBottom: 16 }}>{err}</p>}

        <button type="submit" className="btn primary" style={{ width: '100%', padding: '13px' }} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in →'}
        </button>

        <p style={{ color: 'var(--ink-faint)', fontSize: 12, marginTop: 20, textAlign: 'center', fontFamily: 'var(--mono)' }}>
          Demo: karen@carebridge.hk / hackathon123
        </p>
      </form>
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[1,2,3].map(i => (
        <div key={i} className="card" style={{ height: 100, background: 'var(--bg-sink)',
          animation: 'pulse 1.4s ease-in-out infinite', opacity: 0.6 }}></div>
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:.6}50%{opacity:.3}}`}</style>
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────
function Dashboard() {
  const [lang, setLang] = React.useState('en')
  const [nav, setNav]   = React.useState('today')
  const [openId, setOpenId]   = React.useState(null)
  const [visitId, setVisitId] = React.useState(null)

  // auth + data state
  const [authed, setAuthed]     = React.useState(false)
  const [checking, setChecking] = React.useState(true)   // initial session restore
  const [loading, setLoading]   = React.useState(false)
  const [elders, setElders]     = React.useState([])
  const [visits, setVisits]     = React.useState([])
  const [alerts, setAlerts]     = React.useState([])

  // restore session on mount
  React.useEffect(() => {
    API.restoreSession().then(session => {
      if (session) { setAuthed(true); loadData() }
      else setChecking(false)
    })
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [elderData, visitData, flagData] = await Promise.all([
        API.get('/api/elders'),
        API.get('/api/visits'),
        API.get('/api/flags'),
      ])
      setElders(elderData)
      setVisits(visitData)
      setAlerts(flagData)
    } catch (e) {
      console.error('loadData:', e)
    } finally {
      setLoading(false)
      setChecking(false)
    }
  }

  function handleLogin() {
    setAuthed(true)
    loadData()
  }

  async function handleSignOut() {
    await API.signOut()
    setAuthed(false)
    setElders([]); setVisits([]); setAlerts([])
  }

  if (checking) return <LoadingSkeleton />
  if (!authed)  return <LoginScreen onLogin={handleLogin} />

  const navItems = [
    { k: 'today',    en: 'Today',    zh: '今日',  ic: I.home },
    { k: 'caseload', en: 'Caseload', zh: '個案',  ic: I.people },
    { k: 'visits',   en: 'Visits',   zh: '家訪',  ic: I.visit },
    { k: 'alerts',   en: 'Alerts',   zh: '提示',  ic: I.bell,  badge: alerts.filter(a => a.severity === 'risk').length || null },
    { k: 'messages', en: 'Messages', zh: '訊息',  ic: I.chat },
  ]

  const today = new Date()
  const dateStr = L(lang,
    today.toLocaleDateString('en-HK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    today.toLocaleDateString('zh-HK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))

  const titles = {
    today:    [L(lang, 'Good morning, Karen 早晨', '早晨，家欣'), ''],
    caseload: [L(lang, 'My caseload', '我的個案'), ''],
    visits:   [L(lang, 'Visits', '家訪安排'), ''],
    alerts:   [L(lang, 'Alerts', '提示'), ''],
    messages: [L(lang, 'Messages', '訊息'), ''],
  }

  return (
    <div className="app">
      {/* sidebar */}
      <aside className="side">
        <div className="brand"><span className="mark"></span> CareBridge <span className="zh">康橋</span></div>
        <div className="navg">
          {navItems.map(n => (
            <button key={n.k} className={'navi ' + (nav === n.k ? 'on' : '')} onClick={() => setNav(n.k)}>
              {n.ic} {L(lang, n.en, n.zh)}
              {n.badge ? <span className="badge">{n.badge}</span> : null}
            </button>
          ))}
        </div>
        <div className="spacer"></div>
        <button onClick={handleSignOut} className="btn ghost"
          style={{ margin: '0 12px 8px', fontSize: 13, padding: '8px 14px' }}>
          Sign out
        </button>
        <div className="workercard">
          <Avatar name="曾" size={40} />
          <div>
            <div className="wn">{L(lang, 'Karen Tsang', '曾家欣')}</div>
            <div className="wr">{L(lang, 'Community geriatric nurse', '社區老人科護士')}</div>
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
            <div className="searchbox">{I.search}<input placeholder={L(lang, 'Search elders…', '搜尋長者…')} /></div>
            <div className="langtog">
              <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
              <button className={lang === 'zh' ? 'on' : ''} onClick={() => setLang('zh')}>中</button>
            </div>
          </div>
        </div>

        {loading && <LoadingSkeleton />}
        {!loading && nav === 'today'    && <TodayView    elders={elders} visits={visits} alerts={alerts} lang={lang} onOpen={setOpenId} onVisit={setVisitId} />}
        {!loading && nav === 'caseload' && <CaseloadView elders={elders} lang={lang} onOpen={setOpenId} />}
        {!loading && nav === 'visits'   && <VisitsView   visits={visits} elders={elders} lang={lang} onOpen={setOpenId} onVisit={setVisitId} />}
        {!loading && nav === 'alerts'   && <AlertsView   alerts={alerts} lang={lang} onOpen={setOpenId} onReload={loadData} />}
        {!loading && nav === 'messages' && <SimpleNote lang={lang} title={L(lang,'Messages with families','與家屬的訊息')} body={L(lang,'A lightweight thread with each elder\'s family lives here in the full build.','完整版本將在此顯示與各家屬的對話。')} />}
      </div>

      {openId  && <ElderDetail id={openId}  lang={lang} onClose={() => setOpenId(null)}  onVisit={(id) => { setOpenId(null); setVisitId(id) }} onReload={loadData} />}
      {visitId && <VisitMode   id={visitId} lang={lang} onClose={() => { setVisitId(null); loadData() }} elders={elders} />}
    </div>
  )
}

// ── Caseload view ─────────────────────────────────────────────────────────────
function CaseloadView({ elders, lang, onOpen }) {
  return (
    <div className="content">
      <div className="caseload" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
        {elders.map(e => <ElderCard key={e.id} e={e} lang={lang} onOpen={onOpen} />)}
      </div>
    </div>
  )
}

// ── Visits view ───────────────────────────────────────────────────────────────
function VisitsView({ visits, elders, lang, onOpen, onVisit }) {
  return (
    <div className="content" style={{ maxWidth: 760 }}>
      <div className="card vpanel" style={{ padding: 8 }}>
        {visits.map(v => {
          const e = v.elder || elders.find(x => x.id === v.elder_id) || {}
          const time = v.scheduled_at ? new Date(v.scheduled_at).toLocaleTimeString('en-HK', { hour: '2-digit', minute: '2-digit' }) : '—'
          return (
            <div key={v.id} className={'visit ' + v.state} onClick={() => onVisit(v.elder_id)}>
              <span className="vtime">{time}</span>
              <span className="vbar"></span>
              <div style={{ flex: 1 }}>
                <div className="vname">{L(lang, e.name_en || v.elder_id, e.name_zh || v.elder_id)}</div>
                <div className="vtype">{L(lang, v.type_en, v.type_zh)} · {v.location}</div>
              </div>
              {v.state === 'due' && <Pill kind="risk" dot={false}>{L(lang,'Due now','即將')}</Pill>}
              <button className="btn primary" onClick={ev => { ev.stopPropagation(); onVisit(v.elder_id) }}
                style={{ padding: '8px 14px', fontSize: 14 }}>{L(lang,'Start','開始')}</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Alerts view ───────────────────────────────────────────────────────────────
function AlertsView({ alerts, lang, onOpen, onReload }) {
  async function resolve(e, flagId) {
    e.stopPropagation()
    await API.patch(`/api/flags/${flagId}/resolve`, {})
    onReload()
  }
  if (!alerts.length) return <SimpleNote lang={lang} title={L(lang,'All caught up','提示已全部處理')} body={L(lang,'No open flags.','沒有待處理提示。')} />
  return (
    <div className="content">
      <div className="alerts">
        {alerts.map(a => (
          <div key={a.id} className={'alert card ' + a.severity} onClick={() => onOpen(a.elder_id)}>
            <div className="aic">{a.severity === 'risk' ? I.alert : I.bell}</div>
            <div className="atxt">
              <div className="atop">
                <span className="anm">{L(lang, a.elder?.name_en, a.elder?.name_zh)}</span>
                <Pill kind={a.severity} dot={false}>{a.severity === 'risk' ? L(lang,'Urgent','緊急') : L(lang,'Watch','留意')}</Pill>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink-faint)', fontFamily: 'var(--mono)' }}>
                  {new Date(a.raised_at).toLocaleTimeString('en-HK', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="amsg">{a.label_en}</div>
            </div>
            <button className="btn ghost" style={{ fontSize: 12, padding: '6px 12px', flexShrink: 0 }}
              onClick={ev => resolve(ev, a.id)}>{L(lang,'Resolve','解決')}</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function SimpleNote({ title, body }) {
  return (
    <div className="content">
      <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 560, margin: '20px auto' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--green-tint)', color: 'var(--green-ink)', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>{I.check}</div>
        <h2 style={{ fontSize: 20 }}>{title}</h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: 15, lineHeight: 1.55, marginTop: 10 }}>{body}</p>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<Dashboard />)
