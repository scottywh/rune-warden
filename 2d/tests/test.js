/* Rune Warden consolidated test suite (kept in the project so it survives
   restarts): key-aware level connectivity, core play (walk, fight, knockback
   regression, NPC gifts, beacon advance, boss, finale endings), 1.2.0
   features (keys & gates, king dialogue, Spanwright, re-readable runestones,
   decor bans, fade-in, key HUD), and 1.3.0 (cartoon particles, dust, second
   NPC lines, king death line, visions, orphaned stones restored).
   Run: node tests/test.js */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');
const assert = (c, m) => { if (!c) throw new Error('FAIL: ' + m); console.log('ok: ' + m); };

/* ---- Part A: connectivity, keys tracked (gate costs one key, key gives one) ---- */
{
  const LEVELS = eval(src.match(/const LEVELS = (\[[\s\S]*?\n\];)/)[1]);
  for (const L of LEVELS) {
    const grid = L.map.map(r => r.split(''));
    let s = null; const targets = {};
    grid.forEach((row, y) => row.forEach((c, x) => {
      if (c === 'P') s = [x, y];
      if ('BMNRO'.includes(c)) (targets[c] = targets[c] || []).push([x, y]);
    }));
    const reached = new Set(); const seen = new Set(); const q = [[s[0], s[1], 0]];
    while (q.length) {
      const [x, y, k] = q.pop();
      const sk = y + ',' + x + ',' + k;
      if (seen.has(sk)) continue;
      seen.add(sk); reached.add(y + ',' + x);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (ny < 0 || ny >= grid.length || nx < 0 || nx >= grid[0].length) continue;
        const c = grid[ny][nx];
        if (c === '#') continue;
        let nk = k;
        if (c === 'Y') nk = Math.min(4, k + 1);
        if (c === 'G') { if (k <= 0) continue; nk = k - 1; }
        q.push([nx, ny, nk]);
      }
    }
    const bad = Object.entries(targets).flatMap(([c, pts]) =>
      pts.filter(p => !reached.has(p[1] + ',' + p[0])).map(() => c));
    assert(bad.length === 0, L.name + ' targets all reachable' + (bad.length ? ' (cut off: ' + bad.join(',') + ')' : ''));
  }
}

/* ---- Part B: play harness ---- */
const noop = () => {};
function mkEl() {
  return {
    style: {}, textContent: '', innerHTML: '',
    classList: { add: noop, remove: noop, toggle: noop },
    addEventListener: noop, setPointerCapture: noop, click: noop,
  };
}
const els = {};
const ctxStub = new Proxy({}, {
  get(t, p) {
    if (p === 'createLinearGradient' || p === 'createRadialGradient') return () => ({ addColorStop: noop });
    if (typeof p === 'string') return noop;
    return undefined;
  },
  set() { return true; },
});
global.document = {
  getElementById: (id) => {
    if (!els[id]) {
      els[id] = mkEl();
      if (id === 'game') { els[id].width = 960; els[id].height = 576; els[id].getContext = () => ctxStub; }
    }
    return els[id];
  },
  addEventListener: noop,
  hidden: false,
};
global.window = { addEventListener: noop };
global.localStorage = { _m: {}, getItem(k) { return this._m[k] ?? null; }, setItem(k, v) { this._m[k] = v; } };
global.performance = { now: () => 0 };
global.requestAnimationFrame = noop;

const test = `
;(function () {
  const assert = (c, m) => { if (!c) throw new Error('FAIL: ' + m); console.log('ok: ' + m); };
  const goBeacon = () => { player.x = beacon.x; player.y = beacon.y; update(0.016); };

  // every level parses to a uniform 20x12 room with a beacon; HUD never throws
  for (let i = 0; i < 6; i++) {
    loadLevel(i);
    assert(state.cols === 20 && state.rows === 12, LEVELS[i].name + ' is 20x12');
    assert(beacon, LEVELS[i].name + ' has a beacon');
    assert(runestones.length === (LEVELS[i].runes || []).length, LEVELS[i].name + ' has a stone for every rune line (no orphaned lines)');
    drawHud();
  }
  assert(darkBeacon, 'finale has a dark beacon');
  assert(LEVELS[4].boss && LEVELS[5].finale, 'boss + finale flags set');

  startRun(); advanceCard();
  assert(state.screen === 'play' && state.level === 0, 'startRun -> play level 0');
  assert(state.fade === 1, 'advanceCard sets fade-in');

  // simulated 3D: default view is isometric, projection fits the canvas, toggle works, both renderers run
  assert(state.iso === true, 'simulated-3D view is the default');
  const c00 = isoProject(0, 0), c10 = isoProject(960, 0), c01 = isoProject(0, 576), c11 = isoProject(960, 576);
  const cc = isoProject(480, 288);
  assert(cc[0] === 480 && cc[1] === 300, 'room center projects to screen center');
  for (const [px, py] of [c00, c10, c01, c11]) assert(px >= 0 && px <= 960 && py >= 0 && py <= 576, 'room corners project inside the canvas');
  toggleView();
  assert(state.iso === false, 'view toggle switches to top-down');
  toggleView();
  assert(state.iso === true, 'view toggle switches back to simulated 3D');
  drawHud();
  assert(els['viewBtn'].textContent === 'ISO', 'HUD shows the current view');
  drawIso(); draw(); // both renderers run without throwing
  assert(shade('#000000', 10) === 'rgb(10,10,10)' && shade('#ffffff', -10) === 'rgb(245,245,245)', 'shade helper lightens and darkens');

  // walk right, survive, fight a draugr
  const startX = player.x;
  keys['d'] = true;
  for (let i = 0; i < 200; i++) update(0.016);
  keys['d'] = false;
  assert(player.x > startX && player.hp >= 1, 'player moved right and survived');
  assert(particles.some((p) => p.color === '#c8b898'), 'running kicks up dust');
  let e = enemies[0];
  player.x = e.x - 30; player.y = e.y; player.face = 0;
  attack(); update(0.016);
  assert(e.hp === 1, 'sword hit lands (draugr 2 -> 1)');
  for (let i = 0; i < 20; i++) update(0.016); // let the swing finish
  player.x = e.x - 30; player.y = e.y; player.face = 0;
  attack(); update(0.016);
  assert(!enemies.includes(e) && state.score >= 10, 'draugr dies, score rises');
  assert(particles.some((p) => p.shape === 'star'), 'hits burst into cartoon stars');

  // knockback regression (1.0.4): a player shoved inside the left wall is freed
  player.x = 38; player.y = 64;
  update(0.016);
  assert(!collides(player.x, player.y, player.r), 'unstick frees a wall-trapped player');
  keys['d'] = true;
  for (let i = 0; i < 10; i++) update(0.016);
  keys['d'] = false;
  assert(player.x > 38, 'freed player walks right again');

  // NPC gifts: Mira sharpens, Tove marks, Pike mends
  loadLevel(1);
  let mira = npcs[0];
  player.dmg = 1; player.x = mira.x; player.y = mira.y;
  update(0.016);
  assert(mira.talked && player.dmg === 2, 'Mira sharpens the sword');
  loadLevel(2);
  let tove = npcs[0];
  player.x = tove.x; player.y = tove.y;
  update(0.016);
  assert(tove.talked && beacon.marked, 'Tove marks the beacon');
  loadLevel(3);
  let pike = npcs[0];
  const mh = player.maxHp;
  player.x = pike.x; player.y = pike.y;
  update(0.016);
  assert(pike.talked && player.maxHp === mh + 1 && player.hp === player.maxHp, 'Pike grants a heart');
  pike.cool = 0;
  update(0.016);
  assert(els['banner'].textContent.includes('noisy one'), 'Pike has a second line on the next talk');

  // runestones re-read (never consumed)
  loadLevel(2);
  const stone2 = runestones[0];
  player.x = stone2.x; player.y = stone2.y;
  update(0.016);
  assert(stone2.cool > 0 && runestones.includes(stone2), 'runestone reads and stays');
  stone2.cool = 0.01;
  update(0.016);
  assert(stone2.cool > 4, 'runestone re-reads after cooldown');

  // beacon advance through the realms
  startRun(); advanceCard();
  goBeacon(); advanceCard();
  assert(state.level === 1, 'beacon advances to Frostfall');
  goBeacon(); advanceCard();
  assert(state.level === 2, 'beacon advances to Drowned Road');
  goBeacon(); advanceCard();
  assert(state.level === 3, 'beacon advances to Cinder Wastes');

  // Cinder: key pickup, locked gate, keyed gate
  assert(gates.length === 1 && pickups.some((p) => p.kind === 'key'), 'Cinder has one gate and one key');
  const key = pickups.find((p) => p.kind === 'key');
  player.keys = 0;
  player.x = key.x; player.y = key.y;
  update(0.016);
  assert(player.keys === 1 && !pickups.find((p) => p.kind === 'key'), 'key pickup gives a key');
  drawHud();
  assert(els['keys'].textContent === 'Key ×1', 'HUD shows carried key');
  const g = gates[0];
  player.keys = 0;
  player.x = g.x; player.y = g.y;
  update(0.016);
  assert(!g.open && g.cool > 0, 'gate stays locked without a key');
  player.keys = 1;
  update(0.016);
  assert(g.open && player.keys === 0 && state.grid[g.ty][g.tx] === '.', 'key opens the gate, key spent, tile clears');

  goBeacon(); advanceCard();
  assert(state.level === 4, 'beacon advances to Hollow Hall');

  // the king answers back at half health, and killing him does NOT end the game
  const king = enemies.find((en) => en.kind === 'king');
  assert(king, 'Hollow Hall has its king');
  king.hp = 7;
  damageEnemy(king, 1);
  assert(king.hp === 6 && king.spoken && els['banner'].textContent.includes('She always believed'), 'king speaks at half health');
  damageEnemy(king, 6);
  update(0.016); // removal filter runs in update
  assert(!enemies.includes(king) && state.screen === 'play' && state.level === 4, 'king falls, game continues');
  assert(els['banner'].textContent.includes('winter held'), 'king leaves a dying line');
  goBeacon(); advanceCard();
  assert(state.level === 5, 'beacon advances to the finale');

  // finale: the Spanwright mends, both endings work
  const wright = npcs.find((n) => n.kind === 'wright');
  assert(wright, 'Spanwright waits at the finale');
  player.hp = 2;
  player.x = wright.x; player.y = wright.y;
  update(0.016);
  assert(wright.talked && player.hp === player.maxHp && floats.some((f) => f.txt === 'MENDED'), 'Spanwright mends fully');
  const fstone = runestones[0];
  assert(fstone && fstone.txt.includes('Span can be mended'), 'finale Yrsa stone present');
  assert(LEVELS[5].runes.length === 3, 'Bjarni and the first keeper get their marks at the finale');
  player.x = beacon.x; player.y = beacon.y;
  update(0.016);
  assert(state.screen === 'win' && els['screen'].innerHTML.includes('Span is relit'), 'light ending relights the Span');
  state.screen = 'play';
  player.x = darkBeacon.x; player.y = darkBeacon.y;
  update(0.016);
  assert(state.screen === 'win' && els['screen'].innerHTML.includes('Span stays dark'), 'dark ending lets it rest');

  // decor never lands on entity tiles
  loadLevel(0);
  assert(state.decorBan.has('1,1') && state.decorBan.has('13,1'), 'decor banned on spawn and mead tiles');

  // visions ride into the next realm's card
  showCard(1);
  assert(els['screen'].innerHTML.includes('another light answers'), 'Emberwood vision appears on the Frostfall card');
  // command mode: folk met in command mode join, orders move units,
  // foes chase the nearest party member, beacons revive the fallen
  loadLevel(1); // Frostfall: Mira waits here
  state.cmd = true; state.sel = [];
  const miraNpc = npcs.find((n) => n.kind === 'mira');
  assert(miraNpc, 'Mira waits in Frostfall');
  player.x = miraNpc.x; player.y = miraNpc.y;
  update(0.016);
  assert(miraNpc.talked && allies.find((a) => a.kind === 'mira'), 'Mira joins the party in command mode');
  const miraAlly = allies.find((a) => a.kind === 'mira');
  assert(miraAlly.hp === 4 && miraAlly.dmg === 2, 'Mira marches with her own stats');
  // an order moves the ordered unit (open grid, so walls cannot hide it)
  state.grid = Array.from({ length: 12 }, () => Array(20).fill('.'));
  state.cols = 20; state.rows = 12;
  miraAlly.x = 100; miraAlly.y = 100; miraAlly.order = null;
  state.sel = [miraAlly];
  orderSelected(300, 100, null);
  assert(miraAlly.order && miraAlly.order.type === 'move', 'move order lands on the selected hero');
  for (let i = 0; i < 10; i++) update(0.1);
  assert(miraAlly.x > 150, 'ordered hero walks toward the order');
  // foes chase the nearest party member, not always Kari
  assert(enemies.length > 0, 'Frostfall has foes');
  const foe = enemies[0];
  foe.x = miraAlly.x + 40; foe.y = miraAlly.y; foe.vx = 0; foe.vy = 0;
  player.x = miraAlly.x + 100; player.y = miraAlly.y;
  const fx0 = foe.x;
  update(0.1);
  assert(foe.x < fx0, 'foe closes on the nearer ally instead of Kari');
  // a fallen ally waits for a beacon, then marches again at half hearts
  allies = allies.filter((a) => a !== miraAlly);
  state.deadAllies = ['mira'];
  reachBeacon();
  const back = allies.find((a) => a.kind === 'mira');
  assert(back && back.hp === 2 && state.deadAllies.length === 0, 'beacon revives the fallen at half hearts');
  // command mode off: the party stands down, solo play untouched
  state.cmd = true; toggleCmd();
  assert(!state.cmd && allies.length === 0, 'toggling command off stands the party down');
  state.cmd = false; toggleCmd();
  assert(state.cmd && allies.find((a) => a.kind === 'mira'), 'toggling command on brings met folk back');
  state.cmd = false; allies = []; state.sel = []; state.met = {}; state.deadAllies = []; state.allyHp = {};

  // vision-track 1.7.0: skills, armor, anvil, spider, panels, vision HUD
  startRun(); advanceCard();
  assert(state.heroLvl === 1 && state.skillPoints === 0 && state.armorTier === 0, 'vision run starts at LVL 1, 0 points, Tier 1 armor');
  assert(state.materials.crystal === 0 && state.materials.shard === 0, 'vision run starts with no materials');
  goBeacon(); advanceCard();
  assert(state.heroLvl === 2 && state.skillPoints === 1, 'beacon gives a level and a skill point');
  assert(state.materials.crystal === 1 && state.materials.shard === 1, 'beacon gives crystal + shard');
  const dmg0 = player.dmg;
  unlockSkill('blade');
  assert(state.skills.blade && player.dmg === dmg0 + 1 && state.skillPoints === 0, 'Rune Blade unlocks and raises damage');
  forgeArmor();
  assert(state.armorTier === 0, 'anvil refuses a forge without enough shards');
  state.materials.shard = 2; const hp0 = player.maxHp;
  forgeArmor();
  assert(state.armorTier === 1 && player.maxHp === hp0 + 2, 'Sentinel Obsidian Plate forges and adds hearts');
  state.skillPoints = 1; unlockSkill('shield');
  assert(state.skills.shield && state.shieldActive, 'Rune Shield II unlocks with a live shield');
  const hpBefore = player.hp; player.iframes = 0;
  hurtPlayer(2, player.x, player.y);
  assert(player.hp === hpBefore && !state.shieldActive, 'shield absorbs the next hit');
  loadLevel(5);
  const spider = enemies.find((en) => en.kind === 'spider');
  assert(spider && spider.hp === 8 && spider.score === 250, 'finale has a Crystal Spider, hp 8, score 250');
  openPanel('skills');
  assert(state.screen === 'panel', 'skills panel opens and pauses play');
  closePanel();
  assert(state.screen === 'play', 'panel closes back to play');
  drawHud();
  assert(els['lvl'].textContent.includes('LVL'), 'vision HUD shows LVL');
  assert(els['armor'].textContent.includes('Obsidian') || els['armor'].textContent.includes('Runic'), 'vision HUD shows armor tier');

  // graphics pass 1.8.0: armor look follows the tier, torches exist, minimap runs, both renderers run with the new art
  state.armorTier = 0;
  assert(armorStyle().cloak === '#5a7a9a', 'Tier 1 Kari is blue steel (1.9.0 vision hero, not the old gold cloak)');
  state.armorTier = 1;
  assert(armorStyle().cloak === '#3a3a4e' && armorStyle().trim === '#ffd76a', 'Tier 2 Kari wears obsidian plate with gold trim');
  state.armorTier = 2;
  assert(armorStyle().glow, 'Tier 3 Kari glows aether teal');
  state.armorTier = 0;
  loadLevel(0);
  let torches = 0;
  for (let y = 0; y < state.rows; y++) for (let x = 0; x < state.cols; x++) if (isTorchTile(x, y)) torches++;
  assert(torches > 0, 'Emberwood has wall torches (' + torches + ')');
  drawMinimap();
  assert(els['minimapCanvas'], 'minimap canvas is wired into the HUD');
  drawIso(); draw();
  assert(true, 'both renderers run with 1.8.0 art without throwing');

  // vision hero 1.9.0: blue steel base, staff pulse exists, both renderers run with the new hero
  state.armorTier = 0;
  assert(armorStyle().cloak === '#5a7a9a', 'Tier 1 Kari is blue steel, not a gold robe');
  assert(typeof staffCrystalPulse() === 'number' && staffCrystalPulse() > 0, 'rune staff crystal pulses');
  assert(els['portrait'], 'vision HUD has a Kari portrait');
  drawIso(); draw();
  assert(true, 'both renderers run with the 1.9.0 vision hero without throwing');

  console.log('ALL TESTS PASSED');
})();
`;
eval(src + test);
