/* Hidden in the code, uselessly, on purpose — a thank-you note, in his words:
   "Thank you friends, family, and all the loved ones who've supported me enough to help me get to this point ... 'Mom, Dad, Alan, Grandma & Grandpa, Mamaw n Papaw. ... But all the women I loved, too... Some of 'em may have loved me, too...'"
   It does nothing. It is not shown in the game. It is just here. */
/* Rune Warden — an original top-down action tale.
   Hero: Kari, keeper of the last beacon. Villain: the Hollow King.
   Ten realms, beacons, NPCs, runestones, a raven scout, and a final
   choice. Three of the realms are sealed: each holds a Span Sigil
   behind a brass-key gate, and its beacon stays shut until the Sigil
   is carried out. Folk who join Kari walk with her and can be played as keepers too. No assets or story taken from any existing game; the Norse
   flavour is original writing. */
'use strict';

const TILE = 48;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const LEVELS = [
  {
    name: 'Emberwood',
    hint: 'Draugr walk between the trees. The beacon burns at the far end.',
    floor: ['#2a3a26', '#253521'], wall: '#1a2416', wallTop: '#3d5233',
    weather: 'embers', decor: 'pine', vision: 'The beacon catches — and far off, through the dark, another light answers.',
    runes: ["Yrsa's mark: 'A keeper walks toward the dark so others don't have to.'",
      "Yrsa's mark: 'I was the seventh keeper. The six before me are the wind in the Span now.'"],
    map: [
      '####################',
      '#P.....#.....M.....#',
      '#..D...#....D......#',
      '#......###.........#',
      '#...#......D...#...#',
      '#..R#..M.......#...#',
      '#......#.......#...#',
      '#..D...#...D...R...#',
      '#......###...M.....#',
      '#....M........#....#',
      '#....D.......#..B..#',
      '####################',
    ],
  },
  {
    name: 'Sunlit Clearing',
    hint: 'Open sky, old stones, and draugr in the grass. The beacon stands in the clearing.',
    floor: ['#3a5a2e', '#35552a'], wall: '#1a2a16', wallTop: '#4a6a3a',
    weather: null, npc: null, decor: 'pine', outdoor: true, dark: 0,
    vision: 'The beacon catches in daylight, and for once the dark is only a shadow under the trees.',
    runes: ["Yrsa's mark: 'Not every fight is in a dungeon. Some are just out in the open, where everyone can see you lose.'",
      "Yrsa's mark: 'The clearing remembers every keeper who stood here. Stand well.'"],
    map: [
      '####################',
      '#P.................#',
      '#.....D............#',
      '#..........M.......#',
      '#...R......#.......#',
      '#.......D..........#',
      '#............M.....#',
      '#.....D......#.....#',
      '#..............R...#',
      '#........M.........#',
      '#..............B...#',
      '####################',
    ],
  },
  {
    name: 'Frostfall',
    hint: 'Ice-wolves hunt in packs. Keep moving, keep swinging.',
    floor: ['#24384a', '#20333f'], wall: '#16242f', wallTop: '#3d5a73',
    weather: 'snow', npc: 'mira', decor: 'crystal', vision: 'The light runs north, and for a moment the snow stops falling.',
    runes: ["Yrsa's mark: 'The wolves are only hungry. The Hollow is something else.'",
      "Yrsa's mark: 'The wolves are not the Hollow. They are only hungry, and hunger is honest.'"],
    map: [
      '####################',
      '#P...#.....W.....M.#',
      '#....#..D....#.....#',
      '#.W..###....W.#....#',
      '#.R..#...M...#..D..#',
      '#....#.W.....#.....#',
      '#.M..#....#...N....#',
      '#....###..W...#....#',
      '#.....D.....#.#.M..#',
      '#..W......R#..#....#',
      '#....M.....#...B...#',
      '####################',
    ],
  },
  {
    name: 'Drowned Road',
    hint: 'Black water, drowned dead. Tove poles the marsh road.',
    floor: ['#1e4a44', '#173a36'], wall: '#12201c', wallTop: '#2a6a5e',
    weather: 'rain', npc: 'tove', dark: 0.45, decor: 'reed', vision: 'The beacon burns green-gold over black water. Something below stops watching.',
    runes: ["Yrsa's mark: 'Bjarni was my friend before he was a king. Remember that.'",
      "Yrsa's mark: 'The drowned were ferry-folk once. The Hollow took the river road first.'"],
    map: [
      '####################',
      '#P.......#.........#',
      '#..U....#...U......#',
      '#........#.....M...#',
      '#...M...###...#....#',
      '#........#.....#...#',
      '#.R........U...#...#',
      '#........#.....#N..#',
      '#...U...#.....#....#',
      '#..R.....#.M...#...#',
      '#........#.....#.B.#',
      '####################',
    ],
  },
  {
    name: 'Cinder Wastes',
    hint: 'Ember trolls guard the forge-road. Pike knows a cache.',
    floor: ['#3a2620', '#33211c'], wall: '#221512', wallTop: '#5a3a2e',
    weather: 'ash', npc: 'pike', decor: 'rock', vision: 'The forge-light steadies. The ash falls a little slower.',
    runes: ["Yrsa's mark: 'The forge takes as much as it gives. So does the Span.'",
      "Yrsa's mark: 'The forge-trolls kept their fires for the Span. Ask Pike what the dark promised them.'"],
    map: [
      '####################',
      '#P....#.....T......#',
      '#..Y..#.......M....#',
      '#.R...###.....T....#',
      '#.....#.........#..#',
      '#..M..#...T.....#..#',
      '#.....#.........#N.#',
      '#.....###.......#..#',
      '#.....G.M.......#..#',
      '#.....#....T....#..#',
      '#..R..#.........#B.#',
      '####################',
    ],
  },
  {
    name: 'Hollow Hall',
    hint: 'The Hollow King waits. He charges, and he calls his dead.',
    floor: ['#33262e', '#2e2229'], wall: '#201720', wallTop: '#4a3442',
    boss: true, dark: 0.55, decor: 'pillar', vision: "The King's hall goes quiet. The Hollow pulls back — for now.",
    runes: ["Bjarni's mark: 'Yrsa begged me to wait one winter. My people did not have a winter.'",
      "Yrsa's mark: 'Bjarni opened the Hollow to feed his people. The Hollow kept the change.'"],
    map: [
      '####################',
      '#P........#........#',
      '#...D....#...D.....#',
      '#....R....#........#',
      '#....M...#....M....#',
      '#.........#........#',
      '#....#...#....#....#',
      '#....#........#....#',
      '#.........K........#',
      '#.R..M.........M...#',
      '#.........B........#',
      '####################',
    ],
  },
  {
    name: 'Windscar Fjord',
    hint: 'Two shores, one gate. Eira waits on the west shore — she knows the wind-word the gate answers to. The Sigil of Wind waits behind the brass gate, and its beacon stays sealed until you carry it out.',
    floor: ['#2e3a4a', '#28333f'], wall: '#1a2430', wallTop: '#4a5a70',
    weather: 'snow', decor: 'crystal', seal: 'wind', sealName: 'Sigil of Wind', npc: 'eira', heroGate: 'eira', heroGateName: 'Wind Gate',
    hint2: 'Two shores, one gate. Eira knows the wind-word — SWITCH to her at the gate.',
    vision: 'The wind drops. Somewhere north, a light that was never a beacon answers anyway.',
    runes: ["Yrsa's mark: 'One keeper cannot carry three Sigils alone. The Span will need more than one pair of hands now. Walk as your folk, keeper — they are keepers too, when you let them be.'",
      "Yrsa's mark: 'The fjord keeps what the storm takes. The Sigil of Wind is in the gatehouse. The wind does not give it back for free.'"],
    map: [
      '########################',
      '#P...........#.........#',
      '#....M..H....#......M..#',
      '#............#..H......#',
      '#.R.......D..#.........#',
      '#.......#..#.#.........#',
      '#............#.........#',
      '#............Q....####.#',
      '#...NH.......#..W.M..R.#',
      '#............#....#I.#.#',
      '#.....W......#....#..#.#',
      '#..D.#.......#.Y..#G#D.#',
      '#............#........B#',
      '########################',
    ],
  },
  {
    name: 'Ember Deep',
    hint: 'Mira\'s trial. The forge-road runs through two halls, and only the Ember Gate joins them — it answers to Mira and her ember blade. The Sigil of Ember waits behind the brass gate, and its beacon stays sealed until you carry it out.',
    floor: ['#3a2620', '#33211c'], wall: '#221512', wallTop: '#5a3a2e',
    weather: 'ash', decor: 'rock', seal: 'ember', sealName: 'Sigil of Ember', npc: 'mira', heroGate: 'mira', heroGateName: 'Ember Gate',
    vision: 'The forge-light steadies, and the ash falls a little slower. The deep is listening.',
    runes: ["Bjarni's mark: 'I fed the forge with everything I had. It gave the Span back, and it kept the change.'",
      "Yrsa's mark: 'Ember does not argue. It only burns, and it remembers who tended it.'"],
    map: [
      '########################',
      '#P.............T..####.#',
      '#...........N.....#..#.#',
      '#.R.......D.......#.I#.#',
      '#....M............#..#.#',
      '#........T........##G#.#',
      '##Q#################..##',
      '##.##################.##',
      '#......................#',
      '#..DV..........R.......#',
      '#..................M...#',
      '#..Y.T.................#',
      '#.....................B#',
      '########################',
    ],
  },
  {
    name: 'Sunken Vault',
    hint: 'Tove\'s trial. Three vaults, and only the Tide Gate joins the last of them — it answers to Tove, who ferried these waters before they drowned. The Sigil of Deep waits behind the brass gate, and its beacon stays sealed until you carry it out.',
    floor: ['#1e4a44', '#173a36'], wall: '#12201c', wallTop: '#2a6a5e',
    weather: 'rain', decor: 'reed', dark: 0.45, seal: 'deep', sealName: 'Sigil of Deep', npc: 'tove', heroGate: 'tove', heroGateName: 'Tide Gate',
    vision: 'The water goes still. Below it, something old stops watching.',
    runes: ["First keeper's mark: 'We built the Span with many hands. One keeper holds the light. Many keepers hold the road.'",
      "Yrsa's mark: 'The vault was drowned on purpose. Some things are safer under water than they ever were above it.'"],
    map: [
      '########################',
      '#P......#......U#......#',
      '#.......#.M.....#...Y..#',
      '#.R.....#.E.....Q......#',
      '#.......#.......#......#',
      '#.......#U......#....U.#',
      '#.......#.......#......#',
      '#..E....#...R...#......#',
      '#.##G##.#.......#......#',
      '#.#.U.#.#.....N.#.M....#',
      '#.#...#.........#......#',
      '#.#HI.#.#...D...#......#',
      '#.#####.#.......#.....B#',
      '########################',
    ],
  },
  {
    name: "Span's Heart",
    hint: "Two beacons burn where the Span broke. One relights the world. One lets it rest. Walk to the one you choose.",
    floor: ['#2a2438', '#252031'], wall: '#171423', wallTop: '#453a5e',
    finale: true, dark: 0.5, npc: 'wright', decor: 'shard',
    runes: ["Yrsa's mark: 'The Span can be mended. The question is whether it should be.'",
      "Bjarni's mark: 'I broke it to save them. Tell me I was wrong, keeper — and mean it.'",
      "First keeper's mark: 'We built the Span to hold the Hollow back, not to hold the world together. Remember the difference.'"],
    map: [
      '####################',
      '#P.................#',
      '#....S.......D.....#',
      '#....R.............#',
      '#........M.........#',
      '#.........R........#',
      '#....D.......D.....#',
      '#.........R........#',
      '#........M.........#',
      '#.........N........#',
      '#....B........O....#',
      '####################',
    ],
  },
];

const state = {
  screen: 'title', // title | play | card | over | win
  level: 0, score: 0, best: 0,
  muted: false, paused: false, dbg: false, iso: true,
  cardTimer: 0, shake: 0, time: 0, hitStop: 0, ambientT: 0, fade: 0, dustT: 0,
  cmd: false, met: {}, deadAllies: [], allyHp: {}, sel: [], enemyGrace: 0,
  heroLvl: 1, skillPoints: 0, skills: {}, shieldActive: false,
  armorTier: 0, materials: { crystal: 0, shard: 0 }, panel: null, sigils: 0, sigilTaken: false,
};

try {
  state.best = parseInt(localStorage.getItem('rw_best') || '0', 10) || 0;
  state.muted = localStorage.getItem('rw_muted') === '1';
  state.music = localStorage.getItem('rw_music') !== '0';
  const v = localStorage.getItem('rw_view');
  if (v) state.iso = v === 'iso';
} catch (e) { /* storage unavailable: play on regardless */ }

let player, enemies, pickups, particles, floats, beacon, darkBeacon, npcs, runestones, raven, gates, heroGates, allies = [], hushStone = null; let beckyBox = null;

/* ---------- sound: tiny synth, no assets ---------- */
let AC = null;
function ac() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (AC && AC.state === 'suspended') AC.resume();
  return AC;
}
function tone(freq, dur, type, vol, slide) {
  if (state.muted) return;
  const c = ac(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type || 'square'; o.frequency.setValueAtTime(freq, c.currentTime);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, c.currentTime + dur);
  g.gain.setValueAtTime(vol || 0.12, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  o.connect(g); g.connect(c.destination);
  o.start(); o.stop(c.currentTime + dur);
}
const sfx = {
  swing() { tone(320, 0.09, 'sawtooth', 0.06, 140); },

  hit() { tone(140, 0.12, 'square', 0.12, 60); },
  hurt() { tone(220, 0.25, 'sawtooth', 0.14, 70); },
  mead() { tone(520, 0.1, 'sine', 0.12); setTimeout(() => tone(780, 0.14, 'sine', 0.12), 90); },
  key() { tone(660, 0.08, 'square', 0.1); setTimeout(() => tone(990, 0.12, 'square', 0.1), 80); },
  rune() { [440, 554, 659, 880].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.12), i * 110)); },
  roar() { tone(90, 0.6, 'sawtooth', 0.16, 45); },
  win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', 0.12), i * 140)); },
};
/* ---------- temp music: low-volume synth boom-bap loop, no assets ----------
   3.10.0: a nonspecific hip-hop-type loop under gameplay, deliberately
   quiet so SFX stay on top. All synth, so the APK does not grow.
   84 BPM, 2-bar loop, swung 16ths: kick / snare on 2+4 / hats / a low
   A-minor bass line / a soft pad stab. It only plays during play (not
   title, cards, pause, or win), and only when music is on and not muted.
   The HUD music button toggles it separately from the SFX mute. */
let musicTimer = null, musicNext = 0, musicStep = 0;
const MUSIC_STEP = 60 / 84 / 4;
function musicOsc(freq, dur, type, vol, when, slide) {
  const c = AC; if (!c) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(freq, when);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, when + dur);
  g.gain.setValueAtTime(vol, when);
  g.gain.exponentialRampToValueAtTime(0.001, when + dur);
  o.connect(g); g.connect(c.destination);
  o.start(when); o.stop(when + dur);
}
let _noiseBuf = null;
function musicNoise(dur, vol, when, filterType, filterFreq) {
  const c = AC; if (!c) return;
  if (!_noiseBuf) {
    _noiseBuf = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate);
    const d = _noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource(); src.buffer = _noiseBuf;
  const f = c.createBiquadFilter(); f.type = filterType; f.frequency.value = filterFreq;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, when);
  g.gain.exponentialRampToValueAtTime(0.001, when + dur);
  src.connect(f); f.connect(g); g.connect(c.destination);
  src.start(when); src.stop(when + dur);
}
function scheduleMusicStep(step, when) {
  // 3.11.2: bumped a notch (his tap, 2026-11-04) — was barely audible on
  // a phone speaker. Same mix, ~40% louder; still background, not front.
  if ([0, 7, 10, 16, 23, 26].includes(step)) musicOsc(150, 0.14, 'sine', 0.19, when, 42); // kick
  if ([4, 12, 20, 28].includes(step)) musicNoise(0.16, 0.10, when, 'lowpass', 1800); // snare
  if (step % 2 === 0 || step === 14 || step === 30) musicNoise(0.04, 0.04, when, 'highpass', 6500); // hats
  const bass = { 0: 55, 6: 65.41, 10: 82.41, 16: 55, 22: 49, 26: 82.41 }[step];
  if (bass) musicOsc(bass, 0.38, 'triangle', 0.10, when);
  if (step === 0 || step === 16) for (const f of [220, 261.63, 329.63]) musicOsc(f, 1.4, 'triangle', 0.03, when); // soft Am pad
}
function musicTick() {
  const c = AC;
  if (!c || !state.music || state.muted || state.screen !== 'play' || state.paused) { musicNext = 0; return; }
  if (c.state === 'suspended') c.resume();
  if (!musicNext || musicNext < c.currentTime) musicNext = c.currentTime + 0.05;
  while (musicNext < c.currentTime + 0.25) {
    const swing = (musicStep % 2 === 1) ? MUSIC_STEP * 0.12 : 0;
    scheduleMusicStep(musicStep, musicNext + swing);
    musicNext += MUSIC_STEP; musicStep = (musicStep + 1) % 32;
  }
}
function startMusic() {
  if (!AC || musicTimer) return;
  musicTimer = setInterval(musicTick, 100);
}
function toggleMusic() {
  state.music = !state.music;
  try { localStorage.setItem('rw_music', state.music ? '1' : '0'); } catch (e) {}
  const b = document.getElementById('musicBtn');
  if (b) b.classList.toggle('off', !state.music);
  if (state.music) startMusic();
}

/* ---------- input ---------- */
const keys = {};
const joy = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 };
let lastZoneEvent = 'none';
window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  keys[e.key.toLowerCase()] = true;
  if ((e.key === ' ' || e.key.toLowerCase() === 'j') && !e.repeat) attack();
  if (e.key.toLowerCase() === 'p') togglePause();
  if (e.key.toLowerCase() === 'm') toggleMute();
  // command-mode selection: 1 Kari, 2 Mira, 3 Tove, 4 Pike, 5 Eira, 0 the whole party
  if (state.cmd && state.screen === 'play') {
    if (e.key === '0') state.sel = [player, ...allies];
    else if (e.key === '1') state.sel = [player];
    else if (e.key === '2' && allies.find((a) => a.kind === 'mira')) state.sel = [allies.find((a) => a.kind === 'mira')];
    else if (e.key === '3' && allies.find((a) => a.kind === 'tove')) state.sel = [allies.find((a) => a.kind === 'tove')];
    else if (e.key === '4' && allies.find((a) => a.kind === 'pike')) state.sel = [allies.find((a) => a.kind === 'pike')];
    else if (e.key === '5' && allies.find((a) => a.kind === 'eira')) state.sel = [allies.find((a) => a.kind === 'eira')];
  }
  if (state.screen === 'card' && (e.key === ' ' || e.key === 'Enter')) advanceCard();
  if ((state.screen === 'over' || state.screen === 'win') && e.key === 'Enter') startRun();
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

const stickZone = document.getElementById('stickZone');
const stickBase = document.getElementById('stickBase');
const stickKnob = document.getElementById('stickKnob');
stickZone.addEventListener('pointerdown', (e) => {
  if (joy.active) return;
  lastZoneEvent = 'down id=' + e.pointerId;
  joy.active = true; joy.id = e.pointerId;
  joy.ox = e.clientX; joy.oy = e.clientY; joy.x = 0; joy.y = 0;
  stickBase.style.display = 'block';
  stickBase.style.left = (e.clientX - 60) + 'px';
  stickBase.style.top = (e.clientY - 60) + 'px';
  // Pointer capture is best-effort: if it fails (or the finger lifts over
  // another element), the window-level handlers below still end the stick.
  // A stuck stick used to block every later touch, which felt like "can't move".
  try { stickZone.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
});
stickZone.addEventListener('pointermove', (e) => {
  if (!joy.active || e.pointerId !== joy.id) return;
  lastZoneEvent = 'move ' + Math.round(e.clientX) + ',' + Math.round(e.clientY);
  let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy;
  const len = Math.hypot(dx, dy), max = 52;
  if (len > max) { dx = dx / len * max; dy = dy / len * max; }
  joy.x = dx / max; joy.y = dy / max;
  stickKnob.style.left = (35 + dx) + 'px';
  stickKnob.style.top = (35 + dy) + 'px';
});
// 4.0.3: input reset. Tabbing out to another Android window mid-touch
// loses the pointer entirely — no pointerup, no pointercancel — so the
// stick (and any held keys) would stay stuck and the game would feel dead
// on return, even though the graphics keep drawing.
function resetInput() {
  joy.active = false; joy.id = null; joy.x = 0; joy.y = 0;
  stickBase.style.display = 'none';
  for (const k in keys) keys[k] = false;
}
window.addEventListener('blur', resetInput);
function endStick(e) {
  if (!joy.active) return;
  if (e && e.pointerId !== undefined && e.pointerId !== joy.id) return; // other finger
  lastZoneEvent = 'up id=' + (e ? e.pointerId : '?');
  joy.active = false; joy.id = null; joy.x = 0; joy.y = 0;
  stickBase.style.display = 'none';
}
stickZone.addEventListener('pointerup', endStick);
stickZone.addEventListener('pointercancel', endStick);
// Window-level: a finger lifted over another element (attack button, HUD,
// overlay) must still release the stick, or it stays stuck and movement dies.
window.addEventListener('pointerup', endStick);
window.addEventListener('pointercancel', endStick);
window.addEventListener('lostpointercapture', endStick);

document.getElementById('atkBtn').addEventListener('pointerdown', (e) => { e.preventDefault(); attack(); });
document.getElementById('cmdBtn').addEventListener('click', toggleCmd);
document.getElementById('switchBtn').addEventListener('click', () => { if (state.screen === 'play') switchHero(); });
document.getElementById('allBtn').addEventListener('click', () => { if (state.cmd && state.screen === 'play') state.sel = [player, ...allies]; });
// command input: tap a hero to select, tap ground or a foe to order
document.getElementById('game').addEventListener('pointerdown', (e) => {
  if (!state.cmd || state.screen !== 'play' || state.paused || !player) return;
  const rect = e.target.getBoundingClientRect();
  const sx = (e.clientX - rect.left) / rect.width * 960;
  const sy = (e.clientY - rect.top) / rect.height * 576;
  let wx, wy;
  if (state.iso) { const u = sx - ISO_OX, v = sy - ISO_OY; wx = u + 2 * v; wy = 2 * v - u; }
  else { wx = sx; wy = sy; }
  let best = null, bestD = 30;
  for (const u of [player, ...allies]) {
    const d = Math.hypot(u.x - wx, u.y - wy);
    if (d < bestD) { bestD = d; best = u; }
  }
  if (best) {
    if (state.sel.includes(best)) state.sel = state.sel.filter((u) => u !== best);
    else state.sel = [best];
    return;
  }
  let tgt = null, td = 30;
  for (const en of enemies) {
    if (en.hp <= 0) continue;
    const d = Math.hypot(en.x - wx, en.y - wy);
    if (d < td) { td = d; tgt = en; }
  }
  orderSelected(wx, wy, tgt);
});
document.getElementById('pauseBtn').addEventListener('click', togglePause);
document.getElementById('muteBtn').addEventListener('click', toggleMute);
document.getElementById('dbgBtn').addEventListener('click', () => {
  state.dbg = !state.dbg;
  document.getElementById('dbgBtn').classList.toggle('off', !state.dbg);
  if (!state.dbg) document.getElementById('dbg').classList.add('hidden');
});
// 4.0.3: pause menu — pause, save, and exit, in one place. The old code
// auto-paused on tab-out with no resume and no visible "paused" state, so
// the game looked alive but would not move; and a finger on the stick when
// the app was backgrounded never produced a pointerup, leaving the stick
// stuck. Now tabbing out pauses and opens this menu, and coming back the
// menu is waiting — Resume, Save Game, or Quit to Title.
function showPauseMenu() {
  state.menuOpen = true;
  const info = document.getElementById('pauseInfo');
  if (info) info.textContent = LEVELS[state.level].name + ' — Score ' + state.score + (state.sigils ? ' — Sigils ' + state.sigils + '/3' : '');
  document.getElementById('pauseMenu').classList.remove('hidden');
}
function hidePauseMenu() {
  state.menuOpen = false;
  document.getElementById('pauseMenu').classList.add('hidden');
}
function pauseGame() {
  if (state.screen !== 'play' || state.paused) return;
  state.paused = true;
  document.getElementById('pauseBtn').textContent = '▶';
  showPauseMenu();
  saveGame();
}
function resumeGame() {
  if (!state.paused) return;
  state.paused = false;
  document.getElementById('pauseBtn').textContent = 'II';
  hidePauseMenu();
}
function saveAndBanner() { saveGame(); showBanner('Progress saved.'); }
function quitToTitle() {
  saveGame();
  hidePauseMenu();
  state.paused = false;
  document.getElementById('pauseBtn').textContent = 'II';
  showTitle();
}
document.getElementById('resumeBtn').addEventListener('click', resumeGame);
document.getElementById('saveBtn').addEventListener('click', saveAndBanner);
document.getElementById('quitBtn').addEventListener('click', quitToTitle);
document.addEventListener('visibilitychange', () => {
  resetInput();
  if (document.hidden) pauseGame();
});

function togglePause() {
  if (state.screen !== 'play') return;
  if (state.paused) resumeGame();
  else pauseGame();
}
function toggleMute() {
  state.muted = !state.muted;
  try { localStorage.setItem('rw_muted', state.muted ? '1' : '0'); } catch (e) {}
  document.getElementById('muteBtn').classList.toggle('off', state.muted);
document.getElementById('musicBtn').addEventListener('click', toggleMusic);
document.getElementById('musicBtn').classList.toggle('off', !state.music);
}
document.getElementById('muteBtn').classList.toggle('off', state.muted);
function toggleView() {
  state.iso = !state.iso;
  try { localStorage.setItem('rw_view', state.iso ? 'iso' : 'top'); } catch (e) {}
}
document.getElementById('viewBtn').addEventListener('click', toggleView);

/* ---------- level setup ---------- */
function loadLevel(idx) {
  const L = LEVELS[idx];
  const W = Math.max(...L.map.map((r) => r.length));
  const rows = L.map.map((r) => r.padEnd(W, '#'));
  const grid = rows.map((r) => r.split(''));
  // Carry Kari's condition across realms; a fresh run (player null) starts whole.
  const keep = player ? { hp: player.hp, maxHp: player.maxHp, dmg: player.dmg, keys: player.keys, kind: player.kind || 'kari', color: player.color || '#5a7a9a', speed: player.speed || 175 } : null;
  player = { x: 0, y: 0, r: 14, hp: keep ? keep.hp : 5, maxHp: keep ? keep.maxHp : 5, dmg: keep ? keep.dmg : 1, keys: keep ? keep.keys : 0, kind: keep ? keep.kind : 'kari', color: keep ? keep.color : '#5a7a9a',
    speed: keep ? keep.speed : 175, swing: 0, swingId: 0, hitDone: new Set(), face: 0, iframes: 0, bobPhase: 0, moving: false };
  enemies = []; pickups = []; particles = []; floats = []; beacon = null; darkBeacon = null;
  npcs = []; runestones = []; gates = []; heroGates = [];
  let runeIdx = 0;
  const decorBan = new Set();
  const ban = (x, y) => decorBan.add(x + ',' + y);
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < W; x++) {
      const c = grid[y][x], cx = x * TILE + TILE / 2, cy = y * TILE + TILE / 2;
      if (c === 'P') { player.x = cx; player.y = cy; grid[y][x] = '.'; ban(x, y); }
      else if (c === 'D') { enemies.push(mkEnemy('draugr', cx, cy)); grid[y][x] = '.'; ban(x, y); }
      else if (c === 'W') { enemies.push(mkEnemy('wolf', cx, cy)); grid[y][x] = '.'; ban(x, y); }
      else if (c === 'T') { enemies.push(mkEnemy('troll', cx, cy)); grid[y][x] = '.'; ban(x, y); }
      else if (c === 'U') { enemies.push(mkEnemy('drowned', cx, cy)); grid[y][x] = '.'; ban(x, y); }
      else if (c === 'K') { enemies.push(mkEnemy('king', cx, cy)); grid[y][x] = '.'; ban(x, y); }
      else if (c === 'S') { enemies.push(mkEnemy('spider', cx, cy)); grid[y][x] = '.'; ban(x, y); }
      else if (c === 'H') { enemies.push(mkEnemy('wraith', cx, cy)); grid[y][x] = '.'; ban(x, y); }
      else if (c === 'V') { enemies.push(mkEnemy('brute', cx, cy)); grid[y][x] = '.'; ban(x, y); }
      else if (c === 'E') { enemies.push(mkEnemy('screecher', cx, cy)); grid[y][x] = '.'; ban(x, y); }
      else if (c === 'I') { pickups.push({ x: cx, y: cy, kind: 'sigil', seal: L.seal || '', sealName: L.sealName || 'Span Sigil', ping: 0 }); grid[y][x] = '.'; ban(x, y); }
      else if (c === 'M') { pickups.push({ x: cx, y: cy, kind: 'mead', ping: 0 }); grid[y][x] = '.'; ban(x, y); }
      else if (c === 'Y') { pickups.push({ x: cx, y: cy, kind: 'key', ping: 0 }); grid[y][x] = '.'; ban(x, y); }
      else if (c === 'G') { gates.push({ tx: x, ty: y, x: cx, y: cy, open: false, cool: 0 }); ban(x, y); /* grid stays '#': a gate is a wall until opened */ }
      else if (c === 'Q') { heroGates.push({ tx: x, ty: y, x: cx, y: cy, open: false, cool: 0, hero: L.heroGate || 'eira', heroName: heroName(L.heroGate || 'eira'), gateName: L.heroGateName || 'Hero Gate' }); ban(x, y); /* grid stays '#': a hero gate is a wall until its hero opens it */ }
      else if (c === 'B') { beacon = { x: cx, y: cy, marked: false, ping: 0 }; grid[y][x] = '.'; ban(x, y); }
      else if (c === 'O') { darkBeacon = { x: cx, y: cy }; grid[y][x] = '.'; ban(x, y); }
      else if (c === 'N' && L.npc) { npcs.push({ x: cx, y: cy, kind: L.npc, talked: false, talks: 0, cool: 0 }); grid[y][x] = '.'; ban(x, y); }
      else if (c === 'R') { runestones.push({ x: cx, y: cy, txt: (L.runes && L.runes[runeIdx++]) || 'Yrsa says nothing here.', taken: false, ping: 0, cool: 0 }); grid[y][x] = '.'; ban(x, y); }
    }
  }
  raven = { x: player.x, y: player.y - 30, t: 6, mode: 'follow', target: null };
  // allies carry across realms like Kari; selection resets per realm
  const keepAllies = allies.map((a) => ({ kind: a.kind, hp: a.hp, maxHp: a.maxHp, dmg: a.dmg }));
  // 3.9.1: party spawns in a line, not a clump on Kari — the old
  // +44/+24 offset put the first ally ~50px from Kari, which in 3D,
  // with a 1.9m model, read as spawning on top of her from level 2 on.
  allies = keepAllies.map((k, i) => {
    const a = mkAlly(k.kind, player.x + 72, player.y + 72 * (i + 1));
    a.hp = Math.min(k.hp, k.maxHp); a.maxHp = k.maxHp; a.dmg = k.dmg;
    return a;
  });
  state.sel = [];
  // 3.9.1: no foe starts in Kari's pocket. A map enemy within 180px
  // of the spawn (several levels have one ~107px away, inside chase
  // range) is moved to a nearby open tile at least 180px out, in the
  // same area — never across a wall, never onto another body.
  for (const e of enemies) {
    if (Math.hypot(e.x - player.x, e.y - player.y) >= 180) continue;
    const ex = Math.floor(e.x / TILE), ey = Math.floor(e.y / TILE);
    const tries = [[3, 0], [-3, 0], [0, 3], [0, -3], [3, 3], [-3, 3], [3, -3], [-3, -3], [2, 0], [0, 2], [4, 0], [0, 4]];
    for (const [dx, dy] of tries) {
      const tx = ex + dx, ty = ey + dy;
      if (tx < 0 || ty < 0 || tx >= W || ty >= rows.length || grid[ty][tx] !== '.') continue;
      const cx = tx * TILE + TILE / 2, cy = ty * TILE + TILE / 2;
      if (Math.hypot(cx - player.x, cy - player.y) < 180) continue;
      if (enemies.some((o) => o !== e && Math.hypot(o.x - cx, o.y - cy) < 40)) continue;
      e.x = cx; e.y = cy; break;
    }
  }
  // 3.10.0: the Hush Stone — a weird, seemingly useless in-world music
  // switch. One in every realm, east of the spawn, open tile in all maps.
  ban(4, 1);
  hushStone = { x: 4 * TILE + TILE / 2, y: 1 * TILE + TILE / 2, cool: 0 };
  // 3.11.0: Becky's Icebox — tonight's Easter egg, Frostfall only.
  // An icebox where a maker's mark should be, someone scribbled 'Becky'
  // instead of a brand name. Easy to find, on purpose: tile (2,2),
  // a step from the spawn. No gameplay effect — it's a name, not a mechanic.
  if (idx === 2) { ban(2, 2); beckyBox = { x: 2 * TILE + TILE / 2, y: 2 * TILE + TILE / 2, cool: 0, found: false }; }
  else beckyBox = null;
  state.grid = grid; state.cols = W; state.rows = rows.length; state.decorBan = decorBan; state.lootedChests = new Set(); state.enemyGrace = 0.5; state.sigilTaken = false;
  document.getElementById('levelname').textContent = L.name;
}

/* NPCs: folk Kari meets. Talking once applies a lasting gift. */
const NPCS = {
  mira: { name: 'Mira',
    first: "Mira wipes her hands. 'A rune for your blade, keeper. Hit harder.'",
    second: "Mira wipes her hands. 'Yrsa taught me the steel. She never taught me what to do when the steel comes home wrong.'",
    again: "Mira nods at her forge. 'Keep it sharp.'",
    apply() { player.dmg = 2; floats.push({ x: player.x, y: player.y - 26, txt: 'SWORD UP!', t: 1.2 }); } },
  tove: { name: 'Tove',
    first: "Tove leans on his pole. 'Black water, bright beacon. I'll mark it for you.'",
    second: "Tove looks at the water. 'I ferried folk across before the road drowned. Some of them wave back now. I do not wave back.'",
    again: 'Tove hums a river song.',
    apply() { if (beacon) beacon.marked = true; if (player.hp < player.maxHp) player.hp++; } },
  pike: { name: 'Pike',
    first: "Pike grins with borrowed teeth. 'I kept my mind. Here — a cache I never needed.'",
    second: "Pike taps his skull. 'The Hollow offered me a quiet mind. I kept the noisy one. It itches, but it is mine.'",
    again: 'Pike salutes with a rusty sword.',
    apply() { player.maxHp++; player.hp = player.maxHp; floats.push({ x: player.x, y: player.y - 26, txt: '+1 HEART', t: 1.2 }); } },
  eira: { name: 'Eira',
    first: "Eira lowers her hood. 'The fjord sings when the wind turns. Walk with it, keeper — you will not feel the cold, and you will not be slow.'",
    second: "Eira listens to the wind. 'The gate only opens for the one who knows the wind-word. That is me. I will open it — but you must be the one walking, or it will not count.'",
    again: "Eira nods toward the gate. 'The wind-word is mine. The walking is yours.'",
    apply() { player.speed += 25; floats.push({ x: player.x, y: player.y - 26, txt: 'WINDSTEP!', t: 1.2 }); } },
  wright: { name: 'The Spanwright',
    first: "The Spanwright's ghost kneels between two flames. 'One road opens the world. One road closes it. Both are mercy, keeper. Choose with open eyes.'",
    second: "The Spanwright fades a little. 'I died building this. If you relight it, build it better than I did.'",
    again: "The Spanwright waits. 'The choice is yours alone.'",
    apply() { player.hp = player.maxHp; floats.push({ x: player.x, y: player.y - 26, txt: 'MENDED', t: 1.2 }); } },
};

/* ---------- command mode: the RTS layer ---------- */
// Folk who join Kari in command mode. The Wright never joins: a ghost
// guides the finale, it does not march. Allies persist across realms
// like Kari; the fallen wait for a lit beacon to call them back.
const ALLY_DEFS = {
  kari: { hp: 5, dmg: 1, speed: 175, color: '#5a7a9a' }, // Kari as a follower, when someone else is playing
  mira: { hp: 4, dmg: 2, speed: 150, color: '#c8742c' },
  tove: { hp: 6, dmg: 1, speed: 140, color: '#3a7a8a' },
  pike: { hp: 5, dmg: 2, speed: 160, color: '#7a8a3a' },
  eira: { hp: 3, dmg: 1, speed: 185, color: '#7a9ac8' },
};
function mkAlly(kind, x, y) {
  const d = ALLY_DEFS[kind];
  return { kind, x, y, r: 14, hp: d.hp, maxHp: d.hp, dmg: d.dmg, speed: d.speed,
    swing: 0, swingId: 0, hitDone: new Set(), face: 0, iframes: 0, order: null, color: d.color };
}

/* ---------- 4.0.0: playable folk, single player ---------- */
// Story reason (Windscar runestone): one keeper cannot carry three
// Sigils alone. The folk who joined Kari can now walk as keepers too.
// Switching swaps the two bodies in place — the player object stays the
// player object, so the camera, the beacon, the raven and the renderers
// all follow the controlled hero without re-wiring. The renderers rebuild
// a hero's model when its kind changes (see render3d syncEntities).
function heroName(kind) { return kind === 'kari' ? 'Kari' : (NPCS[kind] ? NPCS[kind].name : kind); }
function switchHero() {
  if (state.screen !== 'play' || state.paused || state.cmd) return;
  if (!allies.length) { showBanner('No one to switch to yet — folk you meet on the road will join you.'); return; }
  if (player.hp <= 0) return;
  const a = allies[0];
  const tmp = { x: player.x, y: player.y, hp: player.hp, maxHp: player.maxHp, dmg: player.dmg, speed: player.speed, kind: player.kind || 'kari', color: player.color || '#5a7a9a', face: player.face };
  player.x = a.x; player.y = a.y; player.hp = a.hp; player.maxHp = a.maxHp; player.dmg = a.dmg; player.speed = a.speed; player.kind = a.kind; player.color = a.color; player.face = a.face;
  a.x = tmp.x; a.y = tmp.y; a.hp = tmp.hp; a.maxHp = tmp.maxHp; a.dmg = tmp.dmg; a.speed = tmp.speed; a.kind = tmp.kind; a.color = tmp.color; a.face = tmp.face;
  a.order = null; player.swing = 0; a.swing = 0; player.iframes = 0.5;
  allies.push(allies.shift()); // 4.0.1: rotate, so repeated SWITCH walks the whole party
  showBanner('Now playing as ' + heroName(player.kind) + '.');
  drawHud();
}
// When the controlled hero falls and folk remain, the watch passes on
// instead of ending: the fallen hero waits (deadAllies) for a beacon.
function fallAndSwitch() {
  if (!allies.length) return false;
  const fallen = player.kind || 'kari';
  const a = allies.shift();
  player.x = a.x; player.y = a.y; player.hp = a.hp; player.maxHp = a.maxHp; player.dmg = a.dmg; player.speed = a.speed; player.kind = a.kind; player.color = a.color; player.face = a.face;
  player.swing = 0; player.iframes = 1;
  if (!state.deadAllies.includes(fallen)) state.deadAllies.push(fallen);
  showBanner(heroName(fallen) + ' falls — ' + heroName(player.kind) + ' takes up the watch.');
  drawHud();
  return true;
}
function hurtAlly(a, dmg, fromX, fromY) {
  if (a.iframes > 0) return;
  a.hp -= dmg; a.iframes = 0.9;
  const dx = a.x - fromX, dy = a.y - fromY, d = Math.hypot(dx, dy) || 1;
  moveBody(a, dx / d * 18, dy / d * 18);
  burst(a.x, a.y, '#e5484d', 10, 'star');
  sfx.hurt();
  if (a.hp <= 0) {
    allies = allies.filter((o) => o !== a);
    if (!state.deadAllies.includes(a.kind)) state.deadAllies.push(a.kind);
    state.sel = state.sel.filter((u) => u !== a);
    burst(a.x, a.y, '#e8dcc0', 14, 'star');
    floats.push({ x: a.x, y: a.y - 26, txt: 'FALLEN', t: 1.2 });
  }
}
// one ordered unit's behavior: move orders, attack orders, and — for
// allies with no order — self-defense up close, following Kari at range
function updateUnitOrders(u, dt, isKari) {
  if (!isKari) {
    if (u.swing > 0) u.swing -= dt;
    if (u.iframes > 0) u.iframes -= dt;
  }
  const o = u.order;
  if (o && o.type === 'move') {
    const dx = o.x - u.x, dy = o.y - u.y, d = Math.hypot(dx, dy);
    if (d < 14) u.order = null;
    else { u.face = Math.atan2(dy, dx); moveBody(u, dx / d * u.speed * dt, dy / d * u.speed * dt); }
    return;
  }
  if (o && o.type === 'atk') {
    const t = o.target;
    if (!t || t.hp <= 0) { u.order = null; return; }
    const dx = t.x - u.x, dy = t.y - u.y, d = Math.hypot(dx, dy) || 1;
    if (d < 46 + t.r) {
      u.face = Math.atan2(dy, dx);
      if (u.swing <= 0) { u.swing = 0.28; u.swingId++; u.hitDone.clear(); u.hitDone.add(t); damageEnemy(t, u.dmg, u.x, u.y); sfx.swing(); }
    } else { u.face = Math.atan2(dy, dx); moveBody(u, dx / d * u.speed * dt, dy / d * u.speed * dt); }
    return;
  }
  if (!isKari) {
    let best = null, bestD = 130;
    for (const e of enemies) {
      if (e.hp <= 0) continue;
      const d = Math.hypot(e.x - u.x, e.y - u.y);
      if (d < bestD) { bestD = d; best = e; }
    }
    if (best) {
      const dx = best.x - u.x, dy = best.y - u.y, d = Math.hypot(dx, dy) || 1;
      if (bestD < 46 + best.r) {
        u.face = Math.atan2(dy, dx);
        if (u.swing <= 0) { u.swing = 0.28; u.swingId++; u.hitDone.clear(); u.hitDone.add(best); damageEnemy(best, u.dmg, u.x, u.y); sfx.swing(); }
      } else { u.face = Math.atan2(dy, dx); moveBody(u, dx / d * u.speed * dt, dy / d * u.speed * dt); }
      return;
    }
    const pd = Math.hypot(player.x - u.x, player.y - u.y);
    if (pd > 170) {
      const dx = player.x - u.x, dy = player.y - u.y, d = pd || 1;
      u.face = Math.atan2(dy, dx); moveBody(u, dx / d * u.speed * dt, dy / d * u.speed * dt);
    }
  }
}
function orderSelected(wx, wy, target) {
  if (!state.sel.length) return;
  state.sel.forEach((u, i) => {
    const ox = (i - (state.sel.length - 1) / 2) * 26;
    u.order = target ? { type: 'atk', target } : { type: 'move', x: wx + ox, y: wy };
  });
  if (target) { burst(wx, wy, '#e5484d', 8); floats.push({ x: wx, y: wy - 16, txt: 'ATK!', t: 0.8 }); }
  else { burst(wx, wy, '#ffd76a', 8); floats.push({ x: wx, y: wy - 16, txt: 'GO', t: 0.8 }); }
  sfx.key();
}
function applyCmdUI() {
  document.getElementById('stickZone').style.display = state.cmd ? 'none' : '';
  document.getElementById('atkBtn').style.display = state.cmd ? 'none' : '';
  document.getElementById('cmdBtn').textContent = state.cmd ? 'CMD*' : 'CMD';
  document.getElementById('lvl').textContent = 'LVL ' + state.heroLvl;
  document.getElementById('hpbar').style.width = Math.round(100 * player.hp / player.maxHp) + '%';
  document.getElementById('mpbar').style.width = '100%';
  document.getElementById('armor').textContent = ARMOR[state.armorTier].name;
  document.getElementById('mats').textContent = '◆' + state.materials.crystal + ' ◇' + state.materials.shard + ' · ' + state.skillPoints + ' pts';
  document.getElementById('minimap').textContent = LEVELS[state.level].name;
}
function toggleCmd() {
  state.cmd = !state.cmd;
  if (state.cmd) {
    // folk already met walk back in; the dead stay dead until a beacon
    for (const kind of Object.keys(state.met)) {
      if (kind === 'wright' || allies.find((a) => a.kind === kind) || state.deadAllies.includes(kind)) continue;
      const a = mkAlly(kind, player.x + 44, player.y + 20);
      const saved = state.allyHp[kind];
      if (saved) { a.hp = Math.min(saved.hp, saved.maxHp); a.maxHp = saved.maxHp; a.dmg = saved.dmg; }
      allies.push(a);
    }
    state.sel = [];
    showBanner('Command mode: tap a hero, then tap where to go.');
  } else {
    for (const a of allies) state.allyHp[a.kind] = { hp: a.hp, maxHp: a.maxHp, dmg: a.dmg };
    // 4.0.1: the party stays with you outside command mode (it used to be
    // disbanded here, which left SWITCH with no one to switch to)
    state.sel = [];
  }
  applyCmdUI();
}

let bannerT = null;
function showBanner(txt) {
  const el = document.getElementById('banner');
  el.textContent = txt;
  el.classList.remove('hidden');
  if (bannerT) clearTimeout(bannerT);
  bannerT = setTimeout(() => el.classList.add('hidden'), 4200);
}

function mkEnemy(kind, x, y) {
  const base = { x, y, kind, hp: 2, r: 14, speed: 70, dmg: 1, score: 10, flash: 0, summonT: 0, charge: 0, vx: 0, vy: 0, face: 0 };
  if (kind === 'wolf') { base.hp = 1; base.speed = 135; base.score = 15; }
  if (kind === 'drowned') { base.hp = 2; base.speed = 88; base.score = 15; }
  if (kind === 'troll') { base.hp = 5; base.r = 20; base.speed = 45; base.dmg = 2; base.score = 30; }
  if (kind === 'king') { base.hp = 12; base.r = 24; base.speed = 58; base.dmg = 2; base.score = 250; }
  if (kind === 'spider') { base.hp = 8; base.r = 20; base.speed = 65; base.dmg = 2; base.score = 250; }
  if (kind === 'wraith') { base.hp = 2; base.speed = 125; base.score = 25; }
  if (kind === 'brute') { base.hp = 7; base.r = 20; base.speed = 40; base.dmg = 2; base.score = 40; }
  if (kind === 'screecher') { base.hp = 1; base.speed = 150; base.score = 20; }
  return base;
}

function isWall(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= state.cols || ty >= state.rows) return true;
  return state.grid[ty][tx] === '#';
}
function collides(x, y, r) {
  const x0 = Math.floor((x - r) / TILE), x1 = Math.floor((x + r) / TILE);
  const y0 = Math.floor((y - r) / TILE), y1 = Math.floor((y + r) / TILE);
  for (let ty = y0; ty <= y1; ty++)
    for (let tx = x0; tx <= x1; tx++)
      if (isWall(tx, ty)) {
        const nx = Math.max(tx * TILE, Math.min(x, tx * TILE + TILE));
        const ny = Math.max(ty * TILE, Math.min(y, ty * TILE + TILE));
        if ((x - nx) * (x - nx) + (y - ny) * (y - ny) < r * r) return true;
      }
  return false;
}
function moveBody(b, dx, dy) {
  if (!collides(b.x + dx, b.y, b.r)) b.x += dx;
  if (!collides(b.x, b.y + dy, b.r)) b.y += dy;
}
// Safety net: if a body ever ends up inside a wall, walk it out to the
// nearest open spot. Without this, a body inside a wall can never move at
// all — collides() blocks every direction from inside a wall tile.
function unstick(b) {
  if (!collides(b.x, b.y, b.r)) return;
  for (let step = 6; step <= 48; step += 6) {
    for (let a = 0; a < 8; a++) {
      const ang = a * Math.PI / 4;
      const nx = b.x + Math.cos(ang) * step, ny = b.y + Math.sin(ang) * step;
      if (!collides(nx, ny, b.r)) { b.x = nx; b.y = ny; return; }
    }
  }
}

/* ---------- combat ---------- */
function attack() {
  if (state.screen !== 'play' || state.paused || !player) return;
  if (state.cmd) return; // command mode orders attacks; the sword button sleeps
  if (player.swing > 0) return;
  player.swing = 0.28; player.swingId++; player.hitDone.clear();
  sfx.swing();
}
function damageEnemy(e, dmg, fromX, fromY) {
  if (e.flash > 0 && e.kind !== 'king') { /* still allow hits, flash is just visual */ }
  e.hp -= dmg; e.flash = 0.12; state.hitStop = 0.045;
  // the Hollow King answers back once, at half health: he is Bjarni, and he knows Yrsa's words
  if (e.kind === 'king' && !e.spoken && e.hp > 0 && e.hp <= 6) {
    e.spoken = true;
    showBanner("The Hollow King lowers his blade. 'You carry her words. She always believed.'");
  }
  const dx = e.x - fromX, dy = e.y - fromY, d = Math.hypot(dx, dy) || 1;
  e.vx = dx / d * 260; e.vy = dy / d * 260;
  burst(e.x, e.y, '#ffd76a', 6, 'star');
  floats.push({ x: e.x, y: e.y - 18, txt: '-' + dmg, t: 0.8 });
  sfx.hit();
  if (e.hp <= 0) {
    if (e.kind === 'spider' || e.kind === 'king') state.materials.crystal += 1; else state.materials.shard += 1;
    state.score += e.score;
    burst(e.x, e.y, '#e8dcc0', 14, 'star');
    floats.push({ x: e.x, y: e.y - 30, txt: '+' + e.score, t: 1 });
    if (e.kind === 'spider' || e.kind === 'king') pickups.push({ x: e.x, y: e.y, kind: 'loot', loot: rollLoot(), cool: 0.4, ping: 0 });
    else if (Math.random() < 0.3) pickups.push({ x: e.x, y: e.y, kind: 'loot', loot: rollLoot(), cool: 0.4, ping: 0 });
    if (e.kind === 'spider') { showBanner('The Crystal Spider shatters. Its shards are yours.'); }
    if (e.kind === 'king') { sfx.roar(); floats.push({ x: e.x, y: e.y - 44, txt: 'The Hollow King falls!', t: 2 }); showBanner("The Hollow King falls. His last words are almost gentle: 'Tell Yrsa... the winter held.'"); }
  }
}
function hurtPlayer(dmg, fromX, fromY) {
  if (state.skills.shield && state.shieldActive) { state.shieldActive = false; floats.push({ x: player.x, y: player.y - 26, txt: 'SHIELD', t: 1 }); burst(player.x, player.y, '#4a90d8', 10, 'star'); return; }
  if (player.iframes > 0) return;
  player.hp -= dmg; player.iframes = 0.9; state.shake = 7;
  const dx = player.x - fromX, dy = player.y - fromY, d = Math.hypot(dx, dy) || 1;
  // Knockback goes through moveBody, not a raw position change: a raw shove
  // can push Kari inside a wall tile, and from inside a wall collides()
  // blocks every direction, trapping her forever.
  moveBody(player, dx / d * 18, dy / d * 18);
  burst(player.x, player.y, '#e5484d', 10, 'star');
  sfx.hurt();
  if (player.hp <= 0) { if (!fallAndSwitch()) { state.screen = 'over'; showScreen('over'); } }
}
function burst(x, y, color, n, shape) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 120;
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0.4 + Math.random() * 0.3, color, shape: shape || 'rect' });
  }
}

/* ---------- flow ---------- */

/* ---------- vision-track 1.7.0: skills, armor tiers, Runic Anvil ---------- */
const SKILLS = {
  shield: { name: 'Rune Shield II', desc: 'Absorb 150 damage, reflects 15% — in this build: absorb the next hit, refreshed at each beacon.', cost: 1 },
  blade: { name: 'Rune Blade', desc: '+1 sword damage.', cost: 1 },
  sentinel: { name: 'Aether Sentinel', desc: '+1 max heart, healed to full.', cost: 1 },
  weaver: { name: 'Void Weaver', desc: '+25 score at each beacon.', cost: 1 },
};

/* ---------- 3.6.0: loot — chests, enemy drops, helpful and useless ---------- */
const LOOT_TABLE = [
  { name: 'Mead Flask', kind: 'help', txt: '+1 HP', apply() { if (player.hp < player.maxHp) player.hp++; else state.score += 10; } },
  { name: 'Brass Key', kind: 'help', txt: 'KEY!', apply() { player.keys++; } },
  { name: 'Rune Shard', kind: 'help', txt: '+1 shard', apply() { state.materials.shard++; } },
  { name: 'Score Gem', kind: 'help', txt: '+25', apply() { state.score += 25; } },
  { name: 'Hearty Root', kind: 'help', txt: '+1 max heart', apply() { player.maxHp++; player.hp++; } },
  { name: 'Left Boot', kind: 'joke', txt: 'A left boot. Just the one.' },
  { name: 'Pet Rock', kind: 'joke', txt: 'It does nothing. It is a rock.' },
  { name: 'Soggy Map', kind: 'joke', txt: 'The map is soggy. And wrong.' },
  { name: 'Draugr Toothpick', kind: 'joke', txt: "Someone else's toothpick." },
  { name: "Yrsa's Shopping List", kind: 'joke', txt: 'Milk, runes, more milk.' },
  { name: 'Echo of a Joke', kind: 'joke', txt: 'You almost get it. Almost.' },
  { name: 'Single Sock', kind: 'joke', txt: 'Its partner is gone. So is yours.' },
  { name: "Hollow King's Autograph", kind: 'joke', txt: 'Forged. Probably.' },
];
function rollLoot() {
  if (Math.random() < 0.05) return LOOT_TABLE.find((l) => l.name === 'Hearty Root');
  const rest = LOOT_TABLE.filter((l) => l.name !== 'Hearty Root');
  return rest[Math.floor(Math.random() * rest.length)];
}
function applyLoot(item) {
  if (item && item.apply) item.apply();
  floats.push({ x: player.x, y: player.y - 26, txt: item.name, t: 1.2 });
  if (item.kind === 'joke') showBanner(item.name + ' — ' + item.txt);
  else floats.push({ x: player.x, y: player.y - 40, txt: item.txt, t: 1 });
  sfx.key();
}
const ARMOR = [
  { name: "Initiate's Runic Leather", hp: 0, dmg: 0 },
  { name: "Sentinel's Obsidian Plate", hp: 2, dmg: 0 },
  { name: "Void-Stalker's Aether-Mail", hp: 2, dmg: 1 },
];
function armorCost(tier) { return tier === 1 ? { crystal: 1, shard: 2 } : { crystal: 2, shard: 3 }; }
function unlockSkill(id) {
  if (!SKILLS[id] || state.skills[id]) return;
  if (state.skillPoints < SKILLS[id].cost) { showBanner('Not enough skill points. Light a beacon.'); return; }
  state.skillPoints -= SKILLS[id].cost; state.skills[id] = true;
  if (id === 'blade') player.dmg += 1;
  if (id === 'sentinel') { player.maxHp += 1; player.hp = player.maxHp; }
  if (id === 'shield') state.shieldActive = true;
  sfx.rune(); openPanel('skills');
}
function forgeArmor() {
  const next = state.armorTier + 1;
  if (next >= ARMOR.length) { showBanner('Already at the highest armor tier.'); return; }
  const c = armorCost(next);
  if (state.materials.crystal < c.crystal || state.materials.shard < c.shard) { showBanner('Not enough materials. Beacons give crystal, foes give shards.'); return; }
  state.materials.crystal -= c.crystal; state.materials.shard -= c.shard;
  state.armorTier = next;
  player.maxHp += ARMOR[next].hp; player.dmg += ARMOR[next].dmg; player.hp = player.maxHp;
  sfx.rune(); openPanel('craft');
}
function openPanel(kind) {
  state.panel = kind; state.screen = 'panel';
  const el = document.getElementById('panel'); const body = document.getElementById('panelBody');
  // 3.3.1: Back at BOTH top and bottom. In landscape the panel is taller
  // than the screen and the old bottom-only Back button was below the fold
  // — the one button that gets you out must never require scrolling to find.
  const backBtn = '<button class="big" onclick="closePanel()">Back to the game</button>';
  let html = backBtn + '<br><br>';
  if (kind === 'skills') {
    html = '<h2>RUNIC SKILL TREE</h2><img class="visionImg" src="vision-skills.jpg" alt="Runic Skill Tree vision art"><p>Skill points: <b>' + state.skillPoints + '</b> — earn one at each beacon.</p>' +
      Object.entries(SKILLS).map(([id, s]) => '<p><b>' + s.name + '</b> — ' + s.desc + '<br>' +
      (state.skills[id] ? '<i>Unlocked</i>' : '<button class="big" onclick="unlockSkill(\'' + id + '\')">Unlock (' + s.cost + ' point)</button>') + '</p>').join('') + html;
  } else if (kind === 'craft') {
    const next = state.armorTier + 1;
    html = '<h2>RUNIC ANVIL</h2><img class="visionImg" src="vision-anvil.jpg" alt="Runic Anvil vision art"><p>Materials — Crystal: <b>' + state.materials.crystal + '</b> · Shard: <b>' + state.materials.shard + '</b></p>' +
      '<p>Current armor: <b>' + ARMOR[state.armorTier].name + '</b></p>' +
      (next < ARMOR.length ? '<p>Next: <b>' + ARMOR[next].name + '</b> — costs ' + armorCost(next).crystal + ' crystal, ' + armorCost(next).shard + ' shards.<br><button class="big" onclick="forgeArmor()">Forge Rune-Link</button></p>'
      : '<p><i>Highest tier reached.</i></p>') + html;
  } else {
    html = '<h2>ARMOR TIERS</h2><img class="visionImg" src="vision-armor.jpg" alt="Armor tiers vision art">' +
      ARMOR.map((a, i) => '<p>' + (i === state.armorTier ? '<b>▶ ' : '') + 'Tier ' + (i + 1) + ': ' + a.name + (i === state.armorTier ? '</b> — worn now' : '') + '</p>').join('') + html;
  }
  body.innerHTML = backBtn + '<br><br>' + html; el.classList.remove('hidden');
}
function closePanel() {
  document.getElementById('panel').classList.add('hidden');
  state.panel = null; state.screen = 'play';
}
document.getElementById('skillsBtn').addEventListener('click', () => { if (player) openPanel('skills'); });
document.getElementById('craftBtn').addEventListener('click', () => { if (player) openPanel('craft'); });
document.getElementById('armorBtn').addEventListener('click', () => { if (player) openPanel('armor'); });
// 3.3.1: tapping the dimmed area outside a panel closes it — a second exit
// if a button is ever off-screen, instead of trapping the player in the panel.
document.getElementById('panel').addEventListener('click', (e) => { if (e.target.id === 'panel') closePanel(); });
document.getElementById('potionBtn').addEventListener('click', () => { if (player && player.hp < player.maxHp) { player.hp = player.maxHp; showBanner('HP potion: Kari is mended.'); } });

function startRun() {
  state.level = 0; state.score = 0; state.paused = false;
  player = null; // fresh run: loadLevel starts Kari whole again
  allies = []; state.met = {}; state.deadAllies = []; state.allyHp = {}; state.sel = [];
  state.heroLvl = 1; state.skillPoints = 0; state.skills = {}; state.shieldActive = false; state.sigils = 0; state.sigilTaken = false;
  state.armorTier = 0; state.materials = { crystal: 0, shard: 0 };
  document.getElementById('pauseBtn').textContent = 'II';
  // 3.8.0: Play goes straight to play — the realm card still appears
  // between realms, but the first realm no longer costs a second click.
  loadLevel(0);
  state.screen = 'play'; state.fade = 1;
  document.getElementById('screen').classList.add('hidden');
  startMusic();
}
/* ---------- 3.8.0: save / load (checkpoint saves) ---------- */
// A save is a checkpoint, not a mid-frame snapshot: the realm, the score,
// the hero, the skills, the materials, and the party. Continuing loads
// that realm fresh, with all of that carried in — so a mid-realm quit
// returns you to the start of your current realm, never to nothing.
// Saves happen at every beacon (for the next realm), on pause, and
// when the app is hidden. Death does NOT overwrite the checkpoint,
// so Continue from the game-over screen works. Winning clears it.
const SAVE_KEY = 'rw_save_v1';
function saveGame(levelOverride) {
  try {
    const data = {
      level: levelOverride !== undefined ? levelOverride : state.level,
      score: state.score, heroLvl: state.heroLvl, skillPoints: state.skillPoints,
      skills: state.skills, shieldActive: state.shieldActive, armorTier: state.armorTier,
      materials: state.materials, sigils: state.sigils,
      player: player ? { hp: player.hp, maxHp: player.maxHp, dmg: player.dmg, keys: player.keys, kind: player.kind || 'kari', color: player.color || '#5a7a9a', speed: player.speed || 175 } : null,
      allies: allies.map((a) => ({ kind: a.kind, hp: a.hp, maxHp: a.maxHp, dmg: a.dmg })),
      met: state.met, deadAllies: state.deadAllies, allyHp: state.allyHp,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) { /* storage unavailable: play on regardless */ }
}
function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
}
function updateTitleSaveInfo() {
  const info = document.getElementById('saveInfo');
  const cont = document.getElementById('continueBtn');
  const data = loadSave();
  if (info) info.textContent = data ? 'Saved: ' + LEVELS[data.level].name + ', LVL ' + data.heroLvl + ', score ' + data.score + (data.sigils ? ', ✦' + data.sigils + '/3' : '') : 'No saved game yet.';
  if (cont) cont.style.display = data ? '' : 'none';
}
function playGame() { if (loadSave()) continueGame(); else newGame(); }
function newGame() { clearSave(); startRun(); }
function continueGame() {
  const data = loadSave();
  if (!data) { newGame(); return; }
  state.score = data.score; state.heroLvl = data.heroLvl; state.skillPoints = data.skillPoints;
  state.skills = data.skills || {}; state.shieldActive = !!data.shieldActive; state.armorTier = data.armorTier || 0;
  state.materials = data.materials || { crystal: 0, shard: 0 }; state.sigils = data.sigils || 0;
  state.met = data.met || {}; state.deadAllies = data.deadAllies || []; state.allyHp = data.allyHp || {}; state.sel = [];
  state.paused = false;
  document.getElementById('pauseBtn').textContent = 'II';
  // Restore the party, then let loadLevel carry it (and the hero's
  // condition) into the saved realm, exactly as a beacon advance does.
  player = data.player ? { x: 0, y: 0, r: 14, hp: data.player.hp, maxHp: data.player.maxHp, dmg: data.player.dmg, keys: data.player.keys, kind: data.player.kind || 'kari', color: data.player.color || '#5a7a9a', speed: data.player.speed || 175, swing: 0, swingId: 0, hitDone: new Set(), face: 0, iframes: 0, bobPhase: 0, moving: false } : null;
  allies = (data.allies || []).map((k) => {
    const a = mkAlly(k.kind, 0, 0); a.hp = Math.min(k.hp, k.maxHp); a.maxHp = k.maxHp; a.dmg = k.dmg; return a;
  });
  loadLevel(data.level);
  state.screen = 'play'; state.fade = 1;
  document.getElementById('screen').classList.add('hidden');
  showBanner('Continued: ' + LEVELS[data.level].name);
  startMusic();
}
function showCard(idx) {
  state.level = idx;
  loadLevel(idx);
  state.screen = 'card'; state.cardTimer = 0;
  // the vision from the beacon just lit rides into the next realm's card
  const prev = idx > 0 ? LEVELS[idx - 1] : null;
  const vis = prev && prev.vision ? '<p class="vision">' + prev.vision + '</p>' : '';
  showScreen('card', '<h2>' + LEVELS[idx].name + '</h2><p>' + LEVELS[idx].hint + '</p>' + vis + '<p><button class="big" onclick="advanceCard()">Start</button></p><p class="small">Or press Space</p>');
}
function advanceCard() {
  if (state.screen !== 'card') return;
  state.screen = 'play';
  state.fade = 1; // fade in from black as the realm opens
  document.getElementById('screen').classList.add('hidden');
  startMusic();
  if (LEVELS[state.level].boss) sfx.roar();
}
function reachBeacon() {
  sfx.rune();
  state.score += 50;
  state.heroLvl += 1; state.skillPoints += 1;
  state.materials.crystal += 1; state.materials.shard += 1;
  if (state.skills.shield) state.shieldActive = true;
  if (state.skills.weaver) state.score += 25;
  player.hp = Math.min(player.maxHp, player.hp + 1); // beacon light mends
  // a lit beacon mends the party and calls the fallen back
  for (const a of allies) a.hp = a.maxHp;
  for (const kind of state.deadAllies) {
    const a = mkAlly(kind, player.x + 44, player.y + 24);
    a.hp = Math.max(1, Math.ceil(a.maxHp / 2));
    allies.push(a);
  }
  state.deadAllies = [];
  floats.push({ x: player.x, y: player.y - 26, txt: '+1', t: 1 });
  if (LEVELS[state.level].finale) { clearSave(); winGame('light'); }
  else if (state.level < LEVELS.length - 1) { saveGame(state.level + 1); showCard(state.level + 1); }
  else winGame('light');
}
function winGame(ending) {
  if (state.screen === 'win') return;
  clearSave();
  state.screen = 'win'; sfx.win();
  if (state.score > state.best) {
    state.best = state.score;
    try { localStorage.setItem('rw_best', String(state.best)); } catch (e) {}
  }
  const dark = ending === 'dark';
  const body = dark
    ? '<h2>The Span stays dark</h2><p>Kari lets the last beacon gutter out. The realms keep their ' +
      'distance — and their peace. The Hollow King is undone, and the dark is quiet.</p>'
    : '<h2>The Span is relit</h2><p>Kari stands beneath a mended sky. ' +
      (state.sigils >= 3 ? 'Three Sigils — Wind, Ember, Deep — settle into the Span, and the beacons burn again. ' : '') +
      'The Hollow King is undone, and the beacons burn again.</p>';
  showScreen('win', body +
    '<p>Score: <b>' + state.score + '</b> &nbsp; Best: <b>' + state.best + '</b></p>' +
    '<button class="big" onclick="startRun()">Play again</button> <button class="big" onclick="showTitle()">Title</button>');
}
let _titleHTML = null;
function showTitle() { state.screen = 'title'; showScreen('title'); }
function showScreen(kind, html) {
  const el = document.getElementById('screen');
  if (kind === 'title') {
    state.screen = 'title';
    if (_titleHTML === null && el.innerHTML && el.innerHTML.includes('playBtn')) _titleHTML = el.innerHTML;
    if (_titleHTML) el.innerHTML = _titleHTML;
    el.classList.remove('hidden');
    const _best = document.getElementById('best');
    if (_best) _best.textContent = state.best > 0 ? 'Best score: ' + state.best : '';
    updateTitleSaveInfo();
    return;
  }
  if (kind === 'over') {
    el.innerHTML = '<div class="panel"><h2>The beacon gutters out</h2><p>Kari falls, but the watch ' +
      'does not end. The realms wait for another try.</p><p>Score: <b>' + state.score + '</b></p>' +
      '<button class="big" onclick="continueGame()">Continue from checkpoint</button> <button class="big" onclick="startRun()">Try again</button> <button class="big" onclick="showTitle()">Title</button></div>';
  } else {
    el.innerHTML = '<div class="panel">' + html + '</div>';
  }
  el.classList.remove('hidden');
}
document.getElementById('screen').addEventListener('click', (e) => {
  if (e.target && e.target.closest('button')) return;
  // Card advance is by the Start button (or Space), not by tapping anywhere:
  // an acknowledgement click is not a start.
});

/* ---------- update ---------- */
function inputVector() {
  let x = 0, y = 0;
  if (keys['arrowleft'] || keys['a']) x -= 1;
  if (keys['arrowright'] || keys['d']) x += 1;
  if (keys['arrowup'] || keys['w']) y -= 1;
  if (keys['arrowdown'] || keys['s']) y += 1;
  if (x !== 0 || y !== 0) { const d = Math.hypot(x, y); return { x: x / d, y: y / d }; }
  if (joy.active && (joy.x !== 0 || joy.y !== 0)) {
    const d = Math.hypot(joy.x, joy.y);
    if (d > 0.15) {
      // Linear response: a half-drag moves at half speed, a full drag at
      // full speed. The old code multiplied by d a second time, so a
      // half-drag moved at quarter speed and a small drag barely moved at
      // all — on a phone screen that reads as "can't move" even though the
      // stick and the sword facing (direction only) both work fine.
      const m = Math.min(1, d);
      return { x: joy.x / d * m, y: joy.y / d * m };
    }
  }
  return { x: 0, y: 0 };
}

function update(dt) {
  state.time += dt;
  if (player.swing > 0) player.swing -= dt;
  if (player.iframes > 0) player.iframes -= dt;

  // player movement: direct in solo mode, orders in command mode
  if (state.cmd) {
    updateUnitOrders(player, dt, true);
    player.moving = !!player.order;
    if (player.moving) player.bobPhase += dt * 12;
    unstick(player);
  } else {
    const v = inputVector();
    if (v.x !== 0 || v.y !== 0) player.face = Math.atan2(v.y, v.x);
    moveBody(player, v.x * player.speed * dt, v.y * player.speed * dt);
    unstick(player);
    player.moving = (v.x !== 0 || v.y !== 0);
    if (player.moving) player.bobPhase += dt * 12;
  }

  // sword arc (solo mode only; command mode orders its own blows)
  if (!state.cmd && player.swing > 0.12) {
    const range = 52, halfArc = 1.0;
    for (const e of enemies) {
      if (e.hp <= 0 || player.hitDone.has(e)) continue;
      const dx = e.x - player.x, dy = e.y - player.y, d = Math.hypot(dx, dy);
      if (d < range + e.r) {
        let ang = Math.atan2(dy, dx) - player.face;
        while (ang > Math.PI) ang -= Math.PI * 2;
        while (ang < -Math.PI) ang += Math.PI * 2;
        if (Math.abs(ang) < halfArc) { player.hitDone.add(e); damageEnemy(e, player.dmg, player.x, player.y); }
      }
    }
  }

  // 3.9.0: 0.5s grace at each level start — enemies do not detect,
  // chase, or attack until it runs out. The player can still hit them.
  if (state.enemyGrace > 0) state.enemyGrace -= dt;
  // enemies
  for (const e of enemies) {
    if (e.hp <= 0) continue;
    if (e.flash > 0) e.flash -= dt;
    // knockback decay
    if (Math.abs(e.vx) > 1 || Math.abs(e.vy) > 1) {
      moveBody(e, e.vx * dt, e.vy * dt);
      e.vx *= 0.86; e.vy *= 0.86;
      continue;
    }
    if (state.enemyGrace > 0) continue; // grace: no detect, chase, or attack yet
    // foes chase the nearest of Kari's party, not just Kari
    let tgt = player, td = Math.hypot(player.x - e.x, player.y - e.y);
    for (const a of allies) {
      const ad = Math.hypot(a.x - e.x, a.y - e.y);
      if (ad < td) { td = ad; tgt = a; }
    }
    const dx = tgt.x - e.x, dy = tgt.y - e.y, d = Math.hypot(dx, dy) || 1;
    if (e.kind === 'king') {
      e.summonT -= dt;
      if (e.summonT <= 0 && enemies.filter((o) => o.hp > 0 && o.kind === 'draugr').length < 3) {
        e.summonT = 8;
        enemies.push(mkEnemy('draugr', e.x + (Math.random() > 0.5 ? 60 : -60), e.y - 40));
        burst(e.x, e.y, '#b07ad4', 12);
      }
      if (e.charge > 0) {
        e.charge -= dt;
        if (e.charge <= 0) { e.vx = dx / d * 520; e.vy = dy / d * 520; }
      } else if (d < 320 && Math.random() < dt * 0.5 && Math.abs(e.vx) < 1) {
        e.charge = 0.6; // telegraph: king flashes, then lunges
        burst(e.x, e.y, '#e5484d', 4);
      } else {
        e.face = Math.atan2(dy, dx);
        moveBody(e, dx / d * e.speed * dt, dy / d * e.speed * dt);
      }
    } else if (d < 300) {
      e.face = Math.atan2(dy, dx);
      moveBody(e, dx / d * e.speed * dt, dy / d * e.speed * dt);
    }
    // contact damage: whoever the foe actually reached
    if (d < e.r + tgt.r + 2) {
      if (tgt === player) hurtPlayer(e.dmg, e.x, e.y);
      else hurtAlly(tgt, e.dmg, e.x, e.y);
    }
  }
  // separate overlapping enemies
  for (let i = 0; i < enemies.length; i++) {
    const a = enemies[i]; if (a.hp <= 0) continue;
    for (let j = i + 1; j < enemies.length; j++) {
      const b = enemies[j]; if (b.hp <= 0) continue;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      const min = a.r + b.r;
      if (d < min) { const push = (min - d) / 2; a.x -= dx / d * push; a.y -= dy / d * push; b.x += dx / d * push; b.y += dy / d * push; }
    }
  }
  enemies = enemies.filter((e) => e.hp > 0);
  for (const e of enemies) unstick(e); // separation shoves can wedge foes into walls too

  // allies: orders, self-defense, following
  for (const a of allies) updateUnitOrders(a, dt, false);
  for (const a of allies) unstick(a);

  // folk: talk on contact, gift once, a second line on the next talk, then a short line on a cooldown
  for (const n of npcs) {
    if (n.cool > 0) n.cool -= dt;
    if (Math.hypot(n.x - player.x, n.y - player.y) < 32 && n.cool <= 0) {
      n.cool = 4;
      const def = NPCS[n.kind];
      if (!n.talked) {
        n.talked = true; n.talks = 1; def.apply(); showBanner(def.first); sfx.rune();
        state.met[n.kind] = true;
        // 4.0.1: folk you meet join the party in or out of command mode (the Wright excepted)
        if (n.kind !== 'wright' && !allies.find((a) => a.kind === n.kind)) {
          allies.push(mkAlly(n.kind, n.x + 20, n.y + 20));
          floats.push({ x: n.x, y: n.y - 30, txt: 'JOINS!', t: 1.2 });
        }
      }
      else if (n.talks === 1 && def.second) { n.talks = 2; showBanner(def.second); sfx.rune(); }
      else showBanner(def.again);
    }
  }

  // runestones: Yrsa's words, re-readable on a cooldown, never consumed
  for (const r of runestones) {
    if (r.cool > 0) r.cool -= dt;
    if (Math.hypot(r.x - player.x, r.y - player.y) < 28 && r.cool <= 0) {
      r.cool = 5;
      showBanner(r.txt);
      sfx.rune();
    }
  }

  // 3.10.0: the Hush Stone toggles the music, and nothing else — no
  // score, damage, loot, or enemy effect, at least as of yet. Same
  // switch as the HUD ♫ button, so the two always agree.
  if (hushStone) {
    if (hushStone.cool > 0) hushStone.cool -= dt;
    if (Math.hypot(hushStone.x - player.x, hushStone.y - player.y) < 32 && hushStone.cool <= 0) {
      hushStone.cool = 5;
      toggleMusic();
      showBanner(state.music ? 'The Hush Stone hums. Music returns.' : 'The Hush Stone hums. Music silenced. It changes nothing else.');
      sfx.rune();
    }
  }

  // 3.11.0: Becky's Icebox — first touch names it, later touches just note it.
  if (beckyBox) {
    if (beckyBox.cool > 0) beckyBox.cool -= dt;
    if (Math.hypot(beckyBox.x - player.x, beckyBox.y - player.y) < 32 && beckyBox.cool <= 0) {
      beckyBox.cool = 8;
      if (!beckyBox.found) {
        beckyBox.found = true;
        showBanner("An icebox, humming cold in Frostfall. Where a maker's mark should be, someone scribbled 'Becky'.");
      } else showBanner("Becky's icebox. Still cold.");
      sfx.rune();
    }
  }

  // pickups
  for (const p of pickups) {
    if (p.taken) continue;
    if (p.cool > 0) { p.cool -= dt; continue; }
    if (Math.hypot(p.x - player.x, p.y - player.y) < 26) {
      p.taken = true;
      if (p.kind === 'sigil') {
        state.sigils++; state.sigilTaken = true;
        state.score += 50;
        floats.push({ x: p.x, y: p.y - 16, txt: (p.sealName || 'Span Sigil') + '!', t: 1.4 });
        showBanner('The ' + (p.sealName || 'Span Sigil') + ' is yours. Sigils: ' + state.sigils + '/3. The beacon is open now.');
        sfx.rune();
      }
      else if (p.kind === 'loot') { applyLoot(p.loot || rollLoot()); }
      else if (p.kind === 'key') {
        player.keys++;
        floats.push({ x: p.x, y: p.y - 16, txt: 'KEY!', t: 1 });
        sfx.key();
      } else {
        if (player.hp < player.maxHp) player.hp++;
        floats.push({ x: p.x, y: p.y - 16, txt: '+1', t: 1 });
        sfx.mead();
      }
    }
  }
  pickups = pickups.filter((p) => !p.taken);

  // 3.6.0: loot chests — decor chests (same hash as the renderers) open
  // on proximity. Some hold a random item, some are empty, on purpose.
  if (!state.lootedChests) state.lootedChests = new Set();
  {
    const pcx = Math.floor(player.x / TILE), pcy = Math.floor(player.y / TILE);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const tx = pcx + dx, ty = pcy + dy;
      if (tx < 0 || ty < 0 || tx >= state.cols || ty >= state.rows) continue;
      if (state.grid[ty][tx] === '#') continue;
      const hh = (tx * 73 + ty * 149) % 100;
      if (hh < 12 || (tx * 37 + ty * 91) % 29 !== 0) continue;
      const key = tx + ',' + ty;
      if (state.lootedChests.has(key)) continue;
      const cx = tx * TILE + TILE / 2, cy = ty * TILE + TILE / 2;
      if (Math.hypot(player.x - cx, player.y - cy) >= 30) continue;
      state.lootedChests.add(key);
      if (Math.random() < 0.6) { const item = rollLoot(); applyLoot(item); floats.push({ x: cx, y: cy - 20, txt: 'CHEST!', t: 1 }); }
      else { floats.push({ x: cx, y: cy - 20, txt: 'Empty. Of course.', t: 1 }); sfx.key(); }
    }
  }

  // gates: a brass key opens them on contact; without one they just say so
  for (const g of gates) {
    if (g.open) continue;
    if (g.cool > 0) g.cool -= dt;
    const nx = Math.max(g.tx * TILE, Math.min(player.x, g.tx * TILE + TILE));
    const ny = Math.max(g.ty * TILE, Math.min(player.y, g.ty * TILE + TILE));
    if (Math.hypot(player.x - nx, player.y - ny) < player.r) {
      if (player.keys > 0) {
        player.keys--; g.open = true;
        state.grid[g.ty][g.tx] = '.';
        showBanner('The gate grinds open.');
        sfx.rune();
      } else if (g.cool <= 0) {
        g.cool = 4;
        showBanner('Locked. A brass key opens it.');
      }
    }
  }

  // 4.0.2: hero gates — a gate that answers only to one hero, not a key.
  // The Wind Gate is why SWITCH matters: only Eira opens it, so the
  // controlled hero has to be Eira at the gate, not just anyone you like.
  for (const g of heroGates) {
    if (g.open) continue;
    if (g.cool > 0) g.cool -= dt;
    const nx = Math.max(g.tx * TILE, Math.min(player.x, g.tx * TILE + TILE));
    const ny = Math.max(g.ty * TILE, Math.min(player.y, g.ty * TILE + TILE));
    if (Math.hypot(player.x - nx, player.y - ny) < player.r) {
      if ((player.kind || 'kari') === g.hero) {
        g.open = true;
        state.grid[g.ty][g.tx] = '.';
        showBanner('The ' + g.gateName + ' opens for ' + g.heroName + '.');
        sfx.rune();
      } else if (g.cool <= 0) {
        g.cool = 4;
        showBanner('The ' + g.gateName + ' answers only to ' + g.heroName + '. SWITCH to ' + g.heroName + '.');
      }
    }
  }

  // beacon — sealed realms: the beacon stays shut until that realm's Sigil is carried out
  if (beacon && Math.hypot(beacon.x - player.x, beacon.y - player.y) < 30) {
    const L = LEVELS[state.level];
    if (L.seal && !state.sigilTaken) {
      if (!beacon.sealCool || beacon.sealCool <= 0) {
        beacon.sealCool = 4;
        showBanner('The beacon is sealed. Find the ' + (L.sealName || 'Span Sigil') + ' first — behind the brass gate.');
      }
    } else {
      beacon = null;
      reachBeacon();
    }
  }
  if (beacon && beacon.sealCool > 0) beacon.sealCool -= dt;
  // the dark beacon: the finale's other choice
  if (darkBeacon && Math.hypot(darkBeacon.x - player.x, darkBeacon.y - player.y) < 30) {
    darkBeacon = null;
    winGame('dark');
  }

  // raven pings fade
  for (const p of pickups) if (p.ping > 0) p.ping -= dt;
  if (beacon && beacon.ping > 0) beacon.ping -= dt;

  // Hrafn the raven: orbits Kari, then scouts the nearest unmarked thing
  if (raven) {
    raven.t -= dt;
    if (raven.mode === 'follow') {
      const ox = Math.cos(state.time * 2.2) * 30, oy = -26 + Math.sin(state.time * 3.1) * 8;
      raven.x += (player.x + ox - raven.x) * Math.min(1, dt * 6);
      raven.y += (player.y + oy - raven.y) * Math.min(1, dt * 6);
      if (raven.t <= 0) {
        let best = null, bestD = 1e9;
        const consider = (ref, kind) => {
          const d = Math.hypot(ref.x - player.x, ref.y - player.y);
          if (d < bestD) { bestD = d; best = { ref, kind }; }
        };
        if (beacon && !beacon.marked) consider(beacon, 'beacon');
        for (const r of runestones) if (!r.taken) consider(r, 'rune');
        for (const p of pickups) if (!p.taken) consider(p, 'mead');
        if (best) { raven.target = best; raven.mode = 'scout'; }
        else raven.t = 8;
      }
    } else if (raven.target) {
      const tgt = raven.target;
      const gone = (tgt.kind === 'beacon' && !beacon) || (tgt.kind !== 'beacon' && tgt.ref.taken);
      if (gone) { raven.mode = 'follow'; raven.t = 10; raven.target = null; }
      else {
        const dx = tgt.ref.x - raven.x, dy = tgt.ref.y - raven.y, d = Math.hypot(dx, dy) || 1;
        const step = 300 * dt;
        if (d <= step + 12) {
          if (tgt.kind === 'beacon') { beacon.marked = true; beacon.ping = 4; }
          else tgt.ref.ping = 4;
          raven.mode = 'follow'; raven.t = 14; raven.target = null;
        } else { raven.x += dx / d * step; raven.y += dy / d * step; }
      }
    }
  }

  // realm weather: ambient motes, no gameplay effect
  state.ambientT -= dt;
  const weather = LEVELS[state.level].weather;
  if (weather && state.ambientT <= 0 && particles.length < 240) {
    state.ambientT = 0.14;
    const wx = Math.random() * state.cols * TILE, wh = state.rows * TILE;
    if (weather === 'embers') particles.push({ x: wx, y: wh, vx: (Math.random() - 0.5) * 20, vy: -25 - Math.random() * 25, t: 14, color: '#ff9a3c' });
    else if (weather === 'snow') particles.push({ x: wx, y: 0, vx: (Math.random() - 0.5) * 20, vy: 30 + Math.random() * 25, t: 12, color: '#dfe9f2' });
    else if (weather === 'ash') particles.push({ x: wx, y: 0, vx: -15 - Math.random() * 15, vy: 15 + Math.random() * 15, t: 12, color: '#9a9a9a' });
    else if (weather === 'rain') particles.push({ x: wx, y: 0, vx: -30, vy: 230, t: 3, color: '#7aa8c8' });
  }
  // beacon sparkles: the lit beacon sheds gold motes
  if (beacon && state.ambientT <= 0.05 && particles.length < 240) {
    particles.push({ x: beacon.x + (Math.random() - 0.5) * 20, y: beacon.y + 10, vx: (Math.random() - 0.5) * 10, vy: -20 - Math.random() * 20, t: 1.2, color: '#ffd76a', shape: 'star' });
  }
  // dust puffs at Kari's heels while she runs
  if (player.moving && particles.length < 240) {
    state.dustT -= dt;
    if (state.dustT <= 0) {
      state.dustT = 0.12;
      particles.push({ x: player.x + (Math.random() - 0.5) * 12, y: player.y + 13, vx: (Math.random() - 0.5) * 15, vy: -8 - Math.random() * 10, t: 0.5, color: '#c8b898', a: 0.5 });
    }
  }

  // particles / floats
  for (const pt of particles) { pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.t -= dt; }
  particles = particles.filter((p) => p.t > 0);
  for (const f of floats) { f.y -= 24 * dt; f.t -= dt; }
  floats = floats.filter((f) => f.t > 0);
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 30);
}

/* ---------- render ---------- */
// cartoon eyes: white balls with pupils that look toward (fx, fy); lines when blinking
function eyes(cx, cy, fx, fy, gap, r, blink, pupil) {
  if (blink) {
    ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(cx - gap - r, cy); ctx.lineTo(cx - gap + r, cy);
    ctx.moveTo(cx + gap - r, cy); ctx.lineTo(cx + gap + r, cy); ctx.stroke();
    return;
  }
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(cx - gap, cy, r, 0, Math.PI * 2); ctx.arc(cx + gap, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = pupil || '#1a1210';
  ctx.beginPath();
  ctx.arc(cx - gap + fx * r * 0.5, cy + fy * r * 0.5, r * 0.55, 0, Math.PI * 2);
  ctx.arc(cx + gap + fx * r * 0.5, cy + fy * r * 0.5, r * 0.55, 0, Math.PI * 2); ctx.fill();
}
// a smile arc under a face
function smile(cx, cy, r) {
  ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 1.6; ctx.beginPath();
  ctx.arc(cx, cy, r, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
}
// lighten/darken a #rrggbb color by amt (-255..255), returned as an rgb() string
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, v + amt));
  return 'rgb(' + c((n >> 16) & 255) + ',' + c((n >> 8) & 255) + ',' + c(n & 255) + ')';
}
/* ---------- 1.8.0 graphics helpers: armor look, torches, crystals, chests ---------- */
/* ---------- 1.9.0: the vision hero — blue steel armor, helmet, rune staff ---------- */
// Kari's look follows the armor actually worn. Tier 1 is now the vision
// hero: blue steel plate, not a gold robe. Obsidian darkens it, aether
// makes it glow teal. The staff and its blue magic are the weapon's look;
// damage, range, and timing are unchanged underneath.
function armorStyle() {
  if (state.armorTier === 2) return { cloak: '#2a9a8a', dark: '#143a4a', trim: '#b07ad4', glow: 'rgba(74,232,216,0.35)' };
  if (state.armorTier === 1) return { cloak: '#3a3a4e', dark: '#1c1c28', trim: '#ffd76a', glow: null };
  return { cloak: '#5a7a9a', dark: '#2a3a4e', trim: '#c8d8e8', glow: null };
}
function staffCrystalPulse() { return 0.7 + 0.3 * Math.sin(state.time * 5); }
// A wall tile gets a torch when it borders open floor and its hash lands:
// sparse enough to read as torchlight, dense enough that no room is dark.
function isTorchTile(x, y) {
  if (!state.grid || state.grid[y][x] !== '#') return false;
  const nearFloor = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
    const nx = x + dx, ny = y + dy;
    return ny >= 0 && ny < state.rows && nx >= 0 && nx < state.cols && state.grid[ny][nx] !== '#';
  });
  return nearFloor && ((x * 5 + y * 11) % 7 === 0);
}
function torchFlame(x, y) { return 0.7 + 0.3 * Math.sin(state.time * 9 + x * 1.7 + y * 2.3); }
function drawCrystalShape(cx, cy, s) {
  ctx.fillStyle = '#7ac8e8';
  ctx.beginPath(); ctx.moveTo(cx, cy - 14 * s); ctx.lineTo(cx - 6 * s, cy + 4 * s); ctx.lineTo(cx + 6 * s, cy + 4 * s); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#d8f2ff';
  ctx.beginPath(); ctx.moveTo(cx, cy - 14 * s); ctx.lineTo(cx - 2 * s, cy + 4 * s); ctx.lineTo(cx + 2 * s, cy + 4 * s); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(122,200,232,0.35)';
  ctx.beginPath(); ctx.ellipse(cx, cy + 5 * s, 9 * s, 3 * s, 0, 0, Math.PI * 2); ctx.fill();
}
function drawChestShape(cx, cy, s) {
  ctx.fillStyle = '#8a6d1f';
  ctx.fillRect(cx - 11 * s, cy - 6 * s, 22 * s, 12 * s);
  ctx.fillStyle = '#ffd76a';
  ctx.fillRect(cx - 11 * s, cy - 6 * s, 22 * s, 3 * s);
  ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 1.5; ctx.strokeRect(cx - 11 * s, cy - 6 * s, 22 * s, 12 * s);
  ctx.fillStyle = '#ffd76a';
  ctx.fillRect(cx - 2 * s, cy - 2 * s, 4 * s, 5 * s);
}
let lightCanvas = null, lightCtx = null;
function drawLighting() {
  const L = LEVELS[state.level];
  const dark = L.dark !== undefined ? L.dark : 0.38;
  try {
    if (!lightCanvas) {
      lightCanvas = document.createElement('canvas');
      lightCanvas.width = canvas.width; lightCanvas.height = canvas.height;
      lightCtx = lightCanvas.getContext('2d');
    }
  } catch (e) { return; }
  if (!lightCtx) return;
  lightCtx.clearRect(0, 0, lightCanvas.width, lightCanvas.height);
  lightCtx.globalCompositeOperation = 'source-over';
  lightCtx.fillStyle = 'rgba(3,5,8,' + dark + ')';
  lightCtx.fillRect(0, 0, lightCanvas.width, lightCanvas.height);
  lightCtx.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r) => {
    const g = lightCtx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.7, 'rgba(255,255,255,0.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    lightCtx.fillStyle = g;
    lightCtx.beginPath(); lightCtx.arc(x, y, r, 0, Math.PI * 2); lightCtx.fill();
  };
  // light holes follow the projection in use: world points top-down,
  // projected ground points in the simulated-3D view (smaller room on screen)
  const P = state.iso ? isoProject : (x, y) => [x, y];
  const R = state.iso ? [150, 130, 120, 80] : [190, 170, 150, 100];
  if (player) { const q = P(player.x, player.y); hole(q[0], q[1], R[0]); }
  if (beacon) { const q = P(beacon.x, beacon.y); hole(q[0], q[1], R[1]); }
  if (darkBeacon) { const q = P(darkBeacon.x, darkBeacon.y); hole(q[0], q[1], R[2]); }
  for (const n of npcs) { const q = P(n.x, n.y); hole(q[0], q[1], R[3]); }
  // torches: small flickering warm holes, so the dungeon reads as lit, not just dark
  if (state.grid) {
    for (let y = 0; y < state.rows; y++) for (let x = 0; x < state.cols; x++) {
      if (!isTorchTile(x, y)) continue;
      const q = P(x * TILE + TILE / 2, y * TILE + TILE / 2);
      hole(q[0], q[1], 62 + 10 * torchFlame(x, y));
    }
  }
  ctx.drawImage(lightCanvas, 0, 0);
}

function draw() {
  const L = LEVELS[state.level];
  const sx = canvas.width / (state.cols * TILE), sy = canvas.height / (state.rows * TILE);
  ctx.save();
  if (state.shake > 0) ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  ctx.scale(sx, sy);
  // floor + walls
  for (let y = 0; y < state.rows; y++) {
    for (let x = 0; x < state.cols; x++) {
      const px = x * TILE, py = y * TILE;
      if (state.grid[y][x] === '#') {
        ctx.fillStyle = L.wall; ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = L.wallTop; ctx.fillRect(px, py, TILE, 10);
        // stone-block courses: mortar lines, offset joints, so walls stop reading as flat paint
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(px, py + 23, TILE, 2); ctx.fillRect(px, py + 39, TILE, 2);
        ctx.fillRect(px + ((y % 2) ? 12 : 30), py + 10, 2, 14);
        ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(px, py + 10, TILE, 2);
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(px, py + TILE - 6, TILE, 6);
        if (isTorchTile(x, y)) {
          const tx = px + TILE / 2, ty = py + TILE / 2, fl = torchFlame(x, y);
          ctx.strokeStyle = '#3a2a12'; ctx.lineWidth = 2; ctx.beginPath();
          ctx.moveTo(tx - 4, ty + 10); ctx.lineTo(tx, ty + 2); ctx.lineTo(tx + 4, ty + 10); ctx.stroke();
          ctx.fillStyle = '#ff9a3c';
          ctx.beginPath(); ctx.ellipse(tx, ty - 2 - 3 * fl, 5, 7 * fl + 3, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffd76a';
          ctx.beginPath(); ctx.ellipse(tx, ty - 1, 2.5, 3.5 * fl + 1, 0, 0, Math.PI * 2); ctx.fill();
        }
      } else {
        ctx.fillStyle = L.floor[(x + y) % 2];
        ctx.fillRect(px, py, TILE, TILE);
        // cut-stone floor: grout grid, speckle, and a faint rune etch on some stones
        ctx.strokeStyle = 'rgba(0,0,0,0.30)'; ctx.lineWidth = 1.5;
        ctx.strokeRect(px + 1, py + 1, TILE - 2, TILE - 2);
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(px + 6 + ((x * 5 + y * 3) % 8), py + 8 + ((x * 3 + y * 7) % 8), 4, 3);
        ctx.fillRect(px + 28 - ((x * 7 + y) % 6), py + 30 - ((x + y * 5) % 6), 3, 3);
        if ((x * 11 + y * 17) % 13 === 0) {
          ctx.strokeStyle = 'rgba(255,215,106,0.25)'; ctx.lineWidth = 1.5; ctx.beginPath();
          ctx.moveTo(px + 14, py + 14); ctx.lineTo(px + 24, py + 24); ctx.lineTo(px + 34, py + 14); ctx.stroke();
        }
        if (L.name === 'Drowned Road') {
          ctx.strokeStyle = 'rgba(122,200,220,' + (0.18 + 0.1 * Math.sin(state.time * 2 + x + y)) + ')'; ctx.lineWidth = 1.5; ctx.beginPath();
          ctx.moveTo(px + 8, py + 32 + Math.sin(state.time * 2 + x) * 2); ctx.lineTo(px + 40, py + 32 + Math.sin(state.time * 2 + x) * 2); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        if ((x * 7 + y * 13) % 5 === 0) ctx.fillRect(px + 10, py + 12, 8, 5);
        // scenery, deterministic per tile, never on entity tiles
        const hh = (x * 73 + y * 149) % 100;
        if (hh < (L.decor === 'pine' ? 5 : 12) && !(state.decorBan && state.decorBan.has(x + ',' + y))) {
          const cx = px + TILE / 2, cy = py + TILE / 2;
          ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2;
          if (L.decor === 'pine') {
            ctx.fillStyle = '#1d3a22';
            ctx.beginPath(); ctx.moveTo(cx, cy - 14); ctx.lineTo(cx - 12, cy + 10); ctx.lineTo(cx + 12, cy + 10); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#4a3220'; ctx.fillRect(cx - 2, cy + 10, 4, 6);
          } else if (L.decor === 'crystal') {
            ctx.fillStyle = '#9fc8e8';
            ctx.beginPath(); ctx.moveTo(cx, cy - 14); ctx.lineTo(cx - 7, cy + 4); ctx.lineTo(cx + 7, cy + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
          } else if (L.decor === 'reed') {
            ctx.strokeStyle = '#4a7a5a'; ctx.lineWidth = 2; ctx.beginPath();
            ctx.moveTo(cx - 8, cy + 12); ctx.lineTo(cx - 8, cy - 8);
            ctx.moveTo(cx, cy + 12); ctx.lineTo(cx, cy - 12);
            ctx.moveTo(cx + 8, cy + 12); ctx.lineTo(cx + 8, cy - 6); ctx.stroke();
            ctx.fillStyle = 'rgba(60,120,180,0.25)';
            ctx.beginPath(); ctx.ellipse(cx, cy + 12, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
          } else if (L.decor === 'rock') {
            ctx.fillStyle = '#4a3228';
            ctx.beginPath(); ctx.ellipse(cx, cy + 6, 12, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#ff9a3c';
            ctx.beginPath(); ctx.arc(cx - 3, cy + 2, 2.5, 0, Math.PI * 2); ctx.fill();
          } else if (L.decor === 'pillar') {
            ctx.fillStyle = '#4a3a4a'; ctx.fillRect(cx - 7, cy - 14, 14, 28);
            ctx.fillStyle = '#5e4a5e'; ctx.fillRect(cx - 7, cy - 14, 14, 5);
            ctx.strokeRect(cx - 7, cy - 14, 14, 28);
          } else if (L.decor === 'shard') {
            ctx.fillStyle = '#6a5a9a';
            ctx.save(); ctx.translate(cx, cy); ctx.rotate(0.5);
            ctx.fillRect(-4, -14, 8, 28); ctx.strokeRect(-4, -14, 8, 28); ctx.restore();
            ctx.fillStyle = '#b07ad4';
            ctx.beginPath(); ctx.arc(cx, cy - 2, 2.5, 0, Math.PI * 2); ctx.fill();
          }
        }
        // moss creeping over the stone, from the vision dungeon
        if ((x * 13 + y * 7) % 17 === 0) {
          ctx.fillStyle = 'rgba(90,140,70,0.30)';
          ctx.beginPath(); ctx.ellipse(px + 12, py + 38, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(px + 34, py + 10, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
        }
        // vision props on otherwise bare stone: blue crystals, gold chests
        if (hh >= 12 && (x * 37 + y * 91) % 23 === 0) drawCrystalShape(px + TILE / 2, py + TILE / 2 + 4, 1.3);
        else if (hh >= 12 && (x * 37 + y * 91) % 29 === 0 && !(state.lootedChests && state.lootedChests.has(x + ',' + y))) drawChestShape(px + TILE / 2, py + TILE / 2 + 6, 1.2);
      }
    }
  }
  // gates: barred doors over their wall tiles
  for (const g of gates) {
    if (g.open) continue;
    const px = g.tx * TILE, py = g.ty * TILE;
    ctx.fillStyle = '#3a2f22'; ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(px + 12, py + 4, 4, TILE - 8);
    ctx.fillRect(px + 22, py + 4, 4, TILE - 8);
    ctx.fillRect(px + 32, py + 4, 4, TILE - 8);
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath(); ctx.arc(px + 24, py + 24, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2;
    ctx.strokeRect(px + 4, py + 4, TILE - 8, TILE - 8);
  }
  // 4.0.2: hero gates — pale-blue door with a gold diamond, distinct from brass gates
  for (const g of heroGates) {
    if (g.open) continue;
    const px = g.tx * TILE, py = g.ty * TILE;
    ctx.fillStyle = '#2a4a6a'; ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
    ctx.fillStyle = '#7ac8e8';
    ctx.beginPath(); ctx.moveTo(px + 24, py + 12); ctx.lineTo(px + 32, py + 24); ctx.lineTo(px + 24, py + 36); ctx.lineTo(px + 16, py + 24); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath(); ctx.arc(px + 24, py + 24, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2;
    ctx.strokeRect(px + 4, py + 4, TILE - 8, TILE - 8);
  }
  // beacons
  const ring = (x, y, r, a) => {
    ctx.strokeStyle = 'rgba(255,215,106,' + a + ')'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  };
  if (beacon) {
    const pulse = 0.6 + 0.4 * Math.sin(state.time * 4);
    // rune pedestal + stone arch doorway framing the beacon, from the vision art
    ctx.fillStyle = '#4a4a5a';
    ctx.fillRect(beacon.x - 26, beacon.y + 14, 52, 10);
    ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2; ctx.strokeRect(beacon.x - 26, beacon.y + 14, 52, 10);
    ctx.fillStyle = '#5a5a6a';
    ctx.fillRect(beacon.x - 20, beacon.y + 6, 40, 10);
    ctx.strokeRect(beacon.x - 20, beacon.y + 6, 40, 10);
    ctx.fillStyle = '#6a6a7a';
    ctx.fillRect(beacon.x - 32, beacon.y - 18, 10, 34);
    ctx.fillRect(beacon.x + 22, beacon.y - 18, 10, 34);
    ctx.strokeRect(beacon.x - 32, beacon.y - 18, 10, 34);
    ctx.strokeRect(beacon.x + 22, beacon.y - 18, 10, 34);
    ctx.fillStyle = '#ffd76a';
    ctx.fillRect(beacon.x - 32, beacon.y - 18, 10, 4);
    ctx.fillRect(beacon.x + 22, beacon.y - 18, 10, 4);
    ctx.fillStyle = 'rgba(255,215,106,' + (0.25 * pulse) + ')';
    ctx.beginPath(); ctx.arc(beacon.x, beacon.y, 40 * pulse + 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ctx.fillRect(beacon.x - 5, beacon.y - 22, 10, 44);
    ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2;
    ctx.strokeRect(beacon.x - 5, beacon.y - 22, 10, 44);
    ctx.beginPath(); ctx.moveTo(beacon.x, beacon.y - 34); ctx.lineTo(beacon.x - 12, beacon.y - 16); ctx.lineTo(beacon.x + 12, beacon.y - 16); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (beacon.marked) ring(beacon.x, beacon.y, 30, 0.5);
    if (beacon.ping > 0) ring(beacon.x, beacon.y, 26 + 4 * Math.sin(state.time * 6), 0.7);
    // rune circle on the ground, like the pedestal in the vision art
    ctx.strokeStyle = 'rgba(255,215,106,0.35)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(beacon.x, beacon.y, 44, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const a = state.time * 0.25 + i * Math.PI / 3;
      ctx.fillStyle = 'rgba(255,215,106,0.6)';
      ctx.fillRect(beacon.x + Math.cos(a) * 44 - 2, beacon.y + Math.sin(a) * 44 - 2, 4, 4);
    }
  }
  if (darkBeacon) {
    const pulse = 0.6 + 0.4 * Math.sin(state.time * 2.5);
    ctx.fillStyle = 'rgba(150,110,220,' + (0.2 * pulse) + ')';
    ctx.beginPath(); ctx.arc(darkBeacon.x, darkBeacon.y, 34 * pulse + 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a6fc0';
    ctx.save(); ctx.translate(darkBeacon.x, darkBeacon.y - 6); ctx.rotate(Math.PI / 4);
    ctx.fillRect(-11, -11, 22, 22);
    ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2; ctx.strokeRect(-11, -11, 22, 22); ctx.restore();
    ctx.fillStyle = '#2a2438'; ctx.fillRect(darkBeacon.x - 3, darkBeacon.y + 8, 6, 16);
  }
  // Hush Stone: dark purple slab, gold note when music is on, grey when off
  if (hushStone) {
    ctx.fillStyle = '#4a3442'; ctx.fillRect(hushStone.x - 8, hushStone.y - 18, 16, 30);
    ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2; ctx.strokeRect(hushStone.x - 8, hushStone.y - 18, 16, 30);
    ctx.fillStyle = state.music ? '#ffd76a' : '#6a6a6a';
    ctx.font = '16px serif'; ctx.textAlign = 'center';
    ctx.fillText('♫', hushStone.x, hushStone.y + 2);
    ctx.textAlign = 'left';
  }
  // Becky's Icebox: pale cold box, name scribbled under it
  if (beckyBox) {
    ctx.fillStyle = '#c8e4f0'; ctx.fillRect(beckyBox.x - 10, beckyBox.y - 10, 20, 18);
    ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2; ctx.strokeRect(beckyBox.x - 10, beckyBox.y - 10, 20, 18);
    ctx.fillStyle = '#7ab0c8'; ctx.fillRect(beckyBox.x - 10, beckyBox.y - 10, 20, 5);
    ctx.fillStyle = '#2a4a5a'; ctx.font = '9px serif'; ctx.textAlign = 'center';
    ctx.fillText('Becky', beckyBox.x, beckyBox.y + 20);
    ctx.textAlign = 'left';
  }
  // runestones
  for (const r of runestones) {
    ctx.fillStyle = '#8a8a7a'; ctx.fillRect(r.x - 7, r.y - 16, 14, 28);
    ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2; ctx.strokeRect(r.x - 7, r.y - 16, 14, 28);
    ctx.fillStyle = '#ffd76a'; ctx.fillRect(r.x - 1, r.y - 10, 2, 12);
    if (r.ping > 0) ring(r.x, r.y, 24 + 3 * Math.sin(state.time * 6), 0.7);
  }
  // folk
  for (const n of npcs) {
    const col = n.kind === 'mira' ? '#c87f3a' : n.kind === 'tove' ? '#4a7a8a' : '#7a8a5a';
    const nblink = (state.time + n.x * 0.01) % 3.4 < 0.12;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(n.x, n.y + 13, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(n.x, n.y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#e8dcc0';
    ctx.beginPath(); ctx.arc(n.x, n.y - 8, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    eyes(n.x, n.y - 8, 0, 0, 2, 1.6, nblink);
    smile(n.x, n.y - 6, 2.5);
    if (!n.talked) {
      ctx.font = 'bold 22px Georgia'; ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd76a'; ctx.fillText('!', n.x, n.y - 22);
    }
  }
  // party allies (command mode)
  if (state.sel.includes(player)) {
    ctx.strokeStyle = '#ffd76a'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(player.x, player.y, 20, 0, Math.PI * 2); ctx.stroke();
  }
  for (const a of allies) {
    const ablink = (state.time + a.x * 0.01) % 3.4 < 0.12;
    if (state.sel.includes(a)) {
      ctx.strokeStyle = '#ffd76a'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(a.x, a.y, 20, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(a.x, a.y + 13, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = a.color;
    ctx.beginPath(); ctx.arc(a.x, a.y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#e8dcc0';
    ctx.beginPath(); ctx.arc(a.x, a.y - 8, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    eyes(a.x, a.y - 8, 0, 0, 2, 1.6, ablink);
    smile(a.x, a.y - 6, 2.5);
    if (a.hp < a.maxHp) {
      ctx.fillStyle = '#1a1210'; ctx.fillRect(a.x - 14, a.y - 26, 28, 5);
      ctx.fillStyle = a.hp / a.maxHp > 0.5 ? '#7ec850' : '#e5484d';
      ctx.fillRect(a.x - 13, a.y - 25, 26 * a.hp / a.maxHp, 3);
    }
  }
  // raven
  if (raven) {
    const flap = Math.sin(state.time * 18) * 5;
    ctx.fillStyle = '#20242a';
    ctx.beginPath(); ctx.ellipse(raven.x, raven.y, 9, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#20242a'; ctx.lineWidth = 3; ctx.beginPath();
    ctx.moveTo(raven.x - 4, raven.y); ctx.lineTo(raven.x - 14, raven.y - 6 - flap);
    ctx.moveTo(raven.x + 4, raven.y); ctx.lineTo(raven.x + 14, raven.y - 6 + flap); ctx.stroke();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath(); ctx.arc(raven.x + 5, raven.y - 1, 1.8, 0, Math.PI * 2); ctx.fill();
  }
  // mead (loot drops are gold, not green)
  for (const p of pickups) {
    ctx.fillStyle = p.kind === 'loot' ? '#ffd76a' : '#7ec850';
    ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#e8f5c0'; ctx.fillRect(p.x - 2, p.y - 12, 4, 6);
    if (p.ping > 0) ring(p.x, p.y, 22 + 3 * Math.sin(state.time * 6), 0.7);
  }
  // enemies, drawn as figures now, not just circles
  for (const e of enemies) {
    const fx = Math.cos(e.face || 0), fy = Math.sin(e.face || 0);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(e.x, e.y + e.r * 0.9, e.r * 0.8, 4, 0, 0, Math.PI * 2); ctx.fill();
    const flash = e.flash > 0;
    // breathing + a squash-pop on every landed hit: the cartoon body language
    const blink = (state.time + e.x * 0.01) % 3.4 < 0.12;
    const br = 1 + Math.sin(state.time * 3 + e.x * 0.05) * 0.03;
    const es = br * (flash ? 1.12 : 1);
    ctx.save(); ctx.translate(e.x, e.y); ctx.scale(es, es); ctx.translate(-e.x, -e.y);
    ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2.5;
    if (e.kind === 'king') {
      ctx.fillStyle = flash || e.charge > 0 ? '#ff8a8a' : '#5a3d6e';
      ctx.beginPath();
      ctx.moveTo(e.x - 16, e.y - 14); ctx.lineTo(e.x + 16, e.y - 14);
      ctx.lineTo(e.x + 22, e.y + 20); ctx.lineTo(e.x - 22, e.y + 20);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d8c8b8';
      ctx.beginPath(); ctx.arc(e.x, e.y - 16, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd76a';
      ctx.beginPath();
      ctx.moveTo(e.x - 10, e.y - 22); ctx.lineTo(e.x - 5, e.y - 32); ctx.lineTo(e.x, e.y - 24);
      ctx.lineTo(e.x + 5, e.y - 32); ctx.lineTo(e.x + 10, e.y - 22);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      eyes(e.x, e.y - 16, fx, fy, 4, 2.5, blink, '#ff5a5a');
      // scepter with a pulsing orb
      ctx.strokeStyle = '#2a1e3a'; ctx.lineWidth = 3; ctx.beginPath();
      ctx.moveTo(e.x + 20, e.y + 16); ctx.lineTo(e.x + 24, e.y - 20); ctx.stroke();
      ctx.fillStyle = '#b07ad4';
      ctx.beginPath(); ctx.arc(e.x + 24, e.y - 22, 3 + Math.sin(state.time * 4) * 1, 0, Math.PI * 2); ctx.fill();
    } else if (e.kind === 'wolf') {
      const leg = Math.sin(state.time * 14 + e.x) * 3;
      ctx.fillStyle = flash ? '#dfe9f2' : '#8fa3b8';
      ctx.beginPath(); ctx.ellipse(e.x, e.y, 16, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(e.x + fx * 14, e.y + fy * 14 - 4, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      eyes(e.x + fx * 14, e.y + fy * 14 - 4, fx, fy, 3, 2, blink, '#e5484d');
      ctx.strokeStyle = flash ? '#dfe9f2' : '#8fa3b8'; ctx.lineWidth = 3; ctx.beginPath();
      ctx.moveTo(e.x - fx * 14, e.y - fy * 14); ctx.lineTo(e.x - fx * 20, e.y - fy * 20 - 4 + Math.sin(state.time * 10 + e.x) * 3);
      ctx.moveTo(e.x - 6, e.y + 8); ctx.lineTo(e.x - 6, e.y + 13 + leg);
      ctx.moveTo(e.x + 6, e.y + 8); ctx.lineTo(e.x + 6, e.y + 13 - leg); ctx.stroke();
    } else if (e.kind === 'troll') {
      ctx.fillStyle = flash ? '#e8dcc0' : '#6b4a34';
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(e.x - 18, e.y + 4, 8, 0, Math.PI * 2); ctx.arc(e.x + 18, e.y + 4, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d8c8b8';
      ctx.beginPath(); ctx.arc(e.x, e.y - 12, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      eyes(e.x, e.y - 12, fx, fy, 4, 2.5, blink, '#ffd76a');
    } else if (e.kind === 'spider') {
      // a real Crystal Spider at last: crystal abdomen, eight jointed legs, glowing eyes
      const sway = Math.sin(state.time * 8 + e.x * 0.05) * 3;
      ctx.strokeStyle = '#2a1240'; ctx.lineWidth = 3;
      for (let leg = 0; leg < 4; leg++) {
        const ly = -10 + leg * 7, bend = (leg % 2 ? 1 : -1) * (4 + sway * 0.4);
        ctx.beginPath(); ctx.moveTo(e.x - 8, e.y + ly); ctx.lineTo(e.x - 20, e.y + ly + bend); ctx.lineTo(e.x - 26, e.y + ly + bend * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(e.x + 8, e.y + ly); ctx.lineTo(e.x + 20, e.y + ly - bend); ctx.lineTo(e.x + 26, e.y + ly - bend * 2); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(176,122,212,0.30)';
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = flash ? '#e8d8f5' : '#7a3a9a';
      ctx.beginPath(); ctx.ellipse(e.x, e.y, e.r, e.r * 0.85, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#b07ad4';
      ctx.beginPath(); ctx.moveTo(e.x, e.y - 18); ctx.lineTo(e.x - 7, e.y - 2); ctx.lineTo(e.x + 7, e.y - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e8c8ff';
      ctx.beginPath(); ctx.arc(e.x - 4, e.y - 8, 2.2, 0, Math.PI * 2); ctx.arc(e.x + 4, e.y - 8, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd76a';
      ctx.beginPath(); ctx.arc(e.x - 7, e.y - 4, 1.6, 0, Math.PI * 2); ctx.arc(e.x + 7, e.y - 4, 1.6, 0, Math.PI * 2); ctx.fill();
    } else {
      const col = e.kind === 'drowned' ? '#5a7a72' : e.kind === 'wraith' ? '#7a6a9a' : e.kind === 'brute' ? '#8a4a3a' : e.kind === 'screecher' ? '#c8b86a' : '#6e8f6a';
      const sway = Math.sin(state.time * 6 + e.x * 0.05) * 2;
      ctx.fillStyle = flash ? '#cfe8cf' : col;
      ctx.beginPath(); ctx.arc(e.x + sway * 0.3, e.y, e.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = flash ? '#e8f5e8' : (e.kind === 'drowned' ? '#7a9a92' : e.kind === 'wraith' ? '#9a8ab8' : e.kind === 'brute' ? '#a85a48' : e.kind === 'screecher' ? '#d8c878' : '#8aa88a');
      ctx.beginPath(); ctx.arc(e.x + fx * 5, e.y - 8, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      eyes(e.x + fx * 5, e.y - 8, fx, fy, 2.5, 1.8, blink);
      ctx.fillStyle = flash ? '#cfe8cf' : col;
      ctx.beginPath(); ctx.arc(e.x - e.r * 0.9, e.y + 2 + sway, 4, 0, Math.PI * 2); ctx.arc(e.x + e.r * 0.9, e.y + 2 - sway, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  // player: vision hero — blue steel armor, helmet, rune staff, blue magic
  if (player) {
    const blink = player.iframes > 0 && Math.floor(state.time * 14) % 2 === 0;
    if (!blink) {
      const bob = player.moving ? Math.sin(player.bobPhase) * 2 : 0;
      const fx = Math.cos(player.face), fy = Math.sin(player.face);
      const sway = Math.sin(state.time * 3) * 2;
      let psx = 1 + Math.sin(state.time * 2.5) * 0.02, psy = psx;
      if (player.swing > 0) { psx *= 1.1; psy *= 1.05; }
      if (player.iframes > 0.7) { psx *= 1.15; psy *= 0.85; }
      ctx.save(); ctx.translate(player.x, player.y); ctx.scale(psx, psy); ctx.translate(-player.x, -player.y);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(player.x, player.y + 13, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
      const legSwing = player.moving ? Math.sin(player.bobPhase) * 3 : 0;
      // steel greaves and boots, not a robe hem
      ctx.fillStyle = '#2a3a4e';
      ctx.fillRect(player.x - 7, player.y + 8, 5, 7 + legSwing * 0.3);
      ctx.fillRect(player.x + 2, player.y + 8, 5, 7 - legSwing * 0.3);
      ctx.fillStyle = '#1c1c28';
      ctx.fillRect(player.x - 7, player.y + 13, 5, 3);
      ctx.fillRect(player.x + 2, player.y + 13, 5, 3);
      const aStyle = armorStyle();
      if (aStyle.glow) {
        ctx.fillStyle = aStyle.glow;
        ctx.beginPath(); ctx.arc(player.x, player.y, 22, 0, Math.PI * 2); ctx.fill();
      }
      if (state.skills.shield && state.shieldActive) {
        ctx.strokeStyle = 'rgba(74,144,216,0.8)'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(player.x, player.y, 20, 0, Math.PI * 2); ctx.stroke();
      }
      // rune staff, held to one side, crystal pulsing blue — the vision weapon
      const staffX = player.x - 15, staffTop = player.y - 30 + bob;
      ctx.strokeStyle = '#4a3220'; ctx.lineWidth = 3; ctx.beginPath();
      ctx.moveTo(staffX, staffTop + 12); ctx.lineTo(staffX, player.y + 12); ctx.stroke();
      const cp = staffCrystalPulse() * (player.swing > 0 ? 1.5 : 1);
      ctx.fillStyle = 'rgba(74,144,216,' + (0.3 * cp) + ')';
      ctx.beginPath(); ctx.arc(staffX, staffTop, 9 * cp, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4a90d8';
      ctx.beginPath(); ctx.moveTo(staffX, staffTop - 7); ctx.lineTo(staffX - 5, staffTop); ctx.lineTo(staffX, staffTop + 7); ctx.lineTo(staffX + 5, staffTop); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 1.5; ctx.stroke();
      // blue steel cuirass with pauldrons, belt, and chain skirt — tinted by whoever is playing
      ctx.fillStyle = (player.kind && player.kind !== 'kari') ? (player.color || aStyle.cloak) : aStyle.cloak;
      ctx.beginPath(); ctx.ellipse(player.x, player.y + 1, 11, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = aStyle.dark;
      ctx.beginPath(); ctx.ellipse(player.x, player.y + 4, 8, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = shade(aStyle.cloak, 40);
      ctx.beginPath(); ctx.arc(player.x - 11, player.y - 4, 5, 0, Math.PI * 2); ctx.arc(player.x + 11, player.y - 4, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = aStyle.trim;
      ctx.fillRect(player.x - 10, player.y + 8, 20, 3);
      // head: face under a steel helmet with a nasal guard
      ctx.fillStyle = '#e8dcc0';
      ctx.beginPath(); ctx.arc(player.x, player.y - 10 + bob, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = aStyle.cloak;
      ctx.beginPath(); ctx.arc(player.x, player.y - 12 + bob, 6.5, Math.PI, 0); ctx.fill(); ctx.stroke();
      ctx.fillStyle = aStyle.dark;
      ctx.fillRect(player.x - 1, player.y - 13 + bob, 2, 5);
      const pblink = (state.time % 3.6) < 0.12;
      eyes(player.x, player.y - 10 + bob, fx, fy, 2.5, 1.8, pblink);
      smile(player.x, player.y - 7 + bob, 2.5);
      if (player.swing > 0) {
        // the blow reads as blue rune magic now, same hitbox as the sword
        const a = player.face + Math.sin((0.28 - player.swing) / 0.28 * Math.PI) * 0.9 - 0.45;
        ctx.fillStyle = 'rgba(74,144,216,0.28)';
        ctx.beginPath(); ctx.moveTo(player.x, player.y);
        ctx.arc(player.x, player.y, 46, a - 0.5, a + 0.5); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#4a90d8'; ctx.lineWidth = 4; ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(player.x + Math.cos(a) * 44, player.y + Math.sin(a) * 44); ctx.stroke();
        ctx.fillStyle = '#c8e4ff';
        ctx.beginPath(); ctx.arc(player.x + Math.cos(a) * 44, player.y + Math.sin(a) * 44, 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }
  // torchlight: darkness with holes at Kari, beacons, and folk
  drawLighting();
  // particles + floats
  for (const pt of particles) {
    ctx.globalAlpha = Math.max(0, pt.t * 2) * (pt.a || 1);
    if (pt.shape === 'star') {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y - 5); ctx.lineTo(pt.x + 1.5, pt.y - 1.5); ctx.lineTo(pt.x + 5, pt.y);
      ctx.lineTo(pt.x + 1.5, pt.y + 1.5); ctx.lineTo(pt.x, pt.y + 5); ctx.lineTo(pt.x - 1.5, pt.y + 1.5);
      ctx.lineTo(pt.x - 5, pt.y); ctx.lineTo(pt.x - 1.5, pt.y - 1.5);
      ctx.closePath(); ctx.fill();
    } else {
      ctx.fillStyle = pt.color; ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4);
    }
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  for (const f of floats) {
    const pop = f.t > 0.8 ? 1.35 : 1;
    ctx.font = 'bold ' + Math.round(20 * pop) + 'px Georgia';
    ctx.globalAlpha = Math.min(1, f.t);
    ctx.lineWidth = 4; ctx.strokeStyle = '#1a1210'; ctx.strokeText(f.txt, f.x, f.y);
    ctx.fillStyle = '#fff'; ctx.fillText(f.txt, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  if (state.fade > 0) {
    ctx.fillStyle = 'rgba(0,0,0,' + (state.fade * 0.7) + ')';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

/* ---------- simulated 3D: dimetric projection, cartoon figures standing ---------- */
const ISO_OX = 384, ISO_OY = 108, ISO_H = 26, ISO_LOW = 10;
function isoProject(wx, wy) { return [(wx - wy) * 0.5 + ISO_OX, (wx + wy) * 0.25 + ISO_OY]; }
function isoFace(fx, fy) {
  const sx = (fx - fy) * 0.5, sy = (fx + fy) * 0.25, d = Math.hypot(sx, sy) || 1;
  return [sx / d, sy / d];
}
function drawIso() {
  const L = LEVELS[state.level];
  ctx.save();
  if (state.shake > 0) ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  // the diorama backdrop: night sky, moon, mountains, and the room's drop shadow
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  if (L.outdoor) { sky.addColorStop(0, '#7ab8e8'); sky.addColorStop(0.6, '#a8d0f0'); sky.addColorStop(1, '#c8e8ff'); }
  else { sky.addColorStop(0, '#0a1428'); sky.addColorStop(0.6, '#101a2e'); sky.addColorStop(1, '#0c1112'); }
  ctx.fillStyle = sky; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#e8e8f0';
  for (let i = 0; i < 60; i++) {
    const sx = (i * 137) % canvas.width, sy = (i * 89) % 260;
    ctx.globalAlpha = 0.25 + ((i * 7) % 10) / 14;
    ctx.fillRect(sx, sy, 2, 2);
  }
  ctx.globalAlpha = 1;
  const moonGlow = ctx.createRadialGradient(820, 90, 4, 820, 90, 70);
  moonGlow.addColorStop(0, 'rgba(255,240,200,0.5)'); moonGlow.addColorStop(1, 'rgba(255,240,200,0)');
  ctx.fillStyle = moonGlow;
  ctx.beginPath(); ctx.arc(820, 90, 70, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f5ecd0';
  ctx.beginPath(); ctx.arc(820, 90, 26, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a2440';
  ctx.beginPath(); ctx.moveTo(0, 150);
  ctx.lineTo(120, 60); ctx.lineTo(240, 130); ctx.lineTo(380, 50); ctx.lineTo(520, 120);
  ctx.lineTo(660, 70); ctx.lineTo(800, 140); ctx.lineTo(960, 90); ctx.lineTo(960, 200); ctx.lineTo(0, 200);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#141e33';
  ctx.beginPath(); ctx.moveTo(0, 190);
  ctx.lineTo(180, 110); ctx.lineTo(340, 170); ctx.lineTo(560, 100); ctx.lineTo(760, 175); ctx.lineTo(960, 130); ctx.lineTo(960, 220); ctx.lineTo(0, 220);
  ctx.closePath(); ctx.fill();
  const drop = ctx.createRadialGradient(480, 300, 40, 480, 300, 430);
  drop.addColorStop(0, 'rgba(0,0,0,0.45)'); drop.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = drop;
  ctx.save(); ctx.translate(480, 300); ctx.scale(1.15, 0.62); ctx.translate(-480, -300);
  ctx.beginPath(); ctx.arc(480, 300, 430, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  // two floor gradients (one per checker color) give the room a vertical light falloff
  const gradA = ctx.createLinearGradient(0, ISO_OY, 0, ISO_OY + 384);
  gradA.addColorStop(0, shade(L.floor[0], 16)); gradA.addColorStop(1, shade(L.floor[0], -14));
  const gradB = ctx.createLinearGradient(0, ISO_OY, 0, ISO_OY + 384);
  gradB.addColorStop(0, shade(L.floor[1], 16)); gradB.addColorStop(1, shade(L.floor[1], -14));
  // one depth-sorted list: tiles and figures, back to front, tiles first on ties
  const items = [];
  for (let y = 0; y < state.rows; y++)
    for (let x = 0; x < state.cols; x++)
      items.push({ d: (x + y + 1) * TILE, kind: 0, x, y });
  const add = (o) => items.push({ d: o.x + o.y, kind: 1, o });
  if (beacon) add(beacon);
  if (darkBeacon) add(darkBeacon);
  for (const r of runestones) add(r);
  if (hushStone) add(hushStone);
  if (beckyBox) add(beckyBox);
  for (const n of npcs) add(n);
  for (const a of allies) add(a);
  for (const p of pickups) add(p);
  for (const e of enemies) add(e);
  if (player) add(player);
  if (raven) add(raven);
  items.sort((a, b) => (a.d - b.d) || (a.kind - b.kind));
  const diamond = (cx, cy, rx, ry, fill, strokeA) => {
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.moveTo(cx, cy - ry); ctx.lineTo(cx + rx, cy); ctx.lineTo(cx, cy + ry); ctx.lineTo(cx - rx, cy); ctx.closePath(); ctx.fill();
    if (strokeA !== undefined) { ctx.strokeStyle = 'rgba(0,0,0,' + strokeA + ')'; ctx.lineWidth = 1; ctx.stroke(); }
  };
  const shadow = (sx, sy, w) => {
    // shadows stretch away from the lit beacon: the clearest depth cue in the scene
    let lx = sx, ly = sy - 100;
    if (beacon) { const q = isoProject(beacon.x, beacon.y); lx = q[0]; ly = q[1]; }
    const dx = sx - lx, dy = sy - ly, d = Math.hypot(dx, dy) || 1;
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath(); ctx.ellipse(sx + dx / d * 9, sy + dy / d * 9, w * 1.4, 4.5, Math.atan2(dy, dx), 0, Math.PI * 2); ctx.fill();
  };
  const groundRing = (sx, sy, rx, a) => {
    ctx.strokeStyle = 'rgba(255,215,106,' + a + ')'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(sx, sy, rx, rx * 0.45, 0, 0, Math.PI * 2); ctx.stroke();
  };
  for (const it of items) {
    if (it.kind === 0) {
      const { x, y } = it;
      const [cx, cy] = isoProject((x + 0.5) * TILE, (y + 0.5) * TILE);
      if (state.grid[y][x] === '#') {
        // wall block: low curb on the front (south/east) rim so the room stays visible, tall block elsewhere
        const H = (x === state.cols - 1 || y === state.rows - 1) ? ISO_LOW : ISO_H;
        const top = cy - H;
        ctx.fillStyle = shade(L.wall, -25);
        ctx.beginPath(); ctx.moveTo(cx - 24, top); ctx.lineTo(cx, top + 12); ctx.lineTo(cx, top + 12 + H); ctx.lineTo(cx - 24, top + H); ctx.closePath(); ctx.fill();
        ctx.fillStyle = shade(L.wall, 5);
        ctx.beginPath(); ctx.moveTo(cx, top + 12); ctx.lineTo(cx + 24, top); ctx.lineTo(cx + 24, top + H); ctx.lineTo(cx, top + 12 + H); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.beginPath(); ctx.moveTo(cx, top + 12); ctx.lineTo(cx + 24, top); ctx.lineTo(cx + 24, top + H); ctx.lineTo(cx, top + 12 + H); ctx.closePath(); ctx.fill();
        diamond(cx, top, 24, 12, L.wallTop, 0.3);
        if (isTorchTile(x, y)) {
          const fl = torchFlame(x, y);
          ctx.strokeStyle = '#3a2a12'; ctx.lineWidth = 2; ctx.beginPath();
          ctx.moveTo(cx - 4, top + 26); ctx.lineTo(cx, top + 18); ctx.lineTo(cx + 4, top + 26); ctx.stroke();
          ctx.fillStyle = '#ff9a3c';
          ctx.beginPath(); ctx.ellipse(cx, top + 12 - 3 * fl, 5, 7 * fl + 3, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffd76a';
          ctx.beginPath(); ctx.ellipse(cx, top + 13, 2.5, 3.5 * fl + 1, 0, 0, Math.PI * 2); ctx.fill();
        }
        for (const g of gates) {
          if (g.open || g.tx !== x || g.ty !== y) continue;
          ctx.fillStyle = '#3a2f22'; ctx.fillRect(cx - 13, cy - 34, 26, 34);
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(cx - 8, cy - 34, 4, 34); ctx.fillRect(cx + 4, cy - 34, 4, 34);
          ctx.fillStyle = '#ffd76a';
          ctx.beginPath(); ctx.arc(cx, cy - 16, 4, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2; ctx.strokeRect(cx - 13, cy - 34, 26, 34);
        }
        for (const g of heroGates) {
          if (g.open || g.tx !== x || g.ty !== y) continue;
          ctx.fillStyle = '#2a4a6a'; ctx.fillRect(cx - 13, cy - 34, 26, 34);
          ctx.fillStyle = '#7ac8e8';
          ctx.beginPath(); ctx.moveTo(cx, cy - 30); ctx.lineTo(cx + 7, cy - 16); ctx.lineTo(cx, cy - 6); ctx.lineTo(cx - 7, cy - 16); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#ffd76a';
          ctx.beginPath(); ctx.arc(cx, cy - 16, 3, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2; ctx.strokeRect(cx - 13, cy - 34, 26, 34);
        }
      } else {
        diamond(cx, cy, 24, 12, (x + y) % 2 === 0 ? gradA : gradB, 0.2);
        if (L.name === 'Drowned Road') diamond(cx, cy, 24, 12, 'rgba(60,180,200,0.14)', 0);
        // cut-stone inner line, so the diamond floor stops reading as flat
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx, cy - 8); ctx.lineTo(cx + 16, cy); ctx.lineTo(cx, cy + 8); ctx.lineTo(cx - 16, cy); ctx.closePath(); ctx.stroke();
        const hh = (x * 73 + y * 149) % 100;
        if (hh < (L.decor === 'pine' ? 5 : 12) && !(state.decorBan && state.decorBan.has(x + ',' + y))) {
          ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2;
          if (L.decor === 'pine') {
            ctx.fillStyle = '#4a3220'; ctx.fillRect(cx - 2, cy - 6, 4, 6);
            ctx.fillStyle = '#1d3a22';
            ctx.beginPath(); ctx.moveTo(cx, cy - 32); ctx.lineTo(cx - 12, cy - 6); ctx.lineTo(cx + 12, cy - 6); ctx.closePath(); ctx.fill(); ctx.stroke();
          } else if (L.decor === 'crystal') {
            ctx.fillStyle = '#9fc8e8';
            ctx.beginPath(); ctx.moveTo(cx, cy - 24); ctx.lineTo(cx - 7, cy - 4); ctx.lineTo(cx + 7, cy - 4); ctx.closePath(); ctx.fill(); ctx.stroke();
          } else if (L.decor === 'reed') {
            ctx.strokeStyle = '#4a7a5a'; ctx.beginPath();
            ctx.moveTo(cx - 8, cy); ctx.lineTo(cx - 8, cy - 14);
            ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - 18);
            ctx.moveTo(cx + 8, cy); ctx.lineTo(cx + 8, cy - 12); ctx.stroke();
            ctx.fillStyle = 'rgba(60,120,180,0.25)';
            ctx.beginPath(); ctx.ellipse(cx, cy, 13, 4, 0, 0, Math.PI * 2); ctx.fill();
            // animated shimmer across the pool
            ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath();
            const sh = Math.sin(state.time * 2 + cx * 0.05) * 2;
            ctx.moveTo(cx - 10, cy + sh); ctx.lineTo(cx + 10, cy + sh); ctx.stroke();
          } else if (L.decor === 'rock') {
            ctx.fillStyle = '#4a3228';
            ctx.beginPath(); ctx.ellipse(cx, cy, 12, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#ff9a3c';
            ctx.beginPath(); ctx.arc(cx - 3, cy - 2, 2.5, 0, Math.PI * 2); ctx.fill();
          } else if (L.decor === 'pillar') {
            ctx.fillStyle = '#4a3a4a'; ctx.fillRect(cx - 6, cy - 26, 12, 26);
            ctx.fillStyle = '#5e4a5e'; ctx.fillRect(cx - 6, cy - 26, 12, 5);
            ctx.strokeRect(cx - 6, cy - 26, 12, 26);
          } else if (L.decor === 'shard') {
            ctx.fillStyle = '#6a5a9a';
            ctx.save(); ctx.translate(cx, cy); ctx.rotate(0.5);
            ctx.fillRect(-4, -26, 8, 26); ctx.strokeRect(-4, -26, 8, 26); ctx.restore();
            ctx.fillStyle = '#b07ad4';
            ctx.beginPath(); ctx.arc(cx, cy - 12, 2.5, 0, Math.PI * 2); ctx.fill();
          }
        }
        if ((x * 13 + y * 7) % 17 === 0) {
          ctx.fillStyle = 'rgba(90,140,70,0.30)';
          ctx.beginPath(); ctx.ellipse(cx - 8, cy + 4, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
        }
        if (hh >= 12 && (x * 37 + y * 91) % 23 === 0) drawCrystalShape(cx, cy - 6, 1.2);
        else if (hh >= 12 && (x * 37 + y * 91) % 29 === 0 && !(state.lootedChests && state.lootedChests.has(x + ',' + y))) drawChestShape(cx, cy - 2, 1.1);
      }
      continue;
    }
    const o = it.o;
    const [sx, sy] = isoProject(o.x, o.y);
    const blink = (state.time + o.x * 0.01) % 3.4 < 0.12;
    if (o === beacon) {
      const pulse = 0.6 + 0.4 * Math.sin(state.time * 4);
      // stone arch doorway behind the beacon + pedestal diamond under it
      ctx.fillStyle = '#4a4a5a';
      ctx.fillRect(sx - 34, sy - 52, 12, 52);
      ctx.fillRect(sx + 22, sy - 52, 12, 52);
      ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2;
      ctx.strokeRect(sx - 34, sy - 52, 12, 52);
      ctx.strokeRect(sx + 22, sy - 52, 12, 52);
      ctx.fillStyle = '#5a5a6a';
      ctx.fillRect(sx - 34, sy - 62, 68, 12);
      ctx.strokeRect(sx - 34, sy - 62, 68, 12);
      ctx.fillStyle = '#ffd76a';
      ctx.fillRect(sx - 34, sy - 52, 12, 4);
      ctx.fillRect(sx + 22, sy - 52, 12, 4);
      ctx.fillStyle = '#6a6a7a';
      ctx.beginPath(); ctx.moveTo(sx, sy - 8); ctx.lineTo(sx + 22, sy + 3); ctx.lineTo(sx, sy + 14); ctx.lineTo(sx - 22, sy + 3); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,215,106,' + (0.25 * pulse) + ')';
      ctx.beginPath(); ctx.ellipse(sx, sy, 30 * pulse + 10, 12, 0, 0, Math.PI * 2); ctx.fill();
      // volumetric light column rising off the flame
      const col = ctx.createLinearGradient(0, sy - 130, 0, sy);
      col.addColorStop(0, 'rgba(255,215,106,0)');
      col.addColorStop(1, 'rgba(255,215,106,' + (0.16 * pulse) + ')');
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(sx - 6, sy - 130); ctx.lineTo(sx + 6, sy - 130);
      ctx.lineTo(sx + 20, sy); ctx.lineTo(sx - 20, sy);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd76a';
      ctx.fillRect(sx - 5, sy - 44, 10, 44);
      ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2; ctx.strokeRect(sx - 5, sy - 44, 10, 44);
      ctx.beginPath(); ctx.moveTo(sx, sy - 58); ctx.lineTo(sx - 12, sy - 40); ctx.lineTo(sx + 12, sy - 40); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (beacon.marked) groundRing(sx, sy, 30, 0.5);
      if (beacon.ping > 0) groundRing(sx, sy, 26 + 4 * Math.sin(state.time * 6), 0.7);
    } else if (o === darkBeacon) {
      const pulse = 0.6 + 0.4 * Math.sin(state.time * 2.5);
      ctx.fillStyle = 'rgba(150,110,220,' + (0.2 * pulse) + ')';
      ctx.beginPath(); ctx.ellipse(sx, sy, 26 * pulse + 9, 11, 0, 0, Math.PI * 2); ctx.fill();
      const col = ctx.createLinearGradient(0, sy - 110, 0, sy);
      col.addColorStop(0, 'rgba(150,110,220,0)');
      col.addColorStop(1, 'rgba(150,110,220,' + (0.14 * pulse) + ')');
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(sx - 5, sy - 110); ctx.lineTo(sx + 5, sy - 110);
      ctx.lineTo(sx + 18, sy); ctx.lineTo(sx - 18, sy);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#8a6fc0';
      ctx.save(); ctx.translate(sx, sy - 34); ctx.rotate(Math.PI / 4);
      ctx.fillRect(-11, -11, 22, 22);
      ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2; ctx.strokeRect(-11, -11, 22, 22); ctx.restore();
      ctx.fillStyle = '#2a2438'; ctx.fillRect(sx - 3, sy - 22, 6, 22);
    } else if (o === hushStone) {
      shadow(sx, sy, 9);
      ctx.fillStyle = '#4a3442'; ctx.fillRect(sx - 8, sy - 30, 16, 30);
      ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2; ctx.strokeRect(sx - 8, sy - 30, 16, 30);
      ctx.fillStyle = state.music ? '#ffd76a' : '#6a6a6a';
      ctx.font = '16px serif'; ctx.textAlign = 'center';
      ctx.fillText('♫', sx, sy - 10);
      ctx.textAlign = 'left';
    } else if (o === beckyBox) {
      shadow(sx, sy, 10);
      ctx.fillStyle = '#c8e4f0'; ctx.fillRect(sx - 10, sy - 22, 20, 18);
      ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2; ctx.strokeRect(sx - 10, sy - 22, 20, 18);
      ctx.fillStyle = '#7ab0c8'; ctx.fillRect(sx - 10, sy - 22, 20, 5);
      ctx.fillStyle = '#2a4a5a'; ctx.font = '9px serif'; ctx.textAlign = 'center';
      ctx.fillText('Becky', sx, sy + 8);
      ctx.textAlign = 'left';
    } else if (runestones.includes(o)) {
      shadow(sx, sy, 9);
      ctx.fillStyle = '#8a8a7a'; ctx.fillRect(sx - 7, sy - 28, 14, 28);
      ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2; ctx.strokeRect(sx - 7, sy - 28, 14, 28);
      ctx.fillStyle = '#ffd76a'; ctx.fillRect(sx - 1, sy - 22, 2, 12);
      if (o.ping > 0) groundRing(sx, sy, 24 + 3 * Math.sin(state.time * 6), 0.7);
    } else if (npcs.includes(o)) {
      const col = o.kind === 'mira' ? '#c87f3a' : o.kind === 'tove' ? '#4a7a8a' : '#7a8a5a';
      shadow(sx, sy, 11);
      ctx.fillStyle = '#3a2a12';
      ctx.fillRect(sx - 7, sy - 8, 5, 8); ctx.fillRect(sx + 2, sy - 8, 5, 8);
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(sx, sy - 22, 13, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = '#e8dcc0';
      ctx.beginPath(); ctx.arc(sx, sy - 38, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      eyes(sx, sy - 38, 0, 0, 2, 1.6, blink);
      smile(sx, sy - 36, 2.5);
      // a trade prop each: hammer, pole, sword, ghost-glow
      if (o.kind === 'mira') {
        ctx.strokeStyle = '#3a2a12'; ctx.lineWidth = 3; ctx.beginPath();
        ctx.moveTo(sx + 14, sy - 30); ctx.lineTo(sx + 14, sy - 10); ctx.stroke();
        ctx.fillStyle = '#8a8a8a'; ctx.fillRect(sx + 10, sy - 36, 8, 6);
      } else if (o.kind === 'tove') {
        ctx.strokeStyle = '#4a3220'; ctx.lineWidth = 3; ctx.beginPath();
        ctx.moveTo(sx - 15, sy - 44); ctx.lineTo(sx - 15, sy); ctx.stroke();
      } else if (o.kind === 'pike') {
        ctx.strokeStyle = '#dfe9f2'; ctx.lineWidth = 2.5; ctx.beginPath();
        ctx.moveTo(sx + 14, sy - 34); ctx.lineTo(sx + 18, sy - 12); ctx.stroke();
      } else if (o.kind === 'wright') {
        const halo = ctx.createRadialGradient(sx, sy - 24, 2, sx, sy - 24, 30);
        halo.addColorStop(0, 'rgba(200,220,255,0.25)'); halo.addColorStop(1, 'rgba(200,220,255,0)');
        ctx.fillStyle = halo;
        ctx.beginPath(); ctx.arc(sx, sy - 24, 30, 0, Math.PI * 2); ctx.fill();
      }
      if (!o.talked) {
        ctx.font = 'bold 22px Georgia'; ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd76a'; ctx.fillText('!', sx, sy - 52);
      }
    } else if (pickups.includes(o)) {
      shadow(sx, sy, 9);
      ctx.fillStyle = o.kind === 'loot' ? '#ffd76a' : '#7ec850';
      ctx.beginPath(); ctx.arc(sx, sy - 9, 9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#e8f5c0'; ctx.fillRect(sx - 2, sy - 20, 4, 8);
      if (o.ping > 0) groundRing(sx, sy, 22 + 3 * Math.sin(state.time * 6), 0.7);
    } else if (o === raven) {
      shadow(sx, sy, 6);
      const flap = Math.sin(state.time * 18) * 5;
      ctx.fillStyle = '#20242a';
      ctx.beginPath(); ctx.ellipse(sx, sy - 44, 9, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#20242a'; ctx.lineWidth = 3; ctx.beginPath();
      ctx.moveTo(sx - 4, sy - 44); ctx.lineTo(sx - 14, sy - 50 - flap);
      ctx.moveTo(sx + 4, sy - 44); ctx.lineTo(sx + 14, sy - 50 + flap); ctx.stroke();
      ctx.fillStyle = '#ffd76a';
      ctx.beginPath(); ctx.arc(sx + 5, sy - 45, 1.8, 0, Math.PI * 2); ctx.fill();
    } else if (allies.includes(o)) {
      if (state.sel.includes(o)) groundRing(sx, sy, 22, 0.9);
      shadow(sx, sy, 11);
      ctx.fillStyle = '#3a2a12';
      ctx.fillRect(sx - 7, sy - 8, 5, 8); ctx.fillRect(sx + 2, sy - 8, 5, 8);
      ctx.fillStyle = o.color;
      ctx.beginPath(); ctx.arc(sx, sy - 22, 13, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = '#e8dcc0';
      ctx.beginPath(); ctx.arc(sx, sy - 38, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      eyes(sx, sy - 38, 0, 0, 2, 1.6, blink);
      smile(sx, sy - 36, 2.5);
      if (o.hp < o.maxHp) {
        ctx.fillStyle = '#1a1210'; ctx.fillRect(sx - 14, sy - 50, 28, 5);
        ctx.fillStyle = o.hp / o.maxHp > 0.5 ? '#7ec850' : '#e5484d';
        ctx.fillRect(sx - 13, sy - 49, 26 * o.hp / o.maxHp, 3);
      }
    } else if (o === player) {
      if (state.sel.includes(player)) groundRing(sx, sy, 24, 0.9);
      const blinkP = player.iframes > 0 && Math.floor(state.time * 14) % 2 === 0;
      if (blinkP) continue;
      shadow(sx, sy, 12);
      const bob = player.moving ? Math.sin(player.bobPhase) * 2 : 0;
      const [fsx, fsy] = isoFace(Math.cos(player.face), Math.sin(player.face));
      let psx = 1 + Math.sin(state.time * 2.5) * 0.02, psy = psx;
      if (player.swing > 0) { psx *= 1.1; psy *= 1.05; }
      if (player.iframes > 0.7) { psx *= 1.15; psy *= 0.85; }
      ctx.save(); ctx.translate(sx, sy); ctx.scale(psx, psy); ctx.translate(-sx, -sy);
      const legSwing = player.moving ? Math.sin(player.bobPhase) * 3 : 0;
      ctx.fillStyle = '#2a3a4e';
      ctx.fillRect(sx - 7, sy - 6, 5, 6 + legSwing * 0.3);
      ctx.fillRect(sx + 2, sy - 6, 5, 6 - legSwing * 0.3);
      const aStyle = armorStyle();
      if (aStyle.glow) {
        ctx.fillStyle = aStyle.glow;
        ctx.beginPath(); ctx.arc(sx, sy - 20, 26, 0, Math.PI * 2); ctx.fill();
      }
      if (state.skills.shield && state.shieldActive) {
        ctx.strokeStyle = 'rgba(74,144,216,0.8)'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.ellipse(sx, sy, 24, 11, 0, 0, Math.PI * 2); ctx.stroke();
      }
      // rune staff at Kari's side, crystal pulsing blue
      const isoStaffX = sx - 16, isoStaffTop = sy - 62 + bob;
      ctx.strokeStyle = '#4a3220'; ctx.lineWidth = 3; ctx.beginPath();
      ctx.moveTo(isoStaffX, isoStaffTop + 12); ctx.lineTo(isoStaffX, sy - 2); ctx.stroke();
      const icp = staffCrystalPulse() * (player.swing > 0 ? 1.5 : 1);
      ctx.fillStyle = 'rgba(74,144,216,' + (0.3 * icp) + ')';
      ctx.beginPath(); ctx.arc(isoStaffX, isoStaffTop, 9 * icp, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4a90d8';
      ctx.beginPath(); ctx.moveTo(isoStaffX, isoStaffTop - 7); ctx.lineTo(isoStaffX - 5, isoStaffTop); ctx.lineTo(isoStaffX, isoStaffTop + 7); ctx.lineTo(isoStaffX + 5, isoStaffTop); ctx.closePath(); ctx.fill();
      // blue steel cuirass: tapered plate, pauldrons, belt, plate seams
      const robe = ctx.createLinearGradient(0, sy - 42, 0, sy);
      const heroCloak = (player.kind && player.kind !== 'kari') ? (player.color || aStyle.cloak) : aStyle.cloak;
      robe.addColorStop(0, shade(heroCloak, 50)); robe.addColorStop(0.55, heroCloak); robe.addColorStop(1, aStyle.dark);
      ctx.fillStyle = robe;
      ctx.beginPath();
      ctx.moveTo(sx - 10, sy - 42 + bob); ctx.lineTo(sx + 10, sy - 42 + bob);
      ctx.lineTo(sx + 13, sy); ctx.lineTo(sx - 13, sy);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(sx - 4, sy - 40 + bob); ctx.quadraticCurveTo(sx - 6, sy - 20, sx - 5, sy - 6);
      ctx.moveTo(sx + 4, sy - 40 + bob); ctx.quadraticCurveTo(sx + 6, sy - 20, sx + 5, sy - 6);
      ctx.stroke();
      ctx.fillStyle = shade(aStyle.cloak, 40);
      ctx.beginPath(); ctx.arc(sx - 11, sy - 36 + bob, 5, 0, Math.PI * 2); ctx.arc(sx + 11, sy - 36 + bob, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = aStyle.trim;
      ctx.fillRect(sx - 13, sy - 5, 26, 4);
      ctx.fillStyle = '#e8dcc0';
      ctx.beginPath(); ctx.arc(sx, sy - 48 + bob, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = aStyle.cloak;
      ctx.beginPath(); ctx.arc(sx, sy - 50 + bob, 6.5, Math.PI, 0); ctx.fill(); ctx.stroke();
      ctx.fillStyle = aStyle.dark;
      ctx.fillRect(sx - 1, sy - 51 + bob, 2, 5);
      const pblink = (state.time % 3.6) < 0.12;
      eyes(sx, sy - 48 + bob, fsx, fsy, 2.5, 1.8, pblink);
      smile(sx, sy - 45 + bob, 2.5);
      if (player.swing > 0) {
        const a = Math.atan2(fsy, fsx) + Math.sin((0.28 - player.swing) / 0.28 * Math.PI) * 0.9 - 0.45;
        ctx.fillStyle = 'rgba(74,144,216,0.28)';
        ctx.beginPath(); ctx.moveTo(sx, sy - 24);
        ctx.arc(sx, sy - 24, 30, a - 0.5, a + 0.5); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#4a90d8'; ctx.lineWidth = 4; ctx.beginPath();
        ctx.moveTo(sx, sy - 24);
        ctx.lineTo(sx + Math.cos(a) * 30, sy - 24 + Math.sin(a) * 30); ctx.stroke();
        ctx.fillStyle = '#c8e4ff';
        ctx.beginPath(); ctx.arc(sx + Math.cos(a) * 30, sy - 24 + Math.sin(a) * 30, 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    } else if (enemies.includes(o)) {
      const e = o;
      const fx = Math.cos(e.face || 0), fy = Math.sin(e.face || 0);
      const [fsx, fsy] = isoFace(fx, fy);
      const flash = e.flash > 0;
      const br = 1 + Math.sin(state.time * 3 + e.x * 0.05) * 0.03;
      const es = br * (flash ? 1.12 : 1);
      shadow(sx, sy, e.r * 0.8);
      ctx.save(); ctx.translate(sx, sy); ctx.scale(es, es); ctx.translate(-sx, -sy);
      ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2.5;
      if (e.kind === 'king') {
        const krobe = ctx.createLinearGradient(0, sy - 50, 0, sy);
        krobe.addColorStop(0, flash || e.charge > 0 ? '#ff9a9a' : '#7a5a9a');
        krobe.addColorStop(1, flash || e.charge > 0 ? '#c85a5a' : '#3a254a');
        ctx.fillStyle = krobe;
        ctx.beginPath();
        ctx.moveTo(sx - 16, sy - 50); ctx.lineTo(sx + 16, sy - 50);
        ctx.lineTo(sx + 22, sy); ctx.lineTo(sx - 22, sy);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#d8c8b8';
        ctx.beginPath(); ctx.arc(sx, sy - 54, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffd76a';
        ctx.beginPath();
        ctx.moveTo(sx - 10, sy - 60); ctx.lineTo(sx - 5, sy - 70); ctx.lineTo(sx, sy - 62);
        ctx.lineTo(sx + 5, sy - 70); ctx.lineTo(sx + 10, sy - 60);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // crown jewels
        ctx.fillStyle = '#e5484d'; ctx.beginPath(); ctx.arc(sx - 5, sy - 64, 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#4a90d8'; ctx.beginPath(); ctx.arc(sx, sy - 66, 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#7ec850'; ctx.beginPath(); ctx.arc(sx + 5, sy - 64, 1.6, 0, Math.PI * 2); ctx.fill();
        eyes(sx, sy - 54, fsx, fsy, 4, 2.5, blink, '#ff5a5a');
        ctx.strokeStyle = '#2a1e3a'; ctx.lineWidth = 3; ctx.beginPath();
        ctx.moveTo(sx + 20, sy - 6); ctx.lineTo(sx + 24, sy - 48); ctx.stroke();
        ctx.fillStyle = '#b07ad4';
        ctx.beginPath(); ctx.arc(sx + 24, sy - 50, 3 + Math.sin(state.time * 4) * 1, 0, Math.PI * 2); ctx.fill();
      } else if (e.kind === 'wolf') {
        const leg = Math.sin(state.time * 14 + e.x) * 3;
        ctx.fillStyle = flash ? '#dfe9f2' : '#8fa3b8';
        ctx.beginPath(); ctx.ellipse(sx, sy - 10, 16, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(sx + fsx * 14, sy - 16, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        eyes(sx + fsx * 14, sy - 16, fsx, fsy, 3, 2, blink, '#e5484d');
        // fur strokes along the back
        ctx.strokeStyle = flash ? '#dfe9f2' : '#6e8296'; ctx.lineWidth = 1.5; ctx.beginPath();
        ctx.moveTo(sx - 8, sy - 16); ctx.lineTo(sx - 6, sy - 12);
        ctx.moveTo(sx, sy - 18); ctx.lineTo(sx + 2, sy - 13);
        ctx.moveTo(sx + 8, sy - 16); ctx.lineTo(sx + 10, sy - 12);
        ctx.stroke();
        ctx.strokeStyle = flash ? '#dfe9f2' : '#8fa3b8'; ctx.lineWidth = 3; ctx.beginPath();
        ctx.moveTo(sx - fsx * 14, sy - 12); ctx.lineTo(sx - fsx * 20, sy - 16 + Math.sin(state.time * 10 + e.x) * 3);
        ctx.moveTo(sx - 6, sy - 2); ctx.lineTo(sx - 6, sy + 1 + leg);
        ctx.moveTo(sx + 6, sy - 2); ctx.lineTo(sx + 6, sy + 1 - leg); ctx.stroke();
      } else if (e.kind === 'troll') {
        ctx.fillStyle = flash ? '#e8dcc0' : '#6b4a34';
        ctx.beginPath(); ctx.arc(sx, sy - 20, e.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        // belly shading and warts
        ctx.fillStyle = flash ? '#f5e8c8' : '#8a6248';
        ctx.beginPath(); ctx.ellipse(sx, sy - 14, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#4a3220';
        ctx.beginPath(); ctx.arc(sx - 8, sy - 24, 1.8, 0, Math.PI * 2); ctx.arc(sx + 9, sy - 18, 1.8, 0, Math.PI * 2); ctx.arc(sx - 2, sy - 28, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(sx - 18, sy - 16, 8, 0, Math.PI * 2); ctx.arc(sx + 18, sy - 16, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#d8c8b8';
        ctx.beginPath(); ctx.arc(sx, sy - 32, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        eyes(sx, sy - 32, fsx, fsy, 4, 2.5, blink, '#ffd76a');
      } else if (e.kind === 'spider') {
        const sway = Math.sin(state.time * 8 + e.x * 0.05) * 3;
        ctx.strokeStyle = '#2a1240'; ctx.lineWidth = 3;
        for (let leg = 0; leg < 4; leg++) {
          const ly = -18 + leg * 6, bend = (leg % 2 ? 1 : -1) * (4 + sway * 0.4);
          ctx.beginPath(); ctx.moveTo(sx - 8, sy + ly); ctx.lineTo(sx - 20, sy + ly + bend); ctx.lineTo(sx - 26, sy + ly + bend * 2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(sx + 8, sy + ly); ctx.lineTo(sx + 20, sy + ly - bend); ctx.lineTo(sx + 26, sy + ly - bend * 2); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(176,122,212,0.30)';
        ctx.beginPath(); ctx.ellipse(sx, sy - 14, e.r + 6, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = flash ? '#e8d8f5' : '#7a3a9a';
        ctx.beginPath(); ctx.ellipse(sx, sy - 14, e.r, e.r * 0.85, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#b07ad4';
        ctx.beginPath(); ctx.moveTo(sx, sy - 34); ctx.lineTo(sx - 7, sy - 16); ctx.lineTo(sx + 7, sy - 16); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#e8c8ff';
        ctx.beginPath(); ctx.arc(sx - 4, sy - 24, 2.2, 0, Math.PI * 2); ctx.arc(sx + 4, sy - 24, 2.2, 0, Math.PI * 2); ctx.fill();
      } else {
        const col = e.kind === 'drowned' ? '#5a7a72' : e.kind === 'wraith' ? '#7a6a9a' : e.kind === 'brute' ? '#8a4a3a' : e.kind === 'screecher' ? '#c8b86a' : '#6e8f6a';
        const sway = Math.sin(state.time * 6 + e.x * 0.05) * 2;
        ctx.fillStyle = flash ? '#cfe8cf' : col;
        ctx.beginPath(); ctx.arc(sx, sy - 14, e.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = flash ? '#e8f5e8' : (e.kind === 'drowned' ? '#7a9a92' : e.kind === 'wraith' ? '#9a8ab8' : e.kind === 'brute' ? '#a85a48' : e.kind === 'screecher' ? '#d8c878' : '#8aa88a');
        ctx.beginPath(); ctx.arc(sx, sy - 28, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = e.kind === 'drowned' ? 'rgba(122,154,146,0.30)' : 'rgba(138,168,138,0.30)';
        ctx.beginPath(); ctx.arc(sx, sy - 28, 9, 0, Math.PI * 2); ctx.fill();
        eyes(sx, sy - 28, fsx, fsy, 2.5, 1.8, blink);
        ctx.fillStyle = flash ? '#cfe8cf' : col;
        ctx.beginPath(); ctx.arc(sx - e.r * 0.9, sy - 12 + sway, 4, 0, Math.PI * 2); ctx.arc(sx + e.r * 0.9, sy - 12 - sway, 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }
  // drifting mist: atmosphere lying over the scene
  for (let i = 0; i < 3; i++) {
    const fx = ((state.time * (12 + i * 6)) % (canvas.width + 400)) - 200;
    const fy = 180 + i * 110;
    const fog = ctx.createRadialGradient(fx, fy, 10, fx, fy, 190);
    fog.addColorStop(0, 'rgba(220,230,250,0.055)'); fog.addColorStop(1, 'rgba(220,230,250,0)');
    ctx.fillStyle = fog;
    ctx.save(); ctx.translate(fx, fy); ctx.scale(1.9, 0.55); ctx.translate(-fx, -fy);
    ctx.beginPath(); ctx.arc(fx, fy, 190, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  // torchlight in projected space, then particles and floats
  drawLighting();
  for (const pt of particles) {
    const [px, py] = isoProject(pt.x, pt.y);
    ctx.globalAlpha = Math.max(0, pt.t * 2) * (pt.a || 1);
    if (pt.shape === 'star') {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.moveTo(px, py - 5); ctx.lineTo(px + 1.5, py - 1.5); ctx.lineTo(px + 5, py);
      ctx.lineTo(px + 1.5, py + 1.5); ctx.lineTo(px, py + 5); ctx.lineTo(px - 1.5, py + 1.5);
      ctx.lineTo(px - 5, py); ctx.lineTo(px - 1.5, py - 1.5);
      ctx.closePath(); ctx.fill();
    } else {
      ctx.fillStyle = pt.color; ctx.fillRect(px - 2, py - 2, 4, 4);
    }
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  for (const f of floats) {
    const [fx, fy] = isoProject(f.x, f.y);
    const pop = f.t > 0.8 ? 1.35 : 1;
    ctx.font = 'bold ' + Math.round(20 * pop) + 'px Georgia';
    ctx.globalAlpha = Math.min(1, f.t);
    ctx.lineWidth = 4; ctx.strokeStyle = '#1a1210'; ctx.strokeText(f.txt, fx, fy - 30);
    ctx.fillStyle = '#fff'; ctx.fillText(f.txt, fx, fy - 30);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  if (state.fade > 0) {
    ctx.fillStyle = 'rgba(0,0,0,' + (state.fade * 0.7) + ')';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawHud() {
  const portrait = document.getElementById('portrait');
  if (portrait) portrait.textContent = 'ᚱ';
  // 3.8.1: the vision HUD top bar (LVL, HP/MP bars, armor, materials,
  // realm name) used to update only when CMD was toggled, so in 3D play
  // it stayed stuck at its opening values — LVL 1 at the finale, in the
  // 3.8.0 win screenshot. Update it every frame, like the rest of the HUD.
  const _lvl = document.getElementById('lvl'); if (_lvl) _lvl.textContent = 'LVL ' + state.heroLvl;
  const _hp = document.getElementById('hpbar'); if (_hp) _hp.style.width = Math.round(100 * player.hp / player.maxHp) + '%';
  const _mp = document.getElementById('mpbar'); if (_mp) _mp.style.width = '100%';
  const _arm = document.getElementById('armor'); if (_arm) _arm.textContent = ARMOR[state.armorTier].name;
  const _mats = document.getElementById('mats'); if (_mats) _mats.textContent = '◆' + state.materials.crystal + ' ◇' + state.materials.shard + ' · ' + state.skillPoints + ' pts' + (state.sigils > 0 ? ' · ✦' + state.sigils + '/3' : '');
  const _mn = document.getElementById('minimap'); if (_mn) _mn.textContent = LEVELS[state.level].name;
  let h = '';
  for (let i = 0; i < player.maxHp; i++) h += '<span class="' + (i < player.hp ? '' : 'dim') + '">♥</span>';
  document.getElementById('hearts').innerHTML = h;
  const totalBeacons = LEVELS.length - 1;
  const lit = Math.min(state.level, totalBeacons);
  document.getElementById('runes').textContent = '◆'.repeat(lit) + '◇'.repeat(totalBeacons - lit);
  // keys: brass keys carried, shown only while carrying
  document.getElementById('keys').textContent = player.keys > 0 ? 'Key ×' + player.keys : '';
  document.getElementById('viewBtn').textContent = state.iso ? 'ISO' : 'TOP';
  document.getElementById('score').textContent = state.score;
  // party line + command-mode buttons
  document.getElementById('party').textContent = '★ ' + heroName(player.kind || 'kari') + ' ' + player.hp + '/' + player.maxHp + (allies.length ? ' · ' + allies.map((a) => heroName(a.kind) + ' ' + a.hp + '/' + a.maxHp).join(' · ') : '');
  document.getElementById('cmdBtn').textContent = state.cmd ? 'CMD*' : 'CMD';
  document.getElementById('allBtn').style.display = state.cmd ? '' : 'none';
  drawMinimap();
}
function drawMinimap() {
  const mc = document.getElementById('minimapCanvas');
  if (!mc || typeof mc.getContext !== 'function' || !state.grid) return;
  try {
    const m = mc.getContext('2d');
    if (!m) return;
    const cw = mc.width, ch = mc.height, tw = cw / state.cols, th = ch / state.rows;
    m.clearRect(0, 0, cw, ch);
    for (let y = 0; y < state.rows; y++) for (let x = 0; x < state.cols; x++) {
      m.fillStyle = state.grid[y][x] === '#' ? '#141414' : '#44503f';
      m.fillRect(x * tw, y * th, tw + 0.5, th + 0.5);
    }
    const dot = (wx, wy, color, s) => {
      m.fillStyle = color;
      m.fillRect(wx / TILE * tw - s / 2, wy / TILE * th - s / 2, s, s);
    };
    if (beacon) dot(beacon.x, beacon.y, '#ffd76a', 4);
    if (darkBeacon) dot(darkBeacon.x, darkBeacon.y, '#b07ad4', 4);
    for (const n of npcs) dot(n.x, n.y, '#7ec850', 3);
    for (const e of enemies) if (e.hp > 0) dot(e.x, e.y, '#e5484d', 3);
    if (player) dot(player.x, player.y, '#fff8e0', 4);
  } catch (e) { /* a stub canvas in tests: minimap is decoration, never fatal */ }
}

function drawDbg() {
  const el = document.getElementById('dbg');
  if (!state.dbg) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  const v = inputVector();
  el.textContent =
    'v1.9.0 screen=' + state.screen + (state.paused ? ' PAUSED' : '') +
    '\njoy active=' + joy.active + ' x=' + joy.x.toFixed(2) + ' y=' + joy.y.toFixed(2) +
    '\ninput x=' + v.x.toFixed(2) + ' y=' + v.y.toFixed(2) +
    '\nplayer x=' + Math.round(player.x) + ' y=' + Math.round(player.y) + ' hp=' + player.hp +
    '\nlevel=' + state.level + ' enemies=' + enemies.length +
    '\nlast stick event: ' + lastZoneEvent;
}

/* ---------- main loop ---------- */
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  // 3.9.0: standalone title — the body class, not the panel, decides
  // whether the game is visible behind the title screen.
  document.body.classList.toggle('title-screen', state.screen === 'title');
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  if (state.screen === 'play' && !state.paused && player) {
    // hit-stop: a beat of freeze when a blow lands, so hits feel heavy
    if (state.hitStop > 0) state.hitStop -= dt;
    else update(dt);
    if (state.fade > 0) state.fade = Math.max(0, state.fade - dt * 1.2);
  }
  if (state.screen === 'card') { state.cardTimer += dt; }
  if (player) { if (state.iso) drawIso(); else draw(); drawHud(); drawDbg(); }
}
loadLevel(0);
showScreen('title');
requestAnimationFrame(frame);
