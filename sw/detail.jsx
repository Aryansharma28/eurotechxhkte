/* CareBridge — Elder detail drawer + tablet visit mode (API-wired) */

// Inline sparkline for drawer — self-contained, no dep on neuro.jsx
function DrawerSparkline({ values, level, width = 64, height = 26 }) {
  if (!values || values.length < 2) return null
  const mn = Math.min(...values); const mx = Math.max(...values)
  const rng = mx - mn || 1; const pad = 3
  const xf = i => ((i / (values.length - 1)) * (width - pad * 2) + pad).toFixed(1)
  const yf = v => ((height - pad) - ((v - mn) / rng) * (height - pad * 2)).toFixed(1)
  const pts = values.map((v, i) => `${xf(i)},${yf(v)}`).join(' L ')
  const color = level === 'risk' ? 'var(--risk)' : level === 'watch' ? 'var(--watch)' : 'var(--stable)'
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <path d={`M ${pts}`} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
      <circle cx={xf(values.length - 1)} cy={yf(values[values.length - 1])} r={2.5} fill={color} />
    </svg>
  )
}

// ── Week calendar (uses 7-day activity_records from API) ─────────────────────
function WeekCalendar({ activities, lang }) {
  // activities: flat array of {record_date, activity_key, status}
  // build 7-col ordered date list (Mon–today)
  const today = new Date()
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
  const dayLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const dayLabelsZh = ['一','二','三','四','五','六','日']

  function getStatus(actKey, date) {
    const rec = activities.find(r => r.activity_key === actKey && r.record_date === date)
    return rec ? rec.status : 'pending'
  }

  return (
    <div className="wkcal">
      <table className="wktable">
        <thead>
          <tr>
            <th></th>
            {dates.map((d, i) => (
              <th key={d} className={i === 6 ? 'today' : ''}>{L(lang, dayLabels[i], '週' + dayLabelsZh[i])}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ACTS.map(a => (
            <tr key={a.key}>
              <td className="rowlbl">{I[a.ic]} {L(lang, a.en, a.zh)}</td>
              {dates.map((d, ci) => {
                const status = getStatus(a.key, d)
                return (
                  <td key={d}>
                    <span className={'cell ' + (status === 'done' ? 'done' : status === 'missed' ? 'miss' : 'pend') + (ci === 6 ? ' todaycol' : '')}>
                      {status === 'done' ? I.check : status === 'missed' ? I.x : '·'}
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Elder detail drawer ───────────────────────────────────────────────────────
function ElderDetail({ id, lang, onClose, onVisit, onReload }) {
  const [detail, setDetail] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [err, setErr] = React.useState(null)
  const [tab, setTab] = React.useState('overview')

  React.useEffect(() => {
    setLoading(true); setErr(null)
    API.get(`/api/elders/${id}`)
      .then(d => setDetail(d))
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false))

    // Re-fetch silently every 5s so biomarker charts update live after a call
    const poll = setInterval(() => {
      API.get(`/api/elders/${id}`).then(d => setDetail(d)).catch(() => {})
    }, 5000)
    return () => clearInterval(poll)
  }, [id])

  if (loading) return (
    <div className="drawer-scrim scrim" onClick={onClose}>
      <div className="drawer" onClick={ev => ev.stopPropagation()} style={{ display: 'grid', placeItems: 'center' }}>
        <p style={{ color: 'var(--ink-faint)' }}>Loading…</p>
      </div>
    </div>
  )

  if (err || !detail) return (
    <div className="drawer-scrim scrim" onClick={onClose}>
      <div className="drawer" onClick={ev => ev.stopPropagation()} style={{ padding: 40 }}>
        <p style={{ color: 'var(--risk)' }}>{err || 'Not found'}</p>
        <button className="btn ghost" onClick={onClose}>Close</button>
      </div>
    </div>
  )

  const e   = detail
  const r   = RISK[e.risk_tier] || RISK.stable
  const fam = (e.family || [])[0] || {}
  const tagIcon = { done: I.phone, missed: I.phoneMissed, family: I.heart, visit: I.map, scheduled: I.clock }
  const neuroAlert = (typeof BIOMARKERS !== 'undefined') ? BIOMARKERS[e.id]?.alertLevel : null

  return (
    <div className="drawer-scrim scrim" onClick={onClose}>
      <div className="drawer" onClick={ev => ev.stopPropagation()}>
        <div className="dh">
          <div className="dh-top">
            <button className="iconbtn" onClick={onClose}>{I.x}</button>
            <Pill kind={r.cls}>{L(lang, r.en, r.zh)}</Pill>
          </div>
          <div className="dh-id">
            <Avatar name={e.name_zh} size={62} />
            <div style={{ flex: 1 }}>
              <div className="dnm">{L(lang, e.name_en, e.name_zh)} <span className="dzh">{L(lang, e.name_zh, e.name_en)}</span></div>
              <div className="dmeta">
                {e.age}{L(lang, ' yrs', ' 歲')} · {L(lang, e.sex === 'F' ? 'Female' : 'Male', e.sex === 'F' ? '女' : '男')} · {L(lang, `Discharged ${e.day_since_discharge ?? '?'} days ago`, `出院第 ${e.day_since_discharge ?? '?'} 天`)} · {L(lang, e.lives_en, e.lives_zh)}
              </div>
            </div>
          </div>
          <div className="dh-actions">
            <button className="btn primary" onClick={() => onVisit(e.id)}>{I.map}{L(lang, 'Start home visit', '開始家訪')}</button>
            <button className="btn ghost" onClick={async (ev) => {
              const btn = ev.currentTarget; btn.disabled = true
              try { await API.post('/api/simulate-call', { elder_id: e.id }); onReload && onReload() }
              catch (err) { alert('Simulate failed: ' + err.message) }
              finally { btn.disabled = false }
            }}>{I.phone}{L(lang, 'Simulate call', '模擬通話')}</button>
            <button className="btn ghost">{I.note}{L(lang, 'Add note', '新增記錄')}</button>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', padding: '0 20px', flexShrink: 0 }}>
          {[
            { k: 'overview', en: 'Overview', zh: '概覽' },
            { k: 'neuro',    en: 'Neuro',    zh: '神經', badge: neuroAlert },
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '10px 16px 9px', fontSize: 13,
              fontWeight: tab === t.k ? 700 : 500,
              color: tab === t.k ? 'var(--ink)' : 'var(--ink-faint)',
              borderBottom: tab === t.k ? '2px solid var(--green)' : '2px solid transparent',
              marginBottom: -1, display: 'flex', alignItems: 'center', gap: 5,
            }}>
              {L(lang, t.en, t.zh)}
              {t.badge && (
                <span style={{ fontSize: 9, fontWeight: 700, borderRadius: 99, padding: '1px 6px',
                               background: t.badge === 'risk' ? 'var(--risk)' : 'var(--watch)', color: '#fff' }}>
                  {t.badge === 'risk' ? '!' : '·'}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="dbody">
          {tab === 'overview' && <>
          <div className={'riskbanner ' + r.cls}>
            <div className="aic" style={{ color: r.cls === 'stable' ? 'var(--green-ink)' : r.cls === 'watch' ? 'var(--watch-ink)' : 'var(--risk-ink)' }}>{I.alert}</div>
            <div>
              <div className="rt">{L(lang, 'Care signal · ', '照顧提示 · ')}{L(lang, r.en, r.zh)}</div>
              <div className="rb">{L(lang, e.risk_note_en, e.risk_note_zh)}</div>
            </div>
          </div>

          <div className="dcard card">
            <h3>{I.cal} {L(lang, "This week's daily activities", '本週每日活動')}</h3>
            <WeekCalendar activities={e.activities || []} lang={lang} />
          </div>

          <div className="dcard card">
            <h3>{I.trend} {L(lang, 'Latest vitals', '最新生命表徵')}</h3>
            <div className="vitals">
              {Object.values((e.vitals || []).reduce((acc, v) => {
                if (!acc[v.vital_key] || v.measured_at > acc[v.vital_key].measured_at) acc[v.vital_key] = v
                return acc
              }, {})).map(v => (
                <div key={v.vital_key} className={'vital ' + (v.status || 'ok')}>
                  <div className="vk">{v.vital_key}</div>
                  <div className="vv">{v.value}</div>
                </div>
              ))}
            </div>
          </div>

          </>}

          {tab === 'neuro' && <>
          {/* ── Voice biomarkers: live from calls, mock baseline fallback ── */}
          {(typeof BIOMARKERS !== 'undefined') && BIOMARKERS[e.id] && (() => {
            const thresholds = (typeof NEURO_THRESHOLDS !== 'undefined') ? NEURO_THRESHOLDS : {}
            const keys = (typeof BIOMARKER_KEYS !== 'undefined') ? BIOMARKER_KEYS : Object.keys(thresholds)

            // recent_calls arrive DESC (newest first). Take up to 7, reverse for chronological order.
            const liveCalls = (e.recent_calls || []).slice(0, 7).reverse()

            // Determine which fields have real data from actual calls
            const liveFields = new Set()
            if (liveCalls.some(c => c.pause_ratio != null))                    liveFields.add('pauses')
            if (liveCalls.some(c => c.parkinson_signal != null))               liveFields.add('parkinson')
            if (liveCalls.some(c => c.neurological_decline_signal != null))    liveFields.add('neuroDec')
            if (liveCalls.some(c => c.rate != null))                           liveFields.add('rate')
            if (liveCalls.some(c => c.pitch != null))                          liveFields.add('pitch')
            if (liveCalls.some(c => c.tremor != null))                         liveFields.add('tremor')
            if (liveCalls.some(c => c.fluency != null))                        liveFields.add('fluency')

            // Mapping from DB column name → biomarker key
            const LIVE_MAP = { pauses: 'pause_ratio', parkinson: 'parkinson_signal',
              neuroDec: 'neurological_decline_signal', rate: 'rate',
              pitch: 'pitch', tremor: 'tremor', fluency: 'fluency' }

            // Start with mock baseline, overlay live values per-day where not null
            let bm = BIOMARKERS[e.id]
            if (liveFields.size > 0) {
              const week = bm.week.map((mockDay, i) => {
                const lc = liveCalls[i]
                if (!lc) return mockDay
                const merged = { ...mockDay }
                liveFields.forEach(k => {
                  const col = LIVE_MAP[k]
                  if (lc[col] != null) merged[k] = lc[col]
                })
                return merged
              })
              const todayCall = liveCalls[liveCalls.length - 1] || {}
              const todayMerged = { ...bm.today }
              liveFields.forEach(k => {
                const col = LIVE_MAP[k]
                if (todayCall[col] != null) todayMerged[k] = todayCall[col]
              })
              const updatedAlerts = { ...bm.metricAlerts }
              if (typeof metricLevel === 'function') {
                liveFields.forEach(k => { updatedAlerts[k] = metricLevel(k, todayMerged[k]) })
              }
              const lvls = Object.values(updatedAlerts)
              bm = { ...bm, week, today: todayMerged, metricAlerts: updatedAlerts,
                alertLevel: lvls.includes('risk') ? 'risk' : lvls.includes('watch') ? 'watch' : null }
            }

            return (
              <div className="dcard card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {I.wave} {L(lang, 'Voice biomarkers', '語音生物標誌')}
                  {liveFields.size > 0 && (
                    <span style={{ fontSize: 10, color: 'var(--stable)', fontWeight: 600, background: 'var(--stable-bg)', borderRadius: 6, padding: '2px 7px' }}>LIVE</span>
                  )}
                </h3>
                {bm.alertLevel && (
                  <div className={'riskbanner ' + bm.alertLevel} style={{ marginBottom: 14 }}>
                    <div className="aic" style={{ color: bm.alertLevel === 'risk' ? 'var(--risk-ink)' : 'var(--watch-ink)' }}>{I.alert}</div>
                    <div><div className="rt">{bm.alertLevel === 'risk' ? L(lang, 'Notable voice change — consider review', '語音出現顯著變化 — 考慮複診') : L(lang, 'Voice pattern shift — monitor closely', '語音模式有輕微偏移 — 密切跟進')}</div></div>
                  </div>
                )}
                {/* Primary: 2 composite signal graphs */}
                <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                  {['parkinson', 'neuroDec'].map(k => {
                    const t = thresholds[k]
                    if (!t) return null
                    const values   = bm.days ? bm.days.map(d => d[k]) : bm.week.map(d => d[k])
                    const level    = bm.metricAlerts[k]
                    const today    = bm.today[k]
                    const isLive   = liveFields.has(k)
                    const numColor = level === 'risk' ? 'var(--risk-ink)' : level === 'watch' ? 'var(--watch-ink)' : 'var(--ink)'
                    return (
                      <div key={k} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ fontSize: 10, color: 'var(--ink-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {L(lang, t.label_en, t.label_zh)}
                          {isLive && <span style={{ marginLeft: 3, fontSize: 8, color: 'var(--stable)', fontWeight: 900 }}>●</span>}
                        </div>
                        <DrawerSparkline values={values} level={level} width={120} height={40} />
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                          <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--mono)', color: numColor, lineHeight: 1 }}>{today}</span>
                          <span style={{ fontSize: 10, color: 'var(--ink-faint)' }}>{t.unit}</span>
                          {level !== 'ok' && (
                            <span className={'pill ' + level} style={{ fontSize: 9, padding: '1px 7px' }}>
                              <span className="dot" />{level}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Secondary: 5 acoustic inputs compact */}
                <div style={{ display: 'flex', gap: 10, paddingTop: 10, borderTop: '0.5px solid var(--line)', flexWrap: 'wrap' }}>
                  {['rate', 'pauses', 'pitch', 'tremor', 'fluency'].map(k => {
                    const t = thresholds[k]
                    if (!t) return null
                    const values   = bm.week.map(d => d[k])
                    const level    = bm.metricAlerts[k]
                    const today    = bm.today[k]
                    const isLive   = liveFields.has(k)
                    const numColor = level === 'risk' ? 'var(--risk-ink)' : level === 'watch' ? 'var(--watch-ink)' : 'var(--ink)'
                    return (
                      <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 50 }}>
                        <div style={{ fontSize: 9, color: 'var(--ink-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {L(lang, t.label_en, t.label_zh)}
                          {isLive && <span style={{ marginLeft: 2, fontSize: 7, color: 'var(--stable)', fontWeight: 900 }}>●</span>}
                        </div>
                        <DrawerSparkline values={values} level={level} width={52} height={22} />
                        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--mono)', color: numColor, lineHeight: 1 }}>
                          {k === 'pauses' ? today.toFixed(2) : String(today)}
                          <span style={{ fontSize: 8, fontWeight: 400, color: 'var(--ink-faint)', marginLeft: 1 }}>{t.unit}</span>
                        </span>
                        {level !== 'ok' && (
                          <span className={'pill ' + level} style={{ fontSize: 8, padding: '1px 5px' }}>
                            <span className="dot" />{level}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '0.5px solid var(--line)', fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--mono)' }}>
                  {liveFields.size > 0
                    ? L(lang, `● live · pause ratio from real calls · ${liveCalls.length} day window`, `● 實時 · 停頓率來自真實通話 · ${liveCalls.length} 天視窗`)
                    : L(lang, 'Baseline data · ● live metrics appear after calls complete', '基準數據 · ● 通話完成後顯示實時指標')
                  }
                </div>
              </div>
            )
          })()}
          </>}

          {tab === 'overview' && <>
          <div className="dcard card">
            <h3>{I.clock} {L(lang, 'Recent check-ins', '近期跟進')}</h3>
            <div className="tl">
              {(e.recent_calls || []).slice(0, 5).map((c, i) => (
                <div key={i} className="tli">
                  <div className={'tdot ' + c.state}>{tagIcon[c.state] || I.phone}</div>
                  <div>
                    <div className="ttime">{new Date(c.scheduled_at).toLocaleDateString('en-HK', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                    <div className="ttxt">{L(lang, c.summary_en || '—', c.summary_zh || '—')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dcard card">
            <h3>{I.check} {L(lang, 'Care plan', '照顧計劃')}</h3>
            <div className="plan">
              {Object.values((e.care_plan || []).reduce((acc, p) => {
                // Normalize key: lowercase, strip punctuation, first 28 chars — catches near-duplicate seed rows
                const key = (p.text_en || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').slice(0, 28).trim()
                if (!acc[key]) acc[key] = p
                return acc
              }, {})).map((p, i) => (
                <div key={i} className={'planitem ' + (p.done ? 'done' : '')}>
                  <span className="pcheck">{p.done && I.check}</span>
                  <span className="pt">{p.text_en}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="dcard card">
            <h3>{I.chat} {L(lang, 'Family contact', '家屬聯絡')}</h3>
            <div className="contact">
              <div className="cinfo">
                <div className="cn">{L(lang, fam.name_en, fam.name_zh) || '—'}</div>
                <div className="cp">{fam.phone || '—'}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="iconbtn">{I.phone}</button>
                <button className="iconbtn">{I.chat}</button>
              </div>
            </div>
          </div>
          </>}
        </div>
      </div>
    </div>
  )
}

// ── Tablet home-visit mode ────────────────────────────────────────────────────
function VisitMode({ id, lang, onClose, elders }) {
  const e = (elders || []).find(x => x.id === id) || {}
  const [checked, setChecked] = React.useState({})
  const [note, setNote]       = React.useState('')
  const [flags, setFlags]     = React.useState([])
  const [saving, setSaving]   = React.useState(false)
  const [saved, setSaved]     = React.useState(false)

  const toggle = k => setChecked(c => ({ ...c, [k]: !c[k] }))
  const toggleFlag = f => setFlags(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])

  async function saveVisit() {
    setSaving(true)
    try {
      const checkedActs = Object.entries(checked).filter(([,v]) => v).map(([k]) => k)
      await API.post('/api/visits', {
        elder_id:    id,
        notes:       note,
        checked_acts: checkedActs,
        quick_flags: flags,
      })
      setSaved(true)
      setTimeout(onClose, 1400)
    } catch (err) {
      alert('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const name = L(lang, e.name_en || id, e.name_zh || id)

  return (
    <div className="visitmode">
      <div className="vm-bar">
        <div className="vm-id">
          <Avatar name={e.name_zh || '?'} size={46} />
          <div>
            <div className="vm-nm">{name} · {L(lang, 'Home visit', '家訪')}</div>
            <div className="vm-sub">{L(lang, `Day ${e.day_since_discharge || '?'} · ${e.dx_en || ''}`, `出院第 ${e.day_since_discharge || '?'} 天 · ${e.dx_zh || ''}`)}</div>
          </div>
        </div>
        <button className="btn ghost" onClick={onClose}
          style={{ background: 'oklch(1 0 0 / 0.15)', color: '#fff', borderColor: 'transparent' }}>
          {I.x}{L(lang, 'End visit', '結束家訪')}
        </button>
      </div>

      <div className="vm-body">
        <div className="vm-card card">
          <h3>{L(lang, "Check today's activities", '勾選今日活動')}</h3>
          <div className="adlbtns">
            {ACTS.map(a => (
              <button key={a.key} className={'adlbtn ' + (checked[a.key] ? 'on' : '')} onClick={() => toggle(a.key)}>
                <span className="adli">{I[a.ic]}</span>
                {L(lang, a.en, a.zh)}
                <span className="adlcheck">{checked[a.key] && I.check}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="vm-card card">
            <h3>{L(lang, 'Visit notes', '家訪記錄')}</h3>
            <textarea className="notearea" value={note} onChange={ev => setNote(ev.target.value)}
              placeholder={L(lang, 'How is the home environment? Any new concerns? Medication count…', '居家環境如何？有何新顧慮？藥物點算…')}></textarea>
            <div className="imgslot" style={{ height: 90, marginTop: 12 }}>{L(lang, '+ photo of medication / home', '+ 藥物 / 居所相片')}</div>
          </div>
          <div className="vm-card card">
            <h3>{L(lang, 'Quick flags', '快速標記')}</h3>
            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginBottom: 16 }}>
              {[[L(lang,'Falls hazard','跌倒危機'),'watch'],[L(lang,'Needs GP','需見醫生'),'risk'],[L(lang,'Low food stock','糧食不足'),'watch'],[L(lang,'Doing well','狀態良好'),'stable']].map(([t, k]) => (
                <button key={t} className={'pill ' + (flags.includes(t) ? k : 'ghost')}
                  style={{ cursor: 'pointer', padding: '9px 14px', fontSize: 14, border: '1px solid var(--line)' }}
                  onClick={() => toggleFlag(t)}>
                  <span className="dot"></span>{t}
                </button>
              ))}
            </div>
            {saved
              ? <div className="btn primary" style={{ width: '100%', padding: 14, textAlign: 'center', background: 'var(--stable)' }}>{I.check} {L(lang,'Saved!','已儲存！')}</div>
              : <button className="btn primary" style={{ width: '100%', padding: 14 }} onClick={saveVisit} disabled={saving}>
                  {I.check}{saving ? L(lang,'Saving…','儲存中…') : L(lang,'Save visit & sync','儲存並同步')}
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

Object.assign(window, { ElderDetail, VisitMode, WeekCalendar })
