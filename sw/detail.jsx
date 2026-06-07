/* CareBridge — Elder detail drawer + tablet visit mode (API-wired) */

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

  React.useEffect(() => {
    setLoading(true); setErr(null)
    API.get(`/api/elders/${id}`)
      .then(d => setDetail(d))
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false))
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
            <button className="btn ghost">{I.phone}{L(lang, 'Call now', '立即致電')}</button>
            <button className="btn ghost">{I.note}{L(lang, 'Add note', '新增記錄')}</button>
          </div>
        </div>

        <div className="dbody">
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
