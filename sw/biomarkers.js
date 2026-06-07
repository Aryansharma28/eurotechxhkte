/* CareBridge — Voice biomarker data (mock, 14-day history per elder) */
/* Used by NeuroView (SW dashboard) and VoiceInsight (Family app)      */

const NEURO_THRESHOLDS = {
  rate:      { label_en: 'Speech rate',       label_zh: '語速',     unit: 'wpm',  watchBelow: 90,  riskBelow: 75,  higherBetter: true  },
  pauses:    { label_en: 'Pause ratio',        label_zh: '停頓率',   unit: '',     watchAbove: 0.18, riskAbove: 0.28, higherBetter: false },
  pitch:     { label_en: 'Pitch range',        label_zh: '音域',     unit: 'semi', watchBelow: 5.5, riskBelow: 4.0,  higherBetter: true  },
  tremor:    { label_en: 'Tremor',             label_zh: '聲顫',     unit: '/10',  watchAbove: 3.5, riskAbove: 5.5,  higherBetter: false },
  fluency:   { label_en: 'Fluency',            label_zh: '流暢度',   unit: '/100', watchBelow: 60,  riskBelow: 45,   higherBetter: true  },
  parkinson: { label_en: 'Parkinson signal',   label_zh: '柏金遜信號', unit: '/100', watchAbove: 30,  riskAbove: 55,   higherBetter: false },
  neuroDec:  { label_en: 'Neuro decline',      label_zh: '神經退化', unit: '/100', watchAbove: 30,  riskAbove: 55,   higherBetter: false },
}

function metricLevel(key, val) {
  const t = NEURO_THRESHOLDS[key]
  if (!t || val == null) return 'ok'
  if (t.higherBetter) {
    if (val < t.riskBelow)  return 'risk'
    if (val < t.watchBelow) return 'watch'
  } else {
    if (val > t.riskAbove)  return 'risk'
    if (val > t.watchAbove) return 'watch'
  }
  return 'ok'
}

const _raw = {
  // wong: COPD, stable, mild occasional dip
  wong: { days: [
    { rate: 118, pauses: 0.13, pitch: 6.8, tremor: 1.2, fluency: 73, parkinson: 18, neuroDec: 16 },
    { rate: 122, pauses: 0.12, pitch: 7.1, tremor: 1.0, fluency: 76, parkinson: 17, neuroDec: 14 },
    { rate: 119, pauses: 0.14, pitch: 6.9, tremor: 1.3, fluency: 74, parkinson: 19, neuroDec: 17 },
    { rate: 121, pauses: 0.13, pitch: 7.2, tremor: 1.1, fluency: 75, parkinson: 16, neuroDec: 15 },
    { rate: 115, pauses: 0.16, pitch: 6.5, tremor: 1.4, fluency: 71, parkinson: 22, neuroDec: 20 },
    { rate: 117, pauses: 0.15, pitch: 6.7, tremor: 1.2, fluency: 73, parkinson: 20, neuroDec: 18 },
    { rate: 120, pauses: 0.13, pitch: 7.0, tremor: 1.0, fluency: 75, parkinson: 17, neuroDec: 15 },
    { rate: 116, pauses: 0.14, pitch: 6.8, tremor: 1.3, fluency: 74, parkinson: 19, neuroDec: 17 },
    { rate: 119, pauses: 0.15, pitch: 7.1, tremor: 1.1, fluency: 76, parkinson: 18, neuroDec: 16 },
    { rate: 122, pauses: 0.13, pitch: 6.9, tremor: 1.2, fluency: 74, parkinson: 17, neuroDec: 15 },
    { rate: 118, pauses: 0.14, pitch: 7.2, tremor: 1.0, fluency: 75, parkinson: 16, neuroDec: 14 },
    { rate: 120, pauses: 0.12, pitch: 7.0, tremor: 1.1, fluency: 73, parkinson: 18, neuroDec: 16 },
    { rate: 117, pauses: 0.15, pitch: 6.8, tremor: 1.3, fluency: 74, parkinson: 20, neuroDec: 18 },
    { rate: 119, pauses: 0.14, pitch: 6.9, tremor: 1.2, fluency: 72, parkinson: 19, neuroDec: 17 },
  ]},
  // chan: CHF, declining across all 5 metrics → RISK
  chan: { days: [
    { rate: 100, pauses: 0.18, pitch: 5.8, tremor: 2.5, fluency: 62, parkinson: 35, neuroDec: 38 },
    { rate:  98, pauses: 0.19, pitch: 5.7, tremor: 2.7, fluency: 61, parkinson: 38, neuroDec: 41 },
    { rate:  99, pauses: 0.18, pitch: 5.6, tremor: 2.8, fluency: 62, parkinson: 40, neuroDec: 43 },
    { rate:  97, pauses: 0.21, pitch: 5.5, tremor: 3.0, fluency: 60, parkinson: 43, neuroDec: 46 },
    { rate:  95, pauses: 0.20, pitch: 5.4, tremor: 3.2, fluency: 59, parkinson: 45, neuroDec: 49 },
    { rate:  96, pauses: 0.22, pitch: 5.3, tremor: 3.4, fluency: 58, parkinson: 48, neuroDec: 52 },
    { rate:  94, pauses: 0.23, pitch: 5.2, tremor: 3.7, fluency: 56, parkinson: 51, neuroDec: 55 },
    { rate:  93, pauses: 0.24, pitch: 5.0, tremor: 4.0, fluency: 54, parkinson: 55, neuroDec: 59 },
    { rate:  91, pauses: 0.25, pitch: 4.8, tremor: 4.4, fluency: 52, parkinson: 58, neuroDec: 62 },
    { rate:  90, pauses: 0.26, pitch: 4.6, tremor: 4.8, fluency: 50, parkinson: 62, neuroDec: 66 },
    { rate:  89, pauses: 0.27, pitch: 4.4, tremor: 5.2, fluency: 48, parkinson: 65, neuroDec: 69 },
    { rate:  88, pauses: 0.28, pitch: 4.3, tremor: 5.6, fluency: 45, parkinson: 68, neuroDec: 72 },
    { rate:  85, pauses: 0.29, pitch: 4.2, tremor: 5.9, fluency: 43, parkinson: 71, neuroDec: 75 },
    { rate:  82, pauses: 0.31, pitch: 4.1, tremor: 6.2, fluency: 41, parkinson: 74, neuroDec: 78 },
  ]},
  // lee: hip fracture, improving across the board
  lee: { days: [
    { rate: 126, pauses: 0.11, pitch: 7.2, tremor: 1.4, fluency: 79, parkinson: 22, neuroDec: 20 },
    { rate: 128, pauses: 0.10, pitch: 7.4, tremor: 1.2, fluency: 80, parkinson: 20, neuroDec: 18 },
    { rate: 130, pauses: 0.10, pitch: 7.5, tremor: 1.1, fluency: 82, parkinson: 19, neuroDec: 17 },
    { rate: 129, pauses: 0.09, pitch: 7.6, tremor: 1.0, fluency: 81, parkinson: 17, neuroDec: 15 },
    { rate: 131, pauses: 0.09, pitch: 7.8, tremor: 1.0, fluency: 83, parkinson: 16, neuroDec: 14 },
    { rate: 133, pauses: 0.08, pitch: 7.9, tremor: 0.9, fluency: 84, parkinson: 14, neuroDec: 12 },
    { rate: 132, pauses: 0.09, pitch: 8.0, tremor: 0.9, fluency: 85, parkinson: 13, neuroDec: 11 },
    { rate: 134, pauses: 0.08, pitch: 8.1, tremor: 0.8, fluency: 84, parkinson: 12, neuroDec: 10 },
    { rate: 133, pauses: 0.08, pitch: 8.2, tremor: 0.9, fluency: 86, parkinson: 11, neuroDec:  9 },
    { rate: 135, pauses: 0.07, pitch: 8.4, tremor: 0.8, fluency: 85, parkinson: 10, neuroDec:  9 },
    { rate: 134, pauses: 0.08, pitch: 8.3, tremor: 0.8, fluency: 87, parkinson:  9, neuroDec:  8 },
    { rate: 136, pauses: 0.07, pitch: 8.5, tremor: 0.7, fluency: 86, parkinson:  9, neuroDec:  7 },
    { rate: 135, pauses: 0.08, pitch: 8.4, tremor: 0.8, fluency: 88, parkinson:  8, neuroDec:  7 },
    { rate: 137, pauses: 0.07, pitch: 8.6, tremor: 0.7, fluency: 87, parkinson:  8, neuroDec:  6 },
  ]},
  // cheung: stroke + diabetes, fluency declining, pauses rising → WATCH
  cheung: { days: [
    { rate: 102, pauses: 0.20, pitch: 5.8, tremor: 1.8, fluency: 60, parkinson: 28, neuroDec: 32 },
    { rate: 101, pauses: 0.21, pitch: 5.7, tremor: 2.0, fluency: 59, parkinson: 29, neuroDec: 33 },
    { rate: 103, pauses: 0.20, pitch: 5.9, tremor: 1.9, fluency: 60, parkinson: 28, neuroDec: 32 },
    { rate: 100, pauses: 0.22, pitch: 5.7, tremor: 2.0, fluency: 58, parkinson: 31, neuroDec: 35 },
    { rate:  98, pauses: 0.23, pitch: 5.6, tremor: 2.1, fluency: 57, parkinson: 33, neuroDec: 37 },
    { rate:  99, pauses: 0.22, pitch: 5.5, tremor: 2.2, fluency: 57, parkinson: 34, neuroDec: 38 },
    { rate:  97, pauses: 0.24, pitch: 5.4, tremor: 2.0, fluency: 56, parkinson: 36, neuroDec: 40 },
    { rate:  96, pauses: 0.24, pitch: 5.5, tremor: 2.2, fluency: 55, parkinson: 37, neuroDec: 41 },
    { rate:  95, pauses: 0.25, pitch: 5.4, tremor: 2.1, fluency: 54, parkinson: 38, neuroDec: 43 },
    { rate:  94, pauses: 0.26, pitch: 5.3, tremor: 2.3, fluency: 53, parkinson: 40, neuroDec: 44 },
    { rate:  93, pauses: 0.26, pitch: 5.4, tremor: 2.2, fluency: 52, parkinson: 39, neuroDec: 44 },
    { rate:  92, pauses: 0.27, pitch: 5.2, tremor: 2.4, fluency: 51, parkinson: 41, neuroDec: 46 },
    { rate:  91, pauses: 0.27, pitch: 5.3, tremor: 2.3, fluency: 51, parkinson: 40, neuroDec: 45 },
    { rate:  91, pauses: 0.28, pitch: 5.2, tremor: 2.5, fluency: 52, parkinson: 42, neuroDec: 47 },
  ]},
  // ho: UTI post-op, stable and healthy baseline
  ho: { days: [
    { rate: 130, pauses: 0.09, pitch: 8.2, tremor: 0.7, fluency: 84, parkinson: 10, neuroDec:  9 },
    { rate: 132, pauses: 0.08, pitch: 8.4, tremor: 0.6, fluency: 85, parkinson:  9, neuroDec:  8 },
    { rate: 134, pauses: 0.09, pitch: 8.3, tremor: 0.7, fluency: 87, parkinson: 10, neuroDec:  9 },
    { rate: 131, pauses: 0.08, pitch: 8.5, tremor: 0.5, fluency: 86, parkinson:  8, neuroDec:  7 },
    { rate: 133, pauses: 0.08, pitch: 8.6, tremor: 0.6, fluency: 88, parkinson:  9, neuroDec:  8 },
    { rate: 135, pauses: 0.07, pitch: 8.4, tremor: 0.7, fluency: 87, parkinson:  8, neuroDec:  7 },
    { rate: 134, pauses: 0.09, pitch: 8.7, tremor: 0.5, fluency: 89, parkinson:  7, neuroDec:  6 },
    { rate: 136, pauses: 0.08, pitch: 8.5, tremor: 0.6, fluency: 88, parkinson:  8, neuroDec:  7 },
    { rate: 135, pauses: 0.07, pitch: 8.8, tremor: 0.5, fluency: 90, parkinson:  7, neuroDec:  6 },
    { rate: 137, pauses: 0.08, pitch: 8.6, tremor: 0.7, fluency: 89, parkinson:  8, neuroDec:  7 },
    { rate: 136, pauses: 0.07, pitch: 8.9, tremor: 0.5, fluency: 91, parkinson:  7, neuroDec:  6 },
    { rate: 138, pauses: 0.08, pitch: 8.7, tremor: 0.6, fluency: 90, parkinson:  8, neuroDec:  7 },
    { rate: 137, pauses: 0.08, pitch: 8.8, tremor: 0.5, fluency: 91, parkinson:  7, neuroDec:  6 },
    { rate: 136, pauses: 0.07, pitch: 8.9, tremor: 0.5, fluency: 91, parkinson:  7, neuroDec:  6 },
  ]},
}

const BIOMARKER_KEYS = ['rate', 'pauses', 'pitch', 'tremor', 'fluency', 'parkinson', 'neuroDec']
const BIOMARKERS = {}

Object.keys(_raw).forEach(id => {
  const days = _raw[id].days
  const baseline = {}
  BIOMARKER_KEYS.forEach(k => {
    baseline[k] = +(days.slice(0, 7).reduce((s, d) => s + d[k], 0) / 7).toFixed(2)
  })
  const today = days[days.length - 1]
  const week  = days.slice(-7)
  const metricAlerts = {}
  BIOMARKER_KEYS.forEach(k => { metricAlerts[k] = metricLevel(k, today[k]) })
  const levels = Object.values(metricAlerts)
  const alertLevel = levels.includes('risk') ? 'risk' : levels.includes('watch') ? 'watch' : null
  BIOMARKERS[id] = { days, baseline, today, week, metricAlerts, alertLevel }
})

Object.assign(window, { BIOMARKERS, NEURO_THRESHOLDS, BIOMARKER_KEYS, metricLevel })
