# Content Plan — Physics 9–10, Chapter 3

## Source

| Field | Value |
|---|---|
| Chapter | তৃতীয় অধ্যায় — বল (Force) |
| Book pages | 62–94 |
| PDF pages | 67–99 (offset +5, same as Chapters 1–2) |

## Confirmed section structure

| § | Title | Book p. |
|---|---|---|
| — | Chapter opener + objectives | 62–63 |
| ৩.১ | জড়তা এবং বলের ধারণা: নিউটনের প্রথম গতি সূত্র (Newton's First Law) | 64 |
| ৩.১.১ | জড়তা (Inertia) | 64 |
| ৩.১.২ | বল (Force) | 67 |
| ৩.২ | মৌলিক বলের প্রকৃতি (Nature of Fundamental Forces) | 67 |
| ৩.২.১–৪ | মহাকর্ষ, তড়িৎ চৌম্বক, দুর্বল নিউক্লীয়, সবল নিউক্লীয় বল | 68–69 |
| ৩.৩ | বলের সাম্যাবস্থা ও অসাম্যাবস্থা (Balanced and Unbalanced Forces) | 69 |
| ৩.৪ | ভরবেগ (Momentum), p = mv | 71 |
| ৩.৫ | সংঘর্ষ (Collision) | 72 |
| ৩.৫.১ | ভরবেগ ও শক্তির সংরক্ষণশীলতা (Conservation of Momentum and Energy) | 72 |
| ৩.৫.২ | নিরাপদ ভ্রমণ: বেগ ও বল (Safe Journey: Velocity and Force) | 74 |
| ৩.৬ | বস্তুর গতির উপর বলের প্রভাব: নিউটনের দ্বিতীয় গতি সূত্র (Newton's Second Law) | 75 |
| — | ওজন ও মাধ্যাকর্ষণ বল, F = GmM/R², g = GM/R² | 79 |
| ৩.৭ | (স্প্রিং দিয়ে ওজন মাপা — spring-scale calibration activity) | ~82–83 |
| ৩.৮ | নিউটনের তৃতীয় গতি সূত্র (Newton's Third Law) | 84 |
| ৩.৯ | ঘর্ষণ (Friction) | ~87 |
| ৩.৯.১ | ঘর্ষণের প্রকারভেদ: স্থিতি, গতি, আবর্ত ঘর্ষণ | 89–90 |
| — | চিত্র ৩.১৮: স্থিতি ঘর্ষণ সহগ পরিমাপ (tilt-table investigation), μs = tan θ | 91 |
| ৩.৯.২ | গতির উপর ঘর্ষণের প্রভাব | 91 |
| ৩.৯.৩ | ঘর্ষণ কমানোর উপায় | 92–93 |
| ৩.৯.৪ | ঘর্ষণ: একটি প্রয়োজনীয় উপদ্রব (Friction: a necessary nuisance) | 94 |
| — | নমুনা প্রশ্ন (Sample MCQs) | 94+ |

**Unconfirmed:** exact section number and page for ৩.৭ (spring-scale activity, read but not pinned to a printed heading) — check book pp. 82–83 directly before seeding, same policy as the two unconfirmed items in Chapters 1–2.

## Key equations, as printed

```
Momentum:                p = mv                      (p. 71)
Elastic collision (1D):  v1' = ((m1-m2)u1 + 2m2u2) / (m1+m2)
                          v2' = ((m2-m1)u2 + 2m1u1) / (m1+m2)   (p. 74)
Newton's second law:      F = ma                       (p. 76)
Gravitation:               F = Gm1m2/r²,  g = GM/R²     (p. 79)
Static friction:           fs = μs·N,  μs = tan θc       (pp. 89, 91)
Kinetic friction:          fk = μk·N                     (p. 90)
```

## Visualization and simulation plan

### Tier 1 — done

All four built, registered, seeded (`scripts/seedChapter3.ts`), and verified live: signed in as the seeded student, walked all four lessons in a real browser, confirmed no negative-SVG-width regressions, confirmed F = ma and Δp = Ft agree exactly for the seeded defaults (5 m/s² for F=10N, m=2kg → 20 m/s after 4 s), confirmed the friction block holds at 0° and slides at 60° against a ~21.8° critical angle for μs=0.4, confirmed the force-balance resultant recalculates correctly after perturbing one of three vectors.

#### 1. `SIM_COLLISION` — সংঘর্ষ

Digitises §৩.৫ directly, using the book's own general 1D elastic-collision formulas (p. 74) and its own worked example: a heavy truck (m₁) meets a small car (m₂) head-on at the same speed — with m₂ ≪ m₁, the book shows the truck barely slows (v₁′ ≈ u) while the car rebounds at three times the closing speed (v₂′ = 3u). That exact relationship is the test fixture. The safe-driving framing (§৩.৫.২) is a genuine local-relevance hook, not decoration — road safety in Bangladesh is exactly what the book is arguing for.

#### 2. `SIM_NEWTONS_SECOND_LAW` — F = ma (built this session)

A block on a frictionless surface; a slider sets applied force and mass; live readouts for acceleration, velocity and momentum over time, tested against `F = ma` and `Δp = Ft` directly from §৩.৬.

#### 3. `SIM_FRICTION_INCLINE` — চিত্র ৩.১৮ (built this session)

Same tilt-table shape as Chapter 2's inclined-plane investigation, different physics: a block on a ramp whose angle increases until it starts to slide, reading off `μs = tan θc` at the critical angle exactly as the book's own experiment does. A natural pair with `SIM_INCLINED_PLANE` — same interaction pattern, reused rather than reinvented, which is itself evidence for the registry's extensibility claim.

#### 4. `VIZ_FORCE_BALANCE` — §৩.৩ (built this session)

Two or three draggable force vectors on a point mass; the resultant and whether the object accelerates update live. Digitises the tug-of-war-on-a-book (চিত্র ৩.০৩) and hanging-pendulum (চিত্র ৩.০২) equilibrium examples.

### Tier 2 — build if time allows

| Key | Topic | Note |
|---|---|---|
| `SIM_ATWOOD` | p. 81, চিত্র ৩.০৯ | Connected bodies over a pulley, `a = Mg/(M+m)`. Good physics, but a narrower single-equation demo than the four above. |
| `VIZ_FUNDAMENTAL_FORCES` | §৩.২ | Four-force comparison card (relative strength, range) — descriptive, not quantitative. |
| `SIM_NEWTONS_CRADLE` | চিত্র ৩.০৫, p. 80 | Marble-row momentum-conservation demo. Charming, but physically a special case of `SIM_COLLISION` rather than new material. |

## Open items

1. Confirm the section number/page for the spring-scale calibration activity (pp. 82–83).
2. Digitise the বহুনির্বাচনি প্রশ্ন MCQs (p. 94+) into `Question` rows once read in full.
