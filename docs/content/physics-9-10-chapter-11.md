# Content Plan — Physics 9–10, Chapter 11

## Source

| Field | Value |
|---|---|
| Chapter | একাদশ অধ্যায় — চল বিদ্যুৎ (Current Electricity) |
| Book pages | 298–330 |
| PDF pages | 303–335 (offset +5, same as Chapters 1–10) |

## Confirmed section structure

| § | Title | Book p. |
|---|---|---|
| — | Chapter opener + objectives | 298–299 |
| ১১.১ | বিদ্যুৎপ্রবাহ (Electric Current) | 300 |
| ১১.১.১ | তড়িৎ চালক শক্তি এবং বিভব পার্থক্য (EMF and Potential Difference), EMF = W/Q | 300–302 |
| ১১.১.২ | পরিবাহী, অপরিবাহী এবং অর্ধপরিবাহী পদার্থ (Conductors, Insulators, Semiconductors) | 302–303 |
| ১১.১.৩ | বিদ্যুৎপ্রবাহের দিক (Direction of Current Flow), I = Q/t | 303–304 |
| ১১.২ | বিভব পার্থক্য এবং বিদ্যুৎপ্রবাহের মধ্যে সম্পর্ক (Relationship between Potential Difference and Current) | 304 |
| ১১.২.১ | ও'মের সূত্র (Ohm's Law), I = V/R | 304–305 |
| ১১.২.২ | রোধ (Resistance), R = ρL/A, আপেক্ষিক রোধ টেবিল ১১.০১, পরিবাহিতা σ = 1/ρ | 306–309 |
| ১১.২.৩ | বর্তনী বা সার্কিট বিশ্লেষণ (Circuit Analysis), চিত্র ১১.০৭–১১.১০ | 309–314 |
| ১১.২.৪ | তুল্য রোধ: শ্রেণি সংযোগ (Equivalent Resistance: Series), R = R₁+R₂+...+Rₙ | 314–315 |
| ১১.২.৫ | তুল্য রোধ: সমান্তরাল বর্তনী সংযোগ (Equivalent Resistance: Parallel), 1/R = 1/R₁+1/R₂+...+1/Rₙ | 315–317 |
| ১১.৩ | তড়িৎ ক্ষমতা (Electric Power), P = VI = I²R = V²/R | 317–319 |
| ১১.৪ | বিদ্যুৎ সরবরাহ (Electrical Supply) — high-voltage transmission | 319 |
| ১১.৪.১ | তড়িতের সিস্টেম লস (Electric System Loss), I²R transmission loss | 319–320 |
| — | (লোডশেডিং, নিরাপদ ও কার্যকর ব্যবহার — load shedding, safe use) | 320–321 |
| — | নমুনা প্রশ্ন (Sample MCQs, creative and short questions) | 322–328 |

No unconfirmed section numbers this chapter — every heading was read directly off a printed page.

## Key equations, as printed

```
EMF:                    EMF = W/Q                                    (p. 301)
Current:                 I = Q/t                                       (p. 303)
Ohm's law:                I = V/R                                       (p. 305)
Resistance:               R = ρL/A                                      (p. 306)
Conductivity:             σ = 1/ρ                                       (p. 307)
Series equivalent:        R = R1 + R2 + ... + Rn                        (p. 315)
Parallel equivalent:      1/R = 1/R1 + 1/R2 + ... + 1/Rn                (p. 317)
Electric power:           P = VI = I²R = V²/R                           (p. 317-318)
Energy (kWh, "unit"):     energy = (P × t)/1000, P in W, t in hours     (p. 319)
```

## Worked examples, as printed (traceable test fixtures)

- p. 308–309: 1 Ω resistance from a 1 m² cross-section wire — silver needs 6.25×10⁷ m, copper 5.9×10⁷ m, tungsten 1.8×10⁷ m, nichrome 10⁶ m; with a realistic 0.1 mm radius (A = 3.14×10⁻⁸ m²) — silver 1.96 m, copper 1.84 m, tungsten 0.57 m, nichrome 0.03 m.
- p. 312: series circuit, 3 V battery, 1 Ω + 2 Ω in series → I = 1.0 A, V across the 1 Ω = 1 V, point B at 2 V.
- p. 313: series circuit, 6 V battery, R₁=5 Ω + R₂=10 Ω + R₃=15 Ω → I = 1/5 A, V₁=1 V, V₂=2 V, V₃=3 V (verified against D returning to 0 V).
- p. 313–314: parallel circuit, 2 V battery, R₁=3 Ω ∥ R₂=6 Ω → I₁ = 2/3 A, I₂ = 1/3 A, total I = 1 A.
- p. 319: a 60 W bulb run 5 hours/day for 30 days → 9 units (kWh); at ৳10/unit → ৳90 total.

## Visualization and simulation plan

### Tier 1 — built, seeding/browser-verification deferred

All four built with pure-logic tests passing (41 tests) and a clean `tsc -b` production build. `scripts/seedChapter11.ts` is written and ready to run, following the same additive per-lesson-idempotent pattern as every earlier chapter, but has **not yet been run or browser-verified**: the isolated dev MySQL instance (port 3307) was found stopped mid-session with no registered Windows service, and starting it was deferred by explicit user decision rather than started unilaterally, since its data directory also holds the user's real `school_management_system` database. Run `npx tsx scripts/seedChapter11.ts` once MySQL is available, then browser-verify following the same temporarily-repointed-`useLessonSource`-chapter-index procedure used for every prior chapter, before marking this section fully done.

#### 1. `SIM_OHMS_LAW` — ও'মের সূত্র, চিত্র ১১.০৪

Digitises §১১.২.১ (pp. 304–305) directly: a simple battery-resistor loop with adjustable voltage and resistance, live current from I = V/R, reproducing the book's own I ∝ V straight-line graph relationship for a fixed resistor.

#### 2. `SIM_WIRE_RESISTANCE` — রোধ, R = ρL/A

Digitises §১১.২.২ (pp. 306–309): a material selector (from টেবিল ১১.০১'s resistivities) and adjustable length/cross-section, live resistance from R = ρL/A. Tested against the book's own worked example — the length of a realistic 0.1 mm-radius wire needed for 1 Ω, across all four named materials (silver, copper, tungsten, nichrome).

#### 3. `SIM_SERIES_PARALLEL_CIRCUIT` — তুল্য রোধ, চিত্র ১১.০৯–১১.১৪

Digitises §১১.২.৩–১১.২.৫ (pp. 309–317): a series/parallel toggle over two resistors and a battery, live equivalent resistance, total current, and the current/voltage split across each resistor. Tested against both of the book's own fully-worked circuits: the three-resistor series chain (5+10+15 Ω, p. 313) and the two-resistor parallel pair (3 Ω ∥ 6 Ω, p. 314).

#### 4. `SIM_ELECTRIC_POWER` — তড়িৎ ক্ষমতা ও বিদ্যুৎ বিল, §১১.৩

Digitises P = VI = I²R = V²/R (pp. 317–319) as a household electricity-cost calculator: an appliance's rated power and daily usage hours give energy in kWh ("ইউনিট") and cost at a per-unit rate. Tested against the book's own worked example (a 60 W bulb, 5 h/day, 30 days, ৳10/unit → 9 units, ৳90).

### Tier 2 — build if time allows

| Key | Topic | Note |
|---|---|---|
| `VIZ_CIRCUIT_SYMBOLS` | §১১.২.৩, চিত্র ১১.০৭ | Reference gallery of standard circuit symbols (cell, switch, resistor, ammeter, voltmeter, etc.) — a lookup table, not a quantitative relation. |
| `VIZ_SYSTEM_LOSS` | §১১.৪.১ | High-voltage transmission demo showing I²R loss falling as voltage rises for fixed delivered power — a direct restatement of `SIM_ELECTRIC_POWER`'s own relation at grid scale, narrower than building it as its own artefact. |
| `VIZ_ELECTRICAL_SAFETY` | pp. 320–321 | Insulation, earthing, and shock-hazard safety content — descriptive. |

## Open items

None outstanding — every section and worked example was read directly from the printed page before this plan was written.
