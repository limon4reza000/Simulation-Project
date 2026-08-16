# Content Plan — Physics 9–10, Chapter 8

## Source

| Field | Value |
|---|---|
| Chapter | অষ্টম অধ্যায় — আলোর প্রতিফলন (Reflection of Light) |
| Book pages | 210–242 |
| PDF pages | 215–247 (offset +5, same as Chapters 1–7) |

## Confirmed section structure

| § | Title | Book p. |
|---|---|---|
| — | Chapter opener + objectives | 210–211 |
| ৮.১ | আলোর প্রকৃতি (Nature of Light) — EM wave, visible range 400–700 nm, চিত্র ৮.০১ | 212–213 |
| ৮.২ | প্রতিফলন (Reflection) — reflection/refraction/absorption at a boundary, চিত্র ৮.০২–৮.০৩ | 214–215 |
| ৮.২.১ | প্রতিফলনের সূত্র (Laws of Reflection) — θᵢ = θᵣ, coplanarity, multiple-mirror images, চিত্র ৮.০৪–৮.০৫ | 215–216 |
| ৮.২.২ | মসৃণ এবং অমসৃণ পৃষ্ঠে প্রতিফলন (Specular vs Diffuse Reflection), চিত্র ৮.০৭ | 218 |
| ৮.৩ | আয়না বা দর্পণ (Mirror) | 218 |
| ৮.৩.১ | প্রতিবিম্ব (Image in a Plane Mirror) — equal distance, virtual, erect, same size; full-length-mirror result (mirror length = half the viewer's height), চিত্র ৮.০৮–৮.১৫ | 219–223 |
| ৮.৪ | গোলীয় আয়না (Spherical Mirror) | 223 |
| ৮.৫ | উত্তল আয়না (Convex Mirror) — f = r/2, চিত্র ৮.১৭–৮.১৮ | 224–225 |
| ৮.৫.১ | গোলীয় উত্তল আয়নায় প্রতিবিম্ব (Image in a Convex Mirror) — always virtual, erect, diminished, চিত্র ৮.১৯ | 225–226 |
| ৮.৬ | অবতল গোলীয় আয়না (Concave Mirror) — f = r/2, চিত্র ৮.২০–৮.২১ | 227–229 |
| ৮.৬.১ | অবতল আয়নায় প্রতিবিম্ব (Image in a Concave Mirror) — two regimes (inside/outside focal length) plus the full seven-row image-nature table, চিত্র ৮.২২–৮.২৫ | 229–233 |
| — | Mirror formula: 1/u + 1/v = 1/f | 233 |
| ৮.৭ | বিবর্ধন (Magnification), m = l′/l | 234 |
| ৮.৮ | আয়নার ব্যবহার (Use of Mirrors) | 234 |
| ৮.৮.১ | সাধারণ আয়না (Plane Mirrors) — left-right flip, fixed with two mirrors at 90° | 234–235 |
| ৮.৮.২ | উত্তল আয়না (Convex Mirrors) — vehicle side mirrors, wide diminished view | 235 |
| ৮.৮.৩ | অবতল আয়না (Concave Mirrors) — telescopes, parallel-beam torches/headlights (source at focus), dentist/magnifying mirrors | 235 |
| ৮.৮.৪ | পাহাড়ি রাস্তার অদৃশ্য বাঁক (Hill-road Blind Curves) — 45° mirrors at blind bends | 236 |
| — | নমুনা প্রশ্ন (Sample MCQs, creative and short questions) | 237–240 |

No unconfirmed section numbers this chapter — every heading was read directly off a printed page.

## Key equations, as printed

```
Law of reflection:      θᵢ = θᵣ  (angle of incidence = angle of reflection)     (p. 215)
Focal length (both mirror types): f = r/2                                       (pp. 225, 229)
Mirror formula:          1/u + 1/v = 1/f                                        (p. 233)
Magnification:            m = l'/l                                              (p. 234)
```

The book's own sign convention for the mirror formula (p. 233) is the "real-is-positive" style used throughout this text: distances are positive when the corresponding point (object, image or focus) is real/in front of the mirror, negative when virtual/behind it — the same spirit as its worked answer "ফোকাস দূরত্ব অসীম" (infinite focal length) for a plane mirror, treated as the limiting case of both curved mirror types.

## Worked examples, as printed (traceable test fixtures)

- p. 219–221: X between two parallel mirrors produces infinitely many images (X′, X″, X‴, …) receding on both sides — a qualitative but precisely constructed geometric result (চিত্র ৮.০৪).
- p. 221: a person 1.5 m tall needs a plane mirror only 0.75 m long to see their full-length reflection, regardless of standing distance from it (চিত্র ৮.১২) — mirror length = viewer height / 2.
- p. 222: two plane mirrors at 60° to each other — a ray striking the first at 60° incidence is shown geometrically to strike the second and reflect straight back the way it came.
- p. 224–225: convex mirror, focal length = radius/2, derived from geometry for near-axis rays.
- p. 228–229: concave mirror, focal length = radius/2, by the analogous geometric argument.
- p. 232 (টেবিল, "অবতল গোলীয় আয়নায় গঠিত প্রতিবিম্বের বৈশিষ্ট্য"): the complete seven-row table of image position/nature for a concave mirror, by object position (at infinity; beyond C; at C; between C and F; at F; between F and P; — this table is the primary Tier-1 test fixture for `SIM_SPHERICAL_MIRROR`).
- No single boxed numeric worked example is printed for §৮.৭'s magnification/mirror-formula pairing — the সৃজনশীল প্রশ্ন on p. 235 poses one (a 2 cm object, magnifications of 3.51× then 6× under two experimental setups) as an *exercise for the student to solve*, not as a solved page answer, so it is not used as a fixture here; `SIM_MIRROR_FORMULA`'s tests instead check the formula's own algebraic self-consistency (m = v/u, the f = r/2 identity, sign behaviour for real vs virtual images), the same treatment already given to Chapter 3's friction-incline investigation and force-balance module where no printed numeric answer existed.

## Visualization and simulation plan

### Tier 1 — done

All four built, registered, seeded (`scripts/seedChapter8.ts`), and verified live: signed in as the seeded student, walked all four lessons in a real browser, confirmed no negative-SVG-width regressions, confirmed `SIM_LAW_OF_REFLECTION` keeps θᵣ = θᵢ at every angle, confirmed `SIM_PLANE_MIRROR_IMAGE`'s default reproduces the book's own full-length-mirror result exactly (1.5 m viewer → 0.75 m mirror) alongside image distance = object distance, confirmed `SIM_SPHERICAL_MIRROR` correctly classifies a concave mirror's default object position as real/inverted/diminished and a convex mirror as always virtual/erect, confirmed `SIM_MIRROR_FORMULA`'s default (u = 6 m, f = 2 m) gives exactly v = 3 m and m = 0.5, matching `SIM_SPHERICAL_MIRROR`'s own geometric result at the same inputs.

#### 1. `SIM_LAW_OF_REFLECTION` — প্রতিফলনের সূত্র, চিত্র ৮.০৩ (built this session)

Digitises §৮.২.১ (p. 215) directly: an adjustable incident ray meets a mirror surface, with a live reflected ray drawn at exactly the same angle from the normal — θᵢ = θᵣ shown, not just stated.

#### 2. `SIM_PLANE_MIRROR_IMAGE` — প্রতিবিম্ব, চিত্র ৮.০৮–৮.১২ (built this session)

Digitises §৮.৩.১ (pp. 219–223): an object at an adjustable distance in front of a plane mirror, with its image shown at the same distance behind it — virtual, erect, same size. Includes the book's own full-length-mirror result as a direct, testable relation: a viewer of adjustable height needs a mirror only half that height to see their whole reflection, independent of standing distance.

#### 3. `SIM_SPHERICAL_MIRROR` — গোলীয় আয়না, চিত্র ৮.১৭–৮.২৫ (built this session)

Digitises §৮.৪–৮.৬.১ (pp. 223–233): a concave/convex toggle and an adjustable object distance, reproducing the book's own seven-row image-nature table exactly — position, real/virtual, erect/inverted, and magnified/same/diminished, for every object position the book itself enumerates.

#### 4. `SIM_MIRROR_FORMULA` — সূত্র ও বিবর্ধন, §৮.৭ (built this session)

Digitises the mirror formula and magnification together (p. 233–234): adjustable object distance and focal length (sign for concave/convex), live image distance from 1/u + 1/v = 1/f and magnification from m = v/u, cross-checked against `SIM_SPHERICAL_MIRROR`'s own geometric result at the same inputs.

### Tier 2 — build if time allows

| Key | Topic | Note |
|---|---|---|
| `VIZ_COLOR_ABSORPTION` | §৮.১, চিত্র ৮.০৬ | Why a red rose looks red in white light and black in green light — qualitative, no printed numeric relation. |
| `VIZ_MIRROR_USES` | §৮.৮.১–৮.৮.৪ | A small gallery: vehicle mirrors, telescopes, torches, hill-road curve mirrors — descriptive/illustrative. |
| `VIZ_MULTI_MIRROR_IMAGES` | p. 219–221, চিত্র ৮.০৪ | The infinite-regress multiple-image construction between two parallel mirrors — a striking visual, but qualitative (no distance formula printed for the nth image). |

## Open items

None outstanding — every section and worked example was read directly from the printed page before this plan was written.
