# Content Plan — Physics 9–10, Chapter 2

## Source

| Field | Value |
|---|---|
| Chapter | দ্বিতীয় অধ্যায় — গতি (Motion) |
| Book pages | 32–59 |
| PDF pages | 37–66 (offset +5, same as Chapter 1) |

## Confirmed section structure

| § | Title | Book p. |
|---|---|---|
| — | Chapter opener + objectives | 32–33 |
| ২.১ | স্থিতি এবং গতি (Rest and Motion) | 34 |
| ২.২ | বিভিন্ন প্রকার গতি (Different Types of Motion) | 35–37 |
| — | সরলরৈখিক গতি (Linear), ঘূর্ণন গতি (Circular), চলন গতি (Translational) | 36 |
| — | পর্যায়বৃত্ত গতি (Periodic), সরল স্পন্দন গতি (SHM) | 37 |
| ২.৩ | স্কেলার ও ভেক্টর রাশি (Scalar and Vector Quantities) | 38 |
| ২.৪ | দূরত্ব ও সরণ (Distance and Displacement) | 39 |
| ২.৫ | দ্রুতি এবং বেগ (Speed and Velocity) | 40 |
| ২.৬ | ত্বরণ (Acceleration) | 43 |
| ২.৭ | গতির সমীকরণ (Equations of Motion) | 45–47 |
| ২.৮ | পড়ন্ত বস্তুর সূত্র (Galileo's Laws of Falling Bodies) | 48–50 |
| — | গতি ও লেখচিত্র (Motion and Graphs) | 51–53 |
| — | অনুসন্ধান ২.০১: ঢালু তলের পরীক্ষা (Inclined Plane Investigation) | 54–56 |
| — | নমুনা প্রশ্ন (Sample MCQs) | 59 |

**Unconfirmed:** the exact section number for "গতি ও লেখচিত্র" (Motion and Graphs) — it reads as continuous discussion after ২.৮ without a numbered header on the pages read. Not guessed; check book pp. 51–53 directly before seeding.

## Key equations, as printed (p. 45–50)

```
Uniform velocity:      s = vt
Uniformly accelerated: v = u + at
                        h = ut + ½gt²      (free fall, a = g)
                        v² = u² + 2gh      (free fall)
```

Galileo's three laws of falling bodies (p. 48), stated explicitly in the book:
1. Equal heights, no resistance → same fall time regardless of mass
2. v ∝ t (velocity proportional to time)
3. h ∝ t² (distance proportional to time squared)

## Visualization and simulation plan

### Tier 1 — build these

#### 1. `SIM_FREE_FALL` — পড়ন্ত বস্তুর সূত্র (built this session)

Digitises Galileo's three laws (p. 48) and the free-fall equations (p. 49) directly. A ball drops under `g = 9.8 m/s²`; live readouts show `v = gt` and `h = ½gt²`; a v–t plot and an h–t plot render alongside so the "v ∝ t, h ∝ t²" relationships in the book are seen, not just stated. Two-drop mode (different masses, same height) demonstrates the first law — same fall time regardless of mass.

#### 2. `SIM_INCLINED_PLANE` — অনুসন্ধান ২.০১

Book pp. 54–56 give a complete, citable lab: ramp length `L`, height `h`, angle `sin θ = h/L`, a ball timed rolling down, average speed `= L/t`, repeated across inclines. Same shape as the vernier caliper investigation in Chapter 1 — a printed procedure to digitise, not invented pedagogy.

#### 3. `VIZ_DISTANCE_DISPLACEMENT` — চিত্র ২.০৪

The book's winding-path figure (p. 39) is naturally interactive: a draggable point along a curved path accumulates distance while the displacement vector (straight line, start to current position) updates live. Makes the scalar/vector distinction in §২.৪ felt rather than defined.

#### 4. `VIZ_MOTION_GRAPHER` — গতি ও লেখচিত্র, চিত্র ২.০৯

The book's own worked example (p. 52) links s–t, v–t and a–t graphs from one dataset. A linked three-panel grapher — drag points on s–t, watch v–t and a–t update — makes the graphical-differentiation argument in this chapter far stronger than three static plots.

### Tier 2 — build if time allows

| Key | Topic | Note |
|---|---|---|
| `VIZ_MOTION_TYPES` | §২.২ | Small gallery: linear, circular, translational, periodic, SHM (pendulum), one canned animation each. Illustrative, not quantitative — lower priority than the Tier 1 items. |
| `VIZ_VECTOR_ADD` | §২.৩ | Two draggable vector arrows with a live resultant. General-purpose enough to reuse in later force chapters. |

## Build order

1. `SIM_FREE_FALL` — pure logic, tested against the book's own equations, then the renderer
2. `SIM_INCLINED_PLANE` — same shape as the Chapter 1 caliper investigation
3. `VIZ_DISTANCE_DISPLACEMENT`
4. `VIZ_MOTION_GRAPHER`

## Open items before seeding

1. Confirm the section number for গতি ও লেখচিত্র (pp. 51–53).
2. Digitise the বহুনির্বাচনি প্রশ্ন MCQs (p. 59+) into `Question` rows — same treatment as Chapter 1's নমুনা প্রশ্ন, watching for the kind of printing ambiguity found in Chapter 1 Q4.
