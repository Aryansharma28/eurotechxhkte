/* CareBridge — Neurological voice biomarker view (social worker dashboard) */

function Sparkline({ values, width = 80, height = 32, level }) {
  if (!values || values.length < 2) return React.createElement('svg', { width: width ?? '100%', height })
  const mn = Math.min(...values); const mx = Math.max(...values)
  const rng = mx - mn || 1
  const pad = 3
  // Use a fixed internal coordinate space so fluid-width SVGs scale correctly
  const vw = width ?? 200
  const xf = i => ((i / (values.length - 1)) * (vw - pad * 2) + pad).toFixed(1)
  const yf = v => ((height - pad) - ((v - mn) / rng) * (height - pad * 2)).toFixed(1)
  const pts = values.map((v, i) => `${xf(i)},${yf(v)}`).join(' L ')
  const color = level === 'risk' ? 'var(--risk)' : level === 'watch' ? 'var(--watch)' : 'var(--stable)'
  const lx = xf(values.length - 1)
  const ly = yf(values[values.length - 1])
  const svgProps = width == null
    ? { viewBox: `0 0 ${vw} ${height}`, style: { display: 'block', width: '100%', height, overflow: 'visible' } }
    : { width, height, style: { display: 'block', overflow: 'visible' } }
  return (
    <svg {...svgProps}>
      <path d={`M ${pts}`} fill="none" stroke={color} strokeWidth={1.8}
            strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
      <circle cx={lx} cy={ly} r={2.8} fill={color} />
    </svg>
  )
}

function MetricCol({ metricKey, values, today, level, baseline, lang }) {
  const t = NEURO_THRESHOLDS[metricKey]
  if (!t) return null
  const label  = L(lang, t.label_en, t.label_zh)
  const valStr = metricKey === 'pauses' ? today.toFixed(2) : String(today)
  const delta  = today - baseline[metricKey]
  const pct    = Math.abs(delta / (baseline[metricKey] || 1) * 100).toFixed(0)
  const worse  = t.higherBetter ? delta < 0 : delta > 0
  const numColor = level === 'risk' ? 'var(--risk-ink)' : level === 'watch' ? 'var(--watch-ink)' : 'var(--ink)'
  const trendColor = level === 'ok' ? 'var(--ink-faint)' : level === 'watch' ? 'var(--watch-ink)' : 'var(--risk-ink)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 76 }}>
      <div style={{ fontSize: 10, color: 'var(--ink-faint)', fontWeight: 700, letterSpacing: '0.05em',
                    textTransform: 'uppercase', textAlign: 'center', whiteSpace: 'nowrap' }}>
        {label}
      </div>
      <Sparkline values={values} width={80} height={32} level={level} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--mono)', color: numColor, lineHeight: 1 }}>
          {valStr}
          <span style={{ fontSize: 9, fontWeight: 500, color: 'var(--ink-faint)', marginLeft: 2 }}>{t.unit}</span>
        </span>
        {+pct > 2
          ? <span style={{ fontSize: 10, fontWeight: 600, color: trendColor, fontFamily: 'var(--mono)' }}>
              {worse ? '↓' : '↑'} {pct}%
            </span>
          : <span style={{ fontSize: 10, color: 'var(--ink-faint)' }}>stable</span>
        }
      </div>
      {level !== 'ok' && (
        <span className={'pill ' + level} style={{ fontSize: 9, padding: '1px 6px' }}>
          <span className="dot"></span>{level}
        </span>
      )}
    </div>
  )
}

const NEURO_MSGS = {
  chan: {
    en: 'Speech rate −18 %, tremor 6.2 (risk), fluency 41 (risk) — consider urgent review',
    zh: '語速下降18%，聲顫6.2（高危），流暢度41（高危）— 考慮緊急複診',
  },
  cheung: {
    en: 'Fluency trending to 52 (watch), pause ratio 0.28 (watch) — monitor word-finding',
    zh: '流暢度降至52（留意），停頓率0.28（留意）— 留意找詞困難',
  },
}

function ElderNeuroCard({ elder, bm, lang, onOpen }) {
  const r = RISK[elder.risk_tier] || RISK.stable
  const neuroLevel = bm.alertLevel
  const msg = NEURO_MSGS[elder.id]

  return (
    <div className="card" style={{ padding: '16px 20px', cursor: 'pointer' }} onClick={() => onOpen(elder.id)}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Avatar name={elder.name_zh} size={40} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{L(lang, elder.name_en, elder.name_zh)}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
            {elder.age}{L(lang, '', '歲')} · {L(lang, elder.dx_en, elder.dx_zh)}
          </div>
        </div>
        <Pill kind={r.cls}>{L(lang, r.en, r.zh)}</Pill>
        {neuroLevel && (
          <Pill kind={neuroLevel} dot={false}>
            {neuroLevel === 'risk'
              ? L(lang, '⚠ Neuro risk', '⚠ 神經高危')
              : L(lang, '· Neuro watch', '· 神經留意')}
          </Pill>
        )}
      </div>

      {/* alert banner */}
      {neuroLevel && msg && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 14,
                      padding: '9px 12px', borderRadius: 10,
                      background: neuroLevel === 'risk' ? 'var(--risk-bg)' : 'var(--watch-bg)' }}>
          <span style={{ color: neuroLevel === 'risk' ? 'var(--risk)' : 'var(--watch)', flexShrink: 0, marginTop: 1 }}>
            {I.alert}
          </span>
          <span style={{ fontSize: 13, lineHeight: 1.45,
                         color: neuroLevel === 'risk' ? 'var(--risk-ink)' : 'var(--watch-ink)' }}>
            {L(lang, msg.en, msg.zh)}
          </span>
        </div>
      )}

      {/* Primary: 2 composite signal graphs side-by-side */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
        {['parkinson', 'neuroDec'].map(k => {
          const t = NEURO_THRESHOLDS[k]
          if (!t) return null
          const values = bm.days.map(d => d[k])
          const level  = bm.metricAlerts[k]
          const today  = bm.today[k]
          const numColor = level === 'risk' ? 'var(--risk-ink)' : level === 'watch' ? 'var(--watch-ink)' : 'var(--ink)'
          return (
            <div key={k} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 10, color: 'var(--ink-faint)', fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.05em' }}>
                {L(lang, t.label_en, t.label_zh)}
              </div>
              <Sparkline values={values} width={null} height={44} level={level} fill />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--mono)', color: numColor, lineHeight: 1 }}>
                  {today}
                </span>
                <span style={{ fontSize: 10, color: 'var(--ink-faint)' }}>{t.unit}</span>
                {level !== 'ok' && (
                  <span className={'pill ' + level} style={{ fontSize: 9, padding: '1px 7px', marginLeft: 4 }}>
                    <span className="dot" />{level}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Secondary: 5 acoustic metrics compact */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '0.5px solid var(--line-soft)',
                    flexWrap: 'wrap' }}>
        {['rate', 'pauses', 'pitch', 'tremor', 'fluency'].map(k => (
          <MetricCol
            key={k}
            metricKey={k}
            values={bm.week.map(d => d[k])}
            today={bm.today[k]}
            level={bm.metricAlerts[k]}
            baseline={bm.baseline}
            lang={lang}
          />
        ))}
      </div>

      <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--line-soft)',
                    fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--mono)' }}>
        {L(lang,
          'Top: 14-day composite signals · bottom: acoustic inputs · baseline = days 1–7',
          '上：14天綜合信號 · 下：聲學輸入 · 基準＝第1–7天')}
      </div>
    </div>
  )
}

function NeuroView({ elders, lang, onOpen }) {
  const alertElders = elders.filter(e => BIOMARKERS[e.id]?.alertLevel)

  return (
    <div className="content">
      {/* explainer */}
      <div style={{ marginBottom: 20, padding: '14px 20px', borderRadius: 14,
                    background: 'var(--calm-bg)', border: '1px solid oklch(0.87 0.04 242)' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--calm)', marginBottom: 6,
                      display: 'flex', alignItems: 'center', gap: 8 }}>
          {I.wave} {L(lang, 'Neurological Voice Biomarkers', '神經語音生物標誌')}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
          {L(lang,
            'Five acoustic markers extracted from each daily call. Deviations from each person\'s 14-day baseline can flag early signs of Parkinson\'s or cognitive decline.',
            '每次每日通話提取五項聲學標誌，與個人14天基準的偏差可標示帕金遜症或認知衰退的早期跡象。'
          )}
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 10, flexWrap: 'wrap' }}>
          {Object.entries(NEURO_THRESHOLDS).map(([k, t]) => (
            <div key={k} style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
              <span style={{ fontWeight: 700 }}>{L(lang, t.label_en, t.label_zh)}</span>
              {' '}
              {t.higherBetter
                ? L(lang, `watch <${t.watchBelow} ${t.unit}`, `留意 <${t.watchBelow}`)
                : L(lang, `watch >${t.watchAbove}`, `留意 >${t.watchAbove}`)}
            </div>
          ))}
        </div>
      </div>

      {/* alert strip */}
      {alertElders.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="sec-title" style={{ marginBottom: 10 }}>
            <h2>{L(lang, 'Neuro alerts', '神經提示')}</h2>
            <span className="sub">
              {L(lang, `${alertElders.length} elder${alertElders.length > 1 ? 's' : ''} need attention`,
                       `${alertElders.length}位長者需要注意`)}
            </span>
          </div>
          <div className="alerts">
            {alertElders.map(e => {
              const bm  = BIOMARKERS[e.id]
              const msg = NEURO_MSGS[e.id]
              return (
                <div key={e.id} className={'alert card ' + bm.alertLevel}
                     style={{ cursor: 'pointer' }} onClick={() => onOpen(e.id)}>
                  <div className="aic">{I.alert}</div>
                  <div className="atxt">
                    <div className="atop">
                      <span className="anm">{L(lang, e.name_en, e.name_zh)}</span>
                      <Pill kind={bm.alertLevel} dot={false}>
                        {bm.alertLevel === 'risk'
                          ? L(lang, 'Neuro risk', '神經高危')
                          : L(lang, 'Neuro watch', '神經留意')}
                      </Pill>
                    </div>
                    {msg && <div className="amsg">{L(lang, msg.en, msg.zh)}</div>}
                  </div>
                  <span className="ago">{I.chevron}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* all elders */}
      <div className="sec-title" style={{ marginBottom: 14 }}>
        <h2>{L(lang, 'All elders — voice trends', '所有長者 — 語音趨勢')}</h2>
        <span className="sub">{L(lang, 'Sparklines = last 7 days · % change vs personal baseline',
                                       '趨勢圖＝過去7天 · 百分比變化對比個人基準')}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {elders.map(e => {
          const bm = BIOMARKERS[e.id]
          if (!bm) return null
          return <ElderNeuroCard key={e.id} elder={e} bm={bm} lang={lang} onOpen={onOpen} />
        })}
      </div>
    </div>
  )
}

Object.assign(window, { NeuroView })
