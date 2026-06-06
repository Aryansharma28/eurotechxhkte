/* CareBridge — mock caseload data (plain JS, global) */

// activity types tracked daily via the call / family / visits
const ACTS = [
  { key: "med",   en: "Medication", zh: "服藥",   ic: "pill"  },
  { key: "meal",  en: "Meals",      zh: "進食",   ic: "meal"  },
  { key: "walk",  en: "Mobility",   zh: "活動",   ic: "walk"  },
  { key: "water", en: "Hydration",  zh: "飲水",   ic: "water" },
  { key: "sleep", en: "Sleep",      zh: "睡眠",   ic: "sleep" },
  { key: "mood",  en: "Mood",       zh: "情緒",   ic: "mood"  },
];

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]; // last = today
const DAYS_ZH = ["一","二","三","四","五","六","日"];

// helper to build a 7-day x 6-act grid. 1=done, 0=missed, -1=n/a(future today partial)
function wk(rows) { return rows; }

const ELDERS = [
  {
    id: "wong", name: "Wong Mei-ling", zh: "黃美玲", age: 78, sex: "F",
    dx: "Pneumonia + COPD", dxZh: "肺炎 · 慢阻肺病", day: 8,
    risk: "watch", lives: "Lives alone · Sham Shui Po", livesZh: "獨居 · 深水埗",
    call: { state: "done", time: "09:32", flag: "Reported mild dizziness this morning", flagZh: "今早感到輕微頭暈" },
    riskNote: "Dizziness + lives alone. Falls risk if it persists.",
    riskNoteZh: "頭暈加獨居，持續或有跌倒風險。",
    family: { name: "Wong Ka-yan (daughter)", zh: "黃嘉欣（女兒）", phone: "+852 9123 4567" },
    vitals: [
      { k: "SpO₂",  v: "94%",      t: "watch" },
      { k: "Temp",  v: "37.1°C",   t: "ok" },
      { k: "HR",    v: "82 bpm",   t: "ok" },
    ],
    week: wk([
      [1,1,1,1,1,1,1], // med
      [1,1,1,1,1,1,1], // meal
      [1,1,0,1,1,1,0], // walk
      [1,1,1,0,1,1,1], // water
      [1,0,1,1,0,1,1], // sleep
      [1,1,1,1,1,0,0], // mood
    ]),
    plan: [
      { t: "Daily inhaler — 2 puffs morning & night", done: true },
      { t: "Pulmonary rehab breathing exercise ×3/day", done: false },
      { t: "Follow-up chest clinic — 18 Jun", done: false },
    ],
    timeline: [
      { time: "Today 09:32", tag: "call", en: "Daily call completed. Said she felt dizzy when standing up. Took inhaler. Ate congee.", zh: "已完成每日電話。起身時感頭暈，已用吸入器，食咗粥。" },
      { time: "Yesterday 18:40", tag: "family", en: "Daughter logged: brought groceries, mum seemed tired.", zh: "女兒記錄：送雜貨，媽媽看似疲倦。" },
      { time: "Mon 10:05", tag: "visit", en: "Home visit — flat tidy, inhaler technique reviewed.", zh: "家訪 — 居所整潔，已檢視吸入器用法。" },
    ],
  },
  {
    id: "chan", name: "Chan Kwok-keung", zh: "陳國強", age: 82, sex: "M",
    dx: "Congestive heart failure", dxZh: "充血性心臟衰竭", day: 4,
    risk: "risk", lives: "Lives with spouse · Kwun Tong", livesZh: "與配偶同住 · 觀塘",
    call: { state: "missed", time: "—", flag: "Missed daily call — 2 attempts, no answer", flagZh: "未接每日電話 — 已試兩次無人接聽" },
    riskNote: "Day 4 CHF, weight up 1.8 kg in 3 days + missed call. Possible fluid overload — call family now.",
    riskNoteZh: "出院第 4 天，3 日內體重升 1.8 公斤兼未接電話，疑似積水 — 請即聯絡家屬。",
    family: { name: "Chan Wai-man (son)", zh: "陳偉文（兒子）", phone: "+852 9876 5432" },
    vitals: [
      { k: "Weight", v: "+1.8 kg ↑", t: "risk" },
      { k: "BP",     v: "152/94",    t: "watch" },
      { k: "HR",     v: "98 bpm",    t: "watch" },
    ],
    week: wk([
      [1,1,1,0,1,0,0],
      [1,1,1,1,0,1,0],
      [1,0,0,1,0,0,0],
      [1,1,0,1,0,0,0],
      [1,1,0,0,1,0,0],
      [1,1,1,0,0,0,0],
    ]),
    plan: [
      { t: "Daily weight — same time, before breakfast", done: false },
      { t: "Diuretic (furosemide) — morning", done: false },
      { t: "Low-salt diet — under 2g/day", done: true },
      { t: "Cardiology follow-up — 12 Jun", done: false },
    ],
    timeline: [
      { time: "Today 09:10", tag: "miss", en: "Daily call NOT answered — 2 attempts.", zh: "每日電話無人接聽 — 已試兩次。" },
      { time: "Yesterday 09:20", tag: "call", en: "Weight up again. Slightly breathless climbing stairs.", zh: "體重再升，上樓梯略感氣促。" },
      { time: "Wed 09:15", tag: "call", en: "Reported swollen ankles. Advised to elevate legs, flagged.", zh: "腳踝水腫，已建議抬高雙腿並標記。" },
    ],
  },
  {
    id: "lee", name: "Lee Sau-ying", zh: "李秀英", age: 75, sex: "F",
    dx: "Hip fracture — post-op", dxZh: "髖部骨折 · 術後", day: 15,
    risk: "stable", lives: "Lives with son · Tseung Kwan O", livesZh: "與兒子同住 · 將軍澳",
    call: { state: "done", time: "09:05", flag: "Walking further each day — in good spirits", flagZh: "每日行得更遠，心情不錯" },
    riskNote: "Recovering well. Maintain mobility momentum, watch for over-exertion.",
    riskNoteZh: "復原良好，維持活動進度，留意過度勞累。",
    family: { name: "Lee Chun-hei (son)", zh: "李俊熙（兒子）", phone: "+852 9555 1212" },
    vitals: [
      { k: "Pain",  v: "2 / 10",  t: "ok" },
      { k: "Steps", v: "1,240",   t: "ok" },
      { k: "BP",    v: "128/80",  t: "ok" },
    ],
    week: wk([
      [1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1],
      [1,1,1,1,0,1,1],
      [1,1,1,1,1,1,1],
    ]),
    plan: [
      { t: "Physiotherapy walk ×2/day with frame", done: true },
      { t: "Calcium + vitamin D — daily", done: true },
      { t: "Ortho follow-up — 25 Jun", done: false },
    ],
    timeline: [
      { time: "Today 09:05", tag: "call", en: "Walked to the lift lobby and back twice. Sleeping well.", zh: "行到電梯大堂來回兩次，睡得好。" },
      { time: "Wed 14:00", tag: "visit", en: "Home visit — gait improving, removed one walking aid.", zh: "家訪 — 步態改善，減少一件助行器。" },
    ],
  },
  {
    id: "cheung", name: "Cheung Chi-ming", zh: "張志明", age: 80, sex: "M",
    dx: "Stroke recovery + diabetes", dxZh: "中風復康 · 糖尿病", day: 11,
    risk: "watch", lives: "Lives alone · Wong Tai Sin", livesZh: "獨居 · 黃大仙",
    call: { state: "done", time: "09:48", flag: "Missed morning medication — forgot", flagZh: "漏服早上藥物 — 忘記了" },
    riskNote: "Medication adherence slipping (3 misses this week) + diabetic. Consider pillbox + family reminder.",
    riskNoteZh: "服藥依從性下降（本週漏 3 次）兼糖尿，考慮藥盒及家屬提醒。",
    family: { name: "Cheung Mei (daughter)", zh: "張薇（女兒）", phone: "+852 9333 8080" },
    vitals: [
      { k: "Glucose", v: "9.8 mmol", t: "watch" },
      { k: "BP",      v: "138/86",   t: "ok" },
      { k: "Adher.",  v: "71%",      t: "watch" },
    ],
    week: wk([
      [1,0,1,1,0,1,0],
      [1,1,1,1,1,1,1],
      [1,1,1,0,1,1,1],
      [1,1,1,1,1,1,1],
      [1,1,1,1,1,0,1],
      [1,1,1,1,1,1,1],
    ]),
    plan: [
      { t: "Metformin — twice daily with meals", done: false },
      { t: "Blood glucose check — morning", done: true },
      { t: "Speech therapy ×2/week", done: true },
      { t: "Neuro follow-up — 20 Jun", done: false },
    ],
    timeline: [
      { time: "Today 09:48", tag: "call", en: "Forgot morning pills again. Reminded; daughter to set up pillbox.", zh: "再次漏食早上藥，已提醒，女兒將安排藥盒。" },
      { time: "Fri 09:30", tag: "call", en: "Glucose a little high. Reviewed diet — too much sweet drink.", zh: "血糖略高，檢視飲食 — 甜飲過多。" },
    ],
  },
  {
    id: "ho", name: "Ho Yuen-wah", zh: "何婉華", age: 71, sex: "F",
    dx: "Post-op + recurrent UTI", dxZh: "術後 · 反覆尿道炎", day: 21,
    risk: "stable", lives: "Lives with spouse · Tai Po", livesZh: "與配偶同住 · 大埔",
    call: { state: "done", time: "10:15", flag: "Feeling well, drinking plenty of water", flagZh: "狀態良好，多飲水" },
    riskNote: "Stable, near graduation from programme. Reinforce hydration to prevent UTI recurrence.",
    riskNoteZh: "穩定，接近結案，加強飲水以防尿道炎復發。",
    family: { name: "Ho Lai-fong (daughter)", zh: "何麗芳（女兒）", phone: "+852 9444 2323" },
    vitals: [
      { k: "Temp",  v: "36.6°C", t: "ok" },
      { k: "Fluid", v: "1.8 L",  t: "ok" },
      { k: "BP",    v: "122/78", t: "ok" },
    ],
    week: wk([
      [1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1],
    ]),
    plan: [
      { t: "Hydration — 1.5L+ per day", done: true },
      { t: "Complete antibiotic course", done: true },
      { t: "Discharge from programme — 28 Jun", done: false },
    ],
    timeline: [
      { time: "Today 10:15", tag: "call", en: "Feeling great, no symptoms. On track to graduate next week.", zh: "狀態極好，無症狀，下週可結案。" },
      { time: "Mon 11:00", tag: "family", en: "Daughter: went to morning tea together, walking fine.", zh: "女兒：一齊飲早茶，行得好。" },
    ],
  },
];

// today's visit schedule
const VISITS = [
  { id:"chan", time: "11:00", type: "Urgent home visit", typeZh: "緊急家訪", elder: "chan", where: "Kwun Tong", state: "due" },
  { id:"wong", time: "14:30", type: "Routine check-in", typeZh: "例行家訪", elder: "wong", where: "Sham Shui Po", state: "upcoming" },
  { id:"cheung", time: "16:00", type: "Pillbox setup", typeZh: "藥盒安排", elder: "cheung", where: "Wong Tai Sin", state: "upcoming" },
];

const WORKER = { name: "Karen Tsang", zh: "曾家欣", role: "Community geriatric nurse", roleZh: "社區老人科護士", team: "Kowloon East Transitional Care" };

Object.assign(window, { ACTS, DAYS, DAYS_ZH, ELDERS, VISITS, WORKER });
