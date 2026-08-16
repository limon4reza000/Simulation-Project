# Content Plan — Physics 9–10, Chapter 9

## Source

| Field | Value |
|---|---|
| Chapter | নবম অধ্যায় — আলোর প্রতিসরণ (Refraction of Light) |
| Book pages | 243–269 |
| PDF pages | 248–274 (offset +5, same as Chapters 1–8) |

## Confirmed section structure

| § | Title | Book p. |
|---|---|---|
| — | Chapter opener + objectives | 243 |
| ৯.১ | আলোর প্রতিসরণ (Refraction of Light) — refractive index n = c/v, টেবিল ৯.০১ | 243–244 |
| ৯.১.১ | প্রতিসরণের সূত্র (Laws of Refraction) — Snell's law n₁ sin θ₁ = n₂ sin θ₂, চিত্র ৯.০১–৯.০৫ | 244–248 |
| ৯.১.২ | আপেক্ষিক প্রতিসরণাঙ্ক (Relative Refractive Index) | 247–248 |
| ৯.২ | পূর্ণ অভ্যন্তরীণ প্রতিফলন (Total Internal Reflection) — critical angle θc = sin⁻¹(n₁/n₂), চিত্র ৯.০৬–৯.০৮ | 248–251 |
| ৯.২.১ | রংধনু (Rainbow), চিত্র ৯.০৯ | 251 |
| ৯.২.২ | মরীচিকা (Mirage), চিত্র ৯.১০ | 251–252 |
| ৯.৩ | প্রতিসরণের ব্যবহার (Uses of Refraction) | 252 |
| ৯.৩.১ | অপটিক্যাল ফাইবার (Optical Fibre) — core/clad TIR, চিত্র ৯.১১ | 253 |
| ৯.৩.২ | প্রিজম (Prism) — dispersion, চিত্র ৯.১২ | 254 |
| ৯.৩.৩ | পেরিস্কোপ ও বাইনোকুলার (Periscope and Binoculars), চিত্র ৯.১৩ | 254 |
| ৯.৩.৪ | লেন্স (Lens) — intro | 255 |
| ৯.৪ | লেন্সের প্রকারভেদ (Types of Lenses) — convex/concave, optical centre, চিত্র ৯.১৪–৯.১৭ | 255–257 |
| ৯.৪.১ | অবতল লেন্স (Concave Lens) — always virtual/erect/diminished, চিত্র ৯.১৮–৯.২০ | 257–259 |
| ৯.৪.২ | উত্তল লেন্স (Convex Lens) — five-case image table by object position, চিত্র ৯.২১–৯.২৬ | 259–264 |
| ৯.৪.৩ | লেন্সের ক্ষমতা (Power of a Lens) — P = 1/f, diopters, sign convention | 264–265 |
| — | নমুনা প্রশ্ন (Sample MCQs, creative and short questions) | 266–269 |

No unconfirmed section numbers this chapter — every heading was read directly off a printed page. Notably, unlike Chapter 8's mirror treatment, this chapter does **not** print an explicit "lens formula" (1/v − 1/u = 1/f) section — every lens image-position result is derived purely by ray construction (§৯.৪.১–৯.৪.২), and the chapter moves directly from those ray diagrams to লেন্সের ক্ষমতা (power) without ever stating a formula analogous to the mirror equation.

## Key equations, as printed

```
Refractive index:        n = c/v                                    (p. 243)
Snell's law:               n1 sin θ1 = n2 sin θ2                       (p. 244)
Critical angle:            sin θc = n1/n2                              (p. 249)
Power of a lens:           P = 1/f  (f in metres, P in diopters)        (p. 265)
```

Sign convention for lens power (p. 265): positive for a convex (converging) lens, negative for a concave (diverging) lens — directly analogous to Chapter 8's signed focal length for mirrors, and reused as this chapter's own convention rather than invented.

## Worked examples, as printed (traceable test fixtures)

- p. 244: refractive indices from speed — vacuum 3×10⁸ m/s (n=1.00), air (n=1.00029), water (n=1.33, v=2.26×10⁸ m/s), glass (n=1.52, v=2×10⁸ m/s), diamond (n=2.42, v=1.24×10⁸ m/s).
- p. 245–246: 45° incidence from air into n=1.6 → 26° refraction; 60° incidence from air refracting to 45° → n₂ = 1.22.
- p. 247–248: water (n=1.33) vs glass (n=1.52) — glass relative to water = 1.14; water relative to glass = 0.88; also diamond-vs-water 1.82, water-vs-diamond 0.55, diamond-vs-glass 1.59, glass-vs-diamond 0.63.
- p. 249–250: critical angle for glass (n=1.52) in air → θc = 41.8°; the same glass surface submerged in water (n=1.33) → θc = 61.6°.
- p. 250–251: a ray inside a medium of n=1.45 hitting a 1.45→1.00 boundary at 75° — Snell's law gives sin θ₂ = 1.40 (impossible), confirming total internal reflection; that medium's own critical angle is 43.6°.
- p. 253: optical fibre, core n=1.50, clad n=1.45 → θc = 75° (angle measured from the fibre axis, not the normal, per চিত্র ৯.১১b's own convention).
- p. 265: a lens rated 2.5 D → f = 1/2.5 = 0.4 m.

## Visualization and simulation plan

### Tier 1 — done

All four built, registered, seeded (`scripts/seedChapter9.ts`), and verified live: signed in as the seeded student, walked all four lessons in a real browser, confirmed no negative-SVG-width regressions, confirmed `SIM_SNELLS_LAW` bends correctly toward the normal entering glass, confirmed `SIM_CRITICAL_ANGLE`'s default (glass/air) reproduces θc ≈ 41.1° and correctly distinguishes refracting from total-internal-reflecting, confirmed `SIM_LENS_IMAGE` correctly classifies a convex lens's default object position as real/inverted/diminished and a concave lens as always virtual/erect, confirmed `SIM_LENS_POWER`'s default (f = 0.4 m) gives exactly the book's own 2.5 D. One real sign error was found and fixed before any of this reached a renderer — see the commit for detail.

#### 1. `SIM_SNELLS_LAW` — প্রতিসরণের সূত্র, চিত্র ৯.০১–৯.০৫ (built this session)

Digitises §৯.১.১ (pp. 244–248) directly: an adjustable incident angle and a chosen pair of media, live refraction angle from n₁ sin θ₁ = n₂ sin θ₂. Tested against both of the book's own worked examples (45°→26° into n=1.6; 60°→45° recovering n₂=1.22).

#### 2. `SIM_CRITICAL_ANGLE` — পূর্ণ অভ্যন্তরীণ প্রতিফলন, চিত্র ৯.০৬–৯.০৮ (built this session)

Digitises §৯.২ (pp. 248–251): an adjustable angle of incidence inside a denser medium, showing ordinary refraction below the critical angle and total internal reflection above it, with a live critical-angle readout from θc = sin⁻¹(n₁/n₂). Tested against the book's own glass-in-air (41.8°) and glass-in-water (61.6°) results, and the optical-fibre worked example (core/clad, 75°).

#### 3. `SIM_LENS_IMAGE` — লেন্সে প্রতিবিম্ব, চিত্র ৯.১৮–৯.২৬ (built this session)

Digitises §৯.৪.১–৯.৪.২ (pp. 257–264): a convex/concave toggle and adjustable object distance, reproducing the book's own image-position results by ray construction — concave always virtual/erect/diminished; convex's full five-case behaviour (inside f: virtual/erect/magnified; at 2f: real/inverted/same-size; beyond 2f: real/inverted/diminished; at f: no image; beyond 2f the other direction mirrors these). Built on the same signed-focal-length approach already proven for `SIM_SPHERICAL_MIRROR` in Chapter 8, since a thin lens's image equation has the identical mathematical shape.

#### 4. `SIM_LENS_POWER` — লেন্সের ক্ষমতা, §৯.৪.৩ (built this session)

Digitises P = 1/f directly (p. 264–265): an adjustable focal length (signed for convex/concave) with a live power readout in diopters. Tested against the book's own worked example (2.5 D → 0.4 m) in both directions.

### Tier 2 — build if time allows

| Key | Topic | Note |
|---|---|---|
| `VIZ_RAINBOW_MIRAGE` | §৯.২.১–৯.২.২, চিত্র ৯.০৯–৯.১০ | Rainbow and mirage as everyday TIR phenomena — qualitative, no printed numeric relation beyond what `SIM_CRITICAL_ANGLE` already covers. |
| `VIZ_PRISM_DISPERSION` | §৯.৩.২, চিত্র ৯.১২ | White light splitting into colours through a prism — qualitative (wavelength-dependent n is stated, not quantified). |
| `VIZ_PERISCOPE` | §৯.৩.৩, চিত্র ৯.১৩ | Prism-based periscope/binoculars construction — illustrative. |

## Open items

None outstanding — every section and worked example was read directly from the printed page before this plan was written.
