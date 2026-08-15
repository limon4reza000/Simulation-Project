# Content Plan — Physics 9–10, Chapter 7

## Source

| Field | Value |
|---|---|
| Chapter | সপ্তম অধ্যায় — তরঙ্গ ও শব্দ (Waves and Sound) |
| Book pages | 186–209 |
| PDF pages | 191–214 (offset +5, same as Chapters 1–6) |

## Confirmed section structure

| § | Title | Book p. |
|---|---|---|
| — | Chapter opener + objectives | 186–187 |
| ৭.১ | সরল স্পন্দন গতি (Simple Harmonic Motion), F = -kx, T = 2π√(m/k), T = 2π√(l/g), চিত্র ৭.০১ | 188–189 |
| ৭.২ | তরঙ্গ (Waves) | 190 |
| ৭.২.১ | তরঙ্গের বৈশিষ্ট্য (Wave Characteristics) — energy ∝ amplitude², medium-dependent speed, reflection/refraction, superposition, চিত্র ৭.০২–৭.০৩ | 190–193 |
| ৭.২.২ | তরঙ্গের প্রকারভেদ (Types of Waves) — transverse vs longitudinal, চিত্র ৭.০৪–৭.০৫ | 193–194 |
| ৭.২.৩ | তরঙ্গ-সংশ্লিষ্ট রাশি (Wave-related Quantities) — v = fλ, চিত্র ৭.০৬–৭.০৯ | 195–198 |
| ৭.৩ | শব্দ তরঙ্গ (Sound Wave) — vocal cords, sound sources, বেলজার পরীক্ষা, audibility 20 Hz–20 kHz, চিত্র ৭.১০–৭.১২ | 198–200 |
| ৭.৩.১ | প্রতিধ্বনি (Echo) — minimum distance for a distinguishable echo | 201–202 |
| ৭.৩.২ | শব্দের বেগের পার্থক্য (Variation of Sound Speed) — v ∝ √T, টেবিল ৭.০১ (speed by medium) | 202–203 |
| ৭.৩.৩ | শব্দের ব্যবহার (Uses of Sound) — 3D seismic survey, ultrasonography, ultrasound cleaner | 203–204 |
| ৭.৩.৪ | সুরযুক্ত শব্দ (Musical/Tonal Sound) — superposed frequencies, instrument families, চিত্র ৭.১৪ | 204 |
| ৭.৩.৫ | শব্দের দূষণ (Noise Pollution), টেবিল ৭.০২ (dB by source) | 205 |
| — | নমুনা প্রশ্ন (Sample MCQs, creative and short questions), চিত্র ৭.১৬–৭.১৭ | 206–209 |

No unconfirmed section numbers this chapter — every heading was read directly off a printed page.

## Key equations, as printed

```
Simple harmonic motion:  F = -kx                                      (p. 188)
Spring period:            T = 2π√(m/k)                                  (p. 188)
Pendulum period:           T = 2π√(l/g)  (independent of mass)          (p. 188)
Wave equation:              v = fλ                                       (p. 195)
Sound speed vs temperature: v ∝ √T  (T in kelvin)                        (p. 202)
```

## Worked examples, as printed (traceable test fixtures)

- p. 189: 1 m string, 10 g stone (mass irrelevant) → T = 2π√(1/9.8) = 2.0 s.
- p. 196–197: a wave with amplitude 0.1 m, wavelength 1 m (from a displacement-vs-position snapshot) and period 0.2 s (from a displacement-vs-time snapshot at the same point) → f = 1/T = 5 Hz, v = λf = 1 × 5 = 5 m/s.
- p. 201: a 1 kHz tuning fork in air (334 m/s), water (1493 m/s) and iron (5130 m/s) → λ = v/f gives 0.334 m, 1.49 m, 5.13 m respectively.
- p. 201–202: distinguishing two sounds needs ≥0.1 s apart; at 330 m/s that is a 33 m round trip, so a reflecting surface at ≥16.5 m gives an audible echo.
- p. 203: sound at 338 m/s at 10°C (283.15 K) → 349.6 m/s at 30°C (303.15 K), via v₁ = v₂√(T₁/T₂).
- Table 7.01 (p. 202): speed of sound — air 330, hydrogen 1284, mercury 1450, water 1493, iron 5130, diamond 12000 (all m/s).

## Visualization and simulation plan

### Tier 1 — done

All four built, registered, seeded (`scripts/seedChapter7.ts`), and verified live: signed in as the seeded student, walked all four lessons in a real browser, confirmed no negative-SVG-width regressions, confirmed `SIM_PENDULUM_PERIOD`'s default (1 m) reproduces the book's own 2.0 s result to full precision (2.01 s — the book's own 2.0 s is a coarser 1-decimal rounding of the same 2.0071 s), confirmed `SIM_WAVE_PROPERTIES`'s default snapshot reproduces the book's own combined worked example exactly (f = 5 Hz, v = 5 m/s), confirmed `SIM_SOUND_SPEED`'s default (30°C) and its table reproduce both the temperature-scaling worked example and টেবিল ৭.০১'s six printed speeds, confirmed `SIM_ECHO` correctly flips from audible to inaudible around its own 16.5 m worked-example threshold.

#### 1. `SIM_PENDULUM_PERIOD` — সরল স্পন্দন গতি, T = 2π√(l/g) (built this session)

Digitises §৭.১ (pp. 188–189) directly: a pendulum of adjustable length, live period readout from T = 2π√(l/g), explicitly demonstrating the book's own emphasised point — the period does not depend on the bob's mass. Tested against the book's own 1 m / 2.0 s worked example. (Distinct from Chapter 4's `SIM_PENDULUM_ENERGY`: that one is about the T/V energy exchange during a swing; this one is about the period itself as a function of length.)

#### 2. `SIM_WAVE_PROPERTIES` — তরঙ্গ-সংশ্লিষ্ট রাশি, চিত্র ৭.০৬–৭.০৯ (built this session)

Digitises §৭.২.৩ (pp. 195–198): a wave snapshot (position domain and time domain, side by side, exactly as the book presents them) with adjustable amplitude, wavelength and period, live frequency and speed readouts via f = 1/T and v = fλ. Tested against the book's own worked example (λ = 1 m, T = 0.2 s → f = 5 Hz, v = 5 m/s).

#### 3. `SIM_SOUND_SPEED` — শব্দের বেগের পার্থক্য, v ∝ √T (built this session)

Digitises §৭.৩.২ (pp. 202–203): a temperature slider drives sound speed via v₁ = v₂√(T₁/T₂), plus a medium selector reproducing টেবিল ৭.০১'s six printed speeds. Tested against the book's own worked example (338 m/s at 10°C → 349.6 m/s at 30°C).

#### 4. `SIM_ECHO` — প্রতিধ্বনি, চিত্র ৭.১৬–৭.১৭ (built this session)

Digitises §৭.৩.১ (pp. 201–202): a sound source at an adjustable distance from a reflecting wall, live round-trip time and a clear "distinguishable / not distinguishable" verdict against the book's own 0.1 s threshold. Tested against the book's own 16.5 m minimum-distance result and against the sample-question fixtures (a 17.25 m case that resolves differently at 10°C vs 30°C because sound speed itself changes, chaining directly into `SIM_SOUND_SPEED`'s own relation).

### Tier 2 — build if time allows

| Key | Topic | Note |
|---|---|---|
| `VIZ_WAVE_TYPES` | §৭.২.২, চিত্র ৭.০৪–৭.০৫ | Transverse vs longitudinal wave animation gallery — illustrative, the underlying physics is already covered by `SIM_WAVE_PROPERTIES`. |
| `VIZ_SUPERPOSITION` | §৭.২.১(v), চিত্র ৭.০৩ | Two waves combining constructively/destructively — a nice visual, but qualitative in the book's own treatment (no worked numeric example). |
| `VIZ_NOISE_LEVELS` | §৭.৩.৫, টেবিল ৭.০২ | A decibel-level comparison gallery across common sound sources — descriptive, not equation-driven. |

## Open items

None outstanding — every section and worked example was read directly from the printed page before this plan was written.
