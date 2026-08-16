# Content Plan — Physics 9–10, Chapter 10

## Source

| Field | Value |
|---|---|
| Chapter | দশম অধ্যায় — স্থির বিদ্যুৎ (Static Electricity) |
| Book pages | 271–297 |
| PDF pages | 276–302 (offset +5, same as Chapters 1–9) |

## Confirmed section structure

| § | Title | Book p. |
|---|---|---|
| — | Chapter opener + objectives | 271 |
| ১০.১ | আধান বা চার্জ (Charge) — atomic structure, elementary charge e = 1.6×10⁻¹⁹ C | 272–273 |
| ১০.২ | ঘর্ষণে স্থির বিদ্যুৎ তৈরি (Static Electricity due to Friction) — triboelectric charging, চিত্র ১০.০২–১০.০৩ | 274–275 |
| ১০.৩ | বৈদ্যুতিক আবেশ (Electrical Induction), চিত্র ১০.০৪–১০.০৬ | 275–277 |
| ১০.৩.১ | তড়িৎবীক্ষণ যন্ত্র (Electroscope), চিত্র ১০.০৭–১০.০৮ | 278–279 |
| ১০.৪ | (বজ্রপাত/ব্যাখ্যা recap) | 277 |
| ১০.৫ | তড়িৎ ক্ষেত্র (Electric Field) — E = kq/r², F = Eq, field lines, চিত্র ১০.০৯–১০.১৩ | 279–286 |
| ১০.৬ | তড়িৎ বিভব (Electric Potential) — V(r) = kq/r, volt defined | 287–288 |
| ১০.৬.১ | বিভব পার্থক্য (Potential Difference) — shock safety, earthing | 288–289 |
| ১০.৭ | ধারক (Capacitor) — V = Q/C, energy = ½CV², C = r/k for a sphere, চিত্র ১০.১৫ | 289–290 |
| ১০.৮ | তড়িৎ বল (Electric Force) — Coulomb's law F = kq₁q₂/r², k = 9×10⁹ Nm²/C², চিত্র ১০.০৯–১০.১০ | 279–282 |
| ১০.৮.১–৮.৫ | Applications and hazards — fuel trucks, electronics/ESD, lightning and lightning rods | 291–292 |
| — | নমুনা প্রশ্ন (Sample MCQs, creative and short questions) | 293–297 |

Note: this chapter's own section numbering is non-monotonic in the printed book — ১০.৮ তড়িৎ বল (Coulomb's law, p. 279) appears in reading order *before* ১০.৫–১০.৭ physically in some editions' cross-references, but its heading number places it after them; the table above lists sections in the order they are physically printed (Charge → Friction → Induction → Electric Field → Potential → Capacitor → Electric Force → hazards), which is the order this plan follows for lesson sequencing regardless of the printed section numbers.

## Key equations, as printed

```
Elementary charge:      e = 1.6×10⁻¹⁹ C                              (p. 273)
Coulomb's law:            F = kq1q2/r²,  k = 9×10⁹ Nm²/C²              (p. 280)
Electric field:            E = kq/r²,  F = Eq                          (p. 283-284)
Electric potential:        V(r) = kq/r                                 (p. 288)
Capacitor:                 V = Q/C,  energy = ½CV²,  C = r/k (sphere)   (p. 289-290)
```

## Worked examples, as printed (traceable test fixtures)

- p. 280–281: +1 C and −1 C, 10 cm apart → F = −9×10¹¹ N (the negative sign denoting attraction).
- p. 281: +9 C and +16 C, 1 m apart — a third charge +q placed between them feels zero net force at x = 0.43 m from the +9 C charge (solving 9(1−x)² = 16x²).
- p. 282: hydrogen atom, proton and electron each 1.6×10⁻¹⁹ C, separated by 0.5×10⁻⁸ m → F = −9.22×10⁻¹² N (attraction).
- p. 282–283: how much charge on Earth and Moon would cancel their mutual gravity (F_G = 1.98×10²⁰ N) — solving F_E = F_G gives q = 5.69×10¹³ C, equivalent to only 324 kg of electrons (about the mass of one cow) on each body.
- p. 286: E = kq/r² for q = 5 C at r = 10 m → E = 4.5×10⁸ N/C.
- p. 286: F = qE rearranged — a 3 C charge feeling 10 N → E = 3.33 N/C.
- p. 290: a 20 μF capacitor at 10 V → energy = ½ × 20×10⁻⁶ × 10² = 10⁻³ J = 1 mJ.

## Visualization and simulation plan

### Tier 1 — done

All four built, registered, seeded (`scripts/seedChapter10.ts`), and verified live: signed in as the seeded student, walked all four lessons in a real browser, confirmed no negative-SVG-width regressions, confirmed `SIM_ELECTRON_TRANSFER`'s default (10 billion electrons) gives exactly ±1.6 nC, confirmed `SIM_COULOMBS_LAW`'s default (+1 C/−1 C at 0.5 m) gives exactly −3.6×10¹⁰ N with an attraction verdict, confirmed `SIM_ELECTRIC_FIELD`'s default (5 C at 10 m) reproduces the book's own 4.5×10⁸ N/C exactly alongside the companion 4.5×10⁹ V potential, confirmed `SIM_CAPACITOR_ENERGY`'s default (20 µF at 10 V) reproduces the book's own 1 mJ exactly. One real precision bug was found and fixed before any of this reached a renderer — see the commit for detail.

#### 1. `SIM_COULOMBS_LAW` — তড়িৎ বল, চিত্র ১০.০৯–১০.১০ (built this session)

Digitises §১০.৮ (pp. 279–282) directly: two point charges at an adjustable separation, live force from F = kq₁q₂/r², signed to show attraction vs repulsion exactly as the book's own sign convention does. Tested against both of the book's own worked examples: the +1 C/−1 C pair (−9×10¹¹ N) and the hydrogen-atom proton–electron pair (−9.22×10⁻¹² N) — as well as the equilibrium-point problem (+9 C and +16 C, zero-force point at x = 0.43 m).

#### 2. `SIM_ELECTRIC_FIELD` — তড়িৎ ক্ষেত্র ও বিভব, চিত্র ১০.১১–১০.১৪ (built this session)

Digitises §১০.৫–১০.৬ (pp. 283–288) together: a single point charge with an adjustable distance slider, live electric field (E = kq/r²) and electric potential (V = kq/r) readouts at that point, plus F = Eq for a placed test charge. Tested against both of the book's own field worked examples (5 C at 10 m → 4.5×10⁸ N/C; 10 N on 3 C → 3.33 N/C).

#### 3. `SIM_CAPACITOR_ENERGY` — ধারক, চিত্র ১০.১৫ (built this session)

Digitises §১০.৭ (pp. 289–290) directly: an adjustable capacitance and voltage, live stored energy from energy = ½CV², plus Q = CV. Tested against the book's own worked example (20 μF at 10 V → 1 mJ exactly).

#### 4. `SIM_ELECTRON_TRANSFER` — আধান ও ঘর্ষণে চার্জ, §১০.১–১০.২ (built this session)

Digitises §১০.১–১০.২ (pp. 272–275) as a discrete counting model: rubbing two materials transfers a whole number of electrons from one to the other, each carrying exactly e = 1.6×10⁻¹⁹ C, so the resulting charge on each object is always an integer multiple of e — the book's own point (p. 273) that charge is quantised, not continuous. An adjustable electron-count slider gives a live total-charge readout in coulombs, letting a student see just how many billions of electrons a everyday static-cling charge (nanocoulombs) actually represents.

### Tier 2 — build if time allows

| Key | Topic | Note |
|---|---|---|
| `VIZ_FIELD_LINES` | §১০.৫, চিত্র ১০.১১–১০.১৩ | Field-line diagrams for like/unlike charge pairs — qualitative, no printed numeric relation beyond what `SIM_ELECTRIC_FIELD` already covers. |
| `VIZ_ELECTROSCOPE` | §১০.৩.১, চিত্র ১০.০৭–১০.০৮ | Gold-leaf electroscope simulation (leaves diverge with charge) — illustrative, qualitative. |
| `VIZ_LIGHTNING_SAFETY` | §১০.৮.৫ | Lightning rod / earthing demonstration — descriptive safety content. |

## Open items

None outstanding — every section and worked example was read directly from the printed page before this plan was written.
