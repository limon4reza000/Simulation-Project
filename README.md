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
| API layer | Catalog + lesson + activity endpoints, 25 tests — **never run against a real database** |
| Auth | **Not started** — a clearly-marked dev header shim stands in |
| Progress, quizzes | **Not started** |

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
npm run dev          # API on http://localhost:4000
npm test             # 25 tests, no database required
```

## API

All responses are wrapped: `{ "data": ... }` on success, `{ "error": { code,
message } }` on failure.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | No database access — use it to check the process is up |
| GET | `/api/classes` | Published classes with their published subjects |
| GET | `/api/subjects/:id/chapters` | |
| GET | `/api/chapters/:id/topics` | Topics with lesson summaries |
| GET | `/api/lessons/:id?lang=bn\|en` | Returns the LessonSpec the renderers consume |
| POST | `/api/simulations/:id/activity` | Requires an authenticated student |

`GET /api/lessons/:id` is a drop-in replacement for
`frontend/src/data/chapter01.ts` — same shape, so the renderers are unchanged.
Every catalog query filters on published-and-not-deleted; there is deliberately
no `?includeDrafts` flag, because that would be one forgotten guard away from
showing unreviewed content to a child.

### The auth shim — read this before deploying anything

There is no real authentication yet. `POST /api/simulations/:id/activity`
identifies the caller from an `x-student-id` header, which is **trivially
spoofable** — any caller could write activity rows for any student.

It is therefore **off by default** and only honoured when the API runs with
`ALLOW_HEADER_IDENTITY=true`. With it off, the endpoint returns 401. The server
logs a warning at startup when it is enabled. Delete `src/lib/auth.ts`'s header
path the moment session auth lands.

Data minimisation is enforced server-side, not left to callers: `activityType`
must be `UPPER_SNAKE_CASE` (so free text cannot be smuggled into what is
effectively an enum), and `metadata` accepts at most 10 keys of primitives with
short strings — no nested objects. The users are children; "we only send what we
need" is not a control if the server accepts anything.

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

## Frontend data source

The app reads from the API when it is reachable and falls back to the bundled
fixtures when it is not, so the renderers stay workable without MySQL. **The
active source is shown in the header.** A silent fallback would be worse than no
fallback, because fixture data would be mistaken for live data.

Set `VITE_API_URL` to point elsewhere, and `VITE_STUDENT_ID` to exercise the
activity endpoint while the dev shim is enabled.

## Next

1. Run the migration and seed against a real MySQL instance — nothing in
   `backend/prisma` has ever touched a live database
2. Session auth + roles, then `TeacherAssignment`-scoped teacher views;
   delete the `x-student-id` shim
3. Quiz engine, seeded from the নমুনা প্রশ্ন MCQs on book pp. 29–31
4. Progress aggregation from `LessonProgress` / `TopicProgress`
5. Time how long instrument #3 takes and record it — that number is the
   extensibility evidence the report needs
