/* Rune Warden: 3D renderer spike.
   Loads AFTER game.js and changes nothing in it. It reads the live simulation
   (player, enemies, allies, npcs, pickups, beacon, state.grid ...) and draws it
   with Three.js. The sim keeps its 2D plane: sim (x, y) -> world (x/TILE, z=y/TILE),
   one tile = one world unit, y is up.
   Hooks (all reassigned globals, game.js is untouched):
     draw / drawIso   -> render3D
     inputVector      -> camera-relative movement
   Everything is procedural: no model files, no texture files. */
(function () {
  'use strict';
  if (typeof THREE === 'undefined') { console.warn('render3d: THREE missing'); return; }
  const T = THREE;
  const U = 1 / TILE; // sim pixels -> world units

  /* ---------- renderer, scene, camera ---------- */
  const c3 = document.getElementById('view3d');
  const renderer = new T.WebGLRenderer({ canvas: c3, antialias: true, powerPreference: 'high-performance' });
  // 3.0.1 perf: cap DPR at 1.25 — 1.5x on a phone panel was the single biggest
  // fill-rate cost, and it bought almost nothing visible at this scale.
  const DPR = Math.min(window.devicePixelRatio || 1, 1.25);
  renderer.setPixelRatio(DPR);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25; // 3.3.1: middle ground — 1.35 washed torches out, 1.15 left the dungeon too dark

  const scene = new T.Scene();
  scene.background = new T.Color(0x070b12);
  scene.fog = new T.FogExp2(0x070b12, 0.045);
  const cam = new T.PerspectiveCamera(46, 16 / 9, 0.1, 80);

  const R3 = { enabled: true, mode: 'chase', yaw: Math.PI / 2 + 0.6, pitch: 0.95, dist: 9.5, lastDraw: 0 };
  window.RW3D = R3;

  /* ---------- 3.5.0: real Kari — KayKit Mage (CC0), loaded once, r128 stack ---------- */
  // Sluggishness guard: only ONE hero model is loaded (Mage, not Knight),
  // and it is loaded once for the whole session, not per realm. The
  // primitive buildKari stays as the fallback until it arrives, and
  // forever after if loading fails, so a model failure never breaks play.
  let kariGLTF = null, kariMixer = null, kariPlaying = null, kariLoadTried = false;
  // 3.4.1: 3.4.0 swallowed the load error, so a failed load looked exactly
  // like "old Kari" with no clue why. The status line on the title screen
  // now says which Kari is actually in use, and why, if it is the fallback.
  function kariStatus(t) {
    const el = document.getElementById('kariStatus');
    if (el) el.textContent = t;
    const best = document.getElementById('best');
    if (best) best.textContent = t;
    window.KARI_STATUS = t;
  }
  // 3.4.2: the 3.4.1 status line sat below the vision image, so it was
  // easy to tap Begin without ever seeing it. Show the same status as a
  // banner once play starts, where it cannot be missed.
  function kariBanner() {
    const el = document.getElementById('banner');
    if (!el || !window.KARI_STATUS) return;
    el.textContent = window.KARI_STATUS; el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 6000);
  }
  for (const id of ['playBtn', 'continueBtn', 'newBtn']) {
    const b = document.getElementById(id);
    if (b) b.addEventListener('click', () => setTimeout(kariBanner, 900));
  }
  function kariPlay(name) {
    if (!kariGLTF || !kariMixer) return;
    const clip = kariGLTF.animations.find((c) => c.name === name) || kariGLTF.animations.find((c) => c.name === 'Idle');
    if (!clip || kariPlaying === clip.name) return;
    kariMixer.stopAllAction();
    const a = kariMixer.clipAction(clip); a.loop = T.LoopRepeat; a.play(); kariPlaying = clip.name;
  }
  function loadKariModel() {
    // 3.5.0: this is now the proof's exact stack — Three r128 + its UMD
    // GLTFLoader, the combination already proven on this phone in the
    // model proof. The r149 loader attempts (3.4.0–3.4.2) never produced
    // the real Kari on device, for a reason still not identified, so
    // stop guessing at the r149 loader and use the stack that worked.
    if (kariLoadTried || typeof T.GLTFLoader === 'undefined') { kariStatus('Kari model: FALLBACK primitive — no GLTFLoader'); return; }
    kariLoadTried = true;
    kariStatus('Kari model: loading Mage…');
    try {
      new T.GLTFLoader().load('models/mage.glb', (gltf) => {
        const root = gltf.scene;
        const box = new T.Box3().setFromObject(root);
        const sc = 1.9 / Math.max(0.1, box.max.y - box.min.y);
        root.scale.setScalar(sc);
        root.position.y = -box.min.y * sc; // feet at 0, as in the proof
        root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } });
        kariGLTF = { root, animations: gltf.animations };
        kariMixer = new T.AnimationMixer(root);
        kariStatus('Kari model: REAL Mage loaded (' + gltf.animations.length + ' clips)');
      }, undefined, (err) => { kariStatus('Kari model: FALLBACK primitive — load failed: ' + (err && err.message ? err.message : err)); });
    } catch (e) { kariStatus('Kari model: FALLBACK primitive — threw: ' + e.message); }
  }
  loadKariModel();

  /* ---------- 3.7.0: real party + enemy models (KayKit, CC0) ---------- */
  // Same r128 stack as Kari. Templates load lazily, once per file, and
  // are cloned per entity with SkeletonUtils (skinned meshes need it —
  // a plain clone() would share the skeleton and all copies would move
  // as one). Allies are one-per-file, so no clone sharing issues there;
  // enemies clone the same template for every foe of that kind.
  const GLTF_FILES = {
    knight: 'models/knight.glb', barbarian: 'models/barbarian.glb', rogue: 'models/rogue.glb',
    skeleton_minion: 'models/skeleton_minion.glb', skeleton_warrior: 'models/skeleton_warrior.glb',
    skeleton_mage: 'models/skeleton_mage.glb', // 3.12.0: the unused rogue skeleton is shrunk out (full copy in backup)
    rogue_hooded: 'models/rogue_hooded.glb', // 4.0.2: Eira (was the wraith in 4.0.0)
    skeleton_rogue: 'models/skeleton_rogue.glb', // 4.0.2: wraith (shrunk, 12 clips)
  };
  const gltfTemplates = {}, gltfLoading = {};
  function loadGLTFTemplate(key, cb) {
    if (gltfTemplates[key]) { cb(gltfTemplates[key]); return; }
    if (gltfLoading[key]) { gltfLoading[key].push(cb); return; }
    gltfLoading[key] = [cb];
    if (typeof T.GLTFLoader === 'undefined' || typeof T.SkeletonUtils === 'undefined') { gltfLoading[key] = []; return; }
    new T.GLTFLoader().load(GLTF_FILES[key], (gltf) => {
      gltfTemplates[key] = gltf; const cbs = gltfLoading[key]; gltfLoading[key] = [];
      cbs.forEach((f) => f(gltf));
    }, undefined, () => { gltfLoading[key] = []; });
  }
  function makeRealModel(key, scaleTo, scaleMul) {
    const g = new T.Group(); const model = { g, kind: 'real', real: true, mixer: null, anims: null, playing: null };
    loadGLTFTemplate(key, (gltf) => {
      const clone = T.SkeletonUtils.clone(gltf.scene);
      const box = new T.Box3().setFromObject(clone);
      const sc = (scaleTo / Math.max(0.1, box.max.y - box.min.y)) * (scaleMul || 1);
      clone.scale.setScalar(sc); clone.position.y = -box.min.y * sc;
      clone.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } });
      g.add(clone); model.mixer = new T.AnimationMixer(clone); model.anims = gltf.animations;
    });
    return model;
  }
  function realPlay(model, name) {
    if (!model.mixer || !model.anims) return;
    const clip = model.anims.find((c) => c.name === name) || model.anims.find((c) => c.name === 'Idle');
    if (!clip || model.playing === clip.name) return;
    model.mixer.stopAllAction(); const a = model.mixer.clipAction(clip); a.loop = T.LoopRepeat; a.play(); model.playing = clip.name;
  }
  const allyModelKey = (a) => a.kind === 'mira' ? 'knight' : a.kind === 'tove' ? 'rogue' : a.kind === 'pike' ? 'barbarian' : a.kind === 'eira' ? 'rogue_hooded' : null;
  const enemyModelKey = (e) => e.kind === 'draugr' ? 'skeleton_minion' : e.kind === 'drowned' ? 'skeleton_mage' : e.kind === 'troll' ? 'skeleton_warrior' : e.kind === 'brute' ? 'skeleton_warrior' : e.kind === 'wraith' ? 'skeleton_rogue' : null;
  const npcModelKey = (n) => n.kind === 'mira' ? 'knight' : n.kind === 'tove' ? 'rogue' : n.kind === 'pike' ? 'barbarian' : n.kind === 'eira' ? 'rogue_hooded' : null;

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    cam.aspect = w / h; cam.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize); resize();

  /* ---------- small helpers ---------- */
  const mats = {};
  function std(color, o) {
    o = o || {};
    return new T.MeshStandardMaterial(Object.assign({ color, roughness: 0.92, metalness: 0.0 }, o));
  }
  const toonGrad = (function () {
    const d = new Uint8Array([70, 70, 70, 255, 150, 150, 150, 255, 255, 255, 255, 255]);
    const t = new T.DataTexture(d, 3, 1, T.RGBAFormat); t.minFilter = t.magFilter = T.NearestFilter; t.needsUpdate = true; return t;
  })();
  function toon(color, o) { return new T.MeshToonMaterial(Object.assign({ color, gradientMap: toonGrad }, o || {})); }
  function glowMat(color) { return new T.MeshBasicMaterial({ color }); }
  function mesh(geo, mat, x, y, z, cast) {
    const m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0);
    if (cast !== false) m.castShadow = true;
    return m;
  }
  // 3.1.0: higher-poly geometry — spheres/cylinders/tori with roughly
  // twice the segments, so armor and faces stop looking faceted up close.
  // This is cheap on a phone GPU; the old low segment counts were a size-era choice.
  const G = {
    box: new T.BoxGeometry(1, 1, 1),
    sph: new T.SphereGeometry(1, 24, 18),
    cyl: new T.CylinderGeometry(1, 1, 1, 20),
    cone: new T.ConeGeometry(1, 1, 16),
    oct: new T.OctahedronGeometry(1),
    ico: new T.IcosahedronGeometry(1, 0),
    tor: new T.TorusGeometry(1, 0.08, 8, 40),
    taper: new T.CylinderGeometry(0.55, 1, 1, 20),
  };
  const WH = 2.6; // wall block height; cutaway sinks the block instead of squashing it
  const wallGeo = new T.BoxGeometry(1, WH, 1);
  (function () { const uv = wallGeo.attributes.uv; for (const i of [0, 1, 2, 3, 4, 5, 6, 7, 16, 17, 18, 19, 20, 21, 22, 23]) uv.setY(i, uv.getY(i) * WH); uv.needsUpdate = true; })();
  function stoneTint(hex, k) { // keep the realm's hue but let the stone read as stone
    const t = new T.Color(hex); const m = Math.max(t.r, t.g, t.b) || 1; t.multiplyScalar(1 / m);
    t.lerp(new T.Color(0.8, 0.8, 0.8), 0.5); return t.multiplyScalar(k);
  }
  function sc(m, x, y, z) { m.scale.set(x, y === undefined ? x : y, z === undefined ? x : z); return m; }
  function hashN(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }

  // canvas textures
  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 4; return t;
  }
  // 3.1.0: canvas fallback textures at 512px, with rows/blocks scaled to the
  // canvas size (the old 256px slab layout is kept as the fallback, not the look).
  function slabs(g, w, h, paint) {
    const rows = [0, Math.round(h * 0.335), Math.round(h * 0.67), h];
    for (let r = 0; r < 3; r++) {
      let x = (r % 2) * (w * 0.16) - w * 0.08;
      while (x < w) {
        const bw = w * 0.27 + Math.floor(hashN(x, r) * w * 0.2);
        paint(x + w * 0.016, rows[r] + h * 0.016, bw - w * 0.032, rows[r + 1] - rows[r] - h * 0.032, hashN(r, x));
        x += bw;
      }
    }
  }
  const stoneTex = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#4a4c52'; g.fillRect(0, 0, w, h);               // mortar
    slabs(g, w, h, (x, y, bw, bh, j) => {
      const tone = 150 + Math.floor(j * 40);
      g.fillStyle = 'rgb(' + tone + ',' + (tone + 1) + ',' + (tone + 4) + ')'; g.fillRect(x, y, bw, bh);
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x, y, bw, h * 0.024);        // lit top edge
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x, y + bh - h * 0.032, bw, h * 0.032);     // shaded lower edge
      for (let i = 0; i < 60; i++) { g.fillStyle = i % 2 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.05)'; g.fillRect(x + Math.random() * bw, y + Math.random() * bh, 3 + Math.random() * 10, 3 + Math.random() * 4); }
      for (let i = 0; i < 12; i++) { g.fillStyle = 'rgba(90,110,70,0.10)'; g.fillRect(x + Math.random() * bw, y + Math.random() * bh, 6 + Math.random() * 14, 4); } // moss flecks
    });
    g.strokeStyle = 'rgba(0,0,0,0.30)'; g.lineWidth = 2;
    for (let i = 0; i < 8; i++) { let x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (Math.random() - 0.5) * 44; y += (Math.random() - 0.3) * 32; g.lineTo(x, y); } g.stroke(); }
  });
  const heightTex = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    g.filter = 'blur(6px)'; g.fillStyle = '#fff';
    slabs(g, w, h, (x, y, bw, bh) => g.fillRect(x, y, bw, bh));
  });
  // 3.1.0 painted textures: generated stone/wood images, tiled with a mirrored
  // 2x2 pattern so the tile edges are seamless. Shared materials are swapped
  // to the painted map the moment it loads; until then the canvas fallback runs.
  // If an image fails to load (offline asset, WebView path), the fallback stays.
  function mirroredTileTex(img) {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024;
    const g = c.getContext('2d'), S = 512;
    g.drawImage(img, 0, 0, S, S);
    g.save(); g.translate(1024, 0); g.scale(-1, 1); g.drawImage(img, 0, 0, S, S); g.restore();
    g.save(); g.translate(0, 1024); g.scale(1, -1); g.drawImage(img, 0, 0, S, S); g.restore();
    g.save(); g.translate(1024, 1024); g.scale(-1, -1); g.drawImage(img, 0, 0, S, S); g.restore();
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8; return t;
  }
  function loadPainted(src, apply) {
    try {
      const img = new Image();
      img.onload = () => { try { apply(mirroredTileTex(img)); } catch (e) {} };
      img.onerror = () => {};
      img.src = src;
    } catch (e) {}
  }
  const wallMat = std(0xffffff, { map: stoneTex, bumpMap: heightTex, bumpScale: 1.1, roughness: 0.95 });
  const floorMat = std(0xffffff, { map: stoneTex, bumpMap: heightTex, bumpScale: 0.9, roughness: 0.9 });
  const woodMat = std(0x7a5226, { roughness: 0.85 });
  loadPainted('stone-wall.jpg', (t) => { wallMat.map = t; wallMat.needsUpdate = true; });
  loadPainted('stone-floor.jpg', (t) => { floorMat.map = t; floorMat.needsUpdate = true; });
  loadPainted('wood-planks.jpg', (t) => { woodMat.map = t; woodMat.color.set(0xffffff); woodMat.needsUpdate = true; });
  const glowTex = canvasTex(64, 64, (g, w, h) => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  const beamTex = canvasTex(8, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,1)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  const runeTex = canvasTex(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#ffe9a0'; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(44, 16); g.lineTo(44, 112); g.moveTo(44, 38); g.lineTo(88, 66); g.lineTo(44, 94); g.stroke();
  });
  const markTex = canvasTex(64, 64, (g, w, h) => {
    g.font = 'bold 56px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 8; g.strokeStyle = '#1a1210'; g.strokeText('!', 32, 34);
    g.fillStyle = '#ffd76a'; g.fillText('!', 32, 34);
  });
  function glowSprite(color, size, opacity) {
    const s = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: opacity === undefined ? 1 : opacity, blending: T.AdditiveBlending, depthWrite: false }));
    s.scale.set(size, size, 1); return s;
  }

  /* ---------- lights ---------- */
  // 3.3.0 diagnosis: the dungeon was lit by a flat cool wash — hemi ~0.7
  // plus a cool-blue directional ~0.6 everywhere — while the warm torch
  // point lights were only ~2.6-3.2 with decay 2, so at 2m they read ~0.7.
  // Torches could never win against that wash. Now the flat lights are cut
  // by about two thirds, and the warm point lights are boosted 2-3x with
  // tighter distances, so light actually pools around torches, Kari and the
  // beacon, and corners go dark the way a torchlit dungeon should.
  const hemi = new T.HemisphereLight(0x9a8a7a, 0x1a1410, 0.50); scene.add(hemi);
  const moon = new T.DirectionalLight(0x8a9ac8, 0.50);
  moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); moon.shadow.bias = -0.0008;
  const sh = moon.shadow.camera; sh.left = -9; sh.right = 9; sh.top = 9; sh.bottom = -9; sh.near = 1; sh.far = 40;
  scene.add(moon); scene.add(moon.target);
  const lantern = new T.PointLight(0xffb866, 3.0, 9, 2); scene.add(lantern);
  const beaconLight = new T.PointLight(0xffc860, 5.0, 12, 2); scene.add(beaconLight);
  const torchPool = [0, 1, 2, 3].map(() => { const l = new T.PointLight(0xff9a40, 5.0, 6.5, 2); scene.add(l); return l; });

  /* ---------- level geometry (rebuilt when the sim loads a new grid) ---------- */
  let built = null;            // the state.grid we built for
  let levelGroup = null;
  let wallInst = null, wallData = [];
  let torches = [];
  let chestModels = []; // 3.6.0: decor chests, so looted ones can hide
  // 3.0.1 perf: pulse/water objects tracked at build time, instead of
  // scanning every levelGroup child every frame in syncEntities.
  let pulseObjs = [], waterObjs = [];
  const dummy = new T.Object3D();
  const col = new T.Color();

  function disposeGroup(g) {
    g.traverse((o) => { if (o.geometry && !Object.values(G).includes(o.geometry)) o.geometry.dispose(); });
  }

  function lighten(hex, k) { col.set(hex); col.multiplyScalar(k); return col.clone(); }

  function tree(x, z) {
    const g = new T.Group(); const s = 0.85 + hashN(x, z) * 0.55;
    const trunk = mesh(G.cyl, toon(0x4a3220), 0, 0.18 * s, 0); sc(trunk, 0.08 * s, 0.36 * s, 0.08 * s); g.add(trunk);
    const cols = [0x14472d, 0x1c6040, 0x257a50];
    for (let i = 0; i < 3; i++) {
      const c = mesh(G.cone, toon(cols[i]), 0, (0.55 + i * 0.42) * s, 0); sc(c, (0.62 - i * 0.14) * s, 0.78 * s, (0.62 - i * 0.14) * s); g.add(c);
    }
    g.rotation.y = hashN(z, x) * 6.28; return g;
  }
  function crystalCluster(x, z, bright) {
    const g = new T.Group();
    const m = new T.MeshStandardMaterial({ color: 0x7ac8e8, emissive: 0x2a8ab8, emissiveIntensity: 0.9, roughness: 0.25, metalness: 0.1, flatShading: true });
    for (let i = 0; i < 4; i++) {
      const c = mesh(G.oct, m, (hashN(x + i, z) - 0.5) * 0.32, 0, (hashN(x, z + i) - 0.5) * 0.32);
      const h = 0.35 + hashN(i, x + z) * 0.55; sc(c, 0.11, h, 0.11); c.position.y = h * 0.9;
      c.rotation.z = (hashN(i, z) - 0.5) * 0.5; g.add(c);
    }
    const gl = glowSprite(0x6ad0ff, 1.6, 0.5); gl.position.y = 0.4; g.add(gl);
    g.userData.pulse = true; return g;
  }
  function chest(x, z) {
    const g = new T.Group();
    const wood = woodMat, gold = toon(0xd9a93a, { emissive: 0x5a4210 });
    const base = mesh(G.box, wood, 0, 0.17, 0); sc(base, 0.6, 0.34, 0.4); g.add(base);
    const lid = mesh(G.cyl, wood, 0, 0.34, 0); sc(lid, 0.2, 0.6, 0.2); lid.rotation.z = Math.PI / 2; lid.scale.set(0.2, 0.6, 0.2); g.add(lid);
    for (const dx of [-0.2, 0.2]) { const b = mesh(G.box, gold, dx, 0.2, 0); sc(b, 0.06, 0.48, 0.42); g.add(b); }
    const lock = mesh(G.box, gold, 0, 0.3, 0.21); sc(lock, 0.1, 0.12, 0.04); g.add(lock);
    const gl = glowSprite(0xffc850, 1.1, 0.45); gl.position.y = 0.35; g.add(gl);
    g.rotation.y = (hashN(x, z) - 0.5) * 1.2; return g;
  }
  function rockPile(x, z, ember) {
    const g = new T.Group(); const m = toon(0x4a3228);
    for (let i = 0; i < 3; i++) { const r = mesh(G.ico, m, (hashN(x, i) - 0.5) * 0.4, 0.1, (hashN(i, z) - 0.5) * 0.4); sc(r, 0.18 + hashN(i, x) * 0.14, 0.14, 0.18 + hashN(z, i) * 0.14); g.add(r); }
    const e = glowSprite(0xff7a28, 0.6, 0.8); e.position.set(-0.05, 0.2, 0.1); g.add(e); return g;
  }
  function pillar(x, z) {
    const g = new T.Group(); const m = std(0x4a3a4a);
    const s = mesh(G.cyl, m, 0, 0.8, 0); sc(s, 0.2, 1.6, 0.2); g.add(s);
    const cap = mesh(G.box, std(0x5e4a5e), 0, 1.65, 0); sc(cap, 0.5, 0.14, 0.5); g.add(cap);
    const base = mesh(G.box, std(0x5e4a5e), 0, 0.08, 0); sc(base, 0.46, 0.16, 0.46); g.add(base); return g;
  }
  function shard(x, z) {
    const g = new T.Group();
    const m = new T.MeshStandardMaterial({ color: 0x6a5a9a, emissive: 0x4a2a8a, emissiveIntensity: 0.8, roughness: 0.3, flatShading: true });
    const c = mesh(G.oct, m, 0, 0.55, 0); sc(c, 0.14, 0.6, 0.14); c.rotation.z = 0.35; g.add(c);
    const gl = glowSprite(0xb07ad4, 1.2, 0.5); gl.position.y = 0.5; g.add(gl); g.userData.pulse = true; return g;
  }
  function reeds(x, z) {
    const g = new T.Group();
    const water = mesh(G.cyl, new T.MeshStandardMaterial({ color: 0x2a6a9a, transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0.3, emissive: 0x0a2a4a }), 0, 0.015, 0, false);
    sc(water, 0.46, 0.03, 0.46); g.add(water); g.userData.water = water;
    const m = toon(0x4a7a5a);
    for (let i = 0; i < 6; i++) { const r = mesh(G.cyl, m, (hashN(i, x) - 0.5) * 0.5, 0.3, (hashN(z, i) - 0.5) * 0.5); sc(r, 0.014, 0.4 + hashN(i, z) * 0.35, 0.014); r.position.y = r.scale.y / 2; g.add(r); }
    return g;
  }

  function buildLevel() {
    if (levelGroup) { scene.remove(levelGroup); disposeGroup(levelGroup); }
    levelGroup = new T.Group(); scene.add(levelGroup);
    const L = LEVELS[state.level], cols = state.cols, rows = state.rows;
    built = state.grid;
    torches = []; wallData = []; pulseObjs = []; waterObjs = []; chestModels = [];

    // atmosphere per realm
    const dark = L.dark !== undefined ? L.dark : 0.38;
    // 3.3.1 rebalance: 3.3.0 cut the flat lights to ~0.3 and the dungeon went
    // too dark overall. Flat lights back to ~0.45, still well below the old
    // ~0.7 wash, so torches (boosted in 3.3.0, kept here) still dominate.
    const base = new T.Color(L.floor[0]).multiplyScalar(0.24).addScalar(0.010);
    scene.background.copy(base); scene.fog.color.copy(base); scene.fog.density = 0.022 + dark * 0.04;
    hemi.intensity = 0.55 - dark * 0.25;
    moon.intensity = 0.55 - dark * 0.2;
    // 3.6.0 outdoor: daylight sky, lighter fog, brighter flat lights —
    // a clearing should not read as a dungeon with the roof off.
    if (L.outdoor) {
      scene.background.set(0x87b5d8); scene.fog.color.set(0x87b5d8); scene.fog.density = 0.012;
      hemi.intensity = 0.85; moon.intensity = 0.7;
    }
    hemi.color.set(0x9a8a7a).lerp(new T.Color(L.wallTop), 0.3); // warm-neutral, not blue wash

    // floor: one instanced slab per open tile
    const floorTiles = [], wallTiles = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) (state.grid[y][x] === '#' ? wallTiles : floorTiles).push([x, y]);
    for (const gt of gates) floorTiles.push([gt.tx, gt.ty]);
    const fm = L.outdoor ? new T.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }) : floorMat;
    const floor = new T.InstancedMesh(G.box, fm, floorTiles.length); floor.receiveShadow = true;
    floorTiles.forEach(([x, y], i) => {
      const j = hashN(x, y);
      dummy.position.set(x + 0.5, -0.09 + (j - 0.5) * 0.03, y + 0.5);
      dummy.scale.set(0.985, 0.18, 0.985);
      dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); floor.setMatrixAt(i, dummy.matrix);
      floor.setColorAt(i, stoneTint(L.floor[(x + y) % 2], 0.85 + j * 0.3));
    });
    floor.instanceMatrix.needsUpdate = true; if (floor.instanceColor) floor.instanceColor.needsUpdate = true;
    levelGroup.add(floor);

    // ground beyond the room so the void never shows
    const void_ = mesh(G.box, std(base.clone().multiplyScalar(0.7)), cols / 2, -0.32, rows / 2, false); sc(void_, cols + 40, 0.2, rows + 40); levelGroup.add(void_);

    // walls: instanced blocks, heights jitter, cut away near the camera each frame
    const wm = L.outdoor ? new T.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }) : wallMat;
    wallInst = new T.InstancedMesh(wallGeo, wm, wallTiles.length); wallInst.castShadow = true; wallInst.receiveShadow = true;
    wallTiles.forEach(([x, y], i) => {
      const edge = (x === 0 || y === 0 || x === cols - 1 || y === rows - 1);
      wallData.push({ x, y, base: edge ? 0 : 0.2 + hashN(y, x) * 0.3, f: 1, tf: 1 });
      wallInst.setColorAt(i, stoneTint(L.wallTop, 0.62 + hashN(x, y) * 0.22));
    });
    levelGroup.add(wallInst);

    // wall torches: sconce + flame; only the nearest few get a real light
    for (const [x, y] of wallTiles) {
      if (!isTorchTile(x, y)) continue;
      const dir = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dz]) => {
        const nx = x + dx, ny = y + dz; return ny >= 0 && ny < rows && nx >= 0 && nx < cols && state.grid[ny][nx] !== '#';
      });
      if (!dir) continue;
      const g = new T.Group();
      const px = x + 0.5 + dir[0] * 0.56, pz = y + 0.5 + dir[1] * 0.56;
      g.position.set(px, 1.25, pz);
      const br = mesh(G.box, std(0x2a2018), 0, -0.12, 0); sc(br, 0.1, 0.34, 0.1); g.add(br);
      const cup = mesh(G.cyl, std(0x3a2a1a), 0, 0.08, 0); sc(cup, 0.1, 0.14, 0.1); g.add(cup);
      const flame = mesh(G.cone, new T.MeshBasicMaterial({ color: 0xffb040 }), 0, 0.26, 0, false); sc(flame, 0.09, 0.32, 0.09); g.add(flame);
      const halo = glowSprite(0xff9a40, 1.9, 0.75); halo.position.y = 0.3; g.add(halo);
      // 3.1.0: a warm pool of light on the floor in front of each torch —
      // cheap (one additive plane, no extra light) and it sells torchlight
      const pool = mesh(G.cyl, new T.MeshBasicMaterial({ color: 0xff9a40, transparent: true, opacity: 0.28, blending: T.AdditiveBlending, depthWrite: false }), dir[0] * 0.3, -1.23, dir[1] * 0.3, false); sc(pool, 1.4, 0.02, 1.4); g.add(pool);
      levelGroup.add(g);
      torches.push({ x, y, g, flame, halo, pos: new T.Vector3(px + dir[0] * 0.3, 1.45, pz + dir[1] * 0.3) });
    }

    // 3.1.0 dressing: hanging banners on some wall faces — a rod, a cloth
    // panel with a rune, gold trim. Deterministic by wall hash, so rooms match.
    for (const [x, y] of wallTiles) {
      if ((x * 31 + y * 17) % 47 !== 0) continue;
      const dir = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dz]) => {
        const nx = x + dx, ny = y + dz; return ny >= 0 && ny < rows && nx >= 0 && nx < cols && state.grid[ny][nx] !== '#';
      });
      if (!dir) continue;
      const bg = new T.Group(); bg.position.set(x + 0.5 + dir[0] * 0.56, 1.7, y + 0.5 + dir[1] * 0.56);
      bg.rotation.y = dir[0] !== 0 ? Math.PI / 2 * dir[0] : (dir[1] > 0 ? 0 : Math.PI);
      const rod = mesh(G.cyl, std(0x3a2a18), 0, 0.45, 0, false); sc(rod, 0.03, 0.7, 0.03); rod.rotation.z = Math.PI / 2; bg.add(rod);
      const cloth = mesh(G.box, std(0x6a1a2a, { roughness: 0.9 }), 0, -0.15, 0, false); sc(cloth, 0.55, 0.95, 0.03); bg.add(cloth);
      const rune = mesh(new T.PlaneGeometry(0.3, 0.3), new T.MeshBasicMaterial({ map: runeTex, transparent: true, color: 0xffd76a }), 0, -0.1, 0.02, false); bg.add(rune);
      levelGroup.add(bg);
    }

    // gates
    for (const gt of gates) {
      const g = new T.Group(); g.position.set(gt.tx + 0.5, 0, gt.ty + 0.5);
      const door = mesh(G.box, toon(0x4a3524), 0, 0.9, 0); sc(door, 1.04, 1.8, 1.04); g.add(door);
      for (const dy of [0.4, 1.4]) { const b = mesh(G.box, std(0x1a1a1a, { metalness: 0.7 }), 0, dy, 0); sc(b, 1.08, 0.1, 1.08); g.add(b); }
      const lock = mesh(G.sph, toon(0xffd76a, { emissive: 0x6a4a10 }), 0, 0.9, 0); sc(lock, 0.1); g.add(lock);
      g.userData.gate = gt; levelGroup.add(g); gt._m3 = g;
    }
    // 4.0.2: hero gates — pale-blue door with a gold rune, so they read as
    // a different kind of gate from the brass-key ones
    for (const gt of (typeof heroGates !== 'undefined' ? heroGates : [])) {
      const g = new T.Group(); g.position.set(gt.tx + 0.5, 0, gt.ty + 0.5);
      const door = mesh(G.box, toon(0x2a4a6a), 0, 0.9, 0); sc(door, 1.04, 1.8, 1.04); g.add(door);
      for (const dy of [0.4, 1.4]) { const b = mesh(G.box, std(0x1a1a1a, { metalness: 0.7 }), 0, dy, 0); sc(b, 1.08, 0.1, 1.08); g.add(b); }
      const rune = mesh(new T.PlaneGeometry(0.3, 0.3), new T.MeshBasicMaterial({ map: runeTex, transparent: true, color: 0xffd76a }), 0, 0.9, 0.53, false); g.add(rune);
      g.userData.gate = gt; levelGroup.add(g); gt._m3 = g;
    }

    // scenery: the same hash rules as the 2D renderers, so rooms match
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (state.grid[y][x] === '#') continue;
      const hh = (x * 73 + y * 149) % 100, X = x + 0.5, Z = y + 0.5;
      let o = null;
      if (hh < (L.decor === 'pine' ? 5 : 12) && !(state.decorBan && state.decorBan.has(x + ',' + y))) {
        if (L.decor === 'pine') o = tree(x, y);
        else if (L.decor === 'crystal') o = crystalCluster(x, y);
        else if (L.decor === 'reed') o = reeds(x, y);
        else if (L.decor === 'rock') o = rockPile(x, y);
        else if (L.decor === 'pillar') o = pillar(x, y);
        else if (L.decor === 'shard') o = shard(x, y);
      } else if (hh >= 12 && (x * 37 + y * 91) % 23 === 0) o = crystalCluster(x, y, true);
      else if (hh >= 12 && (x * 37 + y * 91) % 29 === 0) { o = chest(x, y); chestModels.push({ x, y, g: o }); }
      if (o) {
        o.position.set(X, 0, Z);
        // 3.0.1 perf: small scenery never needs to cast shadows — walls,
        // characters and the beacon carry the shadow read, props do not.
        try { o.traverse((m) => { if (m.isMesh) m.castShadow = false; }); } catch (e) {}
        if (o.userData.pulse) pulseObjs.push(o);
        if (o.userData.water) waterObjs.push(o);
        levelGroup.add(o);
      }
    }
    // Drowned Road: shallow glowing-teal water over the floor, shimmering in syncEntities
    if (L.name === 'Drowned Road') {
      const wm = new T.MeshStandardMaterial({ color: 0x2a8a9a, transparent: true, opacity: 0.38, roughness: 0.15, metalness: 0.3, emissive: 0x1a5a6a, emissiveIntensity: 0.6 });
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        if (state.grid[y][x] === '#') continue;
        const wg = new T.Group(); wg.position.set(x + 0.5, 0, y + 0.5);
        const wp = mesh(G.box, wm, 0, 0.03, 0, false); sc(wp, 0.92, 0.05, 0.92); wg.add(wp); wg.userData.water = wp; waterObjs.push(wg); levelGroup.add(wg);
      }
    }
    weather.rebuild(L.weather);
  }

  /* ---------- characters: procedural low-poly, toon shaded, outlined ---------- */
  const outlineMat = new T.MeshBasicMaterial({ color: 0x120c08, side: T.BackSide });
  // 3.2.0: outlines thinned from 1.10/1.08 to 1.05 — the thick black cartoon
  // edge was a big part of the primitive read. Separation stays, blob goes.
  function outlined(m, k) { // inverted-hull outline, the cheap cartoon edge
    const o = new T.Mesh(m.geometry, outlineMat); o.scale.copy(m.scale).multiplyScalar(k || 1.05); o.position.copy(m.position); o.rotation.copy(m.rotation);
    return o;
  }
  function part(g, geo, mat, x, y, z, sx, sy, sz, ol) {
    const m = mesh(geo, mat, x, y, z); m.scale.set(sx, sy, sz); g.add(m);
    if (ol !== false) g.add(outlined(m, ol || 1.05));
    return m;
  }
  function eyesPair(g, y, z, gap, r, color) {
    const m = new T.MeshBasicMaterial({ color: color || 0x111111 });
    for (const s of [-1, 1]) { const e = mesh(G.sph, m, s * gap, y, z, false); sc(e, r); g.add(e); }
  }
  function track(model, mat) { (model.mats = model.mats || []).push(mat); return mat; }

  function buildKari(style) {
    // 3.0.2: Kari was still reading as a robed figure in 3D — the spike kept
    // the old tapered-cloak body, thin legs and cloak arms, with only a helmet
    // and staff bolted on. That silhouette is the NPC/folk silhouette, not a
    // hero's. Rebuilt here as plate, from the ground up: greaves and boots,
    // a real cuirass with a glowing rune gem, big pauldrons, steel vambraces,
    // and a taller frame. Colour still follows the armor tier (blue steel /
    // obsidian + gold trim / aether teal + glow); the shape is plate at every tier.
    const g = new T.Group(), model = { g, kind: 'kari', mats: [], s0: 1.18 };
    g.scale.setScalar(model.s0);
    const plate = track(model, new T.MeshStandardMaterial({ color: style.cloak, metalness: 0.75, roughness: 0.32, flatShading: true }));
    const dark = track(model, new T.MeshStandardMaterial({ color: style.dark, metalness: 0.7, roughness: 0.4 }));
    const trim = new T.MeshStandardMaterial({ color: style.trim, metalness: 0.6, roughness: 0.35 });
    const skin = track(model, std(0xf0d0a8, { roughness: 0.8 }));
    // legs: hip groups, so walkAnim swings a greave + boot, not a thin rod
    for (const [key, s] of [['legL', -1], ['legR', 1]]) {
      const leg = new T.Group(); leg.position.set(s * 0.12, 0.44, 0);
      const greave = mesh(G.cyl, plate, 0, -0.2, 0); sc(greave, 0.09, 0.38, 0.09); leg.add(greave);
      const knee = mesh(G.sph, trim, 0, -0.2, 0.09, false); sc(knee, 0.05); leg.add(knee);
      const boot = mesh(G.box, dark, 0, -0.4, 0.03); sc(boot, 0.13, 0.1, 0.2); leg.add(boot);
      g.add(leg); model[key] = leg;
    }
    model.body = new T.Group(); model.body.position.y = 0.3; g.add(model.body);
    // cuirass: broad chest plate, narrower waist plate, central ridge, belt
    part(model.body, G.box, plate, 0, 0.55, 0, 0.52, 0.38, 0.32);
    part(model.body, G.box, plate, 0, 0.3, 0, 0.44, 0.2, 0.28);
    const ridge = mesh(G.box, trim, 0, 0.55, 0.17, false); sc(ridge, 0.06, 0.34, 0.03); model.body.add(ridge);
    const belt = mesh(G.cyl, toon(0x4a3220), 0, 0.2, 0, false); sc(belt, 0.24, 0.05, 0.2); model.body.add(belt);
    const buckle = mesh(G.box, trim, 0, 0.2, 0.16, false); sc(buckle, 0.08, 0.06, 0.03); model.body.add(buckle);
    part(model.body, G.cyl, skin, 0, 0.88, 0, 0.08, 0.12, 0.08, false); // neck, was missing
    // glowing rune gem on the chest — the blue-magic read, even standing still
    const gem = mesh(G.oct, new T.MeshStandardMaterial({ color: 0x4a90d8, emissive: 0x4a90d8, emissiveIntensity: 2.5, roughness: 0.25, flatShading: true }), 0, 0.58, 0.18, false); sc(gem, 0.06, 0.09, 0.04); model.body.add(gem);
    part(model.body, G.sph, plate, -0.31, 0.68, 0, 0.17, 0.14, 0.17); part(model.body, G.sph, plate, 0.31, 0.68, 0, 0.17, 0.14, 0.17); // pauldrons, not cloak shoulders
    // 3.1.0 detail: gorget at the neck, tassets hanging over the thighs
    part(model.body, G.cyl, plate, 0, 0.82, 0, 0.22, 0.08, 0.22, false);
    part(model.body, G.box, plate, -0.18, 0.12, 0.05, 0.18, 0.16, 0.06, false); part(model.body, G.box, plate, 0.18, 0.12, 0.05, 0.18, 0.16, 0.06, false);
    model.head = new T.Group(); model.head.position.y = 0.95; model.body.add(model.head);
    part(model.head, G.sph, skin, 0, 0, 0.01, 0.17, 0.17, 0.17);
    // 3.0 vision hero: steel helmet over the face, not a hood — nasal guard down the nose
    const helm = mesh(G.sph, dark, 0, 0.06, -0.02, true); sc(helm, 0.21, 0.18, 0.2); model.head.add(helm);
    const nasal = mesh(G.box, dark, 0, -0.02, 0.17, false); sc(nasal, 0.035, 0.12, 0.03); model.head.add(nasal);
    // 3.1.0: cheek guards, so the helmet reads as a helmet from the side too
    for (const s of [-1, 1]) { const cheek = mesh(G.box, dark, s * 0.17, -0.02, 0.05, false); sc(cheek, 0.03, 0.1, 0.12); model.head.add(cheek); }
    eyesPair(model.head, 0.0, 0.158, 0.065, 0.03, 0x101010);
    const brow = mesh(G.box, toon(0x4a3220), 0, 0.085, 0.15, false); sc(brow, 0.22, 0.03, 0.03); model.head.add(brow);
    // staff arm (left): steel vambrace + fist, staff hung from the arm so the
    // swing animation moves staff and arm together. Staff is tall now — from
    // near the ground to above the helmet — so it reads at chase distance.
    model.arm = new T.Group(); model.arm.position.set(-0.32, 0.62, 0.02); model.body.add(model.arm); model.armL = model.arm;
    part(model.arm, G.cyl, plate, 0, -0.13, 0.05, 0.07, 0.28, 0.07);
    const hand = mesh(G.sph, skin, 0, -0.28, 0.1, false); sc(hand, 0.06); model.arm.add(hand);
    const fingers = mesh(G.box, skin, 0, -0.34, 0.12, false); sc(fingers, 0.07, 0.05, 0.05); model.arm.add(fingers);
    model.staff = new T.Group(); model.staff.position.set(0, -0.25, 0.08); model.arm.add(model.staff);
    const shaft = mesh(G.cyl, toon(0x4a3220), 0, 0.25, 0, true); sc(shaft, 0.035, 1.5, 0.035); model.staff.add(shaft);
    model.crystal = mesh(G.oct, new T.MeshStandardMaterial({ color: 0x4a90d8, emissive: 0x4a90d8, emissiveIntensity: 3, roughness: 0.25, flatShading: true }), 0, 1.05, 0, false); sc(model.crystal, 0.09, 0.14, 0.09); model.staff.add(model.crystal);
    model.crystalGlow = glowSprite(0x4a90d8, 1.1, 0.4); model.crystalGlow.position.set(0, 1.05, 0); model.staff.add(model.crystalGlow);
    model.arc = mesh(G.tor, new T.MeshBasicMaterial({ color: 0x4a90d8, transparent: true, opacity: 0, blending: T.AdditiveBlending }), 0.25, 0.15, 0.25, false); sc(model.arc, 0.55, 0.55, 1); model.arc.rotation.x = Math.PI / 2; model.body.add(model.arc);
    // keep the old name pointing at the staff so any other caller still finds a weapon
    model.sword = model.staff;
    // right arm: steel vambrace + fist, no cloak sleeve — stored so walkAnim
    // can swing it opposite the legs like every other figure
    const armR = new T.Group(); armR.position.set(0.32, 0.62, 0.02); model.body.add(armR); model.armR = armR;
    part(armR, G.cyl, plate, 0, -0.13, 0.05, 0.07, 0.28, 0.07);
    const handR = mesh(G.sph, skin, 0, -0.28, 0.1, false); sc(handR, 0.06); armR.add(handR);
    const fingersR = mesh(G.box, skin, 0, -0.34, 0.12, false); sc(fingersR, 0.07, 0.05, 0.05); armR.add(fingersR);
    // tier dressing is now trim + glow only — the plate shape is already there
    if (style.tier >= 1) {
      const crest = mesh(G.cone, trim, 0, 0.24, -0.02, false); sc(crest, 0.06, 0.16, 0.06); model.head.add(crest);
    }
    if (style.tier === 2) { const gl = glowSprite(0x4ae8d8, 1.8, 0.35); gl.position.y = 0.6; g.add(gl); }
    model.tier = style.tier; return model;
  }

  function figure(opts) { // generic biped: draugr, drowned, folk, king, ghost
    // 3.2.0: the old figure was one tapered robe, two thin cylinder legs and
    // arms, and a big sphere head — that is the primitive look, in one model.
    // Rebuilt as an articulated figure: hip groups with thigh + shin + foot,
    // a layered torso (hips / abdomen / chest / shoulders / neck), arms with
    // upper + forearm + fist, and a smaller head with ears and a nose.
    // Materials are standard (not flat toon) so light shapes the body.
    const g = new T.Group(), model = { g, kind: opts.kind, mats: [] };
    const robe = track(model, std(opts.robe, { roughness: 0.9 }));
    const skin = track(model, std(opts.skin || 0xc9c2a8, { roughness: 0.8 }));
    const legMat = track(model, std(opts.legs || 0x3a2a1a, { roughness: 0.9 }));
    const S = (opts.s || 1) * 0.98; g.scale.setScalar(S); model.s0 = S;
    const fat = opts.fat || 0.26;
    for (const [key, s] of [['legL', -1], ['legR', 1]]) {
      const leg = new T.Group(); leg.position.set(s * 0.11, 0.42, 0);
      part(leg, G.cyl, legMat, 0, -0.11, 0, 0.07, 0.22, 0.07); // thigh
      part(leg, G.cyl, legMat, 0, -0.32, 0, 0.055, 0.22, 0.055); // shin
      const foot = mesh(G.box, legMat, 0, -0.41, 0.03, false); sc(foot, 0.09, 0.05, 0.17); leg.add(foot);
      g.add(leg); model[key] = leg;
    }
    model.body = new T.Group(); model.body.position.y = 0.28; g.add(model.body);
    part(model.body, G.box, robe, 0, 0.18, 0, fat * 1.1, 0.22, fat * 0.85); // abdomen
    part(model.body, G.box, robe, 0, 0.42, 0, fat * 1.35, 0.30, fat); // chest
    part(model.body, G.sph, robe, -0.22, 0.60, 0, 0.09, 0.09, 0.09); part(model.body, G.sph, robe, 0.22, 0.60, 0, 0.09, 0.09, 0.09); // shoulders
    part(model.body, G.cyl, skin, 0, 0.68, 0, 0.07, 0.12, 0.07, false); // neck
    part(model.body, G.cyl, std(0x3a2a18), 0, 0.28, 0, fat * 1.15, 0.05, fat * 0.95, false); // belt, all figures
    model.head = new T.Group(); model.head.position.y = 0.80; model.body.add(model.head);
    part(model.head, G.sph, skin, 0, 0, 0, opts.skull ? 0.12 : 0.14, opts.skull ? 0.15 : 0.14, opts.skull ? 0.12 : 0.14);
    for (const s of [-1, 1]) { const ear = mesh(G.sph, skin, s * 0.14, 0, 0, false); sc(ear, 0.03); model.head.add(ear); }
    const nose = mesh(G.box, skin, 0, -0.02, 0.14, false); sc(nose, 0.03, 0.05, 0.03); model.head.add(nose);
    if (opts.eyeGlow) {
      const em = new T.MeshBasicMaterial({ color: opts.eyeGlow });
      for (const s of [-1, 1]) { const e = mesh(G.sph, em, s * 0.05, 0.02, 0.11, false); sc(e, 0.034); model.head.add(e); }
      const gl = glowSprite(opts.eyeGlow, 0.5, 0.55); gl.position.set(0, 0.02, 0.14); model.head.add(gl);
    } else eyesPair(model.head, 0.02, 0.135, 0.05, 0.022, 0x101010);
    model.armL = new T.Group(); model.armL.position.set(-0.22, 0.60, 0); model.body.add(model.armL);
    model.armR = new T.Group(); model.armR.position.set(0.22, 0.60, 0); model.body.add(model.armR);
    for (const a of [model.armL, model.armR]) {
      part(a, G.cyl, robe, 0, -0.08, 0.05, 0.05, 0.16, 0.05); // upper arm
      part(a, G.cyl, skin, 0, -0.22, 0.05, 0.045, 0.16, 0.045); // forearm
      const fist = mesh(G.sph, skin, 0, -0.32, 0.08, false); sc(fist, 0.06); a.add(fist);
    }
    if (opts.zombieArms) { model.zombie = true; model.armL.rotation.x = -1.2; model.armR.rotation.x = -1.2; }
    if (opts.prop) opts.prop(model);
    return model;
  }

  function buildEnemy(kind) {
    const rk = enemyModelKey({ kind });
    if (rk) { const m = makeRealModel(rk, 1.9, kind === 'troll' ? 1.4 : kind === 'brute' ? 1.6 : 1); m.kind = kind; return m; }
    if (kind === 'wolf') {
      const g = new T.Group(), model = { g, kind, mats: [] };
      const fur = track(model, std(0x8fa3b8, { roughness: 0.9 })), dk = std(0x6e8296, { roughness: 0.9 });
      model.body = new T.Group(); g.add(model.body);
      part(model.body, G.sph, fur, 0, 0.34, 0, 0.2, 0.19, 0.34);
      part(model.body, G.sph, fur, 0, 0.28, 0.12, 0.17, 0.16, 0.17, false); // chest mass, was a bare sphere body
      part(model.body, G.sph, fur, 0, 0.4, 0.28, 0.14, 0.14, 0.14);                // head
      part(model.body, G.cone, fur, 0, 0.34, 0.44, 0.07, 0.2, 0.07).rotation.x = Math.PI / 2; // snout
      const nose = mesh(G.sph, std(0x1a1a1a), 0, 0.34, 0.54, false); sc(nose, 0.03); model.body.add(nose);
      eyesPair(model.body, 0.45, 0.39, 0.06, 0.02, 0xff3a3a);
      for (const s of [-1, 1]) { const ear = mesh(G.cone, fur, s * 0.08, 0.56, 0.24); sc(ear, 0.04, 0.1, 0.04); model.body.add(ear); }
      const tail = mesh(G.cone, dk, 0, 0.38, -0.4); sc(tail, 0.05, 0.3, 0.05); tail.rotation.x = -1.2; model.body.add(tail); model.tail = tail;
      // 3.2.0: legs are hip groups with paws, so the trot swings from the hip
      model.legs = [[-0.1, 0.2], [0.1, 0.2], [-0.1, -0.2], [0.1, -0.2]].map(([x, z]) => {
        const leg = new T.Group(); leg.position.set(x, 0.28, z);
        part(leg, G.cyl, dk, 0, -0.14, 0, 0.035, 0.28, 0.035);
        const paw = mesh(G.sph, dk, 0, -0.28, 0.02, false); sc(paw, 0.05, 0.04, 0.06); leg.add(paw);
        g.add(leg); return leg;
      });
      g.scale.setScalar(1.05); model.s0 = 1.05; return model;
    }
    if (kind === 'spider') {
      const g = new T.Group(), model = { g, kind, mats: [] };
      const sk = track(model, new T.MeshStandardMaterial({ color: 0x2a3a5a, emissive: 0x0a2a4a, roughness: 0.4, flatShading: true }));
      const cr = new T.MeshStandardMaterial({ color: 0x7ac8e8, emissive: 0x3a9ad8, emissiveIntensity: 1.2, flatShading: true });
      model.body = new T.Group(); model.body.position.y = 0.5; g.add(model.body);
      part(model.body, G.sph, sk, 0, 0, 0.12, 0.22, 0.17, 0.26);
      part(model.body, G.sph, sk, 0, 0.04, -0.3, 0.3, 0.24, 0.34);
      for (let i = 0; i < 3; i++) { const c = mesh(G.oct, cr, (i - 1) * 0.12, 0.26, -0.3); sc(c, 0.05, 0.2, 0.05); model.body.add(c); }
      eyesPair(model.body, 0.06, 0.34, 0.07, 0.035, 0xff3a3a); eyesPair(model.body, 0.0, 0.36, 0.13, 0.025, 0xff3a3a);
      // 3.1.0: fangs, so the spider reads as a spider at a glance, not a blob
      for (const s of [-1, 1]) { const fang = mesh(G.cone, sk, s * 0.08, -0.08, 0.38); sc(fang, 0.03, 0.12, 0.03); fang.rotation.x = Math.PI; model.body.add(fang); }
      const gl = glowSprite(0x4ab0ff, 1.8, 0.35); gl.position.set(0, 0.1, -0.3); model.body.add(gl);
      model.legs = [];
      for (let i = 0; i < 8; i++) {
        const side = i < 4 ? -1 : 1, k = i % 4;
        const pivot = new T.Group(); pivot.position.set(side * 0.14, 0.52, 0.2 - k * 0.15); g.add(pivot);
        const upper = mesh(G.cyl, sk, side * 0.2, 0.1, 0); sc(upper, 0.022, 0.4, 0.022); upper.rotation.z = side * -1.1; pivot.add(upper);
        const lower = mesh(G.cyl, sk, side * 0.42, -0.12, 0); sc(lower, 0.018, 0.5, 0.018); lower.rotation.z = side * 0.2; pivot.add(lower);
        pivot.userData = { k, side, base: side * (0.35 + k * 0.12) }; pivot.rotation.y = pivot.userData.base * 0.6; model.legs.push(pivot);
      }
      g.scale.setScalar(1.15); model.s0 = 1.15; return model;
    }
    if (kind === 'screecher') {
      return figure({ kind, robe: 0xc8b86a, skin: 0xe8d8a0, fat: 0.2, s: 0.85, eyeGlow: 0xffd76a, legs: 0x8a7a3a });
    }
    if (kind === 'troll') {
      return figure({ kind, robe: 0x6b4a34, skin: 0xd8c8b8, fat: 0.42, s: 1.55, eyeGlow: 0xffd76a, legs: 0x4a3220,
        prop(m) { const club = mesh(G.cyl, toon(0x4a3220), 0, -0.2, 0.18); sc(club, 0.06, 0.6, 0.06); club.rotation.x = -0.6; m.armR.add(club);
          const kn = mesh(G.sph, toon(0x5a4030), 0, 0.08, 0.34); sc(kn, 0.13); m.armR.add(kn); } });
    }
    if (kind === 'king') {
      return figure({ kind, robe: 0x5a3d6e, skin: 0xd8c8b8, fat: 0.3, s: 1.5, eyeGlow: 0xff5a5a, skull: true, legs: 0x2a1e3a,
        prop(m) {
          const gold = toon(0xffd76a, { emissive: 0x6a4a10 });
          for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283; const p = mesh(G.cone, gold, Math.cos(a) * 0.12, 0.2, Math.sin(a) * 0.12, false); sc(p, 0.035, 0.12, 0.035); m.head.add(p); }
          const staff = mesh(G.cyl, toon(0x2a1e3a), 0.26, 0.3, 0.12); sc(staff, 0.025, 1.1, 0.025); m.body.add(staff);
          const orb = mesh(G.sph, new T.MeshBasicMaterial({ color: 0xb07ad4 }), 0.26, 0.9, 0.12, false); sc(orb, 0.08); m.body.add(orb); m.orb = orb;
          const gl = glowSprite(0xb07ad4, 1.1, 0.7); gl.position.set(0.26, 0.9, 0.12); m.body.add(gl);
          const cape = mesh(G.box, toon(0x3a254a), 0, 0.3, -0.2, true); sc(cape, 0.5, 0.7, 0.04); m.body.add(cape);
        } });
    }
    if (kind === 'drowned') return figure({ kind, robe: 0x2e5a58, skin: 0x8ab0a8, legs: 0x2a3a36, zombieArms: true, eyeGlow: 0x9ad8ff, skull: true });
    return figure({ kind: 'draugr', robe: 0x3e5a46, skin: 0xb8c4b0, legs: 0x3a2a1a, zombieArms: true, eyeGlow: 0xc8ff9a, skull: true,
      prop(m) { const sw = mesh(G.box, std(0x8a7a6a, { metalness: 0.6, roughness: 0.5 }), 0, -0.2, 0.3); sc(sw, 0.03, 0.02, 0.5); m.armR.add(sw); } });
  }

  const NPC_COL = { mira: 0xc87f3a, tove: 0x4a7a8a, pike: 0x7a8a5a, eira: 0x7a9ac8, wright: 0xaac8ff };
  function buildNpc(kind) {
    const rk = npcModelKey({ kind });
    if (rk) {
      const m = makeRealModel(rk, 1.9); m.kind = 'npc';
      const mark = new T.Sprite(new T.SpriteMaterial({ map: markTex, depthTest: false, transparent: true })); mark.scale.set(0.45, 0.45, 1); mark.position.y = 2.5; mark.renderOrder = 10; m.g.add(mark); m.mark = mark;
      return m;
    }
    const ghost = kind === 'wright';
    const m = figure({ kind: 'npc', robe: NPC_COL[kind] || 0x888888, skin: ghost ? 0xcfe0ff : 0xe8c9a0, legs: 0x3a2a1a,
      prop(mm) {
        if (kind === 'mira') { const h = mesh(G.cyl, toon(0x3a2a12), 0.02, -0.24, 0.12); sc(h, 0.03, 0.4, 0.03); h.rotation.x = -0.4; mm.armR.add(h); const hd = mesh(G.box, std(0x8a8a8a, { metalness: 0.7 }), 0.02, -0.07, 0.19); sc(hd, 0.16, 0.1, 0.1); mm.armR.add(hd); }
        if (kind === 'tove') { const p = mesh(G.cyl, toon(0x4a3220), 0.3, 0.45, 0); sc(p, 0.025, 1.5, 0.025); mm.body.add(p); }
        if (kind === 'wright') { const gl = glowSprite(0xaac8ff, 2.2, 0.35); gl.position.y = 0.5; mm.body.add(gl); }
      } });
    if (ghost) for (const mt of m.mats) { mt.transparent = true; mt.opacity = 0.7; }
    const mark = new T.Sprite(new T.SpriteMaterial({ map: markTex, depthTest: false, transparent: true })); mark.scale.set(0.45, 0.45, 1); mark.position.y = 1.35; mark.renderOrder = 10; m.g.add(mark); m.mark = mark;
    return m;
  }
  function buildAlly(a) {
    const rk = allyModelKey(a);
    if (rk) { const m = makeRealModel(rk, 1.9); m.kind = 'ally'; m.allyKind = a.kind; return m; }
    const f = figure({ kind: 'ally', robe: new T.Color(a.color || '#c8742c').getHex(), skin: 0xe8c9a0, legs: 0x3a2a1a,
      prop(mm) { const sw = mesh(G.box, std(0xdfe9f2, { metalness: 0.8, roughness: 0.3 }), 0, -0.2, 0.28); sc(sw, 0.04, 0.02, 0.5); mm.armR.add(sw); } });
    f.allyKind = a.kind; return f;
  }
  function buildRaven() {
    const g = new T.Group(), model = { g, kind: 'raven', mats: [] };
    const b = toon(0x20242a);
    part(g, G.sph, b, 0, 0, 0, 0.09, 0.07, 0.15, false);
    part(g, G.sph, b, 0, 0.04, 0.12, 0.055, 0.055, 0.055, false);
    const beak = mesh(G.cone, toon(0xd9a93a), 0, 0.03, 0.2, false); sc(beak, 0.02, 0.07, 0.02); beak.rotation.x = Math.PI / 2; g.add(beak);
    model.wl = new T.Group(); model.wr = new T.Group(); g.add(model.wl); g.add(model.wr);
    for (const [w, s] of [[model.wl, -1], [model.wr, 1]]) { const wing = mesh(G.box, b, s * 0.16, 0, 0, false); sc(wing, 0.3, 0.02, 0.16); w.add(wing); }
    const eye = mesh(G.sph, new T.MeshBasicMaterial({ color: 0xffd76a }), 0.03, 0.06, 0.15, false); sc(eye, 0.012); g.add(eye);
    return model;
  }
  function buildBeacon() {
    const g = new T.Group(), model = { g, kind: 'beacon' };
    const stone = std(0x6a6a6a);
    // vision set-piece: rune pedestal steps + stone arch doorway framing the beacon
    const step1 = mesh(G.box, stone, 0, 0.05, 0); sc(step1, 1.3, 0.1, 1.3); g.add(step1);
    const step2 = mesh(G.box, stone, 0, 0.12, 0); sc(step2, 1.0, 0.12, 1.0); g.add(step2);
    for (const s of [-1, 1]) {
      const pil = mesh(G.box, stone, s * 0.85, 1.1, 0); sc(pil, 0.28, 2.2, 0.28); g.add(pil);
      const cap = mesh(G.box, toon(0xffd76a, { emissive: 0x5a4210 }), s * 0.85, 2.25, 0); sc(cap, 0.34, 0.1, 0.34); g.add(cap);
    }
    const lintel = mesh(G.box, stone, 0, 2.35, 0); sc(lintel, 2.0, 0.3, 0.3); g.add(lintel);
    const b = mesh(G.cyl, stone, 0, 0.12, 0); sc(b, 0.38, 0.24, 0.38); g.add(b);
    const p = mesh(G.cyl, stone, 0, 0.55, 0); sc(p, 0.2, 0.62, 0.2); g.add(p);
    const bowl = mesh(G.cyl, std(0x3a3a3a, { metalness: 0.6 }), 0, 0.92, 0); sc(bowl, 0.3, 0.12, 0.3); g.add(bowl);
    model.flame = mesh(G.cone, new T.MeshBasicMaterial({ color: 0xffd060 }), 0, 1.2, 0, false); sc(model.flame, 0.18, 0.5, 0.18); g.add(model.flame);
    model.core = mesh(G.cone, new T.MeshBasicMaterial({ color: 0xfff4c0 }), 0, 1.12, 0, false); sc(model.core, 0.09, 0.3, 0.09); g.add(model.core);
    model.halo = glowSprite(0xffc040, 3.2, 0.9); model.halo.position.y = 1.2; g.add(model.halo);
    const beam = mesh(new T.CylinderGeometry(0.12, 0.55, 6, 20, 1, true), new T.MeshBasicMaterial({ map: beamTex, color: 0xffd060, transparent: true, opacity: 0.5, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }), 0, 3.9, 0, false);
    beam.scale.y = 1; g.add(beam); model.beam = beam;
    model.ring = mesh(G.tor, new T.MeshBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0.8, blending: T.AdditiveBlending }), 0, 0.03, 0, false);
    model.ring.rotation.x = Math.PI / 2; sc(model.ring, 0.9, 0.9, 1); g.add(model.ring);
    model.ring2 = mesh(G.tor, new T.MeshBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0.45, blending: T.AdditiveBlending }), 0, 0.03, 0, false);
    model.ring2.rotation.x = Math.PI / 2; sc(model.ring2, 0.62, 0.62, 1); g.add(model.ring2);
    model.mark = mesh(new T.RingGeometry(0.55, 0.7, 32), new T.MeshBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0.6, blending: T.AdditiveBlending, side: T.DoubleSide }), 0, 0.05, 0, false);
    model.mark.rotation.x = -Math.PI / 2; model.mark.visible = false; g.add(model.mark);
    return model;
  }
  function buildDarkBeacon() {
    const g = new T.Group(), model = { g, kind: 'dark' };
    const stone = std(0x2a2438);
    const p = mesh(G.cyl, stone, 0, 0.3, 0); sc(p, 0.22, 0.6, 0.22); g.add(p);
    model.crystal = mesh(G.oct, new T.MeshStandardMaterial({ color: 0x8a6fc0, emissive: 0x5a30a0, emissiveIntensity: 1.1, flatShading: true }), 0, 0.95, 0); sc(model.crystal, 0.2, 0.34, 0.2); g.add(model.crystal);
    model.halo = glowSprite(0xb07ad4, 2.4, 0.8); model.halo.position.y = 0.95; g.add(model.halo);
    const beam = mesh(new T.CylinderGeometry(0.1, 0.45, 5, 20, 1, true), new T.MeshBasicMaterial({ map: beamTex, color: 0xa070e0, transparent: true, opacity: 0.45, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }), 0, 3.4, 0, false); g.add(beam);
    model.ring = mesh(G.tor, new T.MeshBasicMaterial({ color: 0xa070e0, transparent: true, opacity: 0.8, blending: T.AdditiveBlending }), 0, 0.03, 0, false);
    model.ring.rotation.x = Math.PI / 2; sc(model.ring, 0.8, 0.8, 1); g.add(model.ring);
    return model;
  }
  function buildRunestone() {
    const g = new T.Group(), model = { g, kind: 'rune' };
    const slab = mesh(G.box, std(0x8a8a82), 0, 0.5, 0); sc(slab, 0.4, 1.0, 0.16); slab.rotation.z = 0.04; g.add(slab);
    const top = mesh(G.cone, std(0x8a8a82), 0, 1.08, 0); sc(top, 0.27, 0.2, 0.1); top.rotation.y = Math.PI / 4; g.add(top);
    const glyph = new T.Mesh(new T.PlaneGeometry(0.28, 0.28), new T.MeshBasicMaterial({ map: runeTex, transparent: true, color: 0xffd76a, blending: T.AdditiveBlending, depthWrite: false }));
    glyph.position.set(0, 0.62, 0.085); g.add(glyph);
    const glyph2 = glyph.clone(); glyph2.position.z = -0.085; glyph2.rotation.y = Math.PI; g.add(glyph2);
    model.halo = glowSprite(0xffd76a, 1.0, 0.35); model.halo.position.y = 0.62; g.add(model.halo);
    model.ping = mesh(new T.RingGeometry(0.5, 0.6, 28), new T.MeshBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0.7, blending: T.AdditiveBlending, side: T.DoubleSide }), 0, 0.05, 0, false);
    model.ping.rotation.x = -Math.PI / 2; model.ping.visible = false; g.add(model.ping);
    return model;
  }
  function buildHushStone() {
    const g = new T.Group(), model = { g, kind: 'hush' };
    const slab = mesh(G.box, std(0x4a3442), 0, 0.5, 0); sc(slab, 0.4, 1.0, 0.16); slab.rotation.z = 0.04; g.add(slab);
    model.halo = glowSprite(0xffd76a, 1.0, 0.35); model.halo.position.y = 0.62; g.add(model.halo);
    return model;
  }
  function buildBeckyBox() {
    const g = new T.Group(), model = { g, kind: 'becky' };
    const box = mesh(G.box, std(0xc8e4f0), 0, 0.3, 0); sc(box, 0.55, 0.6, 0.45); g.add(box);
    const lid = mesh(G.box, std(0x7ab0c8), 0, 0.62, 0); sc(lid, 0.57, 0.08, 0.47); g.add(lid);
    model.halo = glowSprite(0x9ad8ff, 0.9, 0.3); model.halo.position.y = 0.6; g.add(model.halo);
    return model;
  }
  function buildPickup(kind) {
    const g = new T.Group(), model = { g, kind };
    if (kind === 'loot') {
      const gold = toon(0xffd76a, { emissive: 0x6a4a10 });
      const gem = mesh(G.oct, gold, 0, 0.3, 0); sc(gem, 0.16, 0.24, 0.16); g.add(gem);
      model.halo = glowSprite(0xffd76a, 1.1, 0.5); model.halo.position.y = 0.3; g.add(model.halo);
    } else if (kind === 'sigil') {
      const gem = mesh(G.oct, new T.MeshStandardMaterial({ color: 0xb07ad4, emissive: 0x6a2a9a, emissiveIntensity: 1.4, roughness: 0.2, flatShading: true }), 0, 0.35, 0); sc(gem, 0.2, 0.3, 0.2); g.add(gem);
      const ring = mesh(G.tor, toon(0xffd76a, { emissive: 0x5a4210 }), 0, 0.35, 0); sc(ring, 0.28); ring.rotation.x = Math.PI / 2.4; g.add(ring);
      model.halo = glowSprite(0xb07ad4, 1.6, 0.7); model.halo.position.y = 0.35; g.add(model.halo);
    } else if (kind === 'key') {
      const gold = toon(0xffd76a, { emissive: 0x6a4a10 });
      const ring = mesh(G.tor, gold, 0, 0.45, 0); sc(ring, 0.1); ring.scale.z = 2; g.add(ring);
      const shaft = mesh(G.cyl, gold, 0, 0.3, 0); sc(shaft, 0.03, 0.26, 0.03); g.add(shaft);
      const tooth = mesh(G.box, gold, 0.05, 0.2, 0); sc(tooth, 0.08, 0.04, 0.03); g.add(tooth);
      model.halo = glowSprite(0xffd76a, 0.9, 0.5); model.halo.position.y = 0.4; g.add(model.halo);
    } else {
      const glass = new T.MeshStandardMaterial({ color: 0x7ec850, emissive: 0x3a8a20, emissiveIntensity: 0.8, roughness: 0.2, transparent: true, opacity: 0.92 });
      const fl = mesh(G.sph, glass, 0, 0.2, 0); sc(fl, 0.15, 0.15, 0.15); g.add(fl);
      const neck = mesh(G.cyl, glass, 0, 0.38, 0); sc(neck, 0.05, 0.14, 0.05); g.add(neck);
      const cork = mesh(G.cyl, toon(0x8a6030), 0, 0.47, 0); sc(cork, 0.06, 0.05, 0.06); g.add(cork);
      model.halo = glowSprite(0x9aff60, 0.9, 0.5); model.halo.position.y = 0.25; g.add(model.halo);
    }
    model.ping = mesh(new T.RingGeometry(0.35, 0.42, 24), new T.MeshBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0.7, blending: T.AdditiveBlending, side: T.DoubleSide }), 0, 0.05, 0, false);
    model.ping.rotation.x = -Math.PI / 2; model.ping.visible = false; g.add(model.ping);
    return model;
  }

  /* ---------- entity sync: sim objects <-> models ---------- */
  const models = new Map(); // sim object -> model
  const dying = [];
  const entRoot = new T.Group(); scene.add(entRoot);
  function angLerp(a, b, t) { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * t; }
  function getModel(o, build) {
    let m = models.get(o);
    if (!m) { m = build(); m.ry = undefined; models.set(o, m); entRoot.add(m.g); }
    return m;
  }
  function place(m, o, dt, faceAngle, lerp) {
    m.g.position.set(o.x * U, 0, o.y * U);
    const target = Math.PI / 2 - faceAngle;
    m.ry = m.ry === undefined ? target : angLerp(m.ry, target, Math.min(1, dt * (lerp || 14)));
    m.g.rotation.y = m.ry;
  }
  function flash(m, v, hex) {
    if (!m.mats) return;
    for (const mt of m.mats) { if (mt.emissive) { mt.emissive.setHex(v > 0 ? (hex || 0xffffff) : (mt.userData.em || 0x000000)); } }
  }
  function walkAnim(m, phase, amp, moving) {
    const s = moving ? Math.sin(phase) * amp : 0;
    if (m.legL) { m.legL.rotation.x = s; m.legR.rotation.x = -s; }
    // 3.2.0: arms now swing opposite the legs — the old walk was legs only,
    // which is why figures looked like sliding statues
    if (m.armL && !m.zombie) { m.armL.rotation.x = -s * 0.7; m.armR.rotation.x = s * 0.7; }
  }

  function syncEntities(dt, t) {
    const live = new Set();
    const L = LEVELS[state.level];

    // beacon / dark beacon
    if (beacon) {
      live.add(beacon); const m = getModel(beacon, buildBeacon); m.g.position.set(beacon.x * U, 0, beacon.y * U);
      const pulse = 0.75 + 0.25 * Math.sin(t * 4);
      m.flame.scale.set(0.18 * pulse, 0.5 * (0.9 + 0.2 * Math.sin(t * 9)), 0.18 * pulse); m.core.scale.set(0.09, 0.3 * (0.9 + 0.2 * Math.sin(t * 11)), 0.09);
      m.halo.material.opacity = 0.7 + 0.25 * pulse; m.beam.material.opacity = 0.35 + 0.2 * pulse;
      m.ring.rotation.z = t * 0.5; m.ring2.rotation.z = -t * 0.8;
      m.mark.visible = !!(beacon.marked || beacon.ping > 0); m.mark.scale.setScalar(1 + 0.08 * Math.sin(t * 6));
      beaconLight.position.set(beacon.x * U, 1.4, beacon.y * U); beaconLight.visible = true; beaconLight.intensity = 4.2 + 1.2 * pulse;
    } else beaconLight.visible = false;
    if (darkBeacon) {
      live.add(darkBeacon); const m = getModel(darkBeacon, buildDarkBeacon); m.g.position.set(darkBeacon.x * U, 0, darkBeacon.y * U);
      m.crystal.rotation.y = t * 0.9; m.crystal.position.y = 0.95 + Math.sin(t * 2) * 0.05; m.halo.material.opacity = 0.6 + 0.2 * Math.sin(t * 2.5); m.ring.rotation.z = t * 0.7;
    }
    if (typeof hushStone !== 'undefined' && hushStone) {
      live.add(hushStone); const m = getModel(hushStone, buildHushStone);
      m.g.position.set(hushStone.x * U, 0, hushStone.y * U);
      m.halo.material.color.setHex(state.music ? 0xffd76a : 0x6a6a6a);
      m.halo.material.opacity = state.music ? 0.6 : 0.25;
    }
    if (typeof beckyBox !== 'undefined' && beckyBox) {
      live.add(beckyBox); const m = getModel(beckyBox, buildBeckyBox);
      m.g.position.set(beckyBox.x * U, 0, beckyBox.y * U);
    }
    for (const r of runestones) {
      live.add(r); const m = getModel(r, buildRunestone); m.g.position.set(r.x * U, 0, r.y * U);
      m.halo.material.opacity = 0.25 + 0.15 * Math.sin(t * 2.2 + r.x); m.ping.visible = r.ping > 0; m.ping.scale.setScalar(1 + 0.1 * Math.sin(t * 6));
    }
    for (const p of pickups) {
      live.add(p); const m = getModel(p, () => buildPickup(p.kind));
      m.g.position.set(p.x * U, 0.08 * Math.sin(t * 2.4 + p.x), p.y * U); m.g.rotation.y = t * 1.2;
      m.ping.visible = p.ping > 0; m.ping.position.y = -m.g.position.y + 0.05;
    }
    for (const n of npcs) {
      live.add(n); const m = getModel(n, () => buildNpc(n.kind));
      m.g.position.set(n.x * U, n.kind === 'wright' ? 0.15 + Math.sin(t * 1.6) * 0.06 : 0, n.y * U);
      const dx = player.x - n.x, dy = player.y - n.y;
      m.ry = angLerp(m.ry === undefined ? 0 : m.ry, Math.PI / 2 - Math.atan2(dy, dx), Math.min(1, dt * 4)); m.g.rotation.y = m.ry;
      if (m.real) { realPlay(m, 'Idle'); if (m.mixer) m.mixer.update(dt); if (m.mark) { m.mark.visible = !n.talked; m.mark.position.y = 2.5 + Math.sin(t * 4) * 0.05; } }
      else { m.body.rotation.z = Math.sin(t * 1.5 + n.x) * 0.02; m.mark.visible = !n.talked; m.mark.position.y = 1.35 + Math.sin(t * 4) * 0.05; }
    }
    if (raven) {
      live.add(raven); const m = getModel(raven, buildRaven);
      const h = 1.15 + Math.sin(t * 3) * 0.06;
      m.g.position.set(raven.x * U, h, raven.y * U);
      const ang = Math.atan2(raven.y - (m.py === undefined ? raven.y : m.py), raven.x - (m.px === undefined ? raven.x : m.px));
      if (Math.hypot(raven.x - (m.px || raven.x), raven.y - (m.py || raven.y)) > 0.3) m.g.rotation.y = angLerp(m.g.rotation.y, Math.PI / 2 - ang, 0.2);
      m.px = raven.x; m.py = raven.y;
      const f = Math.sin(t * 18) * 0.7; m.wl.rotation.z = f; m.wr.rotation.z = -f;
    }

    // enemies
    for (const e of enemies) {
      live.add(e); const m = getModel(e, () => buildEnemy(e.kind));
      place(m, e, dt, e.face || 0, 10);
      const moving = !(Math.abs(e.vx) > 1 || Math.abs(e.vy) > 1);
      // 3.7.0 combat readability: a small billboard HP bar above every foe,
      // so you can tell at a glance which one is almost down.
      if (m.maxHp === undefined) m.maxHp = e.hp;
      if (!m.hpBar) {
        const bar = new T.Group();
        const bg = new T.Mesh(new T.PlaneGeometry(0.9, 0.09), new T.MeshBasicMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0.75, depthTest: false }));
        const fg = new T.Mesh(new T.PlaneGeometry(0.86, 0.06), new T.MeshBasicMaterial({ color: 0x7ec850, transparent: true, opacity: 0.95, depthTest: false }));
        fg.position.z = 0.001; bar.add(bg); bar.add(fg); bar.position.y = 2.3; bar.renderOrder = 9;
        m.g.add(bar); m.hpBar = bar; m.hpFg = fg;
      }
      const frac = Math.max(0, e.hp / Math.max(1, m.maxHp));
      m.hpFg.scale.x = Math.max(0.01, frac); m.hpFg.position.x = -(1 - frac) * 0.43;
      m.hpFg.material.color.setHex(frac < 0.3 ? 0xe5484d : 0x7ec850);
      m.hpBar.lookAt(cam.position);
      if (m.real) { realPlay(m, moving ? 'Walking_A' : 'Idle'); if (m.mixer) m.mixer.update(dt); m.g.position.y = 0; }
      else {
        const ph = t * (e.kind === 'wolf' ? 14 : 6) + e.x * 0.05;
        m.g.position.y = e.kind === 'wolf' || e.kind === 'spider' ? 0 : Math.abs(Math.sin(ph)) * 0.025;
        if (m.legs && m.kind === 'wolf') m.legs.forEach((l, i) => { l.rotation.x = Math.sin(ph + (i % 2 ? Math.PI : 0) + (i > 1 ? 1.2 : 0)) * 0.6; });
        else if (m.legs && m.kind === 'spider') m.legs.forEach((p) => { p.rotation.z = Math.sin(ph * 1.5 + p.userData.k * 1.1 + (p.userData.side > 0 ? Math.PI : 0)) * 0.12; p.rotation.y = p.userData.base * 0.6 + Math.sin(ph * 1.5 + p.userData.k) * 0.08; });
        else walkAnim(m, ph, 0.5, true);
        if (m.tail) m.tail.rotation.z = Math.sin(t * 8 + e.x) * 0.35;
        if (m.body && m.kind !== 'wolf' && m.kind !== 'spider') m.body.rotation.z = Math.sin(t * 3 + e.x) * 0.05;
        if (m.orb) m.orb.scale.setScalar(0.08 + Math.sin(t * 4) * 0.012);
        m.g.scale.setScalar((m.s0 || 1) * (e.kind === 'king' && e.charge > 0 ? 1 + Math.sin(t * 40) * 0.05 : 1));
        flash(m, e.flash > 0 ? 1 : 0, 0xff8a6a);
      }
    }
    // allies
    for (const a of allies) {
      live.add(a); let m = getModel(a, () => buildAlly(a));
      if (m.allyKind !== undefined && m.allyKind !== a.kind) { entRoot.remove(m.g); models.delete(a); m = getModel(a, () => buildAlly(a)); }
      place(m, a, dt, a.face || 0, 12);
      const mv = !!a.order; m.g.visible = !(a.iframes > 0 && Math.floor(t * 14) % 2 === 0);
      if (m.real) { realPlay(m, a.swing > 0 ? '1H_Melee_Attack_Chop' : mv ? 'Walking_A' : 'Idle'); if (m.mixer) m.mixer.update(dt); }
      else { walkAnim(m, t * 12, 0.6, mv); if (m.armR) { if (a.swing > 0) m.armR.rotation.x = -1.2 + Math.sin((0.28 - a.swing) / 0.28 * Math.PI) * 1.8; else m.armR.rotation.x = 0; } }
    }
    // Kari
    if (player) {
      live.add(player);
      const style = armorStyle(); const tier = state.armorTier;
      const realReady = !!(kariGLTF && kariMixer);
      let m = models.get(player);
      if (m && realReady && m.kind !== 'kariReal') { entRoot.remove(m.g); models.delete(player); m = null; }
      if (m && !m.real && m.tier !== tier) { entRoot.remove(m.g); models.delete(player); m = null; }
      if (m && m.heroKind !== undefined && m.heroKind !== (player.kind || 'kari')) { entRoot.remove(m.g); models.delete(player); m = null; }
      if (!m) {
        if (player.kind && player.kind !== 'kari') {
          // 4.0.0: playing as a folk hero — use their real model, not Kari's Mage
          m = makeRealModel(allyModelKey({ kind: player.kind }), 1.9); m.kind = 'kariReal'; m.heroKind = player.kind; models.set(player, m); entRoot.add(m.g);
        } else if (realReady) {
          const g = new T.Group(); g.add(kariGLTF.root);
          m = { g, kind: 'kariReal', real: true, s0: 1, tier, heroKind: 'kari' }; models.set(player, m); entRoot.add(m.g);
        } else {
          m = buildKari({ cloak: style.cloak, dark: style.dark, trim: style.trim, tier }); m.ry = undefined; m.heroKind = 'kari'; models.set(player, m); entRoot.add(m.g);
        }
      }
      if (m.real) m.tier = tier;
      place(m, player, dt, player.face || 0, 16);
      const bob = player.moving ? Math.sin(player.bobPhase) : 0;
      m.g.position.y = Math.abs(bob) * 0.04;
      m.g.visible = !(player.iframes > 0 && Math.floor(t * 14) % 2 === 0) && !(R3.mode === 'fps');
      lantern.position.set(player.x * U, 1.7, player.y * U); lantern.intensity = 3.5 + 0.3 * Math.sin(t * 7);
      if (m.real && player.kind && player.kind !== 'kari') {
        realPlay(m, player.swing > 0 ? '1H_Melee_Attack_Chop' : player.moving ? 'Walking_A' : 'Idle');
        if (m.mixer) m.mixer.update(dt);
      } else if (m.real) {
        // real Mage clips: swing = spellcast, moving = walk, else idle.
        // The mixer is advanced here, once per frame, with the sim's dt.
        // 3.7.0: the primitive Kari had a visible blue swing arc; the real
        // Mage did not, so swings read as nothing. Give the real model one.
        if (!m.arc) {
          const arc = new T.Mesh(new T.TorusGeometry(0.55, 0.05, 8, 24, Math.PI * 0.9), new T.MeshBasicMaterial({ color: 0x4a90d8, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }));
          arc.rotation.x = Math.PI / 2; arc.position.set(0, 0.9, 0.45); m.g.add(arc); m.arc = arc;
        }
        const kk = player.swing > 0 ? (0.28 - player.swing) / 0.28 : -1;
        m.arc.material.opacity = kk >= 0 ? Math.sin(kk * Math.PI) * 0.85 : 0;
        kariPlay(player.swing > 0 ? 'Spellcasting' : player.moving ? 'Walking_A' : 'Idle');
        if (kariMixer) kariMixer.update(dt);
      } else {
        walkAnim(m, player.bobPhase, 0.7, player.moving);
        m.body.rotation.z = player.moving ? bob * 0.04 : Math.sin(t * 2.5) * 0.012; m.body.position.y = 0.3 + (player.moving ? 0 : Math.sin(t * 2.5) * 0.008);
        const k = player.swing > 0 ? (0.28 - player.swing) / 0.28 : -1;
        if (k >= 0) {
          m.arm.rotation.y = -1.1 + k * 2.2; m.arm.rotation.x = 0;
          if (m.staff) m.staff.rotation.x = -Math.sin(k * Math.PI) * 0.9;
          if (m.crystal) m.crystal.scale.set(0.09 * (1 + Math.sin(k * Math.PI) * 0.5), 0.14 * (1 + Math.sin(k * Math.PI) * 0.5), 0.09);
          if (m.crystalGlow) m.crystalGlow.material.opacity = 0.4 + Math.sin(k * Math.PI) * 0.6;
          if (m.arc) m.arc.material.opacity = Math.sin(k * Math.PI) * 0.85;
          m.g.scale.setScalar(m.s0 * 1.06);
        } else {
          m.arm.rotation.y = 0;
          if (m.staff) m.staff.rotation.x = 0;
          if (m.crystalGlow) m.crystalGlow.material.opacity = 0.4;
          if (m.arc) m.arc.material.opacity = 0;
          m.g.scale.setScalar(m.s0);
        }
        if (m.crystal && k < 0) { const cp = 1 + 0.3 * Math.sin(t * 5); m.crystal.scale.set(0.09 * cp, 0.14 * cp, 0.09 * cp); }
      }
      if (m.g.visible === false && R3.mode === 'fps') fpsSword.visible = true;
      if (R3.mode === 'fps') { const kk = player.swing > 0 ? (0.28 - player.swing) / 0.28 : 0; fpsSword.rotation.z = -0.5 + Math.sin(kk * Math.PI) * 1.6; fpsSword.rotation.x = -0.3 - Math.sin(kk * Math.PI) * 0.4; }
    }

    // models whose sim object is gone: let them fall over and fade out
    for (const [o, m] of models) {
      if (live.has(o)) continue;
      models.delete(o);
      if (m.kind === 'beacon' || m.kind === 'dark' || m.kind === 'rune' || m.kind === 'mead' || m.kind === 'key' || m.kind === 'loot' || m.kind === 'npc' || m.kind === 'ally' || m.kind === 'raven' || m.kind === 'kari') { entRoot.remove(m.g); continue; }
      m.dead = 0; dying.push(m);
    }
    for (let i = dying.length - 1; i >= 0; i--) {
      const m = dying[i]; m.dead += dt;
      const k = Math.min(1, m.dead / 0.4);
      m.g.rotation.x = -k * 1.4; m.g.position.y = -k * 0.1; m.g.scale.setScalar(Math.max(0.01, (m.g.scale.x || 1) * (1 - k * 0.04)));
      if (k >= 1) { entRoot.remove(m.g); dying.splice(i, 1); }
    }
    // torches flicker + the nearest four get real lights
    const near = torches.map((tc) => ({ tc, d: (tc.x + 0.5 - player.x * U) ** 2 + (tc.y + 0.5 - player.y * U) ** 2 })).sort((a, b) => a.d - b.d);
    torchPool.forEach((l, i) => {
      const n = near[i]; if (!n) { l.visible = false; return; }
      l.visible = true; l.position.copy(n.tc.pos); l.intensity = 3.8 + 1.6 * torchFlame(n.tc.x, n.tc.y);
    });
    for (const tc of torches) {
      const f = torchFlame(tc.x, tc.y);
      tc.flame.scale.set(0.07 * (0.8 + f * 0.3), 0.26 * (0.7 + f * 0.5), 0.07 * (0.8 + f * 0.3)); tc.halo.material.opacity = 0.5 + 0.3 * f;
    }
    // gates open
    for (const gt of gates) if (gt._m3) gt._m3.visible = !gt.open;
    for (const gt of (typeof heroGates !== 'undefined' ? heroGates : [])) if (gt._m3) gt._m3.visible = !gt.open;
    // crystals pulse, water shimmers — tracked lists only, no full scene scan
    for (const c of pulseObjs) c.children.forEach((k) => { if (k.isSprite) k.material.opacity = 0.35 + 0.2 * Math.sin(t * 2 + c.position.x); });
    for (const c of waterObjs) c.userData.water.material.emissiveIntensity = 0.6 + 0.4 * Math.sin(t * 2 + c.position.x * 3);
  }

  /* ---------- weather: a camera-following particle volume ---------- */
  const weather = (function () {
    const N = 360, BOX = [18, 9, 18]; // 3.0.1: 500 -> 360 weather points, same volume
    const geo = new T.BufferGeometry(); const pos = new Float32Array(N * 3), vel = new Float32Array(N * 3);
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    const mat = new T.PointsMaterial({ size: 0.07, map: glowTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true });
    const pts = new T.Points(geo, mat); pts.frustumCulled = false; scene.add(pts);
    let kind = null;
    function reseed(i, initial) {
      pos[i * 3] = (Math.random() - 0.5) * BOX[0]; pos[i * 3 + 2] = (Math.random() - 0.5) * BOX[2];
      pos[i * 3 + 1] = initial ? Math.random() * BOX[1] : (kind === 'embers' ? 0 : BOX[1]);
      let vx = 0, vy = 0, vz = 0;
      if (kind === 'snow') { vy = -(0.6 + Math.random() * 0.7); vx = (Math.random() - 0.5) * 0.5; }
      else if (kind === 'rain') { vy = -(9 + Math.random() * 3); vx = -0.8; }
      else if (kind === 'ash') { vy = -(0.4 + Math.random() * 0.5); vx = -0.5 - Math.random() * 0.5; }
      else if (kind === 'embers') { vy = 0.5 + Math.random() * 0.8; vx = (Math.random() - 0.5) * 0.6; }
      vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz;
    }
    return {
      rebuild(k) {
        kind = k || null; pts.visible = !!kind; if (!kind) return;
        mat.color.set(kind === 'snow' ? 0xe8f0ff : kind === 'rain' ? 0x7aa8d8 : kind === 'ash' ? 0xaaaaaa : 0xff9a3c);
        mat.size = kind === 'rain' ? 0.045 : kind === 'embers' ? 0.12 : 0.09; mat.opacity = kind === 'rain' ? 0.55 : 0.85;
        for (let i = 0; i < N; i++) reseed(i, true);
      },
      update(dt, cx, cz) {
        if (!kind) return;
        for (let i = 0; i < N; i++) {
          pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
          if (kind === 'snow') pos[i * 3] += Math.sin(clock3 * 1.2 + i) * 0.004;
          const dx = pos[i * 3] - 0, dz = pos[i * 3 + 2];
          if (pos[i * 3 + 1] < 0 || pos[i * 3 + 1] > BOX[1]) reseed(i, false);
        }
        pts.position.set(cx, 0, cz); geo.attributes.position.needsUpdate = true;
      },
    };
  })();

  /* ---------- sim particles (hit stars, dust, sparkles) as additive points ---------- */
  const PN = 300; const pgeo = new T.BufferGeometry();
  const ppos = new Float32Array(PN * 3), pcol = new Float32Array(PN * 3);
  pgeo.setAttribute('position', new T.BufferAttribute(ppos, 3)); pgeo.setAttribute('color', new T.BufferAttribute(pcol, 3));
  const ppts = new T.Points(pgeo, new T.PointsMaterial({ size: 0.2, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
  ppts.frustumCulled = false; scene.add(ppts);
  function syncParticles() {
    let n = 0;
    for (const p of particles) {
      if (p.t > 2 || n >= PN) continue; // weather lives in its own system
      col.set(p.color);
      const a = Math.min(1, p.t * 2) * (p.a || 1);
      ppos[n * 3] = p.x * U; ppos[n * 3 + 1] = 0.35 + (p.shape === 'star' ? (0.7 - Math.min(0.7, p.t)) * 0.9 : (0.5 - Math.min(0.5, p.t)) * 0.5); ppos[n * 3 + 2] = p.y * U;
      pcol[n * 3] = col.r * a; pcol[n * 3 + 1] = col.g * a; pcol[n * 3 + 2] = col.b * a; n++;
    }
    pgeo.setDrawRange(0, n); pgeo.attributes.position.needsUpdate = true; pgeo.attributes.color.needsUpdate = true;
  }

  /* ---------- floating numbers: a DOM pool projected from 3D ---------- */
  const floatEls = [];
  const floatLayer = document.createElement('div'); floatLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:3;overflow:hidden';
  document.getElementById('wrap').appendChild(floatLayer);
  const v3 = new T.Vector3();
  function syncFloats() {
    let i = 0;
    for (const f of floats) {
      let el = floatEls[i];
      if (!el) { el = document.createElement('div'); el.style.cssText = 'position:absolute;transform:translate(-50%,-50%);font:bold 22px Georgia,serif;color:#fff;text-shadow:0 0 4px #1a1210,2px 2px 0 #1a1210,-2px -2px 0 #1a1210,2px -2px 0 #1a1210,-2px 2px 0 #1a1210;white-space:nowrap'; floatLayer.appendChild(el); floatEls.push(el); }
      v3.set(f.x * U, 1.3 + (1 - Math.min(1, f.t)) * 0.4, f.y * U).project(cam);
      el.style.display = v3.z < 1 ? 'block' : 'none';
      el.style.left = ((v3.x * 0.5 + 0.5) * 100) + '%'; el.style.top = ((-v3.y * 0.5 + 0.5) * 100) + '%';
      el.style.opacity = Math.min(1, f.t); el.style.fontSize = (f.t > 0.8 ? 28 : 22) + 'px'; el.textContent = f.txt; i++;
    }
    for (; i < floatEls.length; i++) floatEls[i].style.display = 'none';
  }

  /* ---------- camera ---------- */
  const fpsSword = new T.Group(); cam.add(fpsSword); scene.add(cam);
  (function () {
    // first-person weapon is the rune staff too, not a sword
    const shaft = mesh(G.cyl, toon(0x4a3220), 0, 0, 0, false); sc(shaft, 0.03, 0.7, 0.03); fpsSword.add(shaft);
    const crys = mesh(G.oct, new T.MeshStandardMaterial({ color: 0x4a90d8, emissive: 0x4a90d8, emissiveIntensity: 3, roughness: 0.25, flatShading: true }), 0, 0.42, 0, false); sc(crys, 0.07, 0.11, 0.07); fpsSword.add(crys);
    const gl = glowSprite(0x4a90d8, 0.5, 0.5); gl.position.y = 0.42; fpsSword.add(gl);
    fpsSword.position.set(0.38, -0.42, -0.7); fpsSword.visible = false;
  })();
  const camPos = new T.Vector3(), camLook = new T.Vector3(); let camInit = false;
  function updateCamera(dt) {
    const px = player.x * U, pz = player.y * U;
    let tp = new T.Vector3(), tl = new T.Vector3();
    if (R3.mode === 'fps') {
      const f = player.face || 0;
      const look = R3.fpsYaw !== undefined ? R3.fpsYaw : f;
      const pf = R3.pitchF === undefined ? 0.5 : R3.pitchF;
      tp.set(px, 0.82, pz); tl.set(px + Math.cos(look) * 3, 0.82 - (pf - 0.5) * 2.6, pz + Math.sin(look) * 3);
      cam.fov = 72;
    } else if (R3.mode === 'iso') {
      const phi = Math.PI / 2 + Math.PI / 4, pitch = 0.78, d = 15;
      tp.set(px + Math.cos(phi) * Math.cos(pitch) * d, Math.sin(pitch) * d, pz + Math.sin(phi) * Math.cos(pitch) * d); tl.set(px, 0.5, pz); cam.fov = 30;
    } else {
      const d = R3.dist, p = R3.pitch;
      tp.set(px + Math.cos(R3.yaw) * Math.cos(p) * d, 0.7 + Math.sin(p) * d, pz + Math.sin(R3.yaw) * Math.cos(p) * d); tl.set(px, 0.7, pz); cam.fov = 44;
    }
    if (!camInit || R3.snap) { camPos.copy(tp); camLook.copy(tl); camInit = true; R3.snap = false; }
    const k = R3.mode === 'fps' ? 1 : 1 - Math.pow(0.0008, dt);
    camPos.lerp(tp, k); camLook.lerp(tl, k);
    cam.position.copy(camPos); cam.lookAt(camLook);
    if (R3.mode !== 'fps') cam.rotation.z = 0;
    cam.updateProjectionMatrix();
    fpsSword.visible = R3.mode === 'fps';
    // moon follows the player so the shadow frustum stays tight
    moon.position.set(px + 6, 12, pz + 4); moon.target.position.set(px, 0, pz); moon.target.updateMatrixWorld();
  }

  // wall cutaway: blocks between the camera and Kari sink low so she is never hidden
  // 3.0.1 perf: wall cutaway used to rewrite every wall matrix and re-upload
  // the whole instance buffer every frame, even standing still. Now it runs
  // only when the camera/player moved, and only uploads when a wall actually
  // changed height — the occasional hitch when orbiting was this buffer upload.
  let wallFrame = 0, wallLastCam = null, wallSettled = true;
  function updateWalls(dt) {
    if (!wallInst) return;
    wallFrame++;
    const px = player.x * U, pz = player.y * U;
    const camKey = Math.round(cam.position.x * 4) + ',' + Math.round(cam.position.z * 4) + ',' + R3.mode;
    const moved = wallLastCam !== camKey;
    wallLastCam = camKey;
    if (!moved && wallSettled) return;
    if (wallFrame % 2 === 1 && !moved) return; // settling animation, half rate
    const cx = cam.position.x - px, cz = cam.position.z - pz, cl = Math.hypot(cx, cz) || 1, ux = cx / cl, uz = cz / cl;
    let changed = false, snapped = false;
    for (let i = 0; i < wallData.length; i++) {
      const w = wallData[i];
      const rx = w.x + 0.5 - px, rz = w.y + 0.5 - pz;
      const along = rx * ux + rz * uz, side = Math.abs(rx * -uz + rz * ux);
      const open = state.grid[w.y][w.x] !== '#';
      w.tf = open ? 0 : (R3.mode !== 'fps' && along > -0.6 && along < cl && side < 2.4 + along * 0.3) ? 0.2 : 1;
      const prev = w.f;
      w.f += (w.tf - w.f) * Math.min(1, dt * 9);
      if (Math.abs(w.f - prev) < 0.005 && Math.abs(w.tf - w.f) < 0.01) { if (w.f !== w.tf) snapped = true; w.f = w.tf; }
      else changed = true;
      // f = 1 stands full height, f -> 0 sinks the block into the floor
      const top = (WH - w.base) * w.f + 0.12 * (1 - w.f) - 0.12; // top face height
      dummy.position.set(w.x + 0.5, top - WH / 2, w.y + 0.5); dummy.scale.set(1, 1, 1); dummy.rotation.set(0, 0, 0); dummy.updateMatrix();
      wallInst.setMatrixAt(i, dummy.matrix);
    }
    wallSettled = !changed;
    if (changed || moved || snapped) wallInst.instanceMatrix.needsUpdate = true;
  }

  /* ---------- hooks ---------- */
  let clock3 = 0, lastNow = performance.now();
  // 3.0.1 adaptive quality: if the phone sustains >28ms frames for 90 frames,
  // step down once to DPR 1.0, then once more to shadows off. It never steps
  // back up mid-session, so it cannot oscillate and stutter.
  let perfFrames = 0, perfSum = 0, perfLevel = 0;
  function render3D() {
    if (!player || !state.grid) return;
    const now = performance.now(); const dt = Math.min(0.05, (now - lastNow) / 1000); lastNow = now; clock3 += dt;
    perfFrames++; perfSum += dt;
    if (perfFrames >= 90) {
      const avg = perfSum / perfFrames; perfFrames = 0; perfSum = 0;
      if (avg > 0.028 && perfLevel === 0) {
        perfLevel = 1;
        try { renderer.setPixelRatio(1); renderer.setSize(window.innerWidth, window.innerHeight, false); } catch (e) {}
      } else if (avg > 0.028 && perfLevel === 1) {
        perfLevel = 2;
        try { renderer.shadowMap.enabled = false; } catch (e) {}
      }
    }
    if (built !== state.grid) { models.forEach((m) => entRoot.remove(m.g)); models.clear(); dying.length = 0; buildLevel(); R3.snap = true; }
    syncEntities(dt, clock3);
    for (const c of chestModels) c.g.visible = !(state.lootedChests && state.lootedChests.has(c.x + ',' + c.y));
    updateCamera(dt); updateWalls(dt);
    weather.update(dt, camLook.x, camLook.z);
    syncParticles(); syncFloats();
    if (state.shake > 0) cam.position.add(new T.Vector3((Math.random() - 0.5) * state.shake * 0.01, (Math.random() - 0.5) * state.shake * 0.01, 0));
    renderer.render(scene, cam);
    if (state.fade > 0) { c3.style.opacity = String(1 - state.fade * 0.7); } else c3.style.opacity = '1';
  }

  const orig = { draw: window.draw, drawIso: window.drawIso, inputVector: window.inputVector, attack: window.attack };
  window.attack = function () { if (R3.enabled && R3.mode === 'fps' && player && R3.fpsYaw !== undefined) player.face = R3.fpsYaw; return orig.attack(); };
  function enable(on) {
    R3.enabled = on;
    c3.style.display = on ? 'block' : 'none'; floatLayer.style.display = on ? 'block' : 'none';
    document.getElementById('game').style.visibility = on ? 'hidden' : 'visible';
    window.draw = on ? render3D : orig.draw; window.drawIso = on ? render3D : orig.drawIso;
    const b = document.getElementById('dimBtn'); if (b) b.textContent = on ? '3D' : '2D';
    const vb = document.getElementById('viewBtn'); if (vb) vb.style.display = on ? 'none' : '';
    const cb = document.getElementById('camBtn'); if (cb) cb.style.display = on ? '' : 'none';
  }
  window.inputVector = function () {
    const v = orig.inputVector(); if (!R3.enabled || (!v.x && !v.y)) return v;
    const phi = R3.mode === 'iso' ? Math.PI * 0.75 : R3.mode === 'fps' ? (R3.fpsYaw !== undefined ? R3.fpsYaw + Math.PI : (player.face || 0) + Math.PI) : R3.yaw;
    const s = Math.sin(phi), c = Math.cos(phi);
    return { x: v.x * s + v.y * c, y: -v.x * c + v.y * s };
  };

  // camera controls: drag the right side to orbit, Q/E rotate, CAM cycles chase / iso / first person
  let drag = null;
  c3.addEventListener('pointerdown', (e) => {
    if (state.cmd) { commandPick(e); return; }
    if (e.clientX < window.innerWidth * 0.55) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    try { c3.setPointerCapture(e.pointerId); } catch (err) {}
  });
  c3.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
    if (R3.mode === 'fps') { R3.fpsYaw = (R3.fpsYaw !== undefined ? R3.fpsYaw : player.face) + dx * 0.006; R3.pitchF = Math.max(0.1, Math.min(0.9, (R3.pitchF === undefined ? 0.5 : R3.pitchF) + dy * 0.003)); }
    else { R3.yaw += dx * 0.006; R3.pitch = Math.max(0.35, Math.min(1.3, R3.pitch + dy * 0.004)); }
  });
  const endDrag = (e) => { if (drag && e.pointerId === drag.id) drag = null; };
  c3.addEventListener('pointerup', endDrag); c3.addEventListener('pointercancel', endDrag);
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'q') R3.yaw -= 0.18; if (k === 'e') R3.yaw += 0.18;
    if (k === 'c') cycleCam();
  });
  function cycleCam() {
    const order = ['chase', 'iso', 'fps']; R3.mode = order[(order.indexOf(R3.mode) + 1) % 3];
    if (R3.mode === 'fps') { R3.fpsYaw = player ? player.face : 0; R3.pitchF = 0.5; }
    R3.snap = true; const b = document.getElementById('camBtn'); if (b) b.textContent = R3.mode === 'chase' ? 'CAM' : R3.mode === 'iso' ? 'ISO' : 'FPS';
  }
  function commandPick(e) {
    if (state.screen !== 'play' || state.paused || !player) return;
    const r = c3.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = -((e.clientY - r.top) / r.height) * 2 + 1;
    const ray = new T.Raycaster(); ray.setFromCamera({ x: nx, y: ny }, cam);
    const hit = new T.Vector3(); if (!ray.ray.intersectPlane(new T.Plane(new T.Vector3(0, 1, 0), 0), hit)) return;
    const wx = hit.x * TILE, wy = hit.z * TILE;
    let best = null, bd = 30; for (const u of [player, ...allies]) { const d = Math.hypot(u.x - wx, u.y - wy); if (d < bd) { bd = d; best = u; } }
    if (best) { state.sel = state.sel.includes(best) ? state.sel.filter((u) => u !== best) : [best]; return; }
    let tgt = null, td = 34; for (const en of enemies) { if (en.hp <= 0) continue; const d = Math.hypot(en.x - wx, en.y - wy); if (d < td) { td = d; tgt = en; } }
    orderSelected(wx, wy, tgt);
  }
  const camBtn = document.getElementById('camBtn'); if (camBtn) camBtn.addEventListener('click', cycleCam);
  const dimBtn = document.getElementById('dimBtn'); if (dimBtn) dimBtn.addEventListener('click', () => enable(!R3.enabled));
  R3.enable = enable; R3.cycleCam = cycleCam; R3.renderer = renderer; R3.scene = scene; R3.camera = cam;
  enable(true);
})();
