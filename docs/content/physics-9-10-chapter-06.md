# Content Plan — Physics 9–10, Chapter 6

## Source

| Field | Value |
|---|---|
| Chapter | ষষ্ঠ অধ্যায় — বস্তুর ওপর তাপের প্রভাব (Effects of Heat on Matter) |
| Book pages | 159–185 |
| PDF pages | 164–190 (offset +5, same as Chapters 1–5) |

## Confirmed section structure

| § | Title | Book p. |
|---|---|---|
| — | Chapter opener + objectives | 159–160 |
| ৬.১ | তাপ ও তাপমাত্রা (Heat and Temperature) | 161 |
| ৬.১.১ | অভ্যন্তরীণ শক্তি ও তাপের প্রবাহ (Internal Energy and Flow of Heat), চিত্র ৬.০১ | 162 |
| ৬.২ | পদার্থের তাপমাত্রিক ধর্ম (Thermometric Properties of Matter) | 163 |
| ৬.২.১ | ভিন্ন স্কেলের মাঝে সম্পর্ক (Relation Between Scales), চিত্র ৬.০২ | 165–166 |
| ৬.৩ | পদার্থের তাপীয় প্রসারণ (Thermal Expansion of Matter) | 166 |
| ৬.৩.১ | কঠিন পদার্থের প্রসারণ (Expansion of Solids), α, β=2α, γ=3α, চিত্র ৬.০৩–৬.০৪ | 166–171 |
| ৬.৩.২ | তরল পদার্থের প্রসারণ (Expansion of Liquids) — আপাত vs প্রকৃত প্রসারণ, চিত্র ৬.০৫–৬.০৬ | 171–173 |
| ৬.৩.৩ | গ্যাসের প্রসারণ (Expansion of Gases), PV=nRT, চিত্র ৬.০৭ | 173–175 |
| ৬.৪ | পদার্থের অবস্থার পরিবর্তনে তাপের প্রভাব (Effect of Heat in Change of State) — গলন, গলনাঙ্ক, গলনের সুপ্ততাপ, বাষ্পীভবন, স্ফুটনাঙ্ক, বাষ্পীভবনের সুপ্ততাপ, চিত্র ৬.০৮ | 175–177 |
| — | বাষ্পায়নের নির্ভরশীলতা (Dependence of Evaporation) — বায়ুপ্রবাহ, তরলের উপরিভাগের ক্ষেত্রফল, তরলের প্রকৃতি, বাতাসের চাপ, উষ্ণতা, বায়ুর শুষ্কতা | 177–178 |
| ৬.৫ | আপেক্ষিক তাপ (Specific Heat), s = Q/(m(T₂−T₁)), C = ms | 178–179 |
| ৬.৬ | ক্যালোরিমিতির মূলনীতি (Fundamental Principles of Calorimetry) | 179–181 |
| ৬.৭ | গলনাঙ্ক এবং স্ফুটনাঙ্কের ওপর চাপের প্রভাব (Effect of Pressure on Melting/Boiling Point), regelation, চিত্র ৬.০৯ | 181–182 |
| — | নমুনা প্রশ্ন (Sample MCQs, creative and short questions), চিত্র ৬.১০ | 183–185 |

No unconfirmed section numbers this chapter — every heading was read directly off a printed page.

## Key equations, as printed

```
Scale conversion:      TC/100 = (TK - 273.15)/100 = (TF - 32)/180        (p. 165)
Linear expansion:       α = (L2-L1)/(L1(T2-T1)),  L2 = L1 + αL1(T2-T1)    (p. 168)
Area/volume expansion:  β = 2α,  γ = 3α                                    (pp. 169-170)
Ideal gas law:           PV = nRT                                          (p. 174)
Specific heat:            s = Q/(m(T2-T1)),  C = ms                        (p. 178-179)
Calorimetry:              heat lost = heat gained (no heat lost to surroundings) (p. 179)
```

## Worked examples, as printed (traceable test fixtures)

- p. 165–167: −40°C = −40°F (Celsius/Fahrenheit agree); TK = TF at 574.59 K; 98.4°F body temperature ≈ 36.89°C; Celsius and Kelvin never agree.
- p. 169: copper rod, 10 m at 20°C → 10.0167 m at 120°C, α = 16.7×10⁻⁶ °C⁻¹.
- p. 171: gold, ρ = 19.30 g/cc, α = 14×10⁻⁶ °C⁻¹, heated 100°C → ρ′ = 19.22 g/cc.
- p. 180: 100 g ice at 0°C dropped into 1 L water at 30°C, L = 334 kJ/kg → final temperature 20°C.
- p. 181: 2 L water at 75°C mixed with 1 L water at 20°C → final temperature 56.6°C.
- p. 181: 10 g iron at 120°C dropped into 1 kg water at 30°C (s_iron = 450 J/kg·K, s_water = 4200 J/kg·K) → final temperature 30.1°C.
- p. 179: 10 kg gold (s = 230 J/kg·K) has heat capacity 2300 J/K; 10 kg water (s = 4200 J/kg·K) has heat capacity 42,000 J/K — about 20× more.

## Visualization and simulation plan

### Tier 1 — done

All four built, registered, seeded (`scripts/seedChapter6.ts`), and verified live: signed in as the seeded student, walked all four lessons in a real browser, confirmed no negative-SVG-width regressions, confirmed `SIM_TEMPERATURE_SCALES`'s −40 preset gives exactly −40°C and −40°F, confirmed `SIM_THERMAL_EXPANSION`'s default (copper, 120°C) reproduces the p. 169 worked example exactly (10.0167 m), confirmed `SIM_HEATING_CURVE` correctly shows a below-freezing solid at low heat input and a melting/liquid phase midway through, confirmed `SIM_CALORIMETRY`'s two presets reproduce both the p. 181 water-water (56.6–56.7°C) and iron-water (30.1°C) worked examples exactly.

#### 1. `SIM_TEMPERATURE_SCALES` — ভিন্ন স্কেলের মাঝে সম্পর্ক, চিত্র ৬.০২ (built this session)

Digitises §৬.২.১ (pp. 165–167) directly: a temperature slider with simultaneous Celsius, Kelvin and Fahrenheit readouts, tested against all three of the book's own worked examples at once (−40°C = −40°F; TK = TF at 574.59 K; 98.4°F ≈ 36.89°C) and against the fact that Celsius and Kelvin never coincide.

#### 2. `SIM_THERMAL_EXPANSION` — কঠিন পদার্থের প্রসারণ, চিত্র ৬.০৩–৬.০৪ (built this session)

Digitises §৬.৩.১ (pp. 166–171): a rod/plate/cube of adjustable material heated through a temperature range, live length/area/volume readouts using L₂ = L₁ + αL₁(T₂−T₁) and the book's own derived β = 2α, γ = 3α relations. Tested against the copper-rod (α = 16.7×10⁻⁶) and gold-density (ρ′ = 19.22 g/cc) worked examples.

#### 3. `SIM_HEATING_CURVE` — গলন ও বাষ্পীভবন, চিত্র ৬.০৮ (built this session)

Digitises §৬.৪ (pp. 175–177): a temperature-vs-heat-added curve for a substance heated from solid through melting (flat plateau at the melting point, consuming the latent heat of fusion) to liquid, then through boiling (flat plateau at the boiling point) to gas — reproducing চিত্র ৬.০৮'s own shape (rising, flat, rising, flat, rising) directly rather than only describing it in words.

#### 4. `SIM_CALORIMETRY` — ক্যালোরিমিতির মূলনীতি, §৬.৫–৬.৬ (built this session)

Digitises §৬.৫–৬.৬ (pp. 178–181): two masses at different temperatures (same or different materials) come into contact and reach one common final temperature, heat lost by the hotter body exactly equal to heat gained by the cooler one. Tested against all three of the book's own worked examples: the ice-in-water melt (100 g ice + 1 L water at 30°C → 20°C), the water-water mix (2 L at 75°C + 1 L at 20°C → 56.6°C), and the iron-in-water drop (10 g iron at 120°C + 1 kg water at 30°C → 30.1°C, demonstrating how little a small mass of low-specific-heat metal changes a large mass of water).

### Tier 2 — build if time allows

| Key | Topic | Note |
|---|---|---|
| `VIZ_EVAPORATION_FACTORS` | pp. 177–178 | Interactive checklist of the six factors affecting evaporation rate (air flow, surface area, liquid identity, air pressure, temperature, humidity) — descriptive, not quantitative. |
| `VIZ_PRESSURE_MELTING_POINT` | §৬.৭, চিত্র ৬.০৯ | Regelation (wire cutting through ice under pressure) and pressure-cooker boiling-point elevation — qualitative, no printed numeric worked example. |
| `SIM_GAS_EXPANSION` | §৬.৩.৩ | PV = nRT-based gas expansion coefficient γₚ = 1/T — a narrower, more abstract restatement of thermal expansion already covered by `SIM_THERMAL_EXPANSION`, and the book's own derivation, not worked example, is the point of this subsection. |

## Open items

None outstanding — every section and worked example was read directly from the printed page before this plan was written.
