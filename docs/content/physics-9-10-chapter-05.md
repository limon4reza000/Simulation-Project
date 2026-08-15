# Content Plan — Physics 9–10, Chapter 5

## Source

| Field | Value |
|---|---|
| Chapter | পঞ্চম অধ্যায় — পদার্থের অবস্থা ও চাপ (State of Matter and Pressure) |
| Book pages | 127–158 |
| PDF pages | 132–163 (offset +5, same as Chapters 1–4) |

## Confirmed section structure

| § | Title | Book p. |
|---|---|---|
| — | Chapter opener + objectives | 127–128 |
| ৫.১ | চাপ (Pressure), P = F/A, চিত্র ৫.০১ | 129–130 |
| ৫.২ | ঘনত্ব (Density), ρ = m/V, টেবিল ৫.০১ | 130–132 |
| ৫.২.১ | দৈনন্দিন জীবনে ঘনত্বের ব্যবহার (convection, thermal stratification, balloons) | 133–134 |
| ৫.৩ | তরলের ভেতর চাপ (Pressure in Liquids), P = hρg, চিত্র ৫.০২–৫.০৩ | 134–136 |
| ৫.৩.১ | আর্কিমিডিসের নীতি এবং প্লবতা (Archimedes' Principle and Buoyancy), F = Ahρg, চিত্র ৫.০৪ | 137–138 |
| ৫.৩.২ | বস্তুর ভেসে থাকা বা ডুবে যাওয়া (Floating and Sinking) | 138–140 |
| ৫.৩.৩ | প্যাসকেলের সূত্র (Pascal's Law), F₂ = F₁(A₂/A₁), হাইড্রলিক প্রেস, চিত্র ৫.০৫ | 140–142 |
| ৫.৪ | বাতাসের চাপ (Air Pressure), চিত্র ৫.০৬–৫.০৯ | 142–145 |
| ৫.৪.১ | টরিসেলির পরীক্ষা (Torricelli's Experiment), ব্যারোমিটার, ৭৬ cm পারদ = ১ atm, চিত্র ৫.১০ | 145–146 |
| ৫.৪.২ | বাতাসের চাপ এবং আবহাওয়া (Air Pressure and Weather) | 147 |
| ৫.৫ | স্থিতিস্থাপকতা (Elasticity), পীড়ন/বিকৃতি, হুকের সূত্র, ইয়াংস মডুলাস, চিত্র ৫.১১–৫.১২, টেবিল ৫.০২ | 147–150 |
| ৫.৬ | পদার্থের তিন অবস্থা: কঠিন, তরল এবং গ্যাস, চিত্র ৫.১৩ | 150–151 |
| ৫.৬.১ | পদার্থের আণবিক গতিতত্ত্ব (Molecular Kinetic Theory of Gas Pressure) | 152–153 |
| ৫.৬.২ | পদার্থের চতুর্থ অবস্থা: প্লাজমা (Plasma) | 153–154 |
| — | নিজে করো: কঠিন বস্তুর ঘনত্ব বের করা (spring-balance + Archimedes density investigation) | 154 |
| — | নমুনা প্রশ্ন (Sample MCQs, creative and short questions) | 155–158 |

No unconfirmed section numbers this chapter — every heading was read directly off a printed page. (Note: this font renders the Bangla digit ৪ visually close to "8" at some sizes — the same rendering quirk noted in Chapter 4's plan — but every section number below was cross-checked against its neighbours' numbering for consistency, not read in isolation.)

## Key equations, as printed

```
Pressure:              P = F/A                              (p. 129)
Density:               ρ = m/V                               (p. 130)
Pressure in a liquid:  P = hρg                                (p. 134)
Buoyant force:         F = Ahρg  (Archimedes' principle)       (p. 138)
Floating fraction:     V₁/V = ρ_object / ρ_fluid               (p. 139)
Pascal's law:          P = F₁/A₁ = F₂/A₂ → F₂ = F₁(A₂/A₁)      (p. 140-141)
Stress-strain:         T/A = Y·(L-L₀)/L₀  (Hooke's law, elastic limit) (p. 148-149)
Bulk modulus (gas):    P = B·(V-V₀)/V₀                         (p. 150)
```

## Worked examples, as printed (traceable test fixtures)

- p. 130: 50 kg person, feet 0.03 m², back 0.5 m² → standing P = 16,333 N/m², lying P = 980 N/m² (quicksand-safety framing).
- p. 136: whale dives to 2100 m → 210 atm; divers to 305 m → 30.5 atm (both at 10 m/atm).
- p. 136: kerosene (800 kg/m³), water (1000 kg/m³), mercury (13,600 kg/m³) at 0.5 m depth → 3,920 / 4,900 / 66,640 N/m².
- p. 136: depth for 1 atm — mercury 76 cm, water 10.34 m, kerosene 12.92 m.
- p. 139: wood (ρ = 500 kg/m³) floats 50% submerged in water; same wood floats 48.5% submerged in sea water (ρ = 1030 kg/m³).
- p. 140: Archimedes' crown — 10 kg in air, 9.4 kg apparent submerged in water → density 16,666 kg/m³ (short of gold's 19,300 kg/m³ — evidence of an alloy).
- p. 145: Everest summit (8,849 m) air pressure ≈ 35% of sea level, from চিত্র ৫.০৯'s printed curve.
- p. 157 (সৃজনশীল প্রশ্ন ২): rubber band length vs hanging mass, 8 data points from 0–5 kg, with the elastic limit visible directly in the data — length no longer returns to 10 cm once mass exceeds 3 kg.

## Visualization and simulation plan

### Tier 1 — done

All four built, registered, seeded (`scripts/seedChapter5.ts`), and verified live: signed in as the seeded student, walked all four lessons in a real browser, confirmed no negative-SVG-width regressions, confirmed `SIM_PRESSURE`'s defaults reproduce the p. 130 worked example exactly (16,333 N/m² standing, 980 N/m² lying), confirmed `SIM_ARCHIMEDES`'s defaults reproduce the p. 139 wood-in-water example exactly (50% submerged), confirmed `SIM_HOOKES_LAW` reproduces the book's own printed rubber-band dataset exactly at both ends (10 cm at rest, 36 cm loaded / 10.6 cm relaxed at 5 kg — past the elastic limit).

#### 1. `SIM_PRESSURE` — চাপ, চিত্র ৫.০১ (built this session)

Digitises §৫.১ (pp. 129–130) directly: a fixed force applied over an adjustable contact area, live P = F/A readout. Tested against the book's own standing-vs-lying worked example (980 N/m² vs 16,333 N/m²) — the quicksand framing (why lying down is safer) is the book's own, not invented.

#### 2. `SIM_LIQUID_PRESSURE` — তরলের ভেতর চাপ, চিত্র ৫.০২–৫.০৩ (built this session)

Digitises §৫.৩ (pp. 134–136): depth slider over a chosen liquid (water/kerosene/mercury), live P = hρg readout. Tested against all of the book's own worked examples: the whale (210 atm at 2100 m), the diver (30.5 atm at 305 m), and the three-liquid comparison at 0.5 m depth.

#### 3. `SIM_ARCHIMEDES` — প্লবতা ও ভাসা-ডোবা, চিত্র ৫.০৪ (built this session)

Digitises §৫.৩.১–৫.৩.২ (pp. 137–140): an object of adjustable density dropped into a chosen fluid, live buoyant force (F = Ahρg) and submerged-fraction readout, floats or sinks exactly as the physics dictates. Tested against the book's own wood-in-water (50%) and wood-in-seawater (48.5%) fractions, and against the Archimedes crown problem (apparent-weight-loss method recovering 16,666 kg/m³).

#### 4. `SIM_HOOKES_LAW` — স্থিতিস্থাপকতা ও হুকের সূত্র, চিত্র ৫.১১ (built this session)

Digitises §৫.৫ (pp. 147–149): a spring/rubber band stretched by a hanging mass, live stress, strain and T/A = Y(L−L₀)/L₀ readout, linear within the elastic limit and non-returning past it — reproducing the book's own printed rubber-band dataset (সৃজনশীল প্রশ্ন ২, p. 157) exactly, elastic limit at 3 kg included.

### Tier 2 — build if time allows

| Key | Topic | Note |
|---|---|---|
| `SIM_HYDRAULIC_PRESS` | §৫.৩.৩, চিত্র ৫.০৫ | Pascal's law force multiplication, F₂ = F₁(A₂/A₁) — a compelling demo but a narrower single-relation restatement of the same "চাপ সঞ্চালিত হয় সমানভাবে" idea already covered by `SIM_LIQUID_PRESSURE`. |
| `VIZ_ALTITUDE_PRESSURE` | §৫.৪, চিত্র ৫.০৯ | Reproduces the printed pressure-vs-altitude curve (barometric formula) — descriptive/exploratory rather than a single clean equation. |
| `VIZ_MOLECULAR_STATES` | §৫.৬–৫.৬.২ | Solid/liquid/gas/plasma molecular-spacing gallery (চিত্র ৫.১৩) — qualitative, illustrative rather than quantitative. |

## Open items

None outstanding — every section and worked example was read directly from the printed page before this plan was written.
