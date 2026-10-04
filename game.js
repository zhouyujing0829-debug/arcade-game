/* ============================================================
   BALLOON BLASTER — Arcade To-Do Game
   Pure HTML + CSS + JavaScript. No libraries.
   ============================================================ */
"use strict";

/* ---------------- DOM helpers ---------------- */
const $ = (id) => document.getElementById(id);
const screens = {
  attract: $("attract-screen"),
  howto: $("howto-screen"),
  entry: $("entry-screen"),
  shop: $("shop-screen"),
  game: $("game-screen"),
};

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove("visible"));
  screens[name].classList.add("visible");
  if (name === "game") resizeCanvas();
}

/* ---------------- Persistent data ---------------- */
const STORE_KEY = "balloonBlaster.v2";
const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
let hiScore = saved.hiScore || 0;
let tasksCleared = saved.tasksCleared || 0;
let muted = !!saved.muted;
let points = saved.points || 0;                       // shop currency (10 / finished task)
let owned = new Set(saved.owned || ["theme-neon", "skin-classic"]); // default items are free
let equippedTheme = saved.equippedTheme || "theme-neon";
let equippedSkin = saved.equippedSkin || "skin-classic";
let lastBonusDate = saved.lastBonusDate || "";  // local date key of last daily-bonus claim

function persist() {
  localStorage.setItem(STORE_KEY, JSON.stringify({
    hiScore, tasksCleared, muted, points,
    owned: [...owned], equippedTheme, equippedSkin, lastBonusDate,
  }));
}

/* ============================================================
   SHOP CATALOG: website themes + balloon skins
   ============================================================ */
const THEMES = [
  { id: "theme-neon", name: "NEON ARCADE", price: 0,
    prev: { bg: "linear-gradient(160deg,#0a0118,#3d0a4e)", dots: ["#00f6ff", "#ff2e97", "#ffe600"] } },
  { id: "theme-synthwave", name: "SYNTHWAVE", price: 120,
    prev: { bg: "linear-gradient(160deg,#0a0022,#0a2a8a)", dots: ["#21f3ff", "#ff2bb0", "#ffd400"] } },
  { id: "theme-gameboy", name: "RETRO GREEN", price: 160,
    prev: { bg: "linear-gradient(160deg,#08170a,#1c4a1c)", dots: ["#5dff21", "#a8ff60", "#c6ff00"] } },
  { id: "theme-ice", name: "MIDNIGHT ICE", price: 200,
    prev: { bg: "linear-gradient(160deg,#05122a,#14406e)", dots: ["#7fdfff", "#7aa8ff", "#8affc1"] } },
  { id: "theme-sunset", name: "SUNSET BLASTER", price: 260,
    prev: { bg: "linear-gradient(160deg,#26061a,#7a2a0a)", dots: ["#ff2e6a", "#ffcc33", "#ff8a5c"] } },
];

const SKINS = [
  { id: "skin-classic", name: "CLASSIC MIX", price: 0, palette: [
    { body: "#ff2e97", dark: "#8c0d4c", light: "#ffa0cd" },
    { body: "#00f6ff", dark: "#06607a", light: "#8ffcff" },
    { body: "#ffe600", dark: "#8a7400", light: "#fff79e" },
    { body: "#39ff6a", dark: "#10943a", light: "#b0ffca" },
    { body: "#9d4dff", dark: "#4d1a99", light: "#d3b3ff" },
    { body: "#ff7a2e", dark: "#8f3708", light: "#ffc49e" },
    { body: "#ff5e5e", dark: "#8f1616", light: "#ffb3b3" },
    { body: "#5eff8a", dark: "#0f7a35", light: "#c0ffd3" },
  ]},
  { id: "skin-pastel", name: "PASTEL POP", price: 80, palette: [
    { body: "#ffb3d9", dark: "#b3699a", light: "#ffe0f0" },
    { body: "#b3e0ff", dark: "#6b9fc4", light: "#e0f2ff" },
    { body: "#fff0b3", dark: "#c4b36b", light: "#fffbe0" },
    { body: "#b3ffcc", dark: "#6bc490", light: "#e0ffef" },
    { body: "#d9b3ff", dark: "#9a6bc4", light: "#f0e0ff" },
    { body: "#ffd9b3", dark: "#c49a6b", light: "#fff0e0" },
    { body: "#b3b3ff", dark: "#6b6bc4", light: "#e0e0ff" },
    { body: "#e0b3ff", dark: "#a56bc4", light: "#f5e0ff" },
  ]},
  { id: "skin-chrome", name: "CHROME", price: 150, palette: [
    { body: "#cfd8e3", dark: "#4a5566", light: "#ffffff" },
    { body: "#9aa7bd", dark: "#38414f", light: "#dbe4f0" },
    { body: "#e4ecf5", dark: "#6a7688", light: "#ffffff" },
    { body: "#7f8ca3", dark: "#2c3543", light: "#c2cddd" },
    { body: "#b8c4d6", dark: "#454f5e", light: "#eef4fb" },
    { body: "#8899ad", dark: "#333d4a", light: "#d3dcea" },
    { body: "#d6deea", dark: "#5a6472", light: "#ffffff" },
    { body: "#6b7a90", dark: "#28313d", light: "#b3c0d1" },
  ]},
  { id: "skin-neon", name: "VOLT NEON", price: 220, palette: [
    { body: "#ff008c", dark: "#8c004b", light: "#ff7cc2" },
    { body: "#00ff88", dark: "#00884a", light: "#7dffc0" },
    { body: "#00ccff", dark: "#006d8c", light: "#7de6ff" },
    { body: "#ffee00", dark: "#8c8500", light: "#fff67d" },
    { body: "#c400ff", dark: "#6a008c", light: "#e07dff" },
    { body: "#ff5500", dark: "#8c2e00", light: "#ffab7d" },
    { body: "#ff00ee", dark: "#8c0080", light: "#ff7de6" },
    { body: "#00ffea", dark: "#008c80", light: "#7dfff6" },
  ]},
  { id: "skin-candy", name: "CANDY SHOP", price: 300, palette: [
    { body: "#ff6fb5", dark: "#9e2c66", light: "#ffc2e0" },
    { body: "#6fb5ff", dark: "#2c669e", light: "#c2e0ff" },
    { body: "#ffe06f", dark: "#9e842c", light: "#fff5c2" },
    { body: "#6fff9e", dark: "#2c9e55", light: "#c2ffdb" },
    { body: "#c56fff", dark: "#662c9e", light: "#e0c2ff" },
    { body: "#ff9e6f", dark: "#9e552c", light: "#ffdbc2" },
    { body: "#6fffe8", dark: "#2c9e8c", light: "#c2fff5" },
    { body: "#ff6f6f", dark: "#9e2c2c", light: "#ffc2c2" },
  ]},
];

function currentSkinPalette() {
  const s = SKINS.find((x) => x.id === equippedSkin);
  return s ? s.palette : SKINS[0].palette;
}

function applyTheme() {
  document.documentElement.setAttribute("data-theme", equippedTheme);
}

/* ---------------- Preset task pool ("Surprise Me" ideas) ---------------- */
const TASK_POOL = [
  "Drink a full glass of water",
  "Do 10 jumping jacks",
  "Tidy your desk for 5 minutes",
  "Write tomorrow's to-do list",
  "Stretch for 3 minutes",
  "Text a friend you miss",
  "Take 5 slow deep breaths",
  "Put your phone away for 15 min",
  "Make your bed",
  "Sort your inbox for 5 min",
  "Step outside and look at the sky",
  "Write 3 things you're grateful for",
  "Do 20 push-ups",
  "Clean one drawer or shelf",
  "Plan your next meal properly",
  "Set out clothes for tomorrow",
  "Wipe down your kitchen counter",
  "Save one small expense today",
  "Read 5 pages of a book",
  "Listen to a song you love",
  "Stand up and walk for 2 minutes",
  "Unfollow one toxic account",
  "Charge your devices fully",
  "Write down one goal for the week",
  "Wash your face and refresh",
  "Do a 2-minute plank challenge",
  "Name one thing you'll say no to",
  "Backup important photos or files",
  "Water a plant",
  "Draw or doodle anything for 2 min",
  "Compliment someone sincerely",
  "Empty one bag of clutter",
  "Learn one new word or shortcut",
  "Sit in silence for 2 minutes",
  "Roll your shoulders, fix posture",
  "Pick an outfit you feel great in",
  "Reply to that one old message",
  "Do 15 squats right now",
  "Write one idea worth stealing",
  "Look at a far object for 20 sec",
];

const BALLOON_COLORS = [
  { body: "#ff2e97", dark: "#8c0d4c", light: "#ffa0cd" },
  { body: "#00f6ff", dark: "#06607a", light: "#8ffcff" },
  { body: "#ffe600", dark: "#8a7400", light: "#fff79e" },
  { body: "#39ff6a", dark: "#10943a", light: "#b0ffca" },
  { body: "#9d4dff", dark: "#4d1a99", light: "#d3b3ff" },
  { body: "#ff7a2e", dark: "#8f3708", light: "#ffc49e" },
  { body: "#ff5e5e", dark: "#8f1616", light: "#ffb3b3" },
  { body: "#5eff8a", dark: "#0f7a35", light: "#c0ffd3" },
];

const TASK_COUNT = 8;
const MAG_SIZE = 6;
const RELOAD_MS = 1100;
const POINTS_PER_TASK = 10; // shop currency earned per finished task
const DAILY_BONUS = 100;    // shop currency awarded once per calendar day

/* ============================================================
   AUDIO ENGINE (WebAudio, synthesized arcade sounds)
   ============================================================ */
let actx = null;
let bgmTimer = null;
let bgmStep = 0;

function initAudio() {
  if (!actx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) actx = new AC();
  }
  if (actx && actx.state === "suspended") actx.resume();
}

function tone(freq, dur, type = "square", vol = 0.15, slideTo = null, delay = 0) {
  if (!actx || muted) return;
  const t0 = actx.currentTime + delay;
  const osc = actx.createOscillator();
  const g = actx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g).connect(actx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(dur, vol = 0.2, freq = 1200, delay = 0) {
  if (!actx || muted) return;
  const t0 = actx.currentTime + delay;
  const len = Math.max(1, Math.floor(actx.sampleRate * dur));
  const buf = actx.createBuffer(1, len, actx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = actx.createBufferSource();
  src.buffer = buf;
  const filter = actx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  const g = actx.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(filter).connect(g).connect(actx.destination);
  src.start(t0);
}

const SFX = {
  shoot() { noise(0.08, 0.25, 900); tone(880, 0.08, "square", 0.08, 220); },
  pop() { noise(0.18, 0.35, 1800); tone(500, 0.15, "triangle", 0.2, 90); },
  locked() { tone(160, 0.12, "square", 0.18); tone(120, 0.15, "square", 0.18, 100, 0.1); },
  miss() { tone(200, 0.2, "sawtooth", 0.1, 80); },
  reload() { tone(300, 0.06, "square", 0.12, 500); tone(600, 0.08, "square", 0.12, 300, 0.12); },
  done() {
    // coin arpeggio
    tone(988, 0.09, "square", 0.16);
    tone(1319, 0.28, "square", 0.16, null, 0.09);
  },
  skip() { tone(400, 0.15, "triangle", 0.15, 200); },
  clear() {
    const notes = [523, 659, 784, 1047, 784, 1047, 1319];
    notes.forEach((n, i) => tone(n, 0.22, "square", 0.16, null, i * 0.13));
  },
  gameover() {
    const notes = [440, 415, 392, 370, 349, 330, 311, 262];
    notes.forEach((n, i) => tone(n, 0.3, "square", 0.14, null, i * 0.14));
  },
  uiClick() { tone(700, 0.05, "square", 0.1, 900); },
};

/* Simple chiptune background loop */
const BGM_BASS = [131, 131, 196, 196, 175, 175, 165, 165]; // C G F E
const BGM_LEAD = [523, 0, 659, 0, 784, 0, 659, 0, 587, 0, 698, 0, 587, 0, 523, 0];

function startBGM() {
  stopBGM();
  bgmStep = 0;
  bgmTimer = setInterval(() => {
    if (muted || !actx || game.paused || game.phase !== "playing") return;
    const lead = BGM_LEAD[bgmStep % BGM_LEAD.length];
    const bass = BGM_BASS[Math.floor(bgmStep / 2) % BGM_BASS.length];
    if (lead) tone(lead, 0.16, "square", 0.035);
    tone(bass, 0.3, "triangle", 0.05);
    bgmStep++;
  }, 220);
}
function stopBGM() {
  if (bgmTimer) clearInterval(bgmTimer);
  bgmTimer = null;
}

/* ============================================================
   GAME STATE
   ============================================================ */
const canvas = $("game-canvas");
const ctx = canvas.getContext("2d");
const floatLayer = $("float-layer");

const game = {
  phase: "menu", // menu | playing | paused | over
  paused: false,
  score: 0,
  combo: 1,
  ammo: MAG_SIZE,
  reloading: false,
  reloadStart: 0,
  shotsFired: 0,
  shotsHit: 0,
  tasks: [], // { text, state: 'locked'|'active'|'done' }
  balloons: [],
  particles: [],
  bullets: [],
  shake: 0,
  time: 0,
  stars: [],
};

let aim = { x: 0, y: 0, inside: false };

/* ---------------- Canvas sizing ---------------- */
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = $("stage").getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  buildStars(rect.width, rect.height);
  layoutBalloons(rect.width, rect.height);
}
window.addEventListener("resize", () => {
  if (screens.game.classList.contains("visible")) resizeCanvas();
});

function buildStars(w, h) {
  game.stars = [];
  for (let i = 0; i < 60; i++) {
    game.stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.6 + 0.4,
      tw: Math.random() * Math.PI * 2,
    });
  }
}

/* ---------------- Balloons ---------------- */
function layoutBalloons(w, h) {
  const n = game.balloons.length;
  if (!n) return;
  const usableW = w > 800 ? w - 240 : w; // leave room for mission panel on desktop
  const cols = 4;
  const rows = Math.ceil(n / cols);
  const cellW = usableW / cols;
  const topPad = 60;
  const areaH = Math.max(160, h * 0.55 - topPad);
  game.balloons.forEach((b, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    b.baseX = cellW * col + cellW / 2 + (row % 2 ? cellW * 0.22 : -cellW * 0.1);
    b.baseY = topPad + (areaH / rows) * row + areaH / rows / 2;
    b.rx = Math.min(46, cellW * 0.32);
    b.ry = b.rx * 1.22;
    b.phase = (i * 1.7) % (Math.PI * 2);
    b.x = b.baseX;
    b.y = b.baseY;
  });
}

function createBalloons(tasks) {
  const pal = currentSkinPalette();
  game.balloons = tasks.map((t, i) => ({
    idx: i,
    color: pal[i % pal.length],
    baseX: 0, baseY: 0, x: 0, y: 0,
    rx: 42, ry: 52,
    phase: 0,
    wobble: 0, // hit-but-locked wobble
    alive: true,
    popT: -1,
  }));
}

function nextLockedIndex() {
  return game.tasks.findIndex((t) => t.state === "locked");
}

/* ---------------- Bullets & particles ---------------- */
function fireBullet(tx, ty) {
  const rect = $("stage").getBoundingClientRect();
  const sx = rect.width / 2;
  const sy = rect.height - 20;
  const dx = tx - sx, dy = ty - sy;
  const dist = Math.hypot(dx, dy) || 1;
  const speed = 1600; // px per second
  game.bullets.push({
    x: sx, y: sy,
    vx: (dx / dist) * speed,
    vy: (dy / dist) * speed,
    tx, ty,
    traveled: 0,
    maxTravel: dist + 20,
  });
  game.shotsFired++;
  SFX.shoot();
  // recoil
  const gun = $("gun");
  gun.classList.add("recoil");
  setTimeout(() => gun.classList.remove("recoil"), 90);
}

function spawnPop(x, y, color) {
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = Math.random() * 260 + 60;
    game.particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 80,
      r: Math.random() * 4 + 2,
      color: Math.random() < 0.5 ? color.body : color.light,
      life: 1,
      decay: Math.random() * 1.4 + 0.9,
      grav: 420,
    });
  }
  // confetti ribbons
  for (let i = 0; i < 8; i++) {
    game.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 180,
      vy: -Math.random() * 220,
      r: Math.random() * 3 + 2,
      color: "#ffffff",
      life: 1, decay: 1.1, grav: 300, ribbon: true,
    });
  }
}

function spawnPuff(x, y) {
  for (let i = 0; i < 8; i++) {
    const a = Math.random() * Math.PI * 2;
    game.particles.push({
      x, y,
      vx: Math.cos(a) * 70, vy: Math.sin(a) * 70,
      r: Math.random() * 3 + 1,
      color: "#8f7fc0",
      life: 0.7, decay: 1.8, grav: 60,
    });
  }
}

/* ---------------- Floating score text ---------------- */
function floatText(x, y, text, color) {
  const el = document.createElement("div");
  el.className = "float-text";
  el.textContent = text;
  el.style.left = x + "px";
  el.style.top = y + "px";
  el.style.color = color;
  el.style.fontSize = text.length > 6 ? "14px" : "18px";
  floatLayer.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

/* ============================================================
   CORE SHOOTING LOGIC
   ============================================================ */
function tryShoot(px, py) {
  if (game.phase !== "playing" || game.paused) return;
  if (game.reloading) return;
  if (game.ammo <= 0) { startReload(); return; }
  game.ammo--;
  updateHUD();
  fireBullet(px, py);
  if (game.ammo <= 0) startReload();
}

function startReload() {
  if (game.reloading || game.ammo === MAG_SIZE) return;
  game.reloading = true;
  game.reloadStart = performance.now();
  SFX.reload();
  setTimeout(() => {
    game.ammo = MAG_SIZE;
    game.reloading = false;
    updateHUD();
  }, RELOAD_MS);
}

/* Generic hit test: returns any alive balloon whose body contains (bx,by) */
function balloonAtPoint(bx, by) {
  for (const b of game.balloons) {
    if (!b.alive) continue;
    const dx = (bx - b.x) / (b.rx * 1.08);
    const dy = (by - b.y) / (b.ry * 1.08);
    if (dx * dx + dy * dy <= 1) return b;
  }
  return null;
}

/* The single glowing target balloon (the next locked task), if any */
function targetBalloon() {
  const ni = nextLockedIndex();
  if (ni === -1) return null;
  return game.balloons.find((b) => b.idx === ni && b.alive) || null;
}

/* Bullets pass THROUGH locked balloons so the glowing target is never
   physically shielded. Only the target balloon can be popped mid-flight. */
function bulletHitsTarget(bx, by) {
  const b = targetBalloon();
  if (!b) return null;
  const dx = (bx - b.x) / (b.rx * 1.08);
  const dy = (by - b.y) / (b.ry * 1.08);
  return dx * dx + dy * dy <= 1 ? b : null;
}

/* Pop the glowing target balloon and activate its task */
function popTargetBalloon(b) {
  b.alive = false;
  b.popT = 0;
  game.shotsHit++;
  spawnPop(b.x, b.y, b.color);
  SFX.pop();
  game.shake = Math.max(game.shake, 9);

  const pts = 100 * game.combo;
  game.score += pts;
  floatText(b.x, b.y, "+" + pts, "#ffe600");
  if (game.combo > 1) floatText(b.x, b.y - 46, "COMBO x" + game.combo + "!", "#ff2e97");
  game.combo = Math.min(game.combo + 1, 5);

  const task = game.tasks[b.idx];
  if (task) task.state = "active";
  refreshTaskUI();
  updateHUD();
}

/* Bullet reached its aim point without popping the target.
   Give feedback: LOCKED! if aimed at a locked balloon, else a plain miss. */
function resolveAimEnd(bullet) {
  const b = balloonAtPoint(bullet.tx, bullet.ty);
  if (b) {
    b.wobble = 1;
    game.shake = Math.max(game.shake, 5);
    SFX.locked();
    floatText(b.x, b.y - b.ry - 14, "LOCKED!", "#ff5e5e");
    comboReset();
  } else {
    spawnPuff(bullet.x, bullet.y);
    comboReset();
    SFX.miss();
  }
}

function comboReset() {
  if (game.combo > 1) floatText(aim.x || 200, (aim.y || 200) - 30, "COMBO LOST", "#ff5e5e");
  game.combo = 1;
  updateHUD();
}

/* ============================================================
   TASK FLOW (done / skip / clear)
   ============================================================ */
function markDone() {
  if (game.phase !== "playing" || game.paused) return;
  const t = game.tasks.find((x) => x.state === "active");
  if (!t) return;
  t.state = "done";
  game.score += 250;
  points += POINTS_PER_TASK;
  SFX.done();
  const rect = $("stage").getBoundingClientRect();
  floatText(rect.width / 2, rect.height / 2, "+250 TASK DONE!", "#39ff6a");
  floatText(rect.width / 2, rect.height / 2 + 34, "+" + POINTS_PER_TASK + " PTS", "#ffe600");
  tasksCleared++;
  persist();
  refreshTaskUI();
  updateHUD();
  checkAllClear();
}

function skipTask() {
  if (game.phase !== "playing" || game.paused) return;
  const idx = game.tasks.findIndex((x) => x.state === "active");
  if (idx === -1) return;
  const t = game.tasks[idx];
  SFX.skip();
  // move task to the end of the queue and re-inflate its balloon
  game.tasks.splice(idx, 1);
  game.tasks.push(t);
  t.state = "locked";
  const popped = game.balloons.find((b) => b.idx === idx && !b.alive);
  rebuildAfterOrderChange();
  if (popped) {
    popped.alive = true;
    popped.popT = -1;
  }
  game.combo = 1;
  floatText(aim.x || 200, (aim.y || 200) - 30, "RE-QUEUED!", "#ff7a2e");
  refreshTaskUI();
  updateHUD();
}

function rebuildAfterOrderChange() {
  // balloon.idx must map to task order again; rebuild mapping keeping visuals sane
  const alive = game.balloons.filter((b) => b.alive);
  const pal = currentSkinPalette();
  game.balloons = game.tasks.map((t, i) => {
    const reuse = alive.find((b) => !b._reused && b.text === t.text);
    if (reuse) {
      reuse._reused = true;
      reuse.idx = i;
      return reuse;
    }
    // fresh balloon for re-queued task
    return {
      idx: i,
      color: pal[i % pal.length],
      baseX: 0, baseY: 0, x: 0, y: 0,
      rx: 42, ry: 52,
      phase: Math.random() * Math.PI * 2,
      wobble: 0, alive: true, popT: -1,
    };
  });
  game.balloons.forEach((b) => (b.text = game.tasks[b.idx].text));
  const rect = $("stage").getBoundingClientRect();
  layoutBalloons(rect.width, rect.height);
}

function checkAllClear() {
  if (game.tasks.some((t) => t.state !== "done")) return;
  game.phase = "over";
  stopBGM();
  const isHi = game.score > hiScore;
  if (isHi) {
    hiScore = game.score;
    persist();
  }
  SFX.clear();
  // victory particle storm
  const rect = $("stage").getBoundingClientRect();
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      spawnPop(
        Math.random() * rect.width,
        Math.random() * rect.height * 0.6 + 40,
        currentSkinPalette()[Math.floor(Math.random() * currentSkinPalette().length)]
      );
    }, i * 220);
  }
  setTimeout(() => showGameOver(true, isHi), 1300);
}

function quitToMenu() {
  game.phase = "menu";
  game.paused = false;
  stopBGM();
  $("pause-overlay").classList.add("hidden");
  $("gameover-overlay").classList.add("hidden");
  updateAttractStats();
  showScreen("attract");
}

/* ============================================================
   UI UPDATES
   ============================================================ */
function updateHUD() {
  $("hud-score").textContent = String(game.score).padStart(6, "0");
  $("hud-hiscore").textContent = String(Math.max(hiScore, game.score)).padStart(6, "0");
  const comboEl = $("hud-combo");
  comboEl.textContent = "x" + game.combo;
  comboEl.classList.toggle("hot", game.combo >= 3);

  const ammoEl = $("hud-ammo");
  if (game.reloading) {
    ammoEl.textContent = "RELOAD…";
    ammoEl.classList.add("empty");
  } else {
    ammoEl.textContent = "▮".repeat(game.ammo) + "▯".repeat(MAG_SIZE - game.ammo);
    ammoEl.classList.toggle("empty", game.ammo === 0);
  }

  const pips = $("progress-pips");
  if (pips.children.length !== game.tasks.length) {
    pips.innerHTML = "";
    game.tasks.forEach(() => {
      const d = document.createElement("div");
      d.className = "pip";
      pips.appendChild(d);
    });
  }
  const ni = nextLockedIndex();
  const activeI = game.tasks.findIndex((t) => t.state === "active");
  [...pips.children].forEach((p, i) => {
    p.className = "pip";
    const t = game.tasks[i];
    if (!t) return;
    if (t.state === "done") p.classList.add("done");
    else if (i === ni || i === activeI) p.classList.add("active");
  });
}

function refreshTaskUI() {
  const active = game.tasks.find((t) => t.state === "active");
  const ni = nextLockedIndex();
  const bar = $("taskbar");
  const text = $("taskbar-text");
  const label = $("taskbar-label");

  if (active) {
    bar.classList.add("armed");
    label.textContent = "DO THIS NOW";
    text.textContent = active.text;
  } else if (ni !== -1) {
    bar.classList.remove("armed");
    label.textContent = "NEXT TASK";
    text.textContent = "Shoot the glowing balloon!";
  } else {
    bar.classList.remove("armed");
    label.textContent = "MISSION";
    text.textContent = "All tasks cleared!";
  }

  const list = $("task-list");
  list.innerHTML = "";
  game.tasks.forEach((t, i) => {
    const li = document.createElement("li");
    if (t.state === "done") li.className = "done-li";
    else if (t.state === "active") li.className = "current";
    const idx = document.createElement("span");
    idx.className = "idx";
    idx.textContent = String(i + 1).padStart(2, "0");
    const span = document.createElement("span");
    span.textContent = t.state === "locked" ? "• • • • •" : t.text;
    li.appendChild(idx);
    li.appendChild(span);
    list.appendChild(li);
  });
  updateHUD();
}

function showGameOver(cleared, isHi) {
  $("go-title").textContent = cleared ? "★ TASK CLEAR! ★" : "GAME OVER";
  $("go-score").textContent = String(game.score).padStart(6, "0");
  const acc = game.shotsFired ? Math.round((game.shotsHit / game.shotsFired) * 100) : 0;
  $("go-accuracy").textContent = acc + "%";
  $("go-tasks").textContent = game.tasks.filter((t) => t.state === "done").length + "/" + game.tasks.length;
  $("go-newhi").classList.toggle("hidden", !isHi);
  $("gameover-overlay").classList.remove("hidden");
  if (!cleared) SFX.gameover();
}

function updateAttractStats() {
  $("attract-hiscore").textContent = String(hiScore).padStart(6, "0");
  $("attract-cleared").textContent = String(tasksCleared);
  $("attract-points").textContent = String(points);
  const sp = $("shop-points");
  if (sp) sp.textContent = String(points);
  updateDailyBonusUI();
}

/* ---------------- Daily bonus (once per calendar day) ---------------- */
function todayKey() {
  const d = new Date();
  return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}

function canClaimBonus() {
  return lastBonusDate !== todayKey();
}

function updateDailyBonusUI() {
  const wrap = $("daily-bonus");
  const btn = $("btn-daily-bonus");
  const done = $("daily-bonus-done");
  if (!wrap) return;
  const claimable = canClaimBonus();
  wrap.classList.remove("hidden");
  btn.classList.toggle("hidden", !claimable);
  done.classList.toggle("hidden", claimable);
}

function claimDailyBonus() {
  if (!canClaimBonus()) return;
  lastBonusDate = todayKey();
  points += DAILY_BONUS;
  persist();
  SFX.done();
  updateAttractStats();
  // celebratory flash on the title marquee
  const title = document.querySelector(".game-title");
  if (title) {
    const float = document.createElement("div");
    float.className = "float-text";
    float.textContent = "+" + DAILY_BONUS + " PTS!";
    float.style.color = "#ffe600";
    float.style.position = "absolute";
    float.style.left = "50%";
    float.style.top = "30%";
    $("attract-screen").appendChild(float);
    setTimeout(() => float.remove(), 1000);
  }
}

/* ============================================================
   SHOP: render catalog, buy & equip themes / balloon skins
   ============================================================ */
let shopTab = "themes";

function makeThemeSwatch(prev) {
  const sw = document.createElement("div");
  sw.className = "swatch";
  const bg = document.createElement("div");
  bg.className = "sw-bg";
  bg.style.background = prev.bg;
  sw.appendChild(bg);
  prev.dots.forEach((c, i) => {
    const d = document.createElement("div");
    d.className = "sw-dot";
    d.style.background = c;
    d.style.left = (12 + i * 22) + "px";
    sw.appendChild(d);
  });
  return sw;
}

function makeSkinPreview(palette) {
  const wrap = document.createElement("div");
  wrap.className = "mini-balloons";
  palette.slice(0, 6).forEach((c) => {
    const b = document.createElement("div");
    b.className = "mini-balloon";
    b.style.background = `radial-gradient(circle at 32% 28%, ${c.light} 0 12%, ${c.body} 45%, ${c.dark} 100%)`;
    wrap.appendChild(b);
  });
  return wrap;
}

function shopCard(name, price, previewEl, itemId, kind) {
  const isOwned = owned.has(itemId);
  const isEquipped = (kind === "theme" ? equippedTheme : equippedSkin) === itemId;
  const card = document.createElement("div");
  card.className = "shop-item" + (isEquipped ? " equipped-item" : isOwned ? " owned-item" : "");

  const nm = document.createElement("div");
  nm.className = "item-name";
  nm.textContent = name;
  card.appendChild(previewEl);
  card.appendChild(nm);

  if (!isOwned) {
    const pr = document.createElement("div");
    pr.className = "item-price";
    pr.textContent = price + " PTS";
    card.appendChild(pr);
  }

  const actions = document.createElement("div");
  actions.className = "shop-actions";
  const btn = document.createElement("button");
  btn.className = "shop-btn";

  if (isEquipped) {
    btn.classList.add("on");
    btn.textContent = "✓ EQUIPPED";
  } else if (isOwned) {
    btn.classList.add("equip");
    btn.textContent = "EQUIP";
    btn.addEventListener("click", () => {
      if (kind === "theme") { equippedTheme = itemId; applyTheme(); }
      else { equippedSkin = itemId; }
      SFX.uiClick();
      persist();
      renderShop();
    });
  } else if (points >= price) {
    btn.classList.add("buy");
    btn.textContent = "BUY";
    btn.addEventListener("click", () => {
      if (points < price) return;
      points -= price;
      owned.add(itemId);
      // auto-equip after purchase
      if (kind === "theme") { equippedTheme = itemId; applyTheme(); }
      else { equippedSkin = itemId; }
      SFX.done();
      persist();
      updateAttractStats();
      renderShop();
    });
  } else {
    btn.classList.add("cant");
    btn.textContent = "BUY";
    btn.title = "Not enough points";
  }
  actions.appendChild(btn);
  card.appendChild(actions);
  return card;
}

function renderShop() {
  const grid = $("shop-grid");
  grid.innerHTML = "";
  updateAttractStats();
  if (shopTab === "themes") {
    THEMES.forEach((th) =>
      grid.appendChild(shopCard(th.name, th.price, makeThemeSwatch(th.prev), th.id, "theme"))
    );
  } else {
    SKINS.forEach((sk) =>
      grid.appendChild(shopCard(sk.name, sk.price, makeSkinPreview(sk.palette), sk.id, "skin"))
    );
  }
}

function openShop() {
  showScreen("shop");
  renderShop();
}

function setShopTab(tab) {
  shopTab = tab;
  $("tab-themes").classList.toggle("active", tab === "themes");
  $("tab-skins").classList.toggle("active", tab === "skins");
  renderShop();
}

/* ============================================================
   GAME SETUP / START
   ============================================================ */
function startGame(taskTexts) {
  initAudio();
  game.phase = "playing";
  game.paused = false;
  game.score = 0;
  game.combo = 1;
  game.ammo = MAG_SIZE;
  game.reloading = false;
  game.shotsFired = 0;
  game.shotsHit = 0;
  game.particles = [];
  game.bullets = [];
  game.tasks = shuffle(taskTexts.slice(0, TASK_COUNT)).map((text) => ({ text, state: "locked" }));
  createBalloons(game.tasks);
  $("gameover-overlay").classList.add("hidden");
  $("pause-overlay").classList.add("hidden");
  showScreen("game");
  requestAnimationFrame(() => {
    resizeCanvas();
    game.balloons.forEach((b) => (b.text = game.tasks[b.idx].text));
    refreshTaskUI();
    updateHUD();
    startBGM();
  });
}

function pickRandomTasks(n) {
  const pool = TASK_POOL.slice();
  const picks = [];
  for (let i = 0; i < n && pool.length; i++) {
    picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return picks;
}

/* Fisher-Yates shuffle (returns a new array) */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function togglePause(force) {
  if (game.phase !== "playing" && !game.paused) return;
  game.paused = force !== undefined ? force : !game.paused;
  $("pause-overlay").classList.toggle("hidden", !game.paused);
}

/* ============================================================
   RENDERING
   ============================================================ */
function drawBalloon(b, t) {
  const col = b.color;
  const ni = nextLockedIndex();
  const isTarget = b.idx === ni && game.tasks[b.idx] && game.tasks[b.idx].state === "locked";
  const wobbleX = b.wobble > 0 ? Math.sin(t * 40) * b.wobble * 6 : 0;

  ctx.save();
  ctx.translate(b.x + wobbleX, b.y);
  ctx.rotate(Math.sin(t * 0.8 + b.phase) * 0.06 + (b.wobble > 0 ? Math.sin(t * 40) * 0.08 : 0));

  // glow for target balloon
  if (isTarget) {
    const pulse = 0.55 + Math.sin(t * 5) * 0.35;
    ctx.shadowColor = col.body;
    ctx.shadowBlur = 24 * pulse + 10;
    // halo ring
    ctx.beginPath();
    ctx.ellipse(0, 0, b.rx + 10 + pulse * 5, b.ry + 10 + pulse * 5, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255," + (0.35 + pulse * 0.4) + ")";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // string
  ctx.beginPath();
  ctx.moveTo(0, b.ry);
  ctx.quadraticCurveTo(Math.sin(t * 1.5 + b.phase) * 10, b.ry + 26, Math.sin(t + b.phase) * 6, b.ry + 48);
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // knot
  ctx.beginPath();
  ctx.moveTo(-5, b.ry - 2);
  ctx.lineTo(5, b.ry - 2);
  ctx.lineTo(0, b.ry + 7);
  ctx.closePath();
  ctx.fillStyle = col.dark;
  ctx.fill();

  // body with radial gradient
  const grad = ctx.createRadialGradient(-b.rx * 0.35, -b.ry * 0.4, b.rx * 0.1, 0, 0, b.ry * 1.15);
  grad.addColorStop(0, col.light);
  grad.addColorStop(0.45, col.body);
  grad.addColorStop(1, col.dark);
  ctx.beginPath();
  ctx.ellipse(0, 0, b.rx, b.ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // shine
  ctx.beginPath();
  ctx.ellipse(-b.rx * 0.35, -b.ry * 0.42, b.rx * 0.18, b.ry * 0.26, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fill();

  ctx.shadowBlur = 0;

  // label: task number or checkmark
  ctx.font = "bold 17px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const task = game.tasks[b.idx];
  if (task && task.state === "done") {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText("✓", 0, 2);
  } else if (isTarget) {
    ctx.fillStyle = "#12022b";
    ctx.fillText("?", 0, 2);
  } else {
    ctx.fillStyle = "rgba(18, 2, 43, 0.65)";
    ctx.fillText(String(b.idx + 1).padStart(2, "0"), 0, 2);
  }
  ctx.restore();
}

function drawCrosshair(t) {
  if (!aim.inside) return;
  const { x, y } = aim;
  const r = 16 + Math.sin(t * 6) * 1.5;
  ctx.save();
  ctx.strokeStyle = game.reloading ? "#ff5e5e" : "#00f6ff";
  ctx.shadowColor = ctx.strokeStyle;
  ctx.shadowBlur = 8;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - r - 7, y); ctx.lineTo(x - r + 5, y);
  ctx.moveTo(x + r - 5, y); ctx.lineTo(x + r + 7, y);
  ctx.moveTo(x, y - r - 7); ctx.lineTo(x, y - r + 5);
  ctx.moveTo(x, y + r - 5); ctx.lineTo(x, y + r + 7);
  ctx.stroke();
  ctx.fillStyle = ctx.strokeStyle;
  ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
  ctx.restore();
}

function drawReloadBar() {
  if (!game.reloading) return;
  const rect = $("stage").getBoundingClientRect();
  const p = Math.min(1, (performance.now() - game.reloadStart) / RELOAD_MS);
  const w = 140, h = 12;
  const x = rect.width / 2 - w / 2, y = rect.height - 52;
  ctx.save();
  ctx.fillStyle = "rgba(10,1,24,0.85)";
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.strokeStyle = "#ff5e5e";
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = "#ffe600";
  ctx.fillRect(x, y, w * p, h);
  ctx.font = "bold 11px 'Courier New', monospace";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.fillText("RELOADING…", rect.width / 2, y - 8);
  ctx.restore();
}

let lastFrame = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  game.time += dt;
  const t = game.time;

  const rect = $("stage").getBoundingClientRect();
  const W = rect.width, H = rect.height;

  ctx.clearRect(0, 0, W, H);

  // screen shake
  ctx.save();
  if (game.shake > 0) {
    ctx.translate((Math.random() - 0.5) * game.shake, (Math.random() - 0.5) * game.shake);
    game.shake = Math.max(0, game.shake - dt * 40);
  }

  // stars background
  game.stars.forEach((s) => {
    const a = 0.3 + Math.abs(Math.sin(t * 1.2 + s.tw)) * 0.6;
    ctx.fillStyle = "rgba(200,180,255," + a + ")";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // ground glow line
  ctx.strokeStyle = "rgba(157,77,255,0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H - 8);
  ctx.lineTo(W, H - 8);
  ctx.stroke();

  if (!game.paused && game.phase === "playing") {
    // balloon drift
    game.balloons.forEach((b) => {
      b.x = b.baseX + Math.sin(t * 0.7 + b.phase) * 16;
      b.y = b.baseY + Math.sin(t * 1.3 + b.phase * 2) * 10;
      if (b.wobble > 0) b.wobble = Math.max(0, b.wobble - dt * 2.4);
    });

    // bullets
    for (let i = game.bullets.length - 1; i >= 0; i--) {
      const bl = game.bullets[i];
      const stepX = bl.vx * dt, stepY = bl.vy * dt;
      // sub-step collision for fast bullets
      const steps = Math.max(1, Math.ceil(Math.hypot(stepX, stepY) / 8));
      let hitTarget = null;
      for (let s = 1; s <= steps; s++) {
        bl.x += stepX / steps;
        bl.y += stepY / steps;
        bl.traveled += Math.hypot(stepX, stepY) / steps;
        const tb = bulletHitsTarget(bl.x, bl.y);
        if (tb) { hitTarget = tb; break; }
      }
      if (hitTarget) {
        popTargetBalloon(hitTarget);
        game.bullets.splice(i, 1);
      } else if (bl.traveled >= bl.maxTravel || bl.y < -30 || bl.x < -30 || bl.x > W + 30) {
        // reached aim point without popping the target: LOCKED! feedback or a miss
        resolveAimEnd(bl);
        game.bullets.splice(i, 1);
      }
    }
  }

  // draw balloons (even when paused/over so scene stays visible)
  game.balloons.forEach((b) => { if (b.alive) drawBalloon(b, t); });

  // draw bullet tracers
  game.bullets.forEach((bl) => {
    ctx.save();
    ctx.strokeStyle = "#ffe600";
    ctx.shadowColor = "#ffe600";
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bl.x - bl.vx * 0.018, bl.y - bl.vy * 0.018);
    ctx.lineTo(bl.x, bl.y);
    ctx.stroke();
    ctx.restore();
  });

  // particles
  if (!game.paused) {
    for (let i = game.particles.length - 1; i >= 0; i--) {
      const p = game.particles[i];
      p.life -= p.decay * dt;
      if (p.life <= 0) { game.particles.splice(i, 1); continue; }
      p.vy += p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }
  game.particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    if (p.ribbon) {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.x * 0.05 + t * 6);
      ctx.fillRect(-p.r, -p.r * 0.4, p.r * 2, p.r * 0.8);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.life + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });

  drawReloadBar();
  drawCrosshair(t);
  ctx.restore();

  requestAnimationFrame(loop);
}
requestAnimationFrame((now) => { lastFrame = now; loop(now); });

/* ============================================================
   INPUT
   ============================================================ */
const stage = $("stage");

function stagePoint(clientX, clientY) {
  const rect = stage.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

stage.addEventListener("mousemove", (e) => {
  const p = stagePoint(e.clientX, e.clientY);
  aim.x = p.x; aim.y = p.y; aim.inside = true;
});
stage.addEventListener("mouseleave", () => (aim.inside = false));
stage.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;
  if (e.target !== canvas) return; // ignore clicks on HUD / taskbar / panel UI
  initAudio();
  const p = stagePoint(e.clientX, e.clientY);
  aim.x = p.x; aim.y = p.y; aim.inside = true;
  tryShoot(p.x, p.y);
});
stage.addEventListener("touchstart", (e) => {
  if (e.target !== canvas) return; // ignore taps on HUD / taskbar / panel UI
  initAudio();
  const touch = e.touches[0];
  const p = stagePoint(touch.clientX, touch.clientY);
  aim.x = p.x; aim.y = p.y; aim.inside = true;
  tryShoot(p.x, p.y);
  e.preventDefault();
}, { passive: false });

document.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (k === "r" && game.phase === "playing") startReload();
  if (k === "p") togglePause();
  if (k === "m") toggleMute();
  if (k === "enter" && game.phase === "playing") {
    const t = game.tasks.find((x) => x.state === "active");
    if (t) markDone();
  }
});

/* ---------------- Mute ---------------- */
function toggleMute() {
  muted = !muted;
  persist();
  const btn = $("btn-mute");
  btn.classList.toggle("muted", muted);
  btn.textContent = muted ? "✕" : "♪";
}
$("btn-mute").classList.toggle("muted", muted);
$("btn-mute").textContent = muted ? "✕" : "♪";

/* ============================================================
   SCREEN WIRING
   ============================================================ */
/* ---- Attract ---- */
$("btn-how").addEventListener("click", () => { initAudio(); SFX.uiClick(); showScreen("howto"); });
$("btn-surprise").addEventListener("click", () => {
  initAudio(); SFX.uiClick();
  startGame(pickRandomTasks(TASK_COUNT));
});
$("btn-custom").addEventListener("click", () => {
  initAudio(); SFX.uiClick();
  showScreen("entry");
  $("task-input").focus();
});
$("btn-shop").addEventListener("click", () => { initAudio(); SFX.uiClick(); openShop(); });
$("btn-daily-bonus").addEventListener("click", () => { initAudio(); claimDailyBonus(); });
$("tab-themes").addEventListener("click", () => { SFX.uiClick(); setShopTab("themes"); });
$("tab-skins").addEventListener("click", () => { SFX.uiClick(); setShopTab("skins"); });
document.querySelectorAll(".btn-back-attract").forEach((b) =>
  b.addEventListener("click", () => { SFX.uiClick(); stopBGM(); quitToMenu(); })
);

/* ---- Task entry ---- */
const entryTasks = [];

function renderEntryList() {
  const list = $("entry-list");
  list.innerHTML = "";
  entryTasks.forEach((txt, i) => {
    const li = document.createElement("li");
    const num = document.createElement("span");
    num.className = "num";
    num.textContent = i + 1 + ".";
    const span = document.createElement("span");
    span.className = "txt";
    span.textContent = txt;
    const del = document.createElement("button");
    del.textContent = "✕";
    del.title = "Remove";
    del.addEventListener("click", () => {
      entryTasks.splice(i, 1);
      renderEntryList();
      SFX.skip();
    });
    li.append(num, span, del);
    list.appendChild(li);
  });
  $("entry-count").textContent = entryTasks.length;
  $("btn-start-custom").disabled = entryTasks.length === 0;
  if (entryTasks.length < TASK_COUNT) $("task-input").disabled = false;
  else $("task-input").disabled = true;
}

function addEntryTask() {
  const input = $("task-input");
  const txt = input.value.trim().replace(/\s+/g, " ");
  if (!txt) return;
  if (entryTasks.length >= TASK_COUNT) return;
  if (entryTasks.some((t) => t.toLowerCase() === txt.toLowerCase())) {
    input.value = "";
    return;
  }
  entryTasks.push(txt);
  input.value = "";
  SFX.uiClick();
  renderEntryList();
  input.focus();
}

$("btn-add-task").addEventListener("click", addEntryTask);
$("task-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addEntryTask();
});
$("btn-fill-random").addEventListener("click", () => {
  const need = TASK_COUNT - entryTasks.length;
  if (need <= 0) return;
  const candidates = pickRandomTasks(TASK_COUNT).filter(
    (t) => !entryTasks.some((x) => x.toLowerCase() === t.toLowerCase())
  );
  candidates.slice(0, need).forEach((t) => entryTasks.push(t));
  SFX.done();
  renderEntryList();
});
$("btn-start-custom").addEventListener("click", () => {
  if (!entryTasks.length) return;
  startGame(entryTasks);
});

/* ---- Game buttons ---- */
$("btn-done").addEventListener("click", markDone);
$("btn-skip").addEventListener("click", skipTask);
$("btn-pause").addEventListener("click", () => togglePause());
$("btn-resume").addEventListener("click", () => togglePause(false));
$("btn-quit").addEventListener("click", quitToMenu);
$("btn-again").addEventListener("click", () => {
  $("gameover-overlay").classList.add("hidden");
  // replay: same tasks reset, or fresh random in surprise mode
  const texts = game.tasks.map((t) => t.text);
  startGame(texts);
});

/* ---------------- Boot ---------------- */
applyTheme();
updateAttractStats();
renderEntryList();
resizeCanvas();
