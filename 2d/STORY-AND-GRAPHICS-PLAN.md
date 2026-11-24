# Rune Warden — Story Expansion & Graphics Upgrade Plan

Draft, 2026-11-03. Built on what already works: Kari, the gold cloak, the
three beacons, the Hollow King. Nothing here overwrites the current game;
it grows out of it.

**Status 2026-11-03 evening: Phase 1 (story content) and Phase 2 (sprites +
atmosphere) are implemented in v1.1.0, and v1.2.0 adds story depth (Bjarni's
own voice, the Spanwright, re-readable runestones), keys & gates, torchlight,
scenery, and sprite/animation polish. v1.3.0 pivots the look past the mockup's
pixel era into smooth cartoon animation (outlines, faces, squash & stretch,
dust, star bursts) and keeps growing the story (second stones, second NPC
lines, beacon visions, the King's dying line). v1.4.0 adds the simulated-3D
view he asked for: dimetric projection with standing cartoon figures, wall
blocks with shaded faces, depth-sorted drawing, low front rim so the room
stays visible, projected torchlight/particles/floats — default view, with an
ISO/TOP button to fall back to top-down. RPG stats/systems are parked
until the graphics are decent, per his call.** Six realms, NPCs, runestones,
raven scout, finale choice, sword/heart upgrades, sprite figures, weather,
hit-stop. Still open: Phase 4 presentation polish (title art, dialogue
portraits, intro cards).

**v1.8.0 (2026-11-04):** after his verdict that 1.7.0 went backwards
graphically except the title concept art — HUD de-cluttered (Skills/Craft/
Armor to the bottom quickbar, slim top bar, live minimap), stone-block
floors/walls, flickering wall torches with torchlight, blue crystals and
gold chests, Drowned Road water shimmer, beacon rune circle, armor-tier
looks for Kari, shield ring, and a real 8-legged Crystal Spider in both
views. Gameplay unchanged; all tests pass.

**v1.9.0 (2026-11-04):** after he clarified the graphics are still nowhere
near where he wants them — vision hero: Kari in blue steel armor with a
helmet and rune staff in both views, attacks as blue rune magic, beacon on
a rune pedestal inside a stone arch, moss, bigger crystals/chests, Kari
portrait and rune-icon quickbar. Gameplay unchanged; all tests pass.
Still canvas primitives, not painted vision art — that gap is the next
question, not a claim.

## Phase 0 — the gate (not negotiable)

Movement must be proven on his phone before anything is layered on top.
The v1.0.2 debug build (DBG readout: stick vector, input vector, Kari's
position) is the test. If the readout shows the stick dead, fix input
first. No new realms, no new systems on a hero who might not move.

## Part 1 — The story, made larger

### The spine that stays

The Sky Span — the bridge between realms — is shattered. The beacons
have gone dark. Kari, keeper of the Emberwood beacon, is the last warden
standing. She relights the beacons, one realm at a time, and walks toward
whoever broke the Span.

### What the expansion adds: the other wardens

There was an order of wardens, one per realm, and Kari is only the last
one left. Each realm holds the fate of its warden. Finding them is the
emotional spine: tokens, runestones, and one survivor who can still talk.

### Characters

- **Kari** (hero, unchanged at the core). Young, stubborn, gold cloak,
  keeps a beacon lit because somebody has to. Her design anchor stays:
  gold cloak, small against big rooms, a light that moves with her.
- **Old Yrsa** (mentor, voice only). Dead before the game starts. She
  speaks through carved runestones left along the road — short lines,
  practical, dry. Lore pickups, not cutscenes.
- **The Hollow King** (villain, deepened). He was **Bjarni**, warden of
  the deepest realm. When his people starved, he opened the Hollow to
  bargain for them — and the Hollow kept him. He is not cackling evil;
  he believes the Span must stay broken, because anything that can cross
  it can be taken. Tragic antagonist, fought, not just beaten.
- **Mira** (new, Frostfall). A smith who forges rune-blades. Gameplay
  tie: she upgrades Kari's sword after the Frostfall beacon is lit.
- **Tove** (new, Drowned Road). Ferryman of the marsh road. Talks in
  tolls: a token for a crossing, a secret for a shortcut.
- **Pike** (new, wandering). A draugr who kept his mind. Optional quests:
  find what his kin lost, and he opens a sealed door for you. Proof the
  Hollow doesn't take everyone whole.
- **Hrafn** (new, companion). A raven. Gameplay tie: send him ahead and
  he marks pickups and the beacon on the map for a few seconds. Scout,
  not a fighter.

### Realms: 3 → 6

1. **Emberwood** (exists). Kari's home beacon. Draugr in the trees.
2. **Frostfall** (exists). Ice-wolves, Mira's forge.
3. **The Drowned Road** (new). Marsh and black water. Drowned draugr,
   Tove's ferry, a warden's token under the waterline.
4. **Cinder Wastes** (new). Fire realm. Ember trolls, ash storms, the
   forge where rune-blades are born. Hardest normal realm.
5. **Hollow Hall** (exists, moved later). The Hollow King's seat.
6. **The Span's Heart** (new, finale). Where the Span broke. Boss fight
   with the Hollow King, then a choice, not just a victory screen:
   **relight the Span** (reopen the realms to each other, risk and all)
   or **let it stay dark** (safe, separate, lonely). Two endings, both
   earned. The choice is the story's thesis: connection is worth the risk.

### How the story is told (no long cutscenes)

- Runestones: Yrsa's lines, one or two sentences each, found on the road.
- NPC lines: Mira, Tove, Pike speak in 2–4 short exchanges when met.
- Beacon visions: each relit beacon shows a flash of its warden's fate.
- The finale choice is made by walking to one of two beacons. No menus.

## Part 2 — True graphics upgrades

### Where graphics are now

Flat canvas shapes: circles for people, flat tiles, one glow effect,
particles on hits only. Readable, but it is programmer art, and it shows
next to the DOS original's isometric rooms.

### Target look

Hand-crafted pixel-art style, readable on a phone screen, in the spirit
of the DOS original's isometric view — but with modern smoothness:
animated characters, lit beacons, weather, and weight to the sword.

### The upgrade path, in order of visible win per risk

**1. Sprites (biggest win, lowest risk).**
Replace circle characters with drawn sprite frames: 4-frame walk
cycles, an attack frame, a hurt flash, an idle breath. Same for
enemies (draugr shamble, wolf lope, troll stomp, king's crown and
cloak). Tiles get texture: grass blades, cracked stone, ice sheen,
wood grain, with per-tile variation so floors stop looking flat.
Beacons, fire, and water animate. All sprites drawn in code or embedded
as data — no downloads, no asset pipeline, APK stays tiny.

**2. Atmosphere (cheap, high feel).**
Dynamic light: beacon glow that actually lights nearby tiles, darkness
that closes in around Hollow Hall, torch flicker. Weather per realm:
embers in Emberwood, snow in Frostfall, ash in the Wastes, rain on the
Drowned Road. Better particles: embers, snowflakes, splash, blood of
light when the Hollow King is hit. Hit-stop (a beat of freeze on a
solid hit) and a heavier screen shake for the boss.

**3. Isometric view (the headline, the biggest rework).**
The DOS original was isometric, and that is the look he remembers.
Offer it as a view option, not a replacement: same game, diamond
projection, depth-sorted drawing (painter's algorithm, back-to-front),
taller sprites with a real sense of height. Movement math changes
(screen axes map to world diagonals), maps get bigger, and the camera
follows Kari instead of showing the whole room. This is the one phase
that can break things, so it lands after sprites and atmosphere, and
top-down stays available as a fallback.

**4. Presentation (the polish pass).**
Title art (Kari before a dark beacon, gold cloak lit), dialogue
portraits for Mira, Tove, Pike, and the Hollow King (simple drawn
faces, not full art), realm intro cards with a painted backdrop,
transitions (fade, iris) between realms, and a sound upgrade: short
chiptune-style loops per realm from the same tiny synth, still no
audio files.

### Technical notes for this stack

- Same architecture: one web page in the same WebView APK shell. No
  engine, no framework, no Play Store requirement.
- Performance: pre-render static tiles to an offscreen canvas once per
  realm; animate only characters, light, and particles each frame.
  Target 60fps on a mid-range phone.
- Size discipline: sprites as code or data URIs. The 25 KB miracle
  becomes maybe 150–300 KB with real art. Still tiny.
- Controls stay: left stick, sword button, keyboard. Isometric mode
  keeps the same stick — the mapping changes, the hands don't.

## Order of work

1. Phase 0: prove movement on his phone (debug build).
2. Phase 1: story content — new realms, characters, runestones, NPC
   lines, the finale choice. Playable in the current top-down engine.
3. Phase 2: sprite pass + atmosphere.
4. Phase 3: isometric view option.
5. Phase 4: presentation polish, then a 2.0 build.

Open questions for him: does the Hollow King-as-fallen-warden land, or
should he stay pure villain? Is the finale choice welcome, or should
victory be victory? Does isometric matter more than new realms, or the
other way round?
