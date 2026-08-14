# Interactive Learning and Simulation Platform

An interactive learning platform for Bangladeshi secondary students, built on
NCTB curriculum content. First vertical slice: **Physics, Class 9–10, Chapter 1
— ভৌত রাশি এবং তাদের পরিমাপ**.

## Status

| Area | State |
|---|---|
| Database schema | Written and validated (34 models) — **not yet migrated against a live DB** |
| Seed script | Written and typechecked — **not yet executed** (needs MySQL) |
| Instrument logic | Complete, 32 unit tests against printed worked examples |
| Renderers | 4 built: vernier caliper, screw gauge, error propagation, log-scale explorer |
| Component registry | Complete, 11 tests |
| API layer | **Not started** — the frontend runs from inlined fixtures |
| Auth, progress, quizzes | **Not started** |

Everything marked "not yet executed" is blocked only on a running MySQL
instance, not on missing code.

## Layout

```
backend/
  prisma/
    schema.prisma              34 models; see docs/architecture/schema-decisions.md
    sql/01_check_constraints.sql   integrity rules Prisma cannot express
    seed.ts                    Physics 9–10 Chapter 1
frontend/
  src/
    lib/instruments/           pure reading logic — no React, fully tested
    lib/measurement/           error propagation
    components/instruments/    VernierCaliper, ScrewGauge (SVG)
    components/measurement/    ErrorPropagationLab
    components/viz/            LogScaleExplorer
    registry/                  the component registry — the load-bearing abstraction
    data/chapter01.ts          fixtures standing in for the API
docs/
  architecture/schema-decisions.md   every deviation from the report, justified
  content/physics-9-10-chapter-01.md content plan traced to book pages
```

## Running it

### Frontend (works today, no database needed)

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm test         # 43 tests
npm run build
```

The dev harness renders the Chapter 1 lessons, toggles Bangla/English, and
shows the activity stream that will become
`POST /api/simulations/:id/activity`.

### Backend (needs MySQL 8.0.16+)

```bash
cd backend
npm install
cp .env.example .env          # then set DATABASE_URL
npx prisma migrate dev --name init
```

Then paste the contents of `prisma/sql/01_check_constraints.sql` at the end of
the generated `prisma/migrations/<timestamp>_init/migration.sql` and re-run the
migration against a clean database. Those statements enforce the
LessonComponent exclusive arc, percentage bounds, and Bangla collation — see the
file's header for why each one is there. **MySQL below 8.0.16 parses CHECK
constraints and silently ignores them**, which is worse than not having them.

```bash
npm run db:seed
```

## Design decisions worth knowing before you change anything

**The component registry is the architecture.** `Simulation.type` in the
database is a key into `frontend/src/registry/componentRegistry.ts`. Adding an
instrument means one component plus one line in that map — no lesson, topic,
routing or content code is touched. `LessonRenderer.tsx` deliberately contains
no mention of calipers or physics. Keep it that way; it is the project's actual
contribution.

**Instrument logic is pure and separate from rendering.** `lib/instruments/*.ts`
imports no React. That is what allows the reading model to be unit-tested
against the textbook's own printed figures, and it lets the same functions serve
the renderer and the practice-mode auto-grader.

**SVG, not Canvas, for the instruments.** Canvas `fillText` does not reliably
shape Bangla conjuncts; SVG `<text>` uses the normal text pipeline. Every label
here is Bangla, so that alone settles it. The geometry is also one static scale
plus one transformed group — there is no redraw loop to justify. Reserve Canvas
for Chapters 2, 3 and 7, where many bodies actually animate.

**Prisma is pinned to v6.** Prisma 7 moves the datasource URL into
`prisma.config.ts`. v6 matches the tutorials and answers you will actually be
reading. Deliberate, not stale.

**No webfonts.** The Bangla font stack leads with faces that ship on the target
devices (Nirmala UI, Noto Sans Bengali). Bangla webfonts are large and the
target user is on a metered connection.

## Content provenance

Content traces to `Secondary (BV)-2026_Class 9-10_Physics_compressed.pdf`
(NCTB 2026). Every seeded `ContentVersion` carries a `TextbookReference` with a
page number and an APPROVED `ContentValidation`, because §14.4 of the project
report forbids publishing without one.

Two headings in Chapter 1 (১.৩ and its subsections ১.৩.১/২/৪, plus ১.৪.৩) are
**not yet confirmed** against the printed page and are marked as such in the
content plan. Do not guess them — the whole point of the validation gate is that
titles trace to a page.

**The PDF has no text layer.** Its Bangla font carries no ToUnicode map, so
`pypdf` and `pdfium` both extract empty strings; pages must be rendered and read
visually. Bulk content extraction will need OCR (Tesseract with `ben`
traineddata), not text extraction. Budget for it.

## Next

1. Express API over the seeded schema, replacing `data/chapter01.ts`
2. Auth + roles, then `TeacherAssignment`-scoped teacher views
3. Quiz engine, seeded from the নমুনা প্রশ্ন MCQs on book pp. 29–31
4. Progress aggregation from `LessonProgress` / `TopicProgress`
5. Time how long instrument #3 takes and record it — that number is the
   extensibility evidence the report needs
