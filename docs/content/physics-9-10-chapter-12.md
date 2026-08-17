# Content Plan — Physics 9–10, Chapter 12

## Source

| Field | Value |
|---|---|
| Chapter | দ্বাদশ অধ্যায় — বিদ্যুতের চৌম্বক ক্রিয়া (Magnetic Effects of Current) |
| Book pages | 331–346 |
| PDF pages | 336–351 (offset +5, same as Chapters 1–11) |

## Confirmed section structure

| § | Title | Book p. |
|---|---|---|
| — | Chapter opener + objectives | 331 |
| ১২.১ | চুম্বক (Magnet) — poles, attraction/repulsion, Earth's field | 331 |
| ১২.২ | বিদ্যুতের চৌম্বক ক্রিয়া (Magnetic Effects of Current) — field around a current-carrying wire, right-hand grip rule, চিত্র ১২.০২–১২.০৪ | 331–333 |
| ১২.২.১ | সলিনয়েড (Solenoid) | 333–334 |
| ১২.২.২ | তাড়িতচুম্বক (Electromagnet) — strength ∝ current, coil turns | 334–335 |
| ১২.২.৩ | তড়িৎপ্রবাহী তারের ওপর চুম্বকের প্রভাব (Effect of a Magnet on a Current-Carrying Wire) — motor effect, চিত্র ১২.০৯ | 335–336 |
| ১২.২.৪ | ডিসি মোটর (DC Motor) — commutator, torque, চিত্র ১২.১০–১২.১১ | 336–338 |
| ১২.৩ | তড়িৎ চুম্বকীয় আবেশ (Electromagnetic Induction) — Oersted/Faraday, induced EMF from changing flux | 338–339 |
| ১২.৩.১ | জেনারেটর (Generator) — motor run in reverse | 339 |
| ১২.৩.২ | ট্রান্সফর্মার (Transformer) — Vp/np = Vs/ns, VpIp = VsIs, step-up/step-down, চিত্র ১২.১৩–১২.১৫ | 340–342 |
| — | নমুনা প্রশ্ন (Sample MCQs, creative and short questions) | 343–345 |

No unconfirmed section numbers this chapter — every heading was read directly off a printed page. Unlike Chapters 8–11, most of this chapter (§১২.১–১২.৩.১) is qualitative: the book gives deterministic rules (the right-hand grip rule, the proportionality of electromagnet strength to current and turns) rather than closed-form numeric equations. Only §১২.৩.২ (transformers) prints an algebraic relation with worked numeric examples. The Tier-1 plan below reflects that honestly — three of the four artefacts are rule-based direction/strength predictors rather than equation calculators, the same shape already used for Chapter 8's `SIM_LAW_OF_REFLECTION`.

## Key relations, as printed

```
Right-hand grip rule:   thumb = current direction, curled fingers = field direction  (p. 333)
Electromagnet strength:  field strength ∝ current, ∝ number of turns                   (p. 335)
Transformer voltage:     Vp/np = Vs/ns  =>  Vs = (ns/np)Vp                              (p. 341)
Transformer current:     VpIp = VsIs   =>  Is = (Vp/Vs)Ip = (np/ns)Ip                    (p. 341)
```

## Worked examples, as printed (traceable test fixtures)

- p. 342: primary 100 turns, secondary 1000 turns, 10 V **DC** applied to primary → 0 V induced (transformers do not work on DC — no changing flux).
- p. 342: same transformer, 12 V **AC** applied to primary → 120 V AC induced in secondary (step-up, ×10 turns ratio).
- p. 342: same transformer, 1 A in the primary → secondary current = (12/120) × 1 A = 0.1 A.
- p. 344 (sample MCQ, চিত্র ১২.১৪): 200 V primary, 100 turns primary, secondary reads 800 V at Iₛ = 50 mA → nₛ = 400 (a step-up transformer, ×4 ratio).
- p. 344 (সৃজনশীল প্রশ্ন ১, চিত্র ১২.১৫): 240 V primary, 50 turns primary, secondary reads 8 V at 0.9 A — a step-down transformer.

## Visualization and simulation plan

### Tier 1 — done

All four built, registered, seeded (`scripts/seedChapter12.ts`), and verified live (see the reinitialized-MySQL note in Chapter 11's plan — the same fresh instance and full reseed covered this chapter too). Signed in as the seeded student and walked all four lessons in a real browser: confirmed no negative-SVG-width regressions, confirmed `SIM_MAGNETIC_FIELD_DIRECTION` correctly flips between counter-clockwise and clockwise on reversing the current, confirmed `SIM_ELECTROMAGNET_STRENGTH`'s default (1 A, 50 turns) gives exactly 50, confirmed `SIM_DC_MOTOR` spins continuously through its dead points without stopping, confirmed `SIM_TRANSFORMER`'s default (12 V AC, 100→1000 turns) reproduces the book's own 120 V / 0.1 A step-up exactly. One real bug was found and fixed along the way — see the commit for detail.

#### 1. `SIM_TRANSFORMER` — ট্রান্সফর্মার, চিত্র ১২.১৩–১২.১৫

Digitises §১২.৩.২ (pp. 340–342) directly: adjustable primary/secondary turns and primary voltage, live secondary voltage from Vs = (ns/np)Vp and secondary current from Is = (np/ns)Ip, with a DC-vs-AC toggle that makes the secondary voltage collapse to zero on DC — the book's own first worked example. Tested against all three of the book's own numeric worked examples (12 V→120 V step-up; 1 A→0.1 A; the 100/1000-turn ratio itself) plus the two sample-question fixtures (200 V→800 V, nₛ=400; 240 V→8 V step-down).

#### 2. `SIM_MAGNETIC_FIELD_DIRECTION` — ডান হাতের নিয়ম, চিত্র ১২.০২–১২.০৫

Digitises §১২.২ (pp. 331–333) as a deterministic rule engine, the same shape as Chapter 8's `SIM_LAW_OF_REFLECTION`: given a current direction through a straight wire (up/down) or around a loop (clockwise/counter-clockwise as viewed), predicts the resulting magnetic field's circulation direction via the book's own right-hand grip rule, and lets a student check their own prediction against it.

#### 3. `SIM_ELECTROMAGNET_STRENGTH` — তাড়িতচুম্বক, চিত্র ১২.০৭

Digitises §১২.২.২ (pp. 334–335): a coil with adjustable current and number of turns, with a relative field-strength readout modelling the book's own explicit proportionality (strength ∝ current, ∝ turns) — not the book's printed formula (none is given), but its own stated qualitative relationship made quantitative and interactive, documented as such rather than attributed to a numeric equation the book does not print.

#### 4. `SIM_DC_MOTOR` — ডিসি মোটর, চিত্র ১২.০৯–১২.১১

Digitises §১২.২.৩–১২.২.৪ (pp. 335–338) as a rule engine: given the magnetic field's direction (N→S) and the current direction through a coil sitting in it, predicts which way the coil is pushed (motor effect), and shows why a commutator reversing that current every half-turn is what keeps a DC motor spinning continuously rather than settling at one angle — the book's own explanation, reproduced as an interactive check rather than only prose.

## Open items

None outstanding — every section and worked example was read directly from the printed page before this plan was written.
