# Rune Warden 3D (Kari)

The 3D line of Rune Warden: the same top-down Norse-inspired action game,
rendered in Three.js. Kari, keeper of the last beacon, against the Hollow
King — now with real 3D models, a party system, and ten realms.

Current version: 4.0.3.

## Run it

Open `index.html` in a browser (WebGL), or build the Android app:

```sh
export KS_PASS=<your keystore password>
python3 android/build_apk.py
```

The build needs Python 3 and JDK 17+. It fetches its tools from npm on
first run — no Android Studio or SDK needed. The keystore is never in this
repo; set `KS_PASS` before building.

## Models — not in this repo

The 3D models are binary files, so they are not included here. They are
CC0 KayKit assets. To run the game, get the KayKit character packs
(kaykit.com) and place these `.glb` files in `models/`:

- `mage.glb`, `knight.glb`, `barbarian.glb`, `rogue.glb`,
  `rogue_hooded.glb`
- `skeleton_minion.glb`, `skeleton_warrior.glb`, `skeleton_mage.glb`,
  `skeleton_rogue.glb`

## Notes

- `docs/intro-cutscene-draft.md` is a draft intro cutscene — a draft, not
  final.
- The 2D line lives in `2d/` in this repo.
