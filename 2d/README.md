# Rune Warden (2D)

An original top-down Norse-inspired action game. Kari, keeper of the last
beacon, against the Hollow King.

- Touch joystick + sword button; keyboard works too
- Synth sound, best score saved on-device
- Leveling, skills, armor tiers, the Anvil, and the Crystal Spider

Current version: 1.9.0.

## Run it

Open `index.html` in a browser, or build the Android app:

```sh
export KS_PASS=<your keystore password>
python3 android/build_apk.py
```

The build needs Python 3 and JDK 17+. It fetches its tools from npm on
first run — no Android Studio or SDK needed. The keystore is never in this
repo; set `KS_PASS` before building.

## Notes

- `STORY-AND-GRAPHICS-PLAN.md` is the story and graphics plan for the game.
- The 3D line lives in `3d/` in this repo.
