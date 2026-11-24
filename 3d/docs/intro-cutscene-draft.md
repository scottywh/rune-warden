# Rune Warden — intro cutscene draft (4.0.4 candidate, NOT built)

Drafted 2026-11-06 (evening) from what he said that night: little cutscenes
with Continue/Next buttons, folks to speak with, decisions along the way —
first one EARLY, before the first beacon — and choices that grow the two
endings into a branching set. Nothing here is in the game yet. This is the
script to react to; build only after he approves the shape and the lines.

## Where it plays

- On **New Game only**, before the Emberwood realm card (`showCard(0)`).
- Never on Continue — a checkpoint resume goes straight to the realm card.
- A **Skip** button on every beat, straight to Emberwood. Same
  `showScreen` panel pattern the realm cards already use, so it fits the
  existing UI: big buttons, Space to advance on the non-choice beats.

## The scene — "The Last Keeper"

Four short beats. Kari is named only as Kari / keeper — no pronouns,
per his standing call. Yrsa speaks only through a carved runestone,
as in the game now. Hrafn is the raven who already orbits Kari and
scouts; giving Hrafn one spoken line here is the one invention in
this draft — flagged below as an open question.

### Beat 1 — Continue

> **Emberwood. The beacon is dark.**
>
> Kari stands under the dead beacon, gold cloak against the cold.
> The last keeper. The Span is shattered, the other beacons dark,
> and nobody is coming to relight them.
>
> [Continue]

### Beat 2 — Continue

> A runestone at the foot of the beacon, cut in Yrsa's hand:
>
> *"A keeper walks toward the dark so others don't have to."*
>
> Yrsa is dead. The stone is all that's left of her voice.
>
> [Continue]

### Beat 3 — Continue

> Hrafn lands on the beacon's rim — black feathers, gold eye —
> and looks down the road, then back at Kari.
>
> *"The road is hungry, keeper. It ate the last wardens who
> walked it alone."*
>
> [Continue]

### Beat 4 — the choice (three buttons, no Continue)

> Hrafn waits. The road waits. What does Kari do?
>
> 1. **"Send Hrafn ahead — the realms need each other."**
>    → +1 Span (light lean). Hrafn scouts the road, as Hrafn
>    already does in play.
> 2. **"Keep Hrafn close — the road took the last wardens."**
>    → +1 Dark (caution lean). Hrafn stays orbiting Kari.
> 3. **"Let Hrafn choose."**
>    → no lean. Hrafn scouts anyway — the choice is Hrafn's,
>    not Kari's, and the game notes that too.
>
> [Begin — Emberwood]

No score, damage, loot, or enemy effect from any of the three.
The choice only votes on the ending, and the vote is visible
nowhere in play — it surfaces only in the ending text.

## How the choices grow the endings

One small counter, e.g. `state.lean = { span: 0, dark: 0 }`,
+1 per decision, carried in the checkpoint save (one new field
in the existing save — small change, flagged for the build).
The finale stays exactly as it is: walk to one of two beacons
in the Span's Heart. The lean only shades the text of the
ending Kari walks to:

- **Relight the Span, span-leaning (net +2 or more):**
  *"The Span is relit"* — as now, plus one line: the realms
  open to each other again, and Kari keeps the watch.
- **Relight the Span, mixed / no lean:** the current light
  ending text, unchanged.
- **Let it stay dark, dark-leaning (net +2 or more):**
  *"The Span stays dark"* — as now, plus one line: Emberwood's
  own beacon still burns, one light kept for whoever walks
  the road next.
- **Let it stay dark, mixed / no lean:** the current dark
  ending text, unchanged.

So two endings become four texts, not four new boss fights —
the branching is in the words Kari earns, which is the
choose-your-own-adventure shape at the smallest honest size.

## Later decision slots (banked, not drafted)

Same +1 vote, one per folk, so a full run can cast about
five votes before the finale:

- **Mira's trial (Ember Deep):** take the ember blade as a
  weapon, or as a promise to reforge the Span?
- **Tove's toll (Sunken Vault):** pay the crossing in a
  secret, or in a token?
- **Pike's cache (Cinder Wastes):** keep what Pike offers,
  or leave it for Pike's kin?
- **The Spanwright (Span's Heart):** the ghost's line is
  already in the game — *"One road opens the world. One road
  closes it. Both are mercy, keeper."* — a cutscene beat
  there writes itself.
- **The Hollow King:** Bjarni's dying line (*"Tell Yrsa...
  the winter held."*) is already in the game; the choice
  after it is the finale walk itself.

## Build notes (for when he says go)

- Reuse `showScreen` / the realm-card panel; beats advance on
  button or Space, exactly like `advanceCard()`.
- Choice buttons call a `chooseIntro(n)` that records the
  lean, then calls `showCard(0)`.
- Skip on any beat jumps straight to `showCard(0)` with no
  lean recorded.
- `state.lean` needs one field added to the checkpoint save
  and restored on Continue; death does not clear it (same
  rule as the rest of the checkpoint).
- No new art, no new models, no new audio. Hrafn, the
  runestone, and the beacon are all already drawn.

## Open questions for him

1. Hrafn speaking one line — right, or should the raven only
   caw and the beat stay silent? (Yrsa's runestone already
   carries the words; Hrafn could carry the choice without
   speaking.)
2. Is three choices on the first decision too many — cut it
   to two (send ahead / keep close), with "let Hrafn choose"
   dropped?
3. Beat 2 reuses Yrsa's existing Emberwood runestone line
   verbatim — keep it, or write a fresh line for the intro
   and leave the runestone as is?
4. Does the lean shading the ending text land, or does he
   want the branches to change something in play as well
   (a gift, a gate, a folk's line later)?
