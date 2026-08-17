# Content Plan — Physics 9–10, Chapter 13

## Source

| Field | Value |
|---|---|
| Chapter | ত্রয়োদশ অধ্যায় — তেজস্ক্রিয়তা ও ইলেকট্রনিকস (Radioactivity and Electronics) |
| Book pages | 347–360 |
| PDF pages | 352–365 (offset +5, same as Chapters 1–12) |

**This is the final chapter of the book** — page 360 (pdf 365) ends with "সমাপ্ত" (The End), followed only by the back cover (pdf 366). Once this chapter's Tier-1 scope is complete, the textbook's simulation coverage is complete.

## Confirmed section structure

| § | Title | Book p. |
|---|---|---|
| — | Chapter opener + objectives | 347 |
| ১৩.১ | তেজস্ক্রিয়তা (Radioactivity) — isotopes, C-12/13/14 example | 348–349 |
| ১৩.১.১ | আলফা রশ্মি (Alpha Ray) — a helium nucleus, U-238 → Th-234 + He-4 | 349–350 |
| ১৩.১.২ | বিটা রশ্মি (Beta Ray) — an electron, n⁰ → p⁺ + e⁻ + ν̄ | 350–351 |
| ১৩.১.৩ | গামা রশ্মি (Gamma Ray) — an electromagnetic wave, chargeless, massless | 352 |
| ১৩.১.৪ | অর্ধায়ু (Half Life) — N = N₀(1/2)^(t/T) | 352 |
| ১৩.১.৫ | তেজস্ক্রিয়তার ব্যবহার (Uses of Radioactivity) — carbon dating, cancer treatment | 353 |
| ১৩.১.৬ | তেজস্ক্রিয়তা সম্পর্কে সচেতনতা (Awareness of Radioactivity) — Marie Curie, Hiroshima/Nagasaki | 353–354 |
| ১৩.২ | ইলেকট্রনিকসের ক্রমবিকাশ (Development of Electronics) | 354 |
| ১৩.২.১ | ভ্যাকুয়াম টিউব (Vacuum Tube) — Edison effect, diode, triode, ENIAC | 354–355 |
| ১৩.২.২ | ট্রানজিস্টর (Transistor) — Bell Labs, 1947 | 355 |
| ১৩.২.৩ | সমন্বিত বর্তনী (Integrated Circuit) — IC, LSI, VLSI | 355 |
| ১৩.২.৪ | ভবিষ্যতের ইলেকট্রনিকস (Future Electronics) — optics-based ICs, FPGA | 356 |
| ১৩.৩ | অ্যানালগ ও ডিজিটাল ইলেকট্রনিকস (Analog & Digital Electronics) — continuous vs. binary (0/1) signals | 356–357 |
| ১৩.৪ | সেমিকন্ডাক্টর (Semiconductor) — silicon lattice, n-type (phosphorus, extra electron) and p-type (boron, hole) doping | 357–358 |
| — | নমুনা প্রশ্ন (Sample MCQs, creative and short questions) | 359–360 |

No unconfirmed section numbers this chapter — every heading was read directly off a printed page. §১৩.২ (development of electronics history) and most of §১৩.৩ are narrative/historical rather than equation-bearing; §১৩.১.৪ (half-life) is this chapter's one genuinely quantitative relation with printed worked examples, and §১৩.১.১–১৩.১.৩ (radiation types) and §১৩.৪ (semiconductor doping) give deterministic classification rules rather than formulas — the same "rule engine" shape already used for several of Chapter 12's artefacts.

## Key relations, as printed

```
Half-life decay:   N = N0 * (1/2)^(t/T)                         (p. 352)
Alpha decay:        parent -> daughter (Z-2, A-4) + He-4         (p. 350)
Beta decay:          n -> p + e- + antineutrino (Z+1, A same)      (p. 350-351)
```

## Worked examples, as printed (traceable test fixtures)

- p. 350: U-238 (Z=92) alpha-decays to Th-234 (Z=90) + He-4 — atomic number drops by 2, mass number by 4.
- p. 351: C-14 beta-decays to N-14 — neutron count drops by one, proton count rises by one, atomic number +1, mass number unchanged.
- p. 352: 1 kg sample, half-life 100 years → after 200 years (= 2 half-lives), only 1/4 of the original radioactive nuclei remain (3/4 have decayed) — note the book's own point that total *mass* barely changes, since decay only converts a small fraction of nuclei, not the bulk material.
- p. 360 (সৃজনশীল প্রশ্ন ১): 1 kg sample → 250 g of the *original isotope* remains after 900 years → solving 0.25 = (1/2)^(900/T) gives T = 450 years.

## Visualization and simulation plan

### Tier 1 — done

All four built, registered, seeded (`scripts/seedChapter13.ts`), and verified live (see the reinitialized-MySQL note in Chapter 11's plan — the same fresh instance and full reseed covered this chapter too). Signed in as the seeded student and walked all four lessons in a real browser: confirmed no negative-SVG-width regressions, confirmed `SIM_HALF_LIFE`'s default (T=100, t=200) gives exactly 25% remaining after 2 half-lives, confirmed `SIM_RADIATION_SHIELDING`'s default (beta vs. paper) correctly shows the radiation passing through and recommends aluminium instead, confirmed `SIM_SEMICONDUCTOR_DOPING`'s default (5 valence electrons) correctly classifies n-type with a free-electron carrier, confirmed `SIM_BINARY_CONVERTER`'s default (42) gives exactly `101010`. **This closes out full Tier-1 simulation coverage, seeding, and browser verification of the entire textbook — all 13 chapters.**

#### 1. `SIM_HALF_LIFE` — অর্ধায়ু, §১৩.১.৪

Digitises N = N₀(1/2)^(t/T) directly (p. 352): an adjustable half-life and elapsed time, live remaining-fraction readout and a decay-curve plot. Tested against both of the book's own worked examples: 200 years at a 100-year half-life leaves exactly 1/4, and the sample question's reverse direction (1 kg → 250 g at 900 years implies T = 450 years).

#### 2. `SIM_RADIATION_SHIELDING` — আলফা, বিটা, গামা রশ্মি, চিত্র ১৩.০১

Digitises §১৩.১.১–১৩.১.৩ (pp. 349–352) as a deterministic rule engine: given a radiation type (alpha/beta/gamma) and a shield material/thickness, predicts whether the radiation is blocked — reproducing the book's own printed thresholds (paper stops alpha; a few mm of aluminium stops beta; several cm of lead is needed for gamma) exactly as চিত্র ১৩.০১ shows them side by side.

#### 3. `SIM_SEMICONDUCTOR_DOPING` — সেমিকন্ডাক্টর, চিত্র ১৩.০৫

Digitises §১৩.৪ (pp. 357–358) as a rule engine: given a dopant's own valence-electron count (relative to silicon's four), classifies the resulting doped semiconductor as n-type (5-valence dopant, e.g. phosphorus — a free extra electron) or p-type (3-valence dopant, e.g. boron — a "hole"), reproducing the book's own explanation of why each type conducts.

#### 4. `SIM_BINARY_CONVERTER` — অ্যানালগ ও ডিজিটাল, বাইনারি সংখ্যা, §১৩.৩

Digitises §১৩.৩'s own foundational point for digital electronics (pp. 356–357): any value can be represented as a binary (0/1) number rather than a continuous analog voltage. A decimal-to-binary and binary-to-decimal converter with a live bit-pattern display, grounding the chapter's own explanation of why digital signals resist noise where analog ones do not.

### Tier 2 — build if time allows

| Key | Topic | Note |
|---|---|---|
| `VIZ_ELECTRONICS_TIMELINE` | §১৩.২.১–১৩.২.৩ | Vacuum tube → transistor → IC timeline gallery — historical/narrative, not quantitative. |
| `VIZ_ANALOG_VS_DIGITAL_SIGNAL` | §১৩.৩, চিত্র ১৩.০৪ | Side-by-side noisy analog vs. clean digital waveform — illustrative, closely related to what `SIM_BINARY_CONVERTER` already covers conceptually. |
| `VIZ_CARBON_DATING` | §১৩.১.৫ | Archaeological carbon-14 dating walkthrough — a direct application of `SIM_HALF_LIFE`, narrower than building as its own artefact. |

## Open items

None outstanding — every section and worked example was read directly from the printed page before this plan was written. This chapter's completion marks full Tier-1 simulation coverage of the entire physics textbook (Chapters 1–13).
