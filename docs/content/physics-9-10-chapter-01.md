# Content Plan — Physics 9–10, Chapter 1

## Source

| Field | Value |
|---|---|
| Textbook | মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026 edition) |
| File | `Secondary (BV)-2026_Class 9-10_Physics_compressed.pdf` |
| Chapter | প্রথম অধ্যায় — ভৌত রাশি এবং তাদের পরিমাপ (Physical Quantities and Their Measurement) |
| Book pages | 1–31 |
| PDF pages | 6–36 (offset +5) |
| Language | Bangla |

Every topic below cites the book page it came from. Those page numbers are what
populate `TextbookReference.pageStart` / `pageEnd`, which is what the
`ContentValidation` gate checks before a `ContentVersion` can be published.

> **Note.** The PDF has no extractable text layer — the Bangla font carries no
> ToUnicode map, so `pypdf` and `pdfium` both return empty strings. Pages were
> rendered to images and read visually. Any bulk content pipeline will need OCR
> (Tesseract with `ben` traineddata), not text extraction. Budget for this.

---

## Chapter structure as printed

| § | Title | Book pp. |
|---|---|---|
| — | Chapter opener + learning objectives | 1–2 |
| ১.১ | পদার্থবিজ্ঞান (Physics) | 3 |
| ১.২ | পদার্থবিজ্ঞানের পরিসর (Scope of Physics) | 3–4 |
| ১.৩ | *(history of physics — heading not yet confirmed)* | 5–10 |
| ১.৩.৩ | আধুনিক পদার্থবিজ্ঞানের সূচনা | 8 |
| ১.৩.৫ | জগদীশচন্দ্র বসুর অবদান (Contributions of Jagadish Chandra Bose) | 10–11 |
| ১.৪ | পদার্থবিজ্ঞানের উদ্দেশ্য (Objectives of Physics) | 11 |
| ১.৪.১ | প্রকৃতির রহস্য উদঘাটন | 12 |
| ১.৪.২ | প্রকৃতির নিয়মগুলো জানা | 12 |
| ১.৫ | ভৌত রাশি এবং তাদের পরিমাপ | 14 |
| ১.৫.১ | পরিমাপের একক (Units of Measurements) | 15 |
| ১.৫.২ | উপসর্গ বা গুণিতক (Prefix) | 17 |
| ১.৫.৩ | মাত্রা (Dimension) | 18 |
| ১.৬ | পরিমাপের যন্ত্রপাতি (Measuring Instruments) | 20 |
| ১.৬.১ | স্কেল (Scale) বা রুলার (Ruler) | 20 |
| — | স্লাইড/ভার্নিয়ার ক্যালিপার্স (Slide/Vernier Calipers) | 20–22 |
| — | স্ক্রু-গেইজ (Screw Gauge) | 22 |
| — | অনুসন্ধান ১.০১ (Investigation — caliper lab) | 25 |
| ১.৭ | পরিমাপের ত্রুটি ও নির্ভুলতা (Error and accuracy) | 26–28 |
| — | নমুনা প্রশ্ন (Sample questions) | 29–31 |

**Unconfirmed:** the ১.৩ heading text, and ১.৩.১ / ১.৩.২ / ১.৩.৪ / ১.৪.৩.
Read book pp. 5–7 and 13 before seeding. Do not guess these — the whole point of
the validation gate is that titles trace to the printed page.

### Tables and figures worth digitising

| Ref | Content | Use |
|---|---|---|
| টেবিল ১.০১ | 7 SI base quantities, units, symbols | Reference table + quiz source |
| টেবিল ১.০২ | Distances 10⁻¹⁵→10²², masses 10⁻³¹→10⁴¹ kg, times 10⁻²¹→10¹⁷ s | **Scale explorer visualization** |
| টেবিল ১.০৩ | 7 defining constants (c, h, e, Δν, k, N_A, K_cd) | Reference table |
| টেবিল ১.০৪ | New SI wheel diagram | Interactive wheel |
| টেবিল ১.০৫ | SI prefixes deca→exa, deci→atto | **Prefix converter** |
| টেবিল ১.০৬ | Caliper lab data table (M, V, VC, M+V×VC) | **Virtual lab worksheet** |
| চিত্র ১.০৭ | Vernier scale shifted one/two/three divisions | Vernier simulation |
| চিত্র ১.১১ | Paper slide-caliper cut-out | Printable offline activity |

---

## Learning objectives (as printed, book p. 2)

The book states twelve. They are the natural lesson boundaries:

1. পদার্থবিজ্ঞানের পরিসর ও ক্রমবিকাশ ব্যাখ্যা করা
2. পদার্থবিজ্ঞান পাঠের উদ্দেশ্য বর্ণনা করা
3. ভৌত রাশি (মান ও এককসহ) ও পদার্থবিজ্ঞানের মূল ভিত্তি ব্যাখ্যা করা
4. পরিমাপ ও এককের প্রয়োজনীয়তা ব্যাখ্যা করা
5. মৌলিক রাশি ও লব্ধ রাশির পার্থক্য ব্যাখ্যা করা
6. পরিমাপের আন্তর্জাতিক একক ব্যাখ্যা করা
7. রাশির মাত্রা হিসাব করা
8. উপসর্গের গুণিতক/উপগুণিতক রূপান্তর ও বৈজ্ঞানিক প্রতীক ব্যবহার
9. যন্ত্রপাতি ব্যবহার করে ভৌত রাশি পরিমাপ করা
10. পরিমাপে যথার্থতা ও নির্ভুলতা বজায় রাখার কৌশল ব্যাখ্যা করা
11. সরল যন্ত্রপাতিতে সুষম বস্তুর ক্ষেত্রফল ও আয়তন নির্ণয় করা
12. দৈনন্দিন বস্তুর দৈর্ঘ্য, ভর, ক্ষেত্রফল ও আয়তন নির্ণয় করা

Objectives 9–12 are all *measurement performance* objectives. That is what makes
this chapter unexpectedly good for your platform — see below.

---

## Proposed Topic → Lesson breakdown

Nine topics. `displayOrder` shown; maps directly onto the `Topic` and `Lesson`
tables.

| # | Topic (bn) | Topic (en) | Book pp. | Lessons | Interactive weight |
|---|---|---|---|---|---|
| 1 | পদার্থবিজ্ঞান ও এর পরিসর | Physics and Its Scope | 3–4 | 2 | Low |
| 2 | পদার্থবিজ্ঞানের ক্রমবিকাশ | Evolution of Physics | 5–11 | 3 | Low (timeline) |
| 3 | পদার্থবিজ্ঞান পাঠের উদ্দেশ্য | Objectives of Physics | 11–13 | 2 | Low |
| 4 | ভৌত রাশি ও একক | Physical Quantities and Units | 14–17 | 3 | **High** |
| 5 | উপসর্গ ও বৈজ্ঞানিক প্রকাশ | Prefixes and Scientific Notation | 17–18 | 2 | **High** |
| 6 | রাশির মাত্রা | Dimensions of Quantities | 18–19 | 2 | Medium |
| 7 | পরিমাপের যন্ত্রপাতি | Measuring Instruments | 20–24 | 3 | **Very high** |
| 8 | অনুসন্ধান: ক্যালিপার্স ল্যাব | Investigation: Caliper Lab | 25 | 1 | **Very high** |
| 9 | পরিমাপের ত্রুটি ও নির্ভুলতা | Error and Accuracy | 26–28 | 3 | **High** |

**Topics 1–3 are 11 of 31 pages and are pure prose history.** There is nothing
to simulate there. Give them one timeline visualization and good typography, and
spend your engineering budget on topics 4–9. Resist the urge to make the history
section interactive; it will cost days and demo poorly.

---

## Visualization and simulation plan

Mapped to `Visualization.type` / `Simulation.type` registry keys.

### Tier 1 — build these

#### 1. `SIM_VERNIER_CALIPER` — Vernier caliper virtual lab

**Topics 7, 8. This is the centrepiece. Build it first.**

Why this one: the book hands you a complete, citable lab procedure
(অনুসন্ধান ১.০১, p. 25) *and* the exact data table (টেবিল ১.০৬) *and* worked
figures (চিত্র ১.০৭). You are not inventing pedagogy — you are digitising a
printed procedure, which is precisely the defensible position your content
governance policy demands.

Reading model, straight from the book:

```
VC (vernier constant) = S / n
  S = value of one smallest main-scale division (1 mm)
  n = number of vernier divisions (10, 20, or 50)
Reading = M + (V × VC)
  M = main-scale reading just before the vernier zero
  V = index of the vernier line coinciding with a main-scale line
```

`SimulationParameter` rows:

| name | labelBn | type | default | min | max |
|---|---|---|---|---|---|
| `vernierDivisions` | ভার্নিয়ার ভাগসংখ্যা | ENUM | 10 | — | 10/20/50 |
| `mainScaleDivision` | প্রধান স্কেলের ক্ষুদ্রতম ভাগ | FLOAT | 1.0 | 0.5 | 1.0 |
| `objectLength` | বস্তুর দৈর্ঘ্য | FLOAT | 24.4 | 0 | 100 |
| `showAnswer` | উত্তর দেখাও | BOOLEAN | false | — | — |

Two modes worth having: **explore** (drag the jaws, reading displayed live) and
**practise** (random object length, student types a reading, checked against
truth). Practise mode is what generates `QuizAttemptAnswer` rows and feeds the
weak-topic analytics in FR-018.

#### 2. `SIM_SCREW_GAUGE` — Screw gauge

**Topic 7.** Book p. 22 gives pitch = 1 mm per full turn, 100 circular
divisions, least count = 1/100 mm = 0.01 mm.

Build this **second, immediately after the caliper**, and time it. If your
registry architecture is right, the second instrument should cost a fraction of
the first — same drag-read-verify skeleton, different geometry. That measured
delta ("instrument two took 20% of instrument one") is the concrete extensibility
evidence your report currently lacks. Record the number.

#### 3. `VIZ_LOG_SCALE_EXPLORER` — Scale of the universe

**Topic 4**, from টেবিল ১.০২. A single logarithmic slider sweeping 10⁻¹⁵ m
(proton radius) to 10²² m (nearest galaxy), with the book's objects — virus,
hydrogen atom, Everest, Earth radius, solar system — placed at their exponents.
Three tracks: distance, mass, time.

Cheap to build, visually striking, and it makes the abstract point of §1.5.2
(why prefixes exist) *viscerally* rather than as a table. Entirely data-driven
from a JSON array, so it is config, not code — and it is reusable in astronomy
and atomic-structure chapters later.

#### 4. `SIM_ERROR_PROPAGATION` — Error in derived quantities

**Topic 9.** The book's worked example on p. 28 gives you a free test fixture:
a box measured as 10 ± 0.5, 5 ± 0.5, 4 ± 0.5 cm yields volume bounds
149.625 cm³ < V < 259.875 cm³, absolute error 59.875 cm³, relative error ≈ 30%.

Three sliders for dimensions, three for uncertainties, live min/max band and
percentage. The teaching payload — that a 10% error in length becomes ~20% in
area and ~30% in volume — is stated explicitly on p. 28 and is very hard to feel
from the algebra alone.

**Unit-test this against the book's numbers.** It converts a documented worked
example into a passing test case, which is exactly what your Chapter 23 needs
instead of a table of "Not Run".

### Tier 2 — build if time allows

| Key | Topic | Note |
|---|---|---|
| `VIZ_PREFIX_CONVERTER` | 5 | Enter a value, see it across all prefixes in টেবিল ১.০৫ and in scientific notation. Half a day's work, directly serves objective 8. |
| `VIZ_DIMENSION_BUILDER` | 6 | Drag M, L, T exponents; identify the quantity. Book gives [velocity] = LT⁻¹, [acceleration] = LT⁻². |
| `VIZ_TIMELINE` | 2 | Scrollable timeline: Archimedes (287 BC), Eratosthenes (276 BC), Aryabhata (476), Al-Khwarizmi (783), Al-Masudi (896), Ibn al-Haytham (965), Shen Kuo (1031), Young (1801), Dalton (1803), Maxwell (1864), Michelson–Morley (1887), Thomson (1897), Planck (1900), Rutherford (1911), S.N. Bose (1924), J.C. Bose (1858–1937). All dates printed in the book. |
| `VIZ_SI_WHEEL` | 4 | Interactive version of টেবিল ১.০৪ — click a unit, see its constant-based definition from টেবিল ১.০৩. |

### Not worth building

A ruler/scale simulation for §1.6.1 on its own. It is subsumed by the caliper's
main scale — build the caliper and you get the ruler for free.

---

## Implementation guidance

### Use SVG, not Canvas, for these instruments

This is the most important technical call in the chapter, and it runs against
the instinct to reach for Canvas for anything "simulation".

- **Bangla labels render correctly.** Canvas `fillText` does not reliably shape
  conjuncts and matras; SVG `<text>` uses the normal text pipeline and just
  works. Given that every label here is Bangla, this alone decides it.
- **Crisp at any zoom**, which matters for scale markings that must be read to
  a fraction of a division.
- **The geometry is nearly static.** A caliper is one fixed scale plus one
  sliding group — a `transform: translateX()` on a `<g>`, not a redraw loop.
  Canvas earns its keep for particle-heavy scenes (motion, waves, fields in
  later chapters), not for two rulers.
- **Inspectable and accessible.** Values live in the DOM, so tests can assert on
  them without pixel-diffing.

Reserve Canvas/WebGL for Chapters 2, 3 and 7 where you genuinely animate many
bodies.

### Separate the physics from the component

Keep the reading logic in pure functions with no React import:

```ts
// lib/instruments/vernier.ts
export function vernierConstant(mainDiv: number, n: number): number

export function readVernier(
  trueLength: number, mainDiv: number, n: number
): { M: number; V: number; reading: number }
```

Then `<VernierCaliper />` only handles drag and rendering. Three reasons this
matters here specifically:

1. You can unit-test against the book's own figures and worked examples, which
   turns Chapter 23 from a plan into evidence.
2. The same functions serve the auto-grader in practise mode.
3. It keeps the registry renderers thin, which is what makes instrument #2 cheap.

### Registry wiring

```
LessonComponent.componentType = SIMULATION
  → Simulation.type = "SIM_VERNIER_CALIPER"
    → registry lookup → <VernierCaliper config={...} parameters={...} />
```

Every renderer takes the same three props — `config`, `parameters`,
`onActivity` — so adding an instrument means adding one registry entry and one
component, touching no lesson, topic or routing code. **That invariant is your
project's actual research contribution.** Write it down when you can demonstrate
it, and cite the caliper→screw-gauge time delta as the measurement.

---

## Build order

1. `SIM_VERNIER_CALIPER` in explore mode — proves the registry end to end
2. `SIM_SCREW_GAUGE` — **time this**; it is your extensibility evidence
3. `SIM_ERROR_PROPAGATION` — unit-tested against p. 28's worked example
4. `VIZ_LOG_SCALE_EXPLORER` — the demo's visual hook
5. Caliper practise mode + auto-grading — closes the assess loop
6. Tier 2 items as time allows

Seed topics 4–9 first. Topics 1–3 are prose and can be authored last, since they
block nothing.

---

## Open items before seeding

1. Confirm headings ১.৩, ১.৩.১, ১.৩.২, ১.৩.৪, ১.৪.৩ from book pp. 5–7 and 13.
2. Decide OCR tooling for bulk Bangla text (Tesseract `ben`), or accept manual
   authoring for Chapter 1 and defer the pipeline.
3. Digitise the নমুনা প্রশ্ন MCQs (pp. 29–31) into `Question` rows — they are
   pre-written, curriculum-aligned assessment items, so use them rather than
   writing your own.
