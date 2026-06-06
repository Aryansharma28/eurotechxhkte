/* CareBridge — Family app (adult child view of their parent) */

function FamilyApp() {
  const [lang, setLang] = React.useState("en");
  const t = (en, zh) => (lang === "zh" ? zh : en);

  const acts = [
    { ic: "pill",  en: "Medication", zh: "服藥", state: "done" },
    { ic: "meal",  en: "Breakfast",  zh: "早餐", state: "done" },
    { ic: "walk",  en: "Walked",     zh: "活動", state: "done" },
    { ic: "water", en: "Hydration",  zh: "飲水", state: "soft" },
    { ic: "sleep", en: "Slept well", zh: "睡眠", state: "done" },
    { ic: "mood",  en: "Good mood",  zh: "情緒", state: "done" },
  ];
  const week = [1,1,1,1,1,1,1];

  return (
    <div className="fam">
      <div className="fam-scroll">
        <div className="fam-head">
          <div className="fam-hi">{t("Good morning,", "早晨，")}<b>{t("Ka-yan", "嘉欣")}</b></div>
          <div className="fam-lang">
            <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
            <button className={lang === "zh" ? "on" : ""} onClick={() => setLang("zh")}>中</button>
          </div>
        </div>

        {/* hero */}
        <div className="fam-hero">
          <div className="fav">
            <span className="ava">黃</span>
            <div>
              <div className="fnm">{t("Mum · Mei-ling", "媽媽 · 美玲")}</div>
              <div className="fsub">{t("Day 8 home · recovering from pneumonia", "在家第 8 天 · 肺炎康復中")}</div>
            </div>
          </div>
          <div className="fstatus">{t("She's okay today 💚", "今日狀態不錯 💚")}</div>
          <span className="fwhen">{I.phone}{t("Check-in call done · 9:32 AM", "已完成今早通話 · 9:32")}</span>
        </div>

        {/* gentle note */}
        <div className="fam-note">
          <div className="ni">{I.alert}</div>
          <div>
            <div className="nt">{t("One thing to know", "一件事")}</div>
            <div className="nb">{t("Mum felt a little dizzy when standing this morning. Nurse Karen has already been notified and is keeping an eye on it.", "媽媽今早起身時有少少頭暈。社工家欣已經知道，會繼續留意。")}</div>
          </div>
        </div>

        {/* today's call summary */}
        <div className="fam-card">
          <div className="fct">{t("From today's call", "今早通話摘要")}</div>
          <div className="fsummary">{t("“Took my inhaler and ate congee for breakfast. Bit dizzy getting up but okay now. Watched the news.”", "「食咗吸入器，早餐食粥。起身有少少暈，而家無事。睇咗新聞。」")}</div>
        </div>

        {/* activities */}
        <div className="fam-card">
          <div className="fct">{t("Today's activities", "今日活動")}</div>
          <div className="fam-acts">
            {acts.map((a, i) => (
              <div key={i} className={"fam-act " + a.state}>
                <span className="fai">
                  {I[a.ic]}
                  {a.state === "done" && <span className="fcheck">{I.check}</span>}
                </span>
                <span className="fal">{t(a.en, a.zh)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* week */}
        <div className="fam-card">
          <div className="fct">{t("Check-ins this week", "本週通話")}</div>
          <div className="fam-week">
            {["M","T","W","T","F","S","S"].map((d, i) => (
              <div key={i} className={"fam-day " + (i === 6 ? "today" : "")}>
                <span className="fd">{t(d, ["一","二","三","四","五","六","日"][i])}</span>
                <span className={"fdot " + (week[i] ? "done" : "")}>{week[i] ? I.check : ""}</span>
              </div>
            ))}
          </div>
        </div>

        {/* how to help */}
        <div className="fam-help">
          <div className="fht">{t("How you can help today", "今日你可以點幫手")}</div>
          <div className="fhb">{t("If you visit, remind her to sit up slowly and keep drinking water. A short walk together would be lovely.", "如果你過去，提媽媽慢慢起身、多飲水。陪佢散下步就最好。")}</div>
        </div>
      </div>

      {/* sticky actions */}
      <div className="fam-actions">
        <button className="fam-btn call">{I.phone}{t("Call Mum", "打電話畀媽媽")}</button>
        <button className="fam-btn msg">{I.chat}{t("Message nurse", "聯絡社工")}</button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <div className="fam-stage">
    <IOSDevice width={390} height={800}>
      <FamilyApp />
    </IOSDevice>
    <div className="fam-cap">CareBridge · <b>Family app</b> — the adult child's view of their parent</div>
  </div>
);
