/* CareBridge — Today view (props-based, data from API) */

// ── Map API elder rows to the shape the UI expects ───────────────────────────
function elderViewModel(e) {
  const todayActs = e.today_activities || []
  const call      = e.latest_call || null
  const openFlags = e.open_flags || []

  // build 7-day week grid from activity_records
  // today_activities only has today — for the week calendar we use detail fetch
  // For the card ActRow we only need today's 6 activities
  const todayGrid = ACTS.map(a => {
    const rec = todayActs.find(r => r.activity_key === a.key)
    return rec ? (rec.status === 'done' ? 1 : 0) : -1
  })

  // week array: 6 rows × 7 cols — populate today (col 6) from todayGrid, rest unknown
  const week = ACTS.map((_, ri) => [0,0,0,0,0,0, todayGrid[ri]])

  const topFlag = openFlags[0]

  return {
    id:       e.id,
    name:     e.name_en,
    zh:       e.name_zh,
    age:      e.age,
    sex:      e.sex,
    dx:       e.dx_en,
    dxZh:     e.dx_zh,
    day:      e.day_since_discharge ?? 0,
    risk:     e.risk_tier,
    lives:    e.lives_en,
    livesZh:  e.lives_zh,
    riskNote: e.risk_note_en,
    riskNoteZh: e.risk_note_zh,
    call: {
      state: call ? call.state : 'scheduled',
      time:  call?.completed_at ? new Date(call.completed_at).toLocaleTimeString('en-HK', { hour: '2-digit', minute: '2-digit' }) : '—',
      flag:  topFlag?.label_en  ?? (call?.summary_en ?? '—'),
      flagZh: topFlag?.label_zh ?? (call?.summary_zh ?? '—'),
    },
    week,
    // placeholders — detail drawer fetches fresh
    vitals:   [],
    plan:     [],
    timeline: [],
    family:   {},
  }
}

function ActRow({ week, lang }) {
  return (
    <div className="actrow">
      {ACTS.map((a, i) => {
        const today = week[i][6]
        const state = today === 1 ? 'done' : today === 0 ? 'missed' : 'pending'
        return <ActGlyph key={a.key} icon={I[a.ic]} state={state} label={L(lang, a.en, a.zh)} />
      })}
    </div>
  )
}

function ElderCard({ e, lang, onOpen }) {
  const vm     = elderViewModel(e)
  const r      = RISK[vm.risk] || RISK.stable
  const neuBm  = (typeof BIOMARKERS !== 'undefined') ? BIOMARKERS[e.id] : null
  const neuLvl = neuBm?.alertLevel   // 'risk' | 'watch' | undefined

  return (
    <div className="ecard card" onClick={() => onOpen(e.id)}>
      <div className="ehead">
        <Avatar name={vm.zh} size={46} />
        <div style={{ flex: 1 }}>
          <div className="enm">{L(lang, vm.name, vm.zh)}</div>
          <div className="ezh">{L(lang, vm.zh, vm.name)} · {vm.age}{L(lang, '', '歲')}</div>
          <div className="emeta">{L(lang, `Day ${vm.day} · ${vm.dx}`, `出院第 ${vm.day} 天 · ${vm.dxZh}`)}</div>
        </div>
      </div>

      <div className="erow">
        <Pill kind={r.cls}>{L(lang, r.en, r.zh)}</Pill>
        <span className={'callstat ' + (vm.call.state === 'done' ? 'done' : 'missed')}>
          {vm.call.state === 'done' ? I.phone : I.phoneMissed}
          {vm.call.state === 'done' ? L(lang, `Call ${vm.call.time}`, `已致電 ${vm.call.time}`) : L(lang, 'Missed call', '未接電話')}
        </span>
      </div>

      <ActRow week={vm.week} lang={lang} />

      <div className="flagline">
        <span className="fdot" style={{ background: `var(--${r.cls === 'stable' ? 'stable' : r.cls === 'watch' ? 'watch' : 'risk'})` }}></span>
        <span>{L(lang, vm.call.flag, vm.call.flagZh)}</span>
      </div>

      {/* compact voice biomarker row — only when alert */}
      {neuLvl && (
        <div className={'eneuro eneuro-' + neuLvl}>
          <span className="eneuro-ic">{I.wave}</span>
          <span className="eneuro-msg">
            {L(lang, 'Voice pattern change', '語音模式有變')}
          </span>
          <span className={'pill ' + neuLvl} style={{ fontSize: 10, padding: '1px 7px', marginLeft: 'auto' }}>
            {neuLvl === 'risk' ? L(lang, 'Neuro risk', '神經高危') : L(lang, 'Watch', '留意')}
          </span>
        </div>
      )}
    </div>
  )
}

function TodayView({ elders, visits, alerts, lang, onOpen, onVisit }) {
  const counts = {
    stable: elders.filter(e => e.risk_tier === 'stable').length,
    watch:  elders.filter(e => e.risk_tier === 'watch').length,
    risk:   elders.filter(e => e.risk_tier === 'risk').length,
    calls:  elders.filter(e => (e.latest_call || {}).state === 'done').length,
  }

  return (
    <div className="content">
      <div className="kpis">
        <div className="kpi k-stable card"><div className="ki">{I.heart}</div><div className="kn">{counts.stable}</div><div className="kl">{L(lang,'Stable','穩定')}</div></div>
        <div className="kpi k-watch  card"><div className="ki">{I.alert}</div><div className="kn">{counts.watch}</div> <div className="kl">{L(lang,'Watch','留意')}</div></div>
        <div className="kpi k-risk   card"><div className="ki">{I.alert}</div><div className="kn">{counts.risk}</div>  <div className="kl">{L(lang,'At risk','高危')}</div></div>
        <div className="kpi k-call   card"><div className="ki">{I.phone}</div><div className="kn">{counts.calls}/{elders.length}</div><div className="kl">{L(lang,'Calls done','已致電')}</div></div>
        <div className="kpi k-visit  card"><div className="ki">{I.map}</div>  <div className="kn">{visits.length}</div><div className="kl">{L(lang,'Visits today','今日家訪')}</div></div>
      </div>

      <div className="grid-2">
        <div>
          <div className="sec-title">
            <h2>{L(lang, 'Needs your attention', '需要跟進')}</h2>
            <span className="sub">{L(lang, `${alerts.length} flags`, `${alerts.length} 項提示`)}</span>
          </div>
          <div className="alerts">
            {alerts.slice(0, 4).map(a => (
              <div key={a.id} className={'alert card ' + a.severity} onClick={() => onOpen(a.elder_id)}>
                <div className="aic">{a.severity === 'risk' ? I.alert : I.bell}</div>
                <div className="atxt">
                  <div className="atop">
                    <span className="anm">{L(lang, a.elder?.name_en, a.elder?.name_zh)}</span>
                    <Pill kind={a.severity} dot={false}>{a.severity === 'risk' ? L(lang,'Urgent','緊急') : L(lang,'Watch','留意')}</Pill>
                  </div>
                  <div className="amsg">{a.label_en}</div>
                </div>
                <span className="ago">{I.chevron}</span>
              </div>
            ))}
            {!alerts.length && <p style={{ color: 'var(--ink-faint)', padding: '12px 0', fontSize: 14 }}>{L(lang,'All clear this morning','今早一切正常')}</p>}
          </div>

          <div className="sec-title">
            <h2>{L(lang, 'My caseload', '我的個案')}</h2>
            <span className="sub">{L(lang, `${elders.length} elders · sorted by risk`, `${elders.length} 位長者 · 按風險排序`)}</span>
          </div>
          <div className="caseload">
            {elders.map(e => <ElderCard key={e.id} e={e} lang={lang} onOpen={onOpen} />)}
          </div>
        </div>

        <div>
          <div className="sec-title"><h2>{L(lang, "Today's visits", '今日家訪')}</h2></div>
          <div className="vpanel card">
            {visits.map(v => {
              const elder = v.elder || {}
              const time = v.scheduled_at ? new Date(v.scheduled_at).toLocaleTimeString('en-HK', { hour: '2-digit', minute: '2-digit' }) : '—'
              return (
                <div key={v.id} className={'visit ' + v.state} onClick={() => onVisit(v.elder_id)}>
                  <span className="vtime">{time}</span>
                  <span className="vbar"></span>
                  <div style={{ flex: 1 }}>
                    <div className="vname">{L(lang, elder.name_en || v.elder_id, elder.name_zh || v.elder_id)}</div>
                    <div className="vtype">{L(lang, v.type_en, v.type_zh)}</div>
                    <div className="vwhere">{I.map} {v.location}</div>
                  </div>
                  {v.state === 'due' && <Pill kind="risk" dot={false}>{L(lang,'Due now','即將')}</Pill>}
                </div>
              )
            })}
            <button className="btn primary" style={{ width: 'calc(100% - 8px)', margin: '8px 4px 4px' }}>{I.plus}{L(lang, 'Schedule a visit', '新增家訪')}</button>
          </div>

        </div>
      </div>
    </div>
  )
}

function PulseStat({ label, value, trend, good, last }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 2px', borderBottom: last ? 'none' : '1px solid var(--line-soft)' }}>
      <span style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>{label}</span>
      <span style={{ display:'flex', alignItems:'baseline', gap: 8 }}>
        <span style={{ fontSize: 18, fontWeight: 800, fontFamily:'var(--mono)' }}>{value}</span>
        {trend && <span style={{ fontSize: 12, fontWeight: 600, color: good ? 'var(--green)' : 'var(--ink-faint)', fontFamily:'var(--hk)' }}>{trend}</span>}
      </span>
    </div>
  )
}

Object.assign(window, { TodayView, ElderCard, elderViewModel })
