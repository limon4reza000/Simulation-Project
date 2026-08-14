# Interactive Learning and Simulation Platform

An interactive learning platform for Bangladeshi secondary students, built on
NCTB curriculum content. First vertical slice: **Physics, Class 9–10, Chapter 1
— ভৌত রাশি এবং তাদের পরিমাপ**.

## Status

| Area | State |
|---|---|
| Database schema | Migrated and verified against MySQL 8.4.9; all CHECK constraints proven to enforce |
| Seed script | Runs clean: 2 classes, 9 topics, 5 lessons, 5 questions, 11 components |
| Instrument logic | Complete, 32 unit tests against printed worked examples |
| Renderers | 4 built: vernier caliper, screw gauge, error propagation, log-scale explorer |
| Component registry | Complete, 11 tests |
| API layer | Catalog, lesson, activity and quiz endpoints; 58 tests plus a 31-check live-database flow |
| Auth | Session cookies with scrypt passwords; the header shim is gone |
| Quizzes | Server-graded, verified live; 5 of the 6 printed MCQs seeded |
| Progress aggregation | **Not started** |

The quiz flow has been exercised end to end against a real MySQL 8.4 server:
scoring, per-question persistence, attempt ownership (403), duplicate submission
(409), attempt limits (409), and no answer-key leakage through any
student-facing response.

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
npm test         # 52 tests
npm run build
```

The dev harness renders the Chapter 1 lessons, toggles Bangla/English, and
shows the activity stream that will become
`POST /api/simulations/:id/activity`.

### Backend (needs MySQL 8.0.16+)

```bash
cd backend
npm install
cp .env.example .env               # then set DATABASE_URL
npx prisma migrate deploy          # creates the 35 tables
mysql -u USER -p ilsp_dev < prisma/sql/01_check_constraints.sql
npm run db:seed
npm run dev                        # API on http://localhost:4000
npm test                           # 82 tests, no database required
```

The constraints are applied as a **separate step**, not pasted into the
generated migration. Editing a migration after it has been applied changes its
checksum and Prisma then reports drift on every subsequent `migrate dev`. Keeping
them in their own file avoids that and keeps the reason for each one next to it.

Those statements enforce the LessonComponent exclusive arc, percentage bounds,
score and page-order sanity, and Bangla collation. **MySQL below 8.0.16 parses
CHECK constraints and silently ignores them**, which is worse than not having
them — verify with `SELECT VERSION();`. Confirm they took with:

```sql
SELECT CONSTRAINT_NAME FROM information_schema.CHECK_CONSTRAINTS
WHERE CONSTRAINT_SCHEMA = 'ilsp_dev';   -- expect 6 rows
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
| GET | `/api/quizzes/:id?lang=bn\|en` | Questions and options — **never the answer key** |
| POST | `/api/quizzes/:id/attempts` | Starts an attempt; enforces the attempt limit |
| POST | `/api/attempts/:id/submit` | Grades server-side; reveals keys and explanations |
| POST | `/api/auth/login` | Sets the session cookie |
| POST | `/api/auth/logout` | Revokes this session |
| POST | `/api/auth/logout-all` | Revokes every session for the user |
| GET | `/api/auth/me` | Current user, or 401 |

`GET /api/lessons/:id` is a drop-in replacement for
`frontend/src/data/chapter01.ts` — same shape, so the renderers are unchanged.
Every catalog query filters on published-and-not-deleted; there is deliberately
no `?includeDrafts` flag, because that would be one forgotten guard away from
showing unreviewed content to a child.

### Authentication

Session cookies, not tokens in localStorage.

- Passwords are hashed with **scrypt** from node's standard library — no native
  module to compile and one less dependency in the supply chain of a platform
  used by children. Parameters travel inside the hash string, so they can be
  raised later without invalidating existing passwords.
- Passwords are Unicode-normalised (NFKC) before hashing, so a Bangla password
  typed on one keyboard matches the same password typed on another.
- The session cookie is `httpOnly`, `SameSite=Lax`, and `Secure` outside
  development. Page scripts cannot read it.
- The database stores **only a SHA-256 of the session token**. A dump of the
  session table does not let anyone impersonate a user. (SHA-256 rather than
  scrypt is deliberate: the token is 256 bits of randomness, so there is no
  dictionary to slow down. Passwords need a slow KDF because humans choose
  them; tokens do not.)
- Sessions are rows, not self-contained tokens, so logout, "sign out
  everywhere" and suspending an account take effect immediately.
- A wrong password and an unknown email return the same status, code and
  message, and unknown emails still burn comparable CPU — otherwise response
  latency alone reveals which addresses are registered.
- Login failures are rate limited per IP + email. The limiter is in-process, so
  a multi-instance deployment must move it to Redis or the database.

Because the cookie is cross-origin in development, CORS runs with
`credentials: true` and an explicit origin allowlist — a wildcard origin cannot
be combined with credentials, and should not be.

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

Set `VITE_API_URL` to point the client at a different API host.

Seeded development login: `student@example.local` / `ChangeMe!123` (override
with `SEED_PASSWORD`). These are well-known credentials and must never exist in
a deployed environment.

## Next

1. Move the login rate limiter out of process memory before running more than
   one API instance
2. `TeacherAssignment`-scoped teacher views and role-gated authoring routes
3. Quiz engine, seeded from the নমুনা প্রশ্ন MCQs on book pp. 29–31
4. Progress aggregation from `LessonProgress` / `TopicProgress`
5. Time how long instrument #3 takes and record it — that number is the
   extensibility evidence the report needs
