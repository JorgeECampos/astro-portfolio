// Constants/config
const W = 900, H = 520;
const surfaceY = 160;
const LEVELS = [
  { name: 'Estanque', goal: 0 },
  { name: 'Río', goal: 20 },
  { name: 'Mar', goal: 50 },
  { name: 'Alta mar', goal: 90 },
  { name: 'Espacio', goal: 140 },
];
const levelThemes = [
  { waterTop: '#0ea5e9', waterMid: '#0369a1', waterBottom: '#020617', extraGolden: 0.00 },
  { waterTop: '#22c55e', waterMid: '#15803d', waterBottom: '#052e16', extraGolden: 0.02 },
  { waterTop: '#38bdf8', waterMid: '#0284c7', waterBottom: '#0f172a', extraGolden: 0.04 },
  { waterTop: '#0f172a', waterMid: '#1d4ed8', waterBottom: '#020617', extraGolden: 0.06 },
  { waterTop: '#020617', waterMid: '#111827', waterBottom: '#020617', extraGolden: 0.10 },
];
const SHOP_COST = { reel: 20, line: 30, rare: 40 };
const HOOK = { descend: 4.2, ascend: 5.0 };
const FIGHT = { base: 35, decay: 0.04, jiggle: 4 };

// State container
const state = {
  level: { current: 0, maxUnlocked: 0, screenMode: 'start', isScreen: true },
  player: { boatX: 0, boatSpeed: 4, hookX: 0, hookY: 0, reelPower: 4, lineStrength: 0, rareChance: 0, lineLenMax: H - 40 },
  session: { casting: false, retrieving: false, inFight: false, hookedFish: null, fightValue: 0, score: 0, coins: 0, lives: 3, timeLeft: 360, started: false, over: false, timerId: null },
  meta: { highscores: [], enteringName: false, initials: '', pendingScore: 0, touchName: ['A','A','A'] },
  world: { fishes: [], clouds: [], stars: [] },
  loaded: null,
};

// DOM refs
const els = {
  levelName: document.getElementById('level-name'),
  worldMap: document.getElementById('world-map'),
  cnv: document.getElementById('game'),
  time: document.getElementById('time'),
  lives: document.getElementById('lives'),
  score: document.getElementById('score'),
  coins: document.getElementById('coins'),
  fightBox: document.getElementById('fightBox'),
  fight: document.getElementById('fight'),
  highscoreList: document.getElementById('highscore-list'),
  shop: {
    reel: document.getElementById('btnReel'),
    line: document.getElementById('btnLine'),
    rare: document.getElementById('btnRare'),
  },
  touch: {
    wrap: document.getElementById('touch-controls'),
    left: document.getElementById('btnLeft'),
    right: document.getElementById('btnRight'),
    cast: document.getElementById('btnCast'),
  },
  name: {
    wrap: document.getElementById('name-touch'),
    ok: document.getElementById('name-ok'),
    letters: [document.getElementById('lt0'), document.getElementById('lt1'), document.getElementById('lt2')],
  },
};

const ctx = els.cnv.getContext('2d');
const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
const keys = new Set();

// Utils
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const lerp = (a, b, t) => a + (b - a) * t;
const lerpColor = (c1, c2, t) => {
  const p = (c) => [parseInt(c.slice(1,3),16), parseInt(c.slice(3,5),16), parseInt(c.slice(5,7),16)];
  const [r1,g1,b1] = p(c1), [r2,g2,b2] = p(c2);
  const r = Math.round(lerp(r1,r2,t)), g = Math.round(lerp(g1,g2,t)), b = Math.round(lerp(b1,b2,t));
  return `rgb(${r},${g},${b})`;
};

// Colors
const fishColorsNormal = ['#89c2d9','#61a5c2','#468faf','#2c7da0'];
const fishColorsSlim   = ['#38bdf8','#0ea5e9'];
const fishColorsRound  = ['#0f766e','#14b8a6'];
const fishColorsJelly  = ['#a855f7','#6366f1'];

// Storage helpers
function saveProgress() {
  try {
    localStorage.setItem('pescaRetroSave', JSON.stringify({
      maxLevelUnlocked: state.level.maxUnlocked,
      currentLevelIndex: state.level.current,
      score: state.session.score,
      coins: state.session.coins,
      reelPower: state.player.reelPower,
      lineStrength: state.player.lineStrength,
      rareChance: state.player.rareChance,
      timeLeft: state.session.timeLeft,
      lives: state.session.lives,
    }));
  } catch (e) { console.warn('No se pudo guardar', e); }
}

function loadProgress() {
  try {
    const raw = localStorage.getItem('pescaRetroSave'); if (!raw) return;
    const d = JSON.parse(raw);
    state.level.maxUnlocked = Number.isFinite(d.maxLevelUnlocked) ? d.maxLevelUnlocked : 0;
    state.loaded = {
      currentLevelIndex: clamp(d.currentLevelIndex ?? 0, 0, LEVELS.length - 1),
      score: d.score ?? 0,
      coins: d.coins ?? 0,
      reelPower: d.reelPower ?? 4,
      lineStrength: d.lineStrength ?? 0,
      rareChance: d.rareChance ?? 0,
      timeLeft: d.timeLeft ?? 360,
      lives: d.lives ?? 3,
    };
  } catch (e) { console.warn('No se pudo cargar', e); }
}

// Audio
let audioCtx = null;
function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function playBeep(freq=440,duration=0.08,type='square',volume=0.08){
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  osc.start(now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.stop(now + duration + 0.02);
}
const s_cast       = ()=>playBeep(880,0.08,'square');
const s_hook       = ()=>playBeep(660,0.08,'square');
const s_catchSmall = ()=>{playBeep(900,0.08,'square');playBeep(1200,0.1,'triangle',0.06);};
const s_catchMed   = ()=>{playBeep(700,0.08,'square');playBeep(1050,0.1,'square');playBeep(1350,0.12,'triangle',0.06);};
const s_catchBig   = ()=>{playBeep(500,0.1,'square');playBeep(800,0.12,'square');playBeep(1400,0.14,'triangle',0.07);};
const s_breakLine  = ()=>playBeep(260,0.12,'sawtooth');
const s_gameOver   = ()=>playBeep(220,0.25,'square',0.07);
const s_buy        = ()=>playBeep(780,0.06,'triangle',0.06);
const s_levelUp    = ()=>{playBeep(600,0.12,'square');playBeep(900,0.14,'triangle',0.07);};

// Highscores
async function renderHighscores() {
  els.highscoreList.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const li = document.createElement('li');
    if (i < state.meta.highscores.length) {
      const h = state.meta.highscores[i];
      const name = (h.name || '---').padEnd(3, ' ').slice(0,3);
      li.textContent = `${name} — ${h.score}`;
    } else {
      li.textContent = '--- — 0';
    }
    els.highscoreList.appendChild(li);
  }
}

async function loadHighscores() {
  if (location.protocol === 'file:') {
    state.meta.highscores = [];
    renderHighscores();
    return;
  }
  try {
    const res = await fetch('/api/scores');
    if (!res.ok) throw new Error('error scores');
    const data = await res.json();
    state.meta.highscores = (Array.isArray(data) ? data : [])
      .filter(x => typeof x.score === 'number' && typeof x.name === 'string')
      .sort((a,b) => b.score - a.score)
      .slice(0,5);
  } catch (e) {
    console.error(e);
    state.meta.highscores = [];
  }
  renderHighscores();
}

function qualifiesForTop5(curScore) {
  if (curScore <= 0) return false;
  if (state.meta.highscores.length < 5) return true;
  const last = state.meta.highscores[state.meta.highscores.length - 1];
  return curScore > last.score;
}

async function insertHighscore(name, curScore) {
  if (location.protocol === 'file:') {
    state.meta.highscores.push({name, score: curScore});
    state.meta.highscores.sort((a,b)=>b.score-a.score);
    state.meta.highscores = state.meta.highscores.slice(0,5);
    renderHighscores();
    return;
  }
  try {
    await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ name, score: curScore })
    });
    await loadHighscores();
  } catch (e) {
    console.error(e);
  }
}

// Shop
function updateShopUI() {
  els.shop.reel.disabled = state.session.coins < SHOP_COST.reel;
  els.shop.line.disabled = state.session.coins < SHOP_COST.line;
  els.shop.rare.disabled = state.session.coins < SHOP_COST.rare;
}
function buyUpgrade(type) {
  if (state.session.over || state.meta.enteringName || state.session.inFight) return;
  let purchased = false;
  if (type === 'reel' && state.session.coins >= SHOP_COST.reel) {
    state.session.coins -= SHOP_COST.reel; state.player.reelPower += 1; purchased = true;
  } else if (type === 'line' && state.session.coins >= SHOP_COST.line) {
    state.session.coins -= SHOP_COST.line; state.player.lineStrength = Math.min(90, state.player.lineStrength + 10); purchased = true;
  } else if (type === 'rare' && state.session.coins >= SHOP_COST.rare) {
    state.session.coins -= SHOP_COST.rare; state.player.rareChance = Math.min(0.5, state.player.rareChance + 0.1); purchased = true;
  }
  if (purchased) {
    els.coins.textContent = state.session.coins;
    updateShopUI();
    s_buy();
  }
}
els.shop.reel.addEventListener('click', () => { initAudio(); buyUpgrade('reel'); });
els.shop.line.addEventListener('click', () => { initAudio(); buyUpgrade('line'); });
els.shop.rare.addEventListener('click', () => { initAudio(); buyUpgrade('rare'); });

// Fish helpers
function typeMultiplier(type) {
  switch(type){
    case 'golden': return 3;
    case 'round':  return 2;
    case 'jelly':  return 1.5;
    case 'slim':   return 1.5;
    default:       return 1;
  }
}
function randomFishType() {
  const r = Math.random();
  const theme = levelThemes[state.level.current] || levelThemes[0];
  const goldenBoost = state.player.rareChance + (theme.extraGolden || 0);
  if (r < 0.04 + goldenBoost) return 'golden';
  if (r < 0.12) return 'jelly';
  if (r < 0.35) return 'slim';
  if (r < 0.65) return 'round';
  return 'normal';
}
function fishDepthY(size, type) {
  const waterTop = surfaceY + 40;
  const waterBottom = H - 60;
  const mid = waterTop + (waterBottom - waterTop) * 0.5;
  const isSmall = size <= 20 || type === 'slim';
  const isBig   = size >= 30 || type === 'golden' || type === 'round';
  let y;
  if (isSmall) {
    y = waterTop + Math.random() * (mid - waterTop - 10);
  } else if (isBig) {
    const deepTop = mid + 10;
    y = deepTop + Math.random() * (waterBottom - deepTop);
  } else {
    const bandTop = waterTop + (waterBottom - waterTop) * 0.3;
    const bandHeight = (waterBottom - waterTop) * 0.4;
    y = bandTop + Math.random() * bandHeight;
  }
  return y;
}
function spawnFish() {
  const patterns = ['plain', 'striped', 'spotted', 'longtail'];
  let type = randomFishType();
  let size, difficulty, speed, color;
  const dir = Math.random() < 0.5 ? -1 : 1;
  const x = dir === 1 ? -40 : W + 40;
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];
  if (type === 'slim') {
    size = 18; difficulty = 45;
    speed = 2.3 * (0.8 + Math.random()*0.6);
    color = fishColorsSlim[Math.floor(Math.random()*fishColorsSlim.length)];
  } else if (type === 'round') {
    size = 26; difficulty = 60;
    speed = 1.6 * (0.8 + Math.random()*0.6);
    color = fishColorsRound[Math.floor(Math.random()*fishColorsRound.length)];
  } else if (type === 'golden') {
    size = 24; difficulty = 65;
    speed = 1.6 * (0.8 + Math.random()*0.6);
    color = '#facc15';
  } else if (type === 'jelly') {
    size = 22; difficulty = 55;
    speed = 1.1 * (0.8 + Math.random()*0.6);
    color = fishColorsJelly[Math.floor(Math.random()*fishColorsJelly.length)];
  } else {
    if (Math.random() < state.player.rareChance) size = 34;
    else size = Math.random()<0.5?16:Math.random()<0.8?24:34;
    difficulty = size===16?35:size===24?55:75;
    speed = (size===34?1.2:size===24?1.6:2.1)*(0.8+Math.random()*0.6);
    color = fishColorsNormal[Math.floor(Math.random()*fishColorsNormal.length)];
  }
  const y = fishDepthY(size, type);
  state.world.fishes.push({x,y,dir,speed,size,color,difficulty,type,pattern});
}
function spawnCloud() {
  state.world.clouds.push({
    x: Math.random()*W,
    y: 40 + Math.random()*60,
    w: 70 + Math.random()*80,
    h: 20 + Math.random()*20,
    speed: 0.2 + Math.random()*0.4,
  });
}
function initStars() {
  state.world.stars.length = 0;
  for (let i=0;i<60;i++){
    state.world.stars.push({
      x: Math.random()*W,
      y: Math.random()*surfaceY,
      r: Math.random()*2+0.5,
      phase: Math.random()*Math.PI*2,
    });
  }
}

// Level/UI
function updateLevelUI() {
  const lvl = LEVELS[state.level.current];
  els.levelName.textContent = `${lvl.name} (${state.level.current + 1}/${LEVELS.length})`;
  els.worldMap.querySelectorAll('.level-node').forEach(node => {
    const idx = parseInt(node.dataset.level, 10);
    node.classList.toggle('current', idx === state.level.current);
    node.classList.toggle('unlocked', idx <= state.level.maxUnlocked);
  });
}
function checkLevelProgress() {
  const next = state.level.current + 1;
  if (next >= LEVELS.length) return;
  const goal = LEVELS[next].goal;
  if (state.session.score >= goal && !state.level.isScreen && !state.session.over) {
    state.level.current = next;
    state.player.reelPower += 1;
    state.player.lineStrength = Math.min(90, state.player.lineStrength + 5);
    state.session.timeLeft += 30;
    els.time.textContent = state.session.timeLeft;
    if (state.level.current > state.level.maxUnlocked) {
      state.level.maxUnlocked = state.level.current;
      saveProgress();
    }
    updateLevelUI();
    if (state.level.current === 4) initStars();
    state.level.isScreen = true;
    state.level.screenMode = 'levelup';
    state.session.started = false;
    s_levelUp();
  }
}

// Game flow
function resetGameState(){
  state.level.current = 0;
  state.session.score = 0;
  state.session.lives = 3;
  state.session.timeLeft = 360;
  state.session.coins = 0;
  state.player.reelPower = 4;
  state.player.lineStrength = 0;
  state.player.rareChance = 0;

  if (state.loaded) {
    state.level.current = state.loaded.currentLevelIndex ?? state.level.current;
    state.session.score = state.loaded.score ?? state.session.score;
    state.session.coins = state.loaded.coins ?? state.session.coins;
    state.player.reelPower = state.loaded.reelPower ?? state.player.reelPower;
    state.player.lineStrength = state.loaded.lineStrength ?? state.player.lineStrength;
    state.player.rareChance = state.loaded.rareChance ?? state.player.rareChance;
    state.session.timeLeft = state.loaded.timeLeft ?? state.session.timeLeft;
    state.session.lives = state.loaded.lives ?? state.session.lives;
    state.loaded = null;
  }

  state.world.fishes.length = 0;
  for (let i = 0; i < 16; i++) spawnFish();
  state.world.clouds.length = 0;
  for (let i=0;i<5;i++) spawnCloud();
  state.world.stars.length = 0;
  if (state.level.current === 4) initStars();

  state.player.boatX = W/2; state.player.boatSpeed = 4;
  state.player.hookX = state.player.boatX; state.player.hookY = surfaceY + 18;
  state.player.lineLenMax = H - 40;
  state.session.casting = state.session.retrieving = false;
  state.session.hookedFish = null;
  state.session.inFight = false;
  state.session.fightValue = 0;
  state.session.over = false;
  state.session.started = false;
  state.meta.enteringName = false;
  state.meta.initials = '';
  state.meta.pendingScore = 0;

  els.time.textContent   = state.session.timeLeft;
  els.lives.textContent  = state.session.lives;
  els.score.textContent  = state.session.score;
  els.coins.textContent  = state.session.coins;
  els.fightBox.style.display = 'none';
  els.fight.value = 0;
  updateShopUI();

  state.level.isScreen  = true;
  state.level.screenMode = 'start';
  updateLevelUI();
}

function startTimer(){
  if (state.session.timerId) clearInterval(state.session.timerId);
  state.session.timerId = setInterval(()=>{
    if (!state.session.started || state.session.over) return;
    state.session.timeLeft--; els.time.textContent = state.session.timeLeft;
    if (state.session.timeLeft <= 0) endGame();
  }, 1000);
}

function endGame(){
  state.session.over = true;
  if (state.session.timerId) { clearInterval(state.session.timerId); state.session.timerId = null; }
  s_gameOver();
  if (state.level.current > state.level.maxUnlocked) {
    state.level.maxUnlocked = state.level.current;
    saveProgress();
  }
  if (qualifiesForTop5(state.session.score)) {
    state.meta.enteringName = true;
    state.meta.initials = '';
    state.meta.pendingScore = state.session.score;
    if (isTouch && els.name.wrap) {
      state.meta.touchName = ['A','A','A'];
      renderTouchName();
      els.name.wrap.style.display = 'flex';
    }
  }
}

// Input
function bindInput() {
  window.addEventListener('keydown', (e) => {
    const k = e.key;
    if (['ArrowUp','ArrowDown',' '].includes(k)) e.preventDefault();
    if ((k === 'g' || k === 'G') && state.level.isScreen && !state.session.over && state.level.screenMode === 'levelup') {
      saveProgress();
      alert('Progreso de niveles guardado.\nPuedes cerrar el juego cuando quieras.');
      return;
    }
    if (!audioCtx && (k === ' ' || k === 'Enter')) initAudio();
    if (state.meta.enteringName) { handleInitialsInput(e); return; }

    if (k === ' ') {
      if (e.repeat) return;
      if (state.level.isScreen && !state.session.over) {
        state.level.isScreen = false; state.session.started = true; startTimer(); return;
      }
      if (!state.session.started && !state.session.over) {
        state.session.started = true; startTimer(); s_cast(); return;
      }
      onAction(); return;
    }
    if (k === 'Enter' && !state.session.started && !state.session.over) {
      if (state.level.isScreen) {
        state.level.isScreen = false; state.session.started = true; startTimer(); return;
      }
      state.session.started = true; startTimer(); s_cast(); return;
    }
    if (k.toLowerCase() === 'r' && state.session.over && !state.meta.enteringName){
      resetGameState(); startTimer(); return;
    }
    keys.add(k.toLowerCase());
  });
  window.addEventListener('keyup', (e)=>{ keys.delete(e.key.toLowerCase()); });

  if (els.touch.wrap) els.touch.wrap.style.display = isTouch ? 'flex' : 'none';
  addHoldButton(els.touch.left, 'a');
  addHoldButton(els.touch.right, 'd');
  if (els.touch.cast) {
    const tapCast = (e) => { e.preventDefault(); onAction(); };
    els.touch.cast.addEventListener('click', tapCast);
    els.touch.cast.addEventListener('touchstart', tapCast);
  }

  if (els.name.wrap) {
    document.querySelectorAll('#name-touch button[data-slot]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const slot = parseInt(btn.dataset.slot, 10);
        const dir = btn.dataset.dir;
        let code = state.meta.touchName[slot].charCodeAt(0);
        if (dir === 'up') code++; else code--;
        if (code > 90) code = 65;
        if (code < 65) code = 90;
        state.meta.touchName[slot] = String.fromCharCode(code);
        renderTouchName();
      });
    });
    if (els.name.ok) {
      els.name.ok.addEventListener('click', (e) => {
        e.preventDefault();
        const name = state.meta.touchName.join('');
        insertHighscore(name, state.meta.pendingScore);
        state.meta.enteringName = false;
        els.name.wrap.style.display = 'none';
      });
    }
  }
}

function addHoldButton(btn, key) {
  if (!btn) return;
  const down = (e) => { e.preventDefault(); keys.add(key); };
  const up = (e) => { e.preventDefault(); keys.delete(key); };
  ['touchstart','mousedown'].forEach(ev => btn.addEventListener(ev, down));
  ['touchend','touchcancel','mouseup','mouseleave'].forEach(ev => btn.addEventListener(ev, up));
}

function handleInitialsInput(e){
  const k = e.key;
  const isLetter = /^[a-zA-Z]$/.test(k);
  if (isLetter && state.meta.initials.length < 3){
    state.meta.initials += k.toUpperCase();
    return;
  }
  if (k === 'Backspace'){
    state.meta.initials = state.meta.initials.slice(0, -1);
    return;
  }
  if (k === 'Enter' && state.meta.initials.length > 0){
    insertHighscore(state.meta.initials, state.meta.pendingScore);
    state.meta.enteringName = false;
    return;
  }
}

function onAction() {
  if (state.session.over) return;
  if (state.level.isScreen && !state.session.started) { state.level.isScreen = false; state.session.started = true; startTimer(); return; }
  handleSpace();
}

// Gameplay actions
function handleSpace(){
  if (state.session.over) return;
  if (!state.session.casting && !state.session.retrieving && !state.session.inFight && !state.session.hookedFish) {
    state.player.hookX = state.player.boatX; state.session.casting = true; s_cast(); return;
  }
  if (state.session.inFight && state.session.hookedFish) {
    state.session.fightValue = Math.min(100, state.session.fightValue + 10);
    els.fight.value = state.session.fightValue;
    state.player.hookY = Math.max(surfaceY + 18, state.player.hookY - state.player.reelPower);
    if (state.player.hookY <= surfaceY + 22) { captureFish(); return; }
    return;
  }
  if (!state.session.inFight && !state.session.hookedFish && (state.session.casting || state.session.retrieving)) {
    state.session.retrieving = true; state.session.casting = false;
  }
}

function captureFish(){
  if (!state.session.hookedFish) return;
  const size = state.session.hookedFish.size;
  let baseScore = 1, baseCoins = 1;
  if (size >= 34) { baseScore = 3; baseCoins = 5; }
  else if (size >= 24) { baseScore = 2; baseCoins = 3; }
  const mult = typeMultiplier(state.session.hookedFish.type || 'normal');
  const gainedScore = Math.round(baseScore * mult);
  const gainedCoins = Math.round(baseCoins * mult);
  state.session.score += gainedScore;
  state.session.coins += gainedCoins;
  els.score.textContent = state.session.score;
  els.coins.textContent = state.session.coins;
  updateShopUI();
  const idx = state.world.fishes.indexOf(state.session.hookedFish); if (idx>=0) state.world.fishes.splice(idx,1);
  spawnFish();
  if (size >= 34) s_catchBig();
  else if (size >= 24) s_catchMed();
  else s_catchSmall();
  state.session.inFight = false;
  state.session.hookedFish = null;
  els.fightBox.style.display = 'none';
  state.session.retrieving = true;
  checkLevelProgress();
}

function update() {
  if (!state.session.started || state.session.over) {
    for (const c of state.world.clouds) {
      c.x += c.speed;
      if (c.x - c.w > W + 40) {
        c.x = -c.w - 40;
        c.y = 40 + Math.random() * 60;
        c.speed = 0.2 + Math.random() * 0.4;
      }
    }
    return;
  }

  if (!state.session.casting && !state.session.retrieving && !state.session.inFight) {
    if (keys.has('a')) state.player.boatX -= state.player.boatSpeed;
    if (keys.has('d')) state.player.boatX += state.player.boatSpeed;
    state.player.boatX = clamp(state.player.boatX, 60, W - 60);
    state.player.hookX = state.player.boatX;
    state.player.hookY = surfaceY + 18;
  }

  if (state.session.casting && !state.session.inFight) {
    state.player.hookY += HOOK.descend;
    if (state.player.hookY > state.player.lineLenMax) {
      state.session.casting = false;
      state.session.retrieving = true;
    }
  }

  if (state.session.retrieving && !state.session.inFight) {
    state.player.hookY -= HOOK.ascend;
    if (state.player.hookY <= surfaceY + 18) state.session.retrieving = false;
  }

  for (const f of state.world.fishes) {
    if (f === state.session.hookedFish && state.session.inFight) continue;
    f.x += f.speed * f.dir;
    if (f.dir === 1 && f.x > W + 50) { f.dir = -1; f.y = fishDepthY(f.size, f.type); }
    if (f.dir === -1 && f.x < -50) { f.dir = 1; f.y = fishDepthY(f.size, f.type); }
  }

  if (!state.session.inFight && state.session.casting && !state.session.hookedFish) {
    for (const f of state.world.fishes) {
      if (Math.abs(f.x - state.player.hookX) < f.size && Math.abs(f.y - state.player.hookY) < f.size) {
        state.session.hookedFish = f;
        state.session.inFight = true;
        state.session.casting = false;
        state.session.retrieving = false;
        state.session.fightValue = FIGHT.base;
        els.fight.value = state.session.fightValue;
        els.fightBox.style.display = 'inline-flex';
        s_hook();
        break;
      }
    }
  }

  if (state.session.inFight && state.session.hookedFish) {
    const pull = state.session.hookedFish.difficulty * FIGHT.decay;
    const resistFactor = 1 - (state.player.lineStrength / 100);
    state.session.fightValue = Math.max(0, state.session.fightValue - pull * 0.2 * resistFactor);
    els.fight.value = state.session.fightValue;

    const wiggle = Math.sin(Date.now() * 0.02) * FIGHT.jiggle;
    state.session.hookedFish.x = state.player.hookX + wiggle;
    state.session.hookedFish.y = state.player.hookY + 20;

    if (state.session.fightValue < 40 && state.player.hookY < state.player.lineLenMax) state.player.hookY += 0.3;

    if (state.session.fightValue <= 0) {
      state.session.lives--;
      els.lives.textContent = state.session.lives;
      state.session.inFight = false;
      els.fightBox.style.display = 'none';
      if (state.session.lives <= 0) endGame();
      state.session.hookedFish = null;
      state.session.retrieving = true;
      s_breakLine();
    }
  }

  for (const c of state.world.clouds) {
    c.x += c.speed;
    if (c.x - c.w > W + 40) {
      c.x = -c.w - 40;
      c.y = 40 + Math.random() * 60;
      c.speed = 0.2 + Math.random() * 0.4;
    }
  }
}

// Rendering
function drawSky(){
  const t = Date.now() * 0.00003;
  const phase = (Math.sin(t) + 1) / 2;
  let topNight = '#020617', midNight = '#0f172a', botNight = '#1d4ed8';
  let topDay = '#0f172a', midDay = '#1d4ed8', botDay = '#38bdf8';
  if (state.level.current === 4) {
    topNight = midNight = botNight = '#020617';
    topDay = midDay = botDay = '#020617';
  }
  const top = lerpColor(topNight, topDay, phase);
  const mid = lerpColor(midNight, midDay, phase);
  const bot = lerpColor(botNight, botDay, phase);
  const skyGrad = ctx.createLinearGradient(0,0,0,surfaceY);
  skyGrad.addColorStop(0, top); skyGrad.addColorStop(0.5, mid); skyGrad.addColorStop(1, bot);
  ctx.fillStyle = skyGrad; ctx.fillRect(0,0,W,surfaceY);

  if (state.level.current !== 4) {
    const sunX = W * 0.15 + Math.sin(t*1.2) * 40;
    const sunY = surfaceY * (0.2 + 0.2 * Math.cos(t*1.1));
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 40);
    const sunColor = phase > 0.5 ? '#fde68a' : '#bfdbfe';
    sunGrad.addColorStop(0, sunColor); sunGrad.addColorStop(1, 'rgba(252,211,77,0)');
    ctx.fillStyle = sunGrad; ctx.beginPath(); ctx.arc(sunX, sunY, 40, 0, Math.PI*2); ctx.fill();
  }
  if (state.level.current !== 4) {
    ctx.fillStyle = 'rgba(241,245,249,' + (0.5 + 0.4*phase) + ')';
    for (const c of state.world.clouds) { ctx.beginPath(); ctx.ellipse(c.x, c.y, c.w * 0.5, c.h * 0.5, 0, 0, Math.PI*2); ctx.fill(); }
  } else {
    if (state.world.stars.length === 0) initStars();
    for (const s of state.world.stars) {
      const t2 = Date.now() * 0.002 + s.phase;
      const alpha = 0.3 + 0.7 * Math.abs(Math.sin(t2));
      ctx.fillStyle = `rgba(248,250,252,${alpha})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
  }
}
function drawWater(){
  const theme = levelThemes[state.level.current] || levelThemes[0];
  const waterGrad = ctx.createLinearGradient(0, surfaceY, 0, H);
  waterGrad.addColorStop(0, theme.waterTop);
  waterGrad.addColorStop(0.4, theme.waterMid);
  waterGrad.addColorStop(1, theme.waterBottom);
  ctx.fillStyle = waterGrad; ctx.fillRect(0,surfaceY,W,H-surfaceY);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  for (let x=0; x<W; x+=24) {
    ctx.beginPath();
    const y = surfaceY + Math.sin((x+Date.now()*0.002)*0.06)*2;
    ctx.ellipse(x+12, y, 18, 6, 0, 0, Math.PI*2);
    ctx.fill();
  }
}
function drawBoat(){
  ctx.save();
  ctx.translate(state.player.boatX, surfaceY - 6);
  const lvl = state.level.current ?? 0;
  if (lvl === 0) {
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.moveTo(-40, 0); ctx.lineTo(40, 0); ctx.lineTo(24, 14); ctx.lineTo(-24, 14);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e5e7eb'; ctx.fillRect(-3, -16, 6, 16);
  } else if (lvl === 1) {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath(); ctx.moveTo(-44, 2); ctx.lineTo(44, 0); ctx.lineTo(26, 16); ctx.lineTo(-26, 16);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e5e7eb'; ctx.fillRect(-10, -18, 22, 18);
    ctx.fillStyle = '#38bdf8'; ctx.fillRect(-7, -15, 16, 10); ctx.fillRect(30, 2, 10, 12);
  } else if (lvl === 2) {
    ctx.fillStyle = '#0f172a';
    ctx.beginPath(); ctx.moveTo(-50, 2); ctx.lineTo(50, 0); ctx.lineTo(32, 18); ctx.lineTo(-32, 18);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e5e7eb'; ctx.fillRect(-18, -22, 36, 22);
    ctx.fillStyle = '#38bdf8'; ctx.fillRect(-14, -19, 14, 10); ctx.fillRect(2, -19, 14, 10);
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(0, -32); ctx.stroke();
  } else if (lvl === 3) {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath(); ctx.moveTo(-80, 6); ctx.lineTo(80, 0); ctx.lineTo(60, 24); ctx.lineTo(-60, 24);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e5e7eb'; ctx.fillRect(-30, -26, 60, 26);
    ctx.fillStyle = '#60a5fa'; ctx.fillRect(-24, -22, 16, 12); ctx.fillRect(8, -22, 16, 12);
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(0, -46); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -46, 6, 0, Math.PI * 2); ctx.fillStyle = '#facc15'; ctx.fill();
  } else {
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath(); ctx.ellipse(0, 10, 48, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e5e7eb'; ctx.beginPath(); ctx.ellipse(0, -2, 32, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#38bdf8'; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.ellipse(0, -12, 18, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = '#facc15';
    for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.arc(i * 10, 16, 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  ctx.restore();
}
function drawLineAndHook(){
  ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 2; ctx.beginPath();
  ctx.moveTo(state.player.boatX, surfaceY-6); ctx.lineTo(state.player.hookX, state.player.hookY-8); ctx.stroke();
  ctx.save(); ctx.translate(state.player.hookX, state.player.hookY);
  ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3; ctx.beginPath();
  ctx.moveTo(0,-8); ctx.lineTo(0,6); ctx.arc(6,6,6,Math.PI,Math.PI*1.75);
  ctx.stroke(); ctx.restore();
}
function drawAlienFish(f) {
  ctx.save(); ctx.translate(f.x, f.y); ctx.scale(f.dir,1);
  ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.ellipse(0,0,f.size*1.1, f.size*0.6, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#bbf7d0'; ctx.beginPath(); ctx.arc(f.size*0.3, -2, 4, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#020617'; ctx.beginPath(); ctx.arc(f.size*0.3, -2, 2, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#a5b4fc'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-f.size*0.2, -f.size*0.3); ctx.lineTo(-f.size*0.2, -f.size*0.7); ctx.stroke();
  ctx.beginPath(); ctx.arc(-f.size*0.2, -f.size*0.7, 3, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(f.size*0.2, -f.size*0.3); ctx.lineTo(f.size*0.2, -f.size*0.7); ctx.stroke();
  ctx.beginPath(); ctx.arc(f.size*0.2, -f.size*0.7, 3, 0, Math.PI*2); ctx.stroke();
  ctx.restore();
}
function drawFishes(){
  for (const f of state.world.fishes) {
    if (state.level.current === 4) { drawAlienFish(f); continue; }
    if (f.type === 'jelly') {
      ctx.save(); ctx.translate(f.x, f.y);
      ctx.fillStyle = f.color; ctx.beginPath(); ctx.ellipse(0,0,f.size, f.size*0.7, 0, Math.PI, 0, true); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-f.size*0.6,0); ctx.lineTo(-f.size*0.4,f.size*0.9);
      ctx.moveTo(-f.size*0.2,0); ctx.lineTo(-f.size*0.1,f.size);
      ctx.moveTo(0,0); ctx.lineTo(0.1*f.size,f.size*0.9);
      ctx.moveTo(f.size*0.2,0); ctx.lineTo(f.size*0.3,f.size*0.9);
      ctx.strokeStyle = f.color; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); continue;
    }
    ctx.save(); ctx.translate(f.x, f.y); ctx.scale(f.dir,1);
    let bodyW = f.size, bodyH = f.size*0.6;
    if (f.type === 'slim') { bodyW = f.size + 10; bodyH = f.size*0.35; }
    else if (f.type === 'round') bodyH = f.size*0.9;
    else if (f.type === 'golden') bodyH = f.size*0.7;
    ctx.fillStyle = f.color; ctx.beginPath(); ctx.ellipse(0,0,bodyW, bodyH, 0, 0, Math.PI*2); ctx.fill();
    if (f.type === 'golden' || f.type === 'round') {
      ctx.fillStyle = 'rgba(253,224,71,0.4)';
      ctx.beginPath(); ctx.ellipse(-bodyW*0.1,-bodyH*0.3,bodyW*0.4, bodyH*0.3, 0,0,Math.PI*2); ctx.fill();
    }
    ctx.beginPath(); ctx.moveTo(-bodyW,0); ctx.lineTo(-bodyW-8,6); ctx.lineTo(-bodyW-8,-6); ctx.closePath(); ctx.fill();
    const pattern = f.pattern || 'plain';
    if (pattern === 'striped') {
      ctx.strokeStyle = 'rgba(15,23,42,0.35)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-bodyW*0.2,-bodyH*0.7); ctx.lineTo(-bodyW*0.05,bodyH*0.7);
      ctx.moveTo(0,-bodyH*0.7); ctx.lineTo(bodyW*0.15,bodyH*0.7); ctx.stroke();
    } else if (pattern === 'spotted') {
      ctx.fillStyle = 'rgba(248,250,252,0.6)';
      for (let i=-1;i<=1;i++){ ctx.beginPath(); ctx.arc(i*bodyW*0.25, 0, 3, 0, Math.PI*2); ctx.fill(); }
    }
    if (pattern === 'longtail') { ctx.beginPath(); ctx.moveTo(-bodyW,0); ctx.lineTo(-bodyW-14,8); ctx.lineTo(-bodyW-14,-8); ctx.closePath(); ctx.fill(); }
    if (f.type === 'slim' || pattern === 'striped') {
      ctx.fillStyle = 'rgba(15,23,42,0.4)';
      ctx.beginPath(); ctx.moveTo(-bodyW*0.2,-bodyH); ctx.lineTo(0,-bodyH*1.5); ctx.lineTo(bodyW*0.2,-bodyH); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#020617'; ctx.beginPath(); ctx.arc(bodyW*0.4,-2,2.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#e5e7eb'; ctx.beginPath(); ctx.arc(bodyW*0.4-1,-3,1,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
}

// UI overlays
function drawStartScreen() {
  if (state.session.started || state.session.over || !state.level.isScreen) return;
  ctx.fillStyle = 'rgba(15,23,42,0.75)'; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  const lvl = LEVELS[state.level.current];
  const next = state.level.current + 1;
  const nextGoal = LEVELS[next] ? LEVELS[next].goal : null;
  ctx.fillStyle = '#facc15'; ctx.font = 'bold 40px system-ui';
  ctx.fillText(`Nivel ${state.level.current + 1}: ${lvl.name}`, W / 2, H / 2 - 60);
  ctx.fillStyle = '#e5e7eb'; ctx.font = '18px system-ui';
  if (nextGoal != null) ctx.fillText(`Meta para subir: ${nextGoal} puntos`, W / 2, H / 2 - 20);
  else ctx.fillText('Último nivel: disfruta el espacio 🚀', W / 2, H / 2 - 20);
  ctx.font = '14px system-ui';
  if (state.level.screenMode === 'start') ctx.fillText('Pulsa ESPACIO o ENTER para empezar', W / 2, H / 2 + 20);
  else {
    ctx.fillText('1) Continuar al siguiente nivel: ESPACIO / ENTER', W / 2, H / 2 + 10);
    ctx.fillText('2) Guardar y salir: tecla G', W / 2, H / 2 + 40);
  }
}
function drawNameEntry(){
  if (!state.meta.enteringName) return;
  ctx.fillStyle = 'rgba(15,23,42,0.9)'; ctx.fillRect(0,0,W,H);
  ctx.textAlign = 'center'; ctx.fillStyle = '#facc15'; ctx.font = 'bold 40px system-ui';
  ctx.fillText('¡NUEVO TOP 5!', W/2, H/2 - 60);
  ctx.fillStyle = '#e5e7eb'; ctx.font = '18px system-ui';
  ctx.fillText(`Puntos: ${state.meta.pendingScore}`, W/2, H/2 - 20);
  ctx.fillText('Escribe tus iniciales (A-Z), ENTER para guardar', W/2, H/2 + 10);
  const shown = (isTouch && els.name.wrap && els.name.wrap.style.display !== 'none')
    ? state.meta.touchName.join('')
    : (state.meta.initials + '___').slice(0,3);
  ctx.font = 'bold 32px system-ui';
  ctx.fillText(shown.split('').join(' '), W/2, H/2 + 60);
}
function drawGameOver(){
  if (!state.session.over || state.meta.enteringName) return;
  ctx.fillStyle = 'rgba(15,23,42,.8)'; ctx.fillRect(0,0,W,H);
  ctx.fillStyle = '#e5e7eb'; ctx.textAlign = 'center';
  ctx.font = 'bold 42px system-ui'; ctx.fillText('Juego terminado', W/2, H/2-20);
  const top = state.meta.highscores[0];
  const bestText = top ? `${top.name} ${top.score}` : '--- 0';
  ctx.font = 'bold 20px system-ui';
  ctx.fillText(`Puntos: ${state.session.score}  ·  Mejor: ${bestText}`, W/2, H/2+18);
  ctx.font = '16px system-ui'; ctx.fillText('Pulsa R para reiniciar', W/2, H/2+48);
}
function drawFightHint(){
  if (state.session.inFight && state.session.hookedFish && !state.session.over && !state.meta.enteringName) {
    ctx.fillStyle = 'rgba(15,23,42,.20)'; ctx.fillRect(0,0,W,90);
    ctx.fillStyle = '#e5e7eb'; ctx.font = '18px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Pulsa ESPACIO o “Lanzar” repetidamente para ganar la pelea!', W/2, 55);
  }
}
function drawUI(){ drawStartScreen(); drawNameEntry(); drawGameOver(); drawFightHint(); }

function loop(){
  update();
  ctx.clearRect(0,0,W,H);
  drawSky(); drawWater(); drawFishes(); drawBoat(); drawLineAndHook(); drawUI();
  requestAnimationFrame(loop);
}

function renderTouchName() {
  for (let i = 0; i < 3; i++) els.name.letters[i].textContent = state.meta.touchName[i];
}

// Boot
loadProgress();
resetGameState();
loadHighscores();
bindInput();
requestAnimationFrame(loop);

// Debug (siempre crea el objeto)
window.fishDebug = window.fishDebug || {};
const DEV_MODE =
  location.hostname === 'localhost' ||
  location.hostname === '127.0.0.1' ||
  location.protocol === 'file:';

if (DEV_MODE) {
  Object.assign(window.fishDebug, {
    addCoins(n = 100) { state.session.coins += n; els.coins.textContent = state.session.coins; updateShopUI(); },
    setLevel(i = 0) {
      state.level.current = clamp(i, 0, LEVELS.length - 1);
      state.level.maxUnlocked = Math.max(state.level.maxUnlocked, state.level.current);
      updateLevelUI();
    },
    giveScore(s = 50) { state.session.score += s; els.score.textContent = state.session.score; checkLevelProgress(); },
    winFight() { if (state.session.inFight && state.session.hookedFish) { state.player.hookY = surfaceY + 20; state.session.fightValue = 100; captureFish(); } },
    loseFight() { if (state.session.inFight) { state.session.fightValue = 0; els.fight.value = 0; state.session.lives = Math.max(0, state.session.lives - 1); els.lives.textContent = state.session.lives; } },
    refillTime(t = 60) { state.session.timeLeft += t; els.time.textContent = state.session.timeLeft; },
    reset() { resetGameState(); startTimer(); },
  });
  console.info('fishDebug listo:', Object.keys(window.fishDebug).join(', '));
}

