# Textbook Issues Log

Defects found in the source textbook while digitising it. These are **reported,
not corrected**. Guessing what the book meant would be exactly the fabrication
the content policy forbids, and a wrong guess propagates to every student who
uses the platform.

Each entry should end with a teacher's or supervisor's decision recorded against
it before the affected content is published.

**Source:** মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026 edition),
`Secondary (BV)-2026_Class 9-10_Physics_compressed.pdf`.

---

## TB-001 — Chapter 1, নমুনা প্রশ্ন Q4 (book p. 30): duplicate options

**Status:** open — question withheld from the seed
**Found:** 2026-08-14, while seeding the Chapter 1 assessment

### What the book prints

> ৪. একটি দণ্ডকে স্লাইড ক্যালিপার্সে স্থাপনের পর যে পাঠ পাওয়া গেল তা হচ্ছে প্রধান
> স্কেল পাঠ 4 cm, ভার্নিয়ার সমপাতন 7 এবং ভার্নিয়ার ধ্রুবক 0.1 mm, দণ্ডটির দৈর্ঘ্য কত?
>
> - (ক) 4.07 cm
> - (খ) 4.7 cm
> - (গ) **4.07 cm**
> - (ঘ) 4.7 mm

### The problem

Options (ক) and (গ) are identical. Worse, the duplicated value is the *correct*
answer:

```
M  = 4 cm = 40 mm
V  = 7
VC = 0.1 mm
reading = M + (V × VC) = 40 + 0.7 = 40.7 mm = 4.07 cm
```

So the question has two correct options and no single defensible key. It is
unanswerable as printed.

### What was done

The question is **not seeded**. `backend/prisma/seed.ts` seeds 5 of the 6
printed MCQs and logs the omission on every run. The frontend fixture in
`frontend/src/data/chapter01Quiz.ts` likewise skips question id 4 — note the ids
jump 3 → 5, which is deliberate and matches the book's numbering rather than
silently renumbering.

### Decision needed

One of:

1. **Correct the option** — treat (গ) as a typo for a plausible distractor
   (e.g. 40.7 cm or 4.007 cm) and record who authorised the change.
2. **Publish as-is with both keys accepted** — set `answerConfig.correct` to
   `["ka", "ga"]` so either selection is marked right.
3. **Leave it out permanently** and note the gap in the chapter assessment.

Option 2 is the most honest if the question must be used, since it neither
invents text nor penalises a student for the book's error. It needs a teacher's
sign-off either way.

---

## Notes on answer keys generally

**The textbook prints the questions but no answer key.** Every `correct` value
in the seed is therefore *derived*, by one of two routes:

| Question | Basis |
|---|---|
| Q1 (Planck) | Stated on book p. 8 |
| Q2 (Bose / boson) | Stated on book p. 8 |
| Q3 (heat not a base quantity) | টেবিল ১.০১, book p. 14 |
| Q5 (relative error 3.33 %) | Computed: 0.5 / 15 × 100 |
| Q6 (volume ratio 1 : 0.673) | Computed: 168 cm³ vs (4/3)πr³ = 113.1 cm³ |

Derivation is not the same as validation. These keys must be reviewed by a
subject teacher before the quiz is used for real assessment — which is precisely
what `ContentValidation` exists to record, and why the publication gate in §14.4
requires an APPROVED row rather than trusting the author.

---

## Still unconfirmed (not defects — just unread)

Chapter 1 headings ১.৩, ১.৩.১, ১.৩.২, ১.৩.৪ and ১.৪.৩ have not been read off the
printed page yet (book pp. 5–7 and 13). They are deliberately absent from the
seed rather than guessed. See `physics-9-10-chapter-01.md`.
