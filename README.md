# Rune Warden

An original top-down Norse-inspired action game. Kari, keeper of the last
beacon, against the Hollow King.

This repo holds both lines of the game:

- **`2d/`** — the original 2D line (v1.9.0). Canvas-drawn, touch joystick +
  sword button, keyboard works, synth sound, best score saved on-device.
  Leveling, skills, armor tiers, the Anvil, and the Crystal Spider.
- **`3d/`** — the 3D line (v4.0.3), rendered in Three.js with real 3D
  models, a party system, and ten realms.

Each line builds its own Android app the same way:

```sh
export KS_PASS=<your keystore password>
python3 2d/android/build_apk.py   # or 3d/android/build_apk.py
```

The builds need Python 3 and JDK 17+. They fetch their tools from npm on
first run — no Android Studio or SDK needed. The keystore is never in this
repo; set `KS_PASS` before building.

## Notes

- The 3D models are binary files, so they are not in this repo. They are
  CC0 KayKit assets — see `3d/README.md` for which `.glb` files to get and
  where to put them.
- `2d/STORY-AND-GRAPHICS-PLAN.md` is the story and graphics plan.
- `3d/docs/intro-cutscene-draft.md` is a draft intro cutscene — a draft,
  not final.
