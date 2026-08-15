# Content Plan — Physics 9–10, Chapter 4

## Source

| Field | Value |
|---|---|
| Chapter | চতুর্থ অধ্যায় — কাজ, ক্ষমতা ও শক্তি (Work, Power and Energy) |
| Book pages | 98–126 |
| PDF pages | 103–131 (offset +5, same as Chapters 1–3) |

## Confirmed section structure

| § | Title | Book p. |
|---|---|---|
| — | Chapter opener + objectives | 98–99 |
| ৪.১ | কাজ (Work), W = Fs | 100–101 |
| ৪.২ | শক্তি (Energy) — capacity to do work; positive work adds energy, negative work removes it | 102–103 |
| ৪.৩ | শক্তির বিভিন্ন রূপ (Different Forms of Energy) | 103 |
| ৪.৩.১ | গতিশক্তি (Kinetic Energy), T = ½mv², derived from F=ma and v²=u²+2as | 104–105 |
| ৪.৩.২ | বিভব শক্তি (Potential Energy) — spring V = ½kx² (চিত্র ৪.০২), gravitational W = mgh, v² = 2gh re-derived by the energy method | 106–109 |
| ৪.৪ | শক্তির বিভিন্ন উৎস (Sources of Energy), চিত্র ৪.০৩ | 110 |
| ৪.৪.১ | অনবায়নযোগ্য শক্তি (Non-Renewable): oil, gas, coal, nuclear (uranium) | 110–111 |
| ৪.৪.২ | নবায়নযোগ্য শক্তি (Renewable): hydro, biomass, solar, wind, biofuel, geothermal | 111–113 |
| ৪.৪.৩ | শক্তির রূপান্তর ও পরিবেশের উপর প্রভাব (Transformation and Environmental Effect) | 113 |
| ৪.৫ | শক্তির নিত্যতা এবং রূপান্তর (Conservation and Conversion of Energy) | 114 |
| ৪.৫.১ | শক্তির নিত্যতা (Conservation of Energy) — pendulum, চিত্র ৪.০৪, 8 labelled positions with T/V bars | 114–115 |
| ৪.৫.২ | শক্তির রূপান্তর (Conversion of Energy) — worked chain across electrical/chemical/heat/mechanical/light forms, চিত্র ৪.০৫ (nuclear plant) | 115–118 |
| ৪.৬ | ভর ও শক্তির সম্পর্ক (Relation between Mass and Energy), E = mc², নিউক্লিয়ার ফিশন চেইন বিক্রিয়া, চিত্র ৪.০৬ | 118–119 |
| ৪.৭ | ক্ষমতা (Power), P = W/t, unit W | 120 |
| ৪.৮ | কর্মদক্ষতা (Efficiency), η = (কাজ/প্রদত্ত শক্তি) × 100% | 121 |
| — | অনুসন্ধান ৪.০১: শারীরিক ক্ষমতা (physical-power investigation — climb stairs, measure m, h, t, compute P = mgh/t) | 122 |
| — | নমুনা প্রশ্ন (Sample MCQs, creative and short questions) | 123–126 |

No unconfirmed section numbers this chapter — every heading was read directly off a printed page.

## Key equations, as printed

```
Work:                    W = Fs                                (p. 100)
Kinetic energy:          T = ½mv²                               (p. 104)
Spring potential energy: V = ½kx²                                (p. 107)
Gravitational PE:        W = mgh,  v² = 2gh                      (p. 108)
Mass-energy:             E = mc²                                 (p. 118)
Power:                   P = W/t                                 (p. 120)
Efficiency:              η = (কাজের পরিমাণ / প্রদত্ত শক্তি) × 100%  (p. 121)
```

## Worked examples, as printed (traceable test fixtures)

- p. 101: 50 kg person climbs a 10-storey building (3 m/floor) → W = 490 N × 30 m = 14,700 J = 14.7 kJ.
- p. 102–103: 100 N force moves a body 10 m against 10 N friction (চিত্র ৪.০১) → applied work = 1000 J, friction work = −100 J.
- p. 105: 10 kg body, 10 N force for 10 s → a = 1 m/s², v = 10 m/s, T = 500 J; same force for 20 s → v = 20 m/s, T = 2000 J.
- p. 107: 10 kg body at 10 m/s strikes a spring, k = 100,000 J/m² → compresses x = 0.1 m.
- p. 109: 10 kg body thrown up at 100 m/s → rises h = 510 m (checked two ways: kinematics and energy).
- p. 121: 1000 W motor lifts 100 kg by 10 m in 15 s → work = 9800 J, energy supplied = 15,000 J, loss = 5200 J, η = 65.3%.

## Visualization and simulation plan

### Tier 1 — done

All four built, registered, seeded (`scripts/seedChapter4.ts`), and verified live: signed in as the seeded student, walked all four lessons in a real browser, confirmed no negative-SVG-width regressions, confirmed `SIM_WORK`'s defaults reproduce the চিত্র ৪.০১ example exactly (1000 J applied, −100 J friction), confirmed `SIM_POWER_EFFICIENCY`'s defaults reproduce the p. 121 worked example exactly (9800 J work, 15000 J supplied, 65.3% efficiency). Also fixed a real bug found along the way: the app header was hardcoded to Chapter 1's title regardless of which chapter's lessons were actually loaded — every student past Chapter 1 was seeing the wrong chapter name in the header. Fixed by threading the loaded chapter's title through `useLessonSource`.

#### 1. `SIM_WORK` — কাজ, চিত্র ৪.০১ (built this session)

Digitises §৪.১ directly (p. 100–103): a force pulls a block across a surface against friction. Live readouts for work done by the applied force (`W = Fs`) and work done by friction (`W = -fs`), signed explicitly — the book's own point that a negative work value is not "not work," it is work in the sense the book defines. Tested against both the climbing-stairs example (14.7 kJ) and the friction-block example (1000 J vs −100 J).

#### 2. `SIM_ENERGY_CONVERSION` — গতিশক্তি ও বিভব শক্তির রূপান্তর (built this session)

Digitises §৪.৩.১–৪.৩.২ (pp. 104–109): a body thrown upward or dropped, with live kinetic- and potential-energy readouts that exchange as height and speed change, checked against `T = ½mv²`, `V = mgh`, and the book's own re-derivation of `v² = 2gh` by the energy method rather than kinematics alone. Uses the printed 100 m/s throw (rises 510 m) as a test fixture.

#### 3. `SIM_PENDULUM_ENERGY` — চিত্র ৪.০৪, শক্তির নিত্যতা (built this session)

Direct digitisation of the book's own printed figure: a swinging pendulum with live T (kinetic) and V (potential) bars, reproducing the eight labelled positions (a–h) — T and V trade off but their sum stays constant, exactly the point the figure exists to make. A natural, distinct interaction shape from the other three (motion rather than a slider-driven static setup).

#### 4. `SIM_POWER_EFFICIENCY` — অনুসন্ধান ৪.০১ ও §৪.৮ (built this session)

Combines the book's own physical-power investigation (climb a flight of stairs of known height in measured time, `P = mgh/t`) with the efficiency worked example (a motor lifting a mass, where the energy supplied exceeds the work done and the difference is quantified as loss). Same lab-investigation shape as Chapter 2's inclined-plane and Chapter 3's friction-incline artefacts — reused rather than reinvented. Tested against the printed 1000 W / 15 s / 100 kg / 10 m example (η = 65.3%).

### Tier 2 — build if time allows

| Key | Topic | Note |
|---|---|---|
| `VIZ_ENERGY_SOURCES` | §৪.৪ | Renewable/non-renewable source gallery (চিত্র ৪.০৩) — descriptive, not quantitative. |
| `VIZ_ENERGY_CHAIN` | §৪.৫.২ | Small chain-of-conversion diagram (electrical→mechanical→heat etc.) — illustrative. |
| `VIZ_NUCLEAR_FISSION` | §৪.৬, চিত্র ৪.০৬ | Fission chain-reaction diagram (U-235 → Kr + Ba + 3n) — qualitative, mass-energy relation is descriptive at this level. |

## Open items

None outstanding — every section and worked example was read directly from the printed page before this plan was written.
