let activeTab = "exam";
let audioContext;
let currentTimeText;
let examDateText;
let classScheduleList;
let autoBellToggle;
let pomodoroTimerText;
let pomodoroPhaseText;
let pomodoroRoundText;
let focusInput;
let breakInput;
let pomodoroStatusText;
let schedule = [
  { id: 1, start: "08:00", end: "08:50" },
  { id: 2, start: "09:00", end: "09:50" },
  { id: 3, start: "10:10", end: "11:00" }
];
let nextScheduleId = 4;
let autoBellEnabled = false;
let firedAlarms = new Set();
let pomodoro = {
  phase: "focus",
  focusMinutes: 25,
  breakMinutes: 5,
  remainingSeconds: 25 * 60,
  running: false,
  round: 1,
  lastTick: 0
};

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.elt.setAttribute("aria-hidden", "true");
  canvas.style("position", "fixed");
  canvas.style("inset", "0");
  canvas.style("z-index", "0");
  canvas.style("pointer-events", "none");
  injectStyles();
  buildInterface();
  updateClock();
  updateClassSchedule();
  updatePomodoroDisplay();
  setInterval(updateClock, 1000);
  setInterval(checkAutomaticBell, 1000);
}

function draw() {
  clear();
  noStroke();
  fill(218, 226, 255, 75);
  circle(width * 0.08, height * 0.13, 230);
  fill(220, 245, 235, 80);
  circle(width * 0.94, height * 0.82, 300);
  if (pomodoro.running) {
    const now = millis();
    if (pomodoro.lastTick === 0) pomodoro.lastTick = now;
    const elapsed = Math.floor((now - pomodoro.lastTick) / 1000);
    if (elapsed > 0) {
      pomodoro.remainingSeconds = Math.max(0, pomodoro.remainingSeconds - elapsed);
      pomodoro.lastTick += elapsed * 1000;
      updatePomodoroDisplay();
      if (pomodoro.remainingSeconds === 0) finishPomodoroPhase();
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function injectStyles() {
  const style = document.createElement("style");
  style.textContent = `
    :root { font-family: 'DM Sans', 'Noto Sans TC', sans-serif; color: #20273b; background: #f6f8fc; font-synthesis: none; }
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; }
    body { min-height: 100vh; background: linear-gradient(135deg, #f8f9fd 0%, #f2f6fb 100%); }
    button, input { font: inherit; }
    button { cursor: pointer; }
    .app-shell { position: relative; z-index: 1; width: min(100% - 40px, 1060px); margin: 0 auto; padding: 44px 0 60px; }
    .topline { display: flex; align-items: center; justify-content: space-between; margin-bottom: 27px; }
    .brand { display: flex; align-items: center; gap: 12px; font-size: 18px; font-weight: 800; letter-spacing: -.4px; }
    .brand-mark { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 14px; color: white; background: #5269df; box-shadow: 0 8px 20px #5269df36; font-size: 20px; }
    .eyebrow { color: #7b8499; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; }
    .tabs { display: flex; gap: 7px; padding: 6px; width: fit-content; margin: 0 auto 30px; border: 1px solid #e8ebf3; border-radius: 16px; background: #fff; box-shadow: 0 8px 30px #28334e0a; }
    .tab-button { min-height: 44px; padding: 0 22px; border: 0; border-radius: 11px; color: #788197; background: transparent; font-size: 14px; font-weight: 700; transition: .18s ease; }
    .tab-button:hover { color: #3349ba; background: #f4f6ff; }
    .tab-button.active { color: #fff; background: #5269df; box-shadow: 0 5px 13px #5269df38; }
    .panel { display: none; animation: appear .25s ease; }
    .panel.active { display: block; }
    @keyframes appear { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    .card { border: 1px solid #e9edf4; border-radius: 22px; background: #fff; box-shadow: 0 15px 42px #2636560c; }
    .clock-card { min-height: 435px; padding: 50px 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
    .icon-bubble { display: grid; place-items: center; width: 56px; height: 56px; margin-bottom: 20px; border-radius: 18px; background: #eef0ff; font-size: 25px; }
    .clock-title { margin: 0 0 8px; color: #29324b; font-size: 23px; font-weight: 700; }
    .clock-time { margin: 12px 0 8px; color: #303d75; font-size: clamp(66px, 12vw, 108px); font-variant-numeric: tabular-nums; font-weight: 700; letter-spacing: -6px; line-height: 1.1; }
    .clock-date { color: #7e879b; font-size: 16px; font-weight: 500; }
    .attendance-fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; width: min(100%, 600px); margin-top: 26px; }
    .attendance-field { display: flex; flex-direction: column; gap: 8px; padding: 14px; border: 1px solid #edf0f6; border-radius: 14px; background: #fbfcff; color: #68728a; font-size: 13px; font-weight: 700; }
    .attendance-input { width: 100%; min-width: 0; height: 42px; padding: 0 10px; border: 1px solid #e5e9f1; border-radius: 10px; outline: none; color: #303d75; background: #fff; font-size: 18px; font-variant-numeric: tabular-nums; font-weight: 700; text-align: center; }
    .attendance-input:focus { border-color: #7284e8; box-shadow: 0 0 0 3px #5269df18; }
    .clock-note { margin-top: 30px; color: #a0a7b7; font-size: 13px; }
    .section-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin: 0 0 22px; }
    .section-heading h1 { margin: 5px 0 0; font-size: 28px; letter-spacing: -.7px; }
    .section-heading p { margin: 7px 0 0; color: #858da0; font-size: 14px; }
    .bell-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 22px; }
    .bell-button { min-height: 120px; padding: 22px; border: 0; border-radius: 20px; color: #fff; text-align: left; box-shadow: 0 10px 24px #303b5820; transition: transform .18s, box-shadow .18s; }
    .bell-button:hover { transform: translateY(-2px); box-shadow: 0 14px 28px #303b582c; }
    .bell-button:active { transform: translateY(1px); }
    .bell-button.start { background: linear-gradient(135deg, #536cdf, #7183ef); }
    .bell-button.end { background: linear-gradient(135deg, #e89157, #f0aa6d); }
    .bell-symbol { display: block; margin-bottom: 9px; font-size: 25px; }
    .bell-label { display: block; font-size: 22px; font-weight: 800; }
    .bell-hint { display: block; margin-top: 4px; opacity: .84; font-size: 12px; }
    .schedule-card { padding: 24px; }
    .card-heading { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 19px; }
    .card-heading h2 { margin: 0; font-size: 17px; }
    .card-heading p { margin: 5px 0 0; color: #8c94a6; font-size: 12px; }
    .primary-button, .secondary-button, .danger-button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 40px; padding: 0 15px; border: 0; border-radius: 11px; font-size: 13px; font-weight: 700; transition: .16s; }
    .primary-button { color: white; background: #5269df; }
    .primary-button:hover { background: #4058ce; }
    .secondary-button { color: #4559c4; background: #edf0ff; }
    .secondary-button:hover { background: #e2e7ff; }
    .danger-button { color: #b35353; background: #fff0ef; }
    .danger-button:hover { background: #ffe2df; }
    .schedule-row { display: grid; grid-template-columns: 72px minmax(0, 1fr) minmax(0, 1fr) 38px; align-items: center; gap: 12px; padding: 12px 0; border-top: 1px solid #f0f2f7; }
    .period-label { color: #677188; font-size: 13px; font-weight: 700; }
    .time-input { width: 100%; min-height: 42px; padding: 0 10px; border: 1px solid #e5e9f1; border-radius: 10px; outline: none; color: #323c55; background: #fbfcfe; }
    .time-input:focus, .number-input:focus { border-color: #7284e8; box-shadow: 0 0 0 3px #5269df18; }
    .delete-button { width: 36px; height: 36px; border: 0; border-radius: 10px; color: #9299aa; background: transparent; font-size: 18px; }
    .delete-button:hover { color: #bd5353; background: #fff0ef; }
    .empty-schedule { padding: 26px 0 10px; color: #9299aa; text-align: center; font-size: 13px; }
    .switch-line { display: flex; align-items: center; justify-content: space-between; gap: 15px; margin-top: 20px; padding-top: 18px; border-top: 1px solid #f0f2f7; }
    .switch-title { font-size: 13px; font-weight: 700; }
    .switch-description { margin-top: 4px; color: #8b93a5; font-size: 12px; }
    .switch { position: relative; flex: 0 0 auto; width: 48px; height: 27px; }
    .switch input { position: absolute; width: 1px; height: 1px; opacity: 0; }
    .switch-track { position: absolute; inset: 0; border-radius: 20px; background: #d9deea; transition: .2s; cursor: pointer; }
    .switch-track:before { content: ''; position: absolute; top: 4px; left: 4px; width: 19px; height: 19px; border-radius: 50%; background: white; box-shadow: 0 1px 4px #1a244022; transition: .2s; }
    .switch input:checked + .switch-track { background: #5269df; }
    .switch input:checked + .switch-track:before { transform: translateX(21px); }
    .pomodoro-layout { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(255px, .75fr); gap: 20px; }
    .pomodoro-main { min-height: 444px; padding: 38px 26px 28px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
    .phase-pill { display: inline-flex; align-items: center; gap: 7px; padding: 8px 13px; border-radius: 30px; color: #4056c1; background: #eef0ff; font-size: 12px; font-weight: 800; }
    .phase-pill.break { color: #348465; background: #eaf7f1; }
    .pomodoro-time { margin: 21px 0 4px; color: #2e3c78; font-size: clamp(70px, 11vw, 100px); font-variant-numeric: tabular-nums; font-weight: 700; letter-spacing: -6px; line-height: 1.1; }
    .pomodoro-message { min-height: 21px; margin: 10px 0 23px; color: #888fa2; font-size: 13px; }
    .timer-controls { display: flex; flex-wrap: wrap; justify-content: center; gap: 9px; }
    .timer-controls button { min-width: 90px; min-height: 43px; }
    .round-indicator { margin-top: 25px; color: #858da0; font-size: 13px; }
    .round-indicator strong { color: #4658bd; }
    .settings-card { align-self: start; padding: 25px; }
    .settings-card h2 { margin: 0; font-size: 17px; }
    .settings-card > p { margin: 7px 0 21px; color: #8c94a6; font-size: 12px; line-height: 1.6; }
    .setting-field { display: block; margin-top: 17px; color: #5f6980; font-size: 13px; font-weight: 700; }
    .setting-input-wrap { display: flex; align-items: center; gap: 11px; margin-top: 8px; }
    .number-input { width: 100%; height: 44px; padding: 0 12px; border: 1px solid #e5e9f1; border-radius: 10px; outline: none; color: #303a53; background: #fbfcfe; }
    .input-unit { flex: 0 0 auto; color: #8a92a4; font-size: 12px; font-weight: 500; }
    .settings-divider { height: 1px; margin: 22px 0 18px; background: #eff1f6; }
    .save-note { min-height: 16px; margin-top: 11px; color: #858da0; font-size: 11px; }
    .footer-note { margin-top: 20px; color: #a0a7b7; text-align: center; font-size: 11px; }
    @media (max-width: 680px) {
      .app-shell { width: min(100% - 28px, 520px); padding-top: 23px; }
      .topline { margin-bottom: 20px; }
      .brand { font-size: 16px; }
      .tabs { display: grid; grid-template-columns: repeat(3, 1fr); width: 100%; margin-bottom: 21px; }
      .tab-button { padding: 0 8px; font-size: 12px; }
      .section-heading { align-items: flex-start; flex-direction: column; }
      .section-heading h1 { font-size: 24px; }
      .bell-actions { gap: 10px; }
      .bell-button { min-height: 110px; padding: 16px; }
      .bell-label { font-size: 19px; }
      .schedule-card { padding: 18px; }
      .schedule-row { grid-template-columns: 58px minmax(0, 1fr) minmax(0, 1fr) 30px; gap: 7px; }
      .pomodoro-layout { grid-template-columns: 1fr; }
      .pomodoro-main { min-height: 385px; padding: 30px 18px 24px; }
      .settings-card { width: 100%; }
      .clock-card { min-height: 390px; }
      .attendance-fields { gap: 7px; margin-top: 22px; }
      .attendance-field { gap: 7px; padding: 10px 7px; font-size: 11px; }
      .attendance-input { height: 40px; padding: 0 5px; font-size: 17px; }
      .clock-note { margin-top: 22px; }
    }
    @media (prefers-reduced-motion: reduce) { *, *:before, *:after { animation-duration: .01ms !important; transition-duration: .01ms !important; } }
  `;
  document.head.appendChild(style);
}

function buildInterface() {
  document.body.insertAdjacentHTML("beforeend", `
    <main class="app-shell">
      <header class="topline">
        <div class="brand"><span class="brand-mark">◷</span><span>校園時間管理</span></div>
        <span class="eyebrow">TIME WELL SPENT</span>
      </header>
      <nav class="tabs" aria-label="計時功能">
        <button class="tab-button active" data-tab="exam" type="button">考試大鐘</button>
        <button class="tab-button" data-tab="class" type="button">上下課鐘</button>
        <button class="tab-button" data-tab="pomodoro" type="button">讀書番茄鐘</button>
      </nav>
      <section class="panel active" id="panel-exam" aria-label="考試大鐘">
        <div class="card clock-card">
          <span class="icon-bubble">◷</span>
          <p class="eyebrow">EXAM CLOCK</p>
          <h1 class="clock-title">考試大鐘</h1>
          <div class="clock-time" id="current-time" aria-live="off">--:--:--</div>
          <div class="clock-date" id="exam-date"></div>
          <div class="attendance-fields" role="group" aria-label="考試人數">
            <label class="attendance-field" for="attendance-required">應到人數
              <input class="attendance-input" id="attendance-required" type="number" min="0" step="1" value="0" inputmode="numeric">
            </label>
            <label class="attendance-field" for="attendance-present">實到人數
              <input class="attendance-input" id="attendance-present" type="number" min="0" step="1" value="0" inputmode="numeric">
            </label>
            <label class="attendance-field" for="attendance-absent">缺考人數
              <input class="attendance-input" id="attendance-absent" type="number" min="0" step="1" value="0" inputmode="numeric">
            </label>
          </div>
          <p class="clock-note">專心應試，掌握每分每秒</p>
        </div>
      </section>
      <section class="panel" id="panel-class" aria-label="上下課鐘">
        <div class="section-heading">
          <div><span class="eyebrow">SCHOOL BELL</span><h1>上下課鐘</h1><p>手動播放鈴聲，或依課表自動提醒。</p></div>
        </div>
        <div class="bell-actions">
          <button class="bell-button start" id="ring-start" type="button"><span class="bell-symbol">♬</span><span class="bell-label">上課鈴</span><span class="bell-hint">播放上課鐘聲</span></button>
          <button class="bell-button end" id="ring-end" type="button"><span class="bell-symbol">♫</span><span class="bell-label">下課鈴</span><span class="bell-hint">播放下課鐘聲</span></button>
        </div>
        <div class="card schedule-card">
          <div class="card-heading">
            <div><h2>每日課表</h2><p>設定每一節的上課與下課時間</p></div>
            <button class="primary-button" id="add-period" type="button">＋ 新增一節</button>
          </div>
          <div id="schedule-list"></div>
          <div class="switch-line">
            <div><div class="switch-title">自動打鐘</div><div class="switch-description">時間到時自動播放對應鈴聲</div></div>
            <label class="switch" aria-label="啟用自動打鐘"><input id="auto-bell-toggle" type="checkbox"><span class="switch-track"></span></label>
          </div>
        </div>
        <p class="footer-note">首次使用時，請先按任一鈴聲按鈕以啟用瀏覽器音效。</p>
      </section>
      <section class="panel" id="panel-pomodoro" aria-label="讀書番茄鐘">
        <div class="section-heading">
          <div><span class="eyebrow">POMODORO TIMER</span><h1>讀書番茄鐘</h1><p>專注一段時間，再好好休息一下。</p></div>
        </div>
        <div class="pomodoro-layout">
          <div class="card pomodoro-main">
            <span class="phase-pill" id="phase-pill">● 專注時間</span>
            <div class="pomodoro-time" id="pomodoro-time" aria-live="off">25:00</div>
            <p class="pomodoro-message" id="pomodoro-status">準備好了嗎？開始你的專注時光。</p>
            <div class="timer-controls">
              <button class="primary-button" id="pomodoro-start" type="button">▶ 開始</button>
              <button class="secondary-button" id="pomodoro-reset" type="button">↺ 重設</button>
              <button class="secondary-button" id="pomodoro-skip" type="button">跳過 →</button>
            </div>
            <div class="round-indicator">目前第 <strong id="pomodoro-round">1</strong> 輪</div>
          </div>
          <aside class="card settings-card">
            <h2>時間設定</h2><p>依照自己的讀書節奏調整專注與休息時間。</p>
            <label class="setting-field" for="focus-minutes">專注時間</label>
            <div class="setting-input-wrap"><input class="number-input" id="focus-minutes" type="number" min="1" max="180" value="25"><span class="input-unit">分鐘</span></div>
            <label class="setting-field" for="break-minutes">休息時間</label>
            <div class="setting-input-wrap"><input class="number-input" id="break-minutes" type="number" min="1" max="60" value="5"><span class="input-unit">分鐘</span></div>
            <button class="primary-button" id="save-settings" type="button" style="width:100%; margin-top:20px">套用設定</button>
            <div class="save-note" id="settings-note">預設：專注 25 分鐘・休息 5 分鐘</div>
            <div class="settings-divider"></div>
            <span class="eyebrow">FOCUS · REST · REPEAT</span>
          </aside>
        </div>
      </section>
    </main>
  `);

  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.tab));
  });
  document.getElementById("ring-start").addEventListener("click", () => playBell("start"));
  document.getElementById("ring-end").addEventListener("click", () => playBell("end"));
  document.getElementById("add-period").addEventListener("click", addSchedulePeriod);
  autoBellToggle = document.getElementById("auto-bell-toggle");
  autoBellToggle.addEventListener("change", async () => {
    autoBellEnabled = autoBellToggle.checked;
    if (autoBellEnabled) {
      await getAudioContext();
      checkAutomaticBell();
    }
  });
  pomodoroTimerText = document.getElementById("pomodoro-time");
  pomodoroPhaseText = document.getElementById("phase-pill");
  pomodoroRoundText = document.getElementById("pomodoro-round");
  pomodoroStatusText = document.getElementById("pomodoro-status");
  focusInput = document.getElementById("focus-minutes");
  breakInput = document.getElementById("break-minutes");
  document.getElementById("pomodoro-start").addEventListener("click", togglePomodoro);
  document.getElementById("pomodoro-reset").addEventListener("click", resetPomodoro);
  document.getElementById("pomodoro-skip").addEventListener("click", () => changePomodoroPhase(true));
  document.getElementById("save-settings").addEventListener("click", applyPomodoroSettings);
  currentTimeText = document.getElementById("current-time");
  examDateText = document.getElementById("exam-date");
  classScheduleList = document.getElementById("schedule-list");
}

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll(".tab-button").forEach((button) => {
    const isActive = button.dataset.tab === tab;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
  document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
  document.getElementById(`panel-${tab}`).classList.add("active");
}

function updateClock() {
  if (!currentTimeText || !examDateText) return;
  const now = new Date();
  currentTimeText.textContent = now.toLocaleTimeString("zh-TW", { hour12: false });
  examDateText.textContent = new Intl.DateTimeFormat("zh-TW", {
    year: "numeric", month: "long", day: "numeric", weekday: "long"
  }).format(now);
}

function updateClassSchedule() {
  if (!classScheduleList) return;
  classScheduleList.replaceChildren();
  if (schedule.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-schedule";
    empty.textContent = "目前沒有課節，按「新增一節」來建立課表。";
    classScheduleList.appendChild(empty);
    return;
  }
  schedule.forEach((period, index) => {
    const row = document.createElement("div");
    row.className = "schedule-row";
    const label = document.createElement("span");
    label.className = "period-label";
    label.textContent = `第 ${index + 1} 節`;
    row.appendChild(label);
    row.appendChild(createTimeInput(period, "start", "上課時間"));
    row.appendChild(createTimeInput(period, "end", "下課時間"));
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "delete-button";
    removeButton.textContent = "×";
    removeButton.setAttribute("aria-label", `刪除第 ${index + 1} 節`);
    removeButton.addEventListener("click", () => {
      schedule = schedule.filter((item) => item.id !== period.id);
      updateClassSchedule();
    });
    row.appendChild(removeButton);
    classScheduleList.appendChild(row);
  });
}

function createTimeInput(period, key, label) {
  const input = document.createElement("input");
  input.type = "time";
  input.className = "time-input";
  input.value = period[key];
  input.setAttribute("aria-label", `第 ${schedule.indexOf(period) + 1} 節${label}`);
  input.addEventListener("change", () => {
    period[key] = input.value;
  });
  return input;
}

function addSchedulePeriod() {
  const lastPeriod = schedule[schedule.length - 1];
  const defaultStart = lastPeriod ? addMinutes(lastPeriod.end, 10) : "08:00";
  schedule.push({ id: nextScheduleId++, start: defaultStart, end: addMinutes(defaultStart, 50) });
  updateClassSchedule();
}

function addMinutes(time, minutes) {
  const [hour, minute] = time.split(":").map(Number);
  const total = (hour * 60 + minute + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function checkAutomaticBell() {
  if (!autoBellEnabled) return;
  const now = new Date();
  const today = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const current = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  schedule.forEach((period) => {
    [["start", "start"], ["end", "end"]].forEach(([key, bellType]) => {
      if (period[key] !== current) return;
      const alarmKey = `${today}-${period.id}-${key}-${current}`;
      if (firedAlarms.has(alarmKey)) return;
      firedAlarms.add(alarmKey);
      playBell(bellType);
    });
  });
  if (firedAlarms.size > 1000) firedAlarms.clear();
}

async function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("此瀏覽器不支援 Web Audio API，無法播放鈴聲。");
  }
  if (!audioContext) audioContext = new AudioContextClass();
  if (audioContext.state === "suspended") await audioContext.resume();
  return audioContext;
}

async function playBell(type) {
  try {
    const context = await getAudioContext();
    const startAt = context.currentTime + 0.03;
    const notes = type === "start"
      ? [{ frequency: 880, duration: 0.3 }, { frequency: 1174.66, duration: 0.3 }, { frequency: 880, duration: 0.55 }]
      : [{ frequency: 784, duration: 0.35 }, { frequency: 659.25, duration: 0.35 }, { frequency: 523.25, duration: 0.6 }];
    notes.forEach((note, index) => {
      const onset = startAt + index * 0.39;
      [1, 2.76].forEach((partial, partialIndex) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = partialIndex === 0 ? "sine" : "triangle";
        oscillator.frequency.setValueAtTime(note.frequency * partial, onset);
        gain.gain.setValueAtTime(0.0001, onset);
        gain.gain.exponentialRampToValueAtTime(partialIndex === 0 ? 0.22 : 0.045, onset + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, onset + note.duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(onset);
        oscillator.stop(onset + note.duration + 0.02);
      });
    });
  } catch (error) {
    console.error("鈴聲播放失敗：", error);
    if (pomodoroStatusText) pomodoroStatusText.textContent = error.message;
  }
}

function togglePomodoro() {
  if (pomodoro.running) {
    pomodoro.running = false;
    pomodoro.lastTick = 0;
    pomodoroStatusText.textContent = "已暫停，準備好時可以繼續。";
  } else {
    pomodoro.running = true;
    pomodoro.lastTick = millis();
    pomodoroStatusText.textContent = pomodoro.phase === "focus" ? "專注中，保持節奏！" : "休息一下，補充能量。";
  }
  updatePomodoroDisplay();
}

function resetPomodoro() {
  pomodoro.running = false;
  pomodoro.lastTick = 0;
  pomodoro.remainingSeconds = getCurrentPhaseDuration();
  pomodoroStatusText.textContent = "計時已重設，準備好了就開始。";
  updatePomodoroDisplay();
}

function applyPomodoroSettings() {
  const focus = Number(focusInput.value);
  const rest = Number(breakInput.value);
  if (!Number.isInteger(focus) || focus < 1 || focus > 180 ||
      !Number.isInteger(rest) || rest < 1 || rest > 60) {
    document.getElementById("settings-note").textContent = "請輸入有效分鐘數：專注 1–180、休息 1–60。";
    document.getElementById("settings-note").style.color = "#b35353";
    return;
  }
  pomodoro.focusMinutes = focus;
  pomodoro.breakMinutes = rest;
  pomodoro.running = false;
  pomodoro.lastTick = 0;
  pomodoro.remainingSeconds = getCurrentPhaseDuration();
  document.getElementById("settings-note").textContent = "設定已套用；目前計時已重設。";
  document.getElementById("settings-note").style.color = "#348465";
  pomodoroStatusText.textContent = "時間設定已更新，準備開始。";
  updatePomodoroDisplay();
}

function getCurrentPhaseDuration() {
  return (pomodoro.phase === "focus" ? pomodoro.focusMinutes : pomodoro.breakMinutes) * 60;
}

function finishPomodoroPhase() {
  playBell("end");
  changePomodoroPhase(false);
}

function changePomodoroPhase(skipped) {
  const wasFocus = pomodoro.phase === "focus";
  if (wasFocus) {
    pomodoro.phase = "break";
  } else {
    pomodoro.phase = "focus";
    pomodoro.round += 1;
  }
  pomodoro.remainingSeconds = getCurrentPhaseDuration();
  pomodoro.running = !skipped;
  pomodoro.lastTick = pomodoro.running ? millis() : 0;
  pomodoroStatusText.textContent = skipped
    ? (wasFocus ? "已跳過專注，休息時間開始。" : "已跳過休息，開始新一輪專注。")
    : (wasFocus ? "專注完成！休息時間開始。" : "休息結束！新一輪專注開始。");
  if (skipped) playBell("end");
  updatePomodoroDisplay();
}

function updatePomodoroDisplay() {
  if (!pomodoroTimerText) return;
  const minutes = Math.floor(pomodoro.remainingSeconds / 60);
  const seconds = pomodoro.remainingSeconds % 60;
  pomodoroTimerText.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  pomodoroPhaseText.textContent = pomodoro.phase === "focus" ? "● 專注時間" : "● 休息時間";
  pomodoroPhaseText.classList.toggle("break", pomodoro.phase === "break");
  pomodoroRoundText.textContent = String(pomodoro.round);
  document.getElementById("pomodoro-start").textContent = pomodoro.running ? "Ⅱ 暫停" : "▶ 開始";
}
