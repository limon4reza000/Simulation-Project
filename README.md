# Interactive Learning and Simulation Platform

An interactive learning platform for Bangladeshi secondary students, built on
NCTB curriculum content. First vertical slice: **Physics, Class 9–10**,
Chapters 1–7 (complete) — ভৌত রাশি এবং তাদের পরিমাপ, গতি, বল, কাজ ক্ষমতা ও শক্তি,
পদার্থের অবস্থা ও চাপ, বস্তুর ওপর তাপের প্রভাব, তরঙ্গ ও শব্দ.

## Status

524 tests passing (137 backend, 387 frontend), plus live-database and
browser-driven verification for every renderer.

| Area | State |
|---|---|
| Database schema | Migrated and verified against MySQL 8.4.9; all CHECK constraints proven to enforce |
| Seed | Chapters 1–7, each idempotent and independently re-runnable |
| Renderers | 29 built: caliper, screw gauge, error propagation, log-scale explorer, quiz runner, free fall, inclined plane, distance/displacement, motion grapher, collision, Newton's second law, friction incline, force balance, work, energy conversion, pendulum energy, power/efficiency, pressure, liquid pressure, Archimedes/buoyancy, Hooke's law, temperature scales, thermal expansion, heating curve, calorimetry, pendulum period, wave properties, sound speed, echo — each with pure-logic tests checked against the book's own equations or printed figures |
| Component registry | The architectural core: adding an artefact is one component + one registry line |
| API layer | Catalog, lesson, activity, quiz, progress, auth, registration, teacher-roster and admin-assignment endpoints |
| Auth | Separate student/teacher login and registration; session cookies, scrypt passwords, role enforced server-side |
| Teacher scoping | `TeacherAssignment`-scoped class rosters; only an ADMIN can grant or revoke a teacher's access to a class |
| Quizzes | Server-graded, verified live; the answer key never reaches the browser |
| Progress aggregation | Derived from lessons and quiz scores, never incremented in place; weak-topic identification |

The quiz flow has been exercised end to end against a real MySQL 8.4 server:
scoring, per-question persistence, attempt ownership (403), duplicate submission
(409), attempt limits (409), and no answer-key leakage through any
student-facing response.

## Layout

```
backend/
  prisma/
    schema.prisma              35 models; see docs/architecture/schema-decisions.md
    sql/01_check_constraints.sql   integrity rules Prisma cannot express
    seed.ts                    Physics 9–10 Chapter 1
  scripts/
    seedChapter2.ts            additive, per-lesson idempotent — see its header
    seedChapter3.ts            same pattern, for Chapter 3
    seedChapter4.ts            same pattern, for Chapter 4
    seedChapter5.ts            same pattern, for Chapter 5
    seedChapter6.ts            same pattern, for Chapter 6
    seedChapter7.ts            same pattern, for Chapter 7
frontend/
  src/
    lib/instruments/           Chapter 1 instrument logic — no React, fully tested
    lib/measurement/           error propagation
    lib/kinematics/            Chapter 2 kinematics logic — free fall, inclined
                                plane, path geometry, motion grapher
    lib/dynamics/               Chapter 3 dynamics logic — collision, Newton's
                                second law, friction incline, force balance
    lib/energy/                 Chapter 4 energy logic — work, kinetic/potential
                                energy conversion, pendulum energy, power/efficiency
    lib/pressure/                Chapter 5 pressure/matter logic — pressure,
                                liquid pressure, Archimedes/buoyancy, Hooke's law
    lib/heat/                    Chapter 6 heat logic — temperature scales,
                                thermal expansion, heating curve, calorimetry
    lib/waves/                   Chapter 7 wave/sound logic — pendulum period,
                                wave properties, sound speed, echo
    components/instruments/    VernierCaliper, ScrewGauge (SVG)
    components/measurement/    ErrorPropagationLab
    components/viz/            LogScaleExplorer
    components/kinematics/     FreeFall, InclinedPlane, DistanceDisplacement,
                                MotionGrapher
    components/dynamics/       Collision, NewtonsSecondLaw, FrictionIncline,
                                ForceBalance
    components/energy/         Work, EnergyConversion, PendulumEnergy,
                                PowerEfficiency
    components/pressure/       Pressure, LiquidPressure, Archimedes, HookesLaw
    components/heat/           TemperatureScales, ThermalExpansion, HeatingCurve,
                                CalorimetryLab
    components/waves/          PendulumPeriod, WaveProperties, SoundSpeed, Echo
    registry/                  the component registry — the load-bearing abstraction
    data/chapter01.ts          fixtures standing in for the API
docs/
  architecture/schema-decisions.md   every deviation from the report, justified
  content/physics-9-10-chapter-01.md content plan traced to book pages
  content/physics-9-10-chapter-02.md same, for Chapter 2
  content/physics-9-10-chapter-03.md same, for Chapter 3
  content/physics-9-10-chapter-04.md same, for Chapter 4
  content/physics-9-10-chapter-05.md same, for Chapter 5
  content/physics-9-10-chapter-06.md same, for Chapter 6
  content/physics-9-10-chapter-07.md same, for Chapter 7
  content/textbook-issues.md         printing defects found in the source book
```

## Running it

### Frontend (works today, no database needed)

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm test         # 387 tests
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
npm test                           # 137 tests, no database required
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
| GET | `/api/auth/enrollable-classes` | Classes 6–10, for the registration form |
| POST | `/api/auth/register/student` | Always creates a STUDENT; class required |
| POST | `/api/auth/register/teacher` | Always creates a TEACHER |
| GET | `/api/teacher/overview` | TEACHER only; scoped by TeacherAssignment |
| GET | `/api/teacher/classes/:id/students` | TEACHER only; 403 unless assigned to that class |
| GET | `/api/admin/assignable` | ADMIN only; teachers/classes/subjects for the assignment form |
| GET | `/api/admin/assignments` | ADMIN only; every current TeacherAssignment |
| POST | `/api/admin/assignments` | ADMIN only; grants a teacher access to a class |
| DELETE | `/api/admin/assignments/:id` | ADMIN only; revokes it, and is audit-logged |
| POST | `/api/lessons/:id/progress` | Records the caller's own lesson progress |
| GET | `/api/chapters/:id/progress` | The caller's own progress, with weak topics |

`GET /api/lessons/:id` is a drop-in replacement for
`frontend/src/data/chapter01.ts` — same shape, so the renderers are unchanged.
Every catalog query filters on published-and-not-deleted; there is deliberately
no `?includeDrafts` flag, because that would be one forgotten guard away from
showing unreviewed content to a child.

### Roles

Students and teachers have separate login and registration pages, at
`/login/student`, `/register/student`, `/login/teacher` and `/register/teacher`,
and separate dashboards at `/learn` and `/teacher`.

**The role is decided by the endpoint, never by the request.** There are two
registration endpoints rather than one with a `role` field, and each hardcodes
its role as a constant. A body containing `"role": "ADMIN"` is ignored — there
is a test for exactly that, and it was checked against the live server too.

Student registration requires a class (6–10). It is validated server-side
against published `Class` rows, so a number in range that names a withdrawn
class is still rejected. The dropdown is populated from the API rather than
hard-coded, so the options cannot drift from what exists.

Route guards in the client are convenience only. Every endpoint re-checks the
role, so a tampered client reaches 403s rather than data:

- a student calling `/api/teacher/overview` gets 403 `FORBIDDEN`
- a teacher calling a student progress route gets 403 `NOT_A_STUDENT`

A teacher who signs in through the *student* login page still lands on the
teacher dashboard: there is one login endpoint, and the server's answer decides
the destination. Trusting the page to say who someone is would defeat the point.

Teachers see only classes assigned to them through `TeacherAssignment`. A newly
registered teacher therefore sees none — which is the honest answer, not "all
students".

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
- Login failures and registrations are rate limited per IP + email. The limiter
  is in-process, so a multi-instance deployment must move it to Redis or the
  database.
- "Remember me" is a real setting, not decoration: it extends the session from
  12 hours to 30 days. Still bounded — a session that never expires is a
  credential that cannot be revoked by time.

#### Controls that are honest about not working yet

The auth screens follow a design that includes social sign-in, a forgot-password
link and legal links. None of those exist behind the scenes, so rather than
render controls that silently do nothing:

- **Social sign-in buttons** (Facebook, Google, Apple, Microsoft) are shown, but
  pressing one says plainly that the provider is not connected and to use email.
  There is no OAuth client, no redirect handler and no account-linking model.
- **"Forgot Password"** explains that reset is not available and to ask a
  teacher or administrator — which is what someone locked out can actually do
  today.
- **Terms and Privacy** are plain text, not links, because the documents do not
  exist. Linking to nothing on the screen where someone agrees to them would be
  the worst possible place to do it.

Each becomes real work rather than a UI change: wire OAuth, build reset, write
the documents. Until then the screens say so.

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

## Progress

Progress is **derived, never authored**: `TopicProgress` and `SubjectProgress`
are recomputed from lesson completion and submitted quiz attempts every time
either changes. Counters that are incremented in place drift the moment
anything is retried, republished or deleted; recomputing costs a little more per
write and is always correct.

Two deliberate distinctions the tests pin down:

- `scoreAvg` is **null when nothing has been attempted**, not 0. "Took no quiz"
  and "took a quiz and scored zero" are different facts, and showing the second
  when the first is true discourages a student who has done nothing wrong.
- A topic is **weak only if attempted and scored below the threshold**. Topics
  never started are not weak — they are unvisited. Conflating the two fills a
  beginner's dashboard with red on day one.

Overall completion is weighted by lesson count, not topic count, so one finished
one-lesson topic beside an untouched nine-lesson topic reads as 10%, not 50%.

### Seeding caveat

`prisma/seed.ts` upserts users, classes, subjects, chapters, topics and lessons
on natural keys, but the content below them (textbook, references, learning
content, simulations, quizzes, questions) has no natural unique key. Those are
created once and **skipped** on later runs.

This was found the hard way: before the guard existed, three seed runs during
development left 15 questions where there should be 5, three quizzes, and nine
simulations. The header claimed idempotency the script did not have. To rebuild
content cleanly, recreate the database and migrate again rather than re-seeding
over the top.

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

1. **Admin UI.** `POST/DELETE /api/admin/assignments` exist and are tested, but
   there is no screen to call them from — an admin can only grant or revoke a
   teacher's class today via curl or a REST client. Every registered teacher
   therefore still sees an empty roster in the browser until this exists.
2. Password reset, so the login page can offer a real "Forgot password?"
   instead of the honest placeholder it shows now
3. Phone as an alternative login identifier — the current design is email-only,
   and adding phone means a second unique column and a second login path
4. Move the login/registration rate limiter out of process memory before
   running more than one API instance
5. Give `prisma/seed.ts` natural unique keys so its content can be upserted
   rather than skipped on re-run — `scripts/seedChapter2.ts` already does this
   per-lesson and is the pattern to follow
6. Chapter 2 Tier 2 (optional): a small canned-animation gallery for the five
   motion types in §২.২, and a general-purpose two-arrow vector adder reusable
   in later force chapters
7. Chapter 2's নমুনা প্রশ্ন MCQs are not yet digitised into `Question` rows
8. Confirm the section number for গতি ও লেখচিত্র (pp. 51–53) — read but not
   pinned down against the printed page
9. Chapter 3 Tier 2 (optional): Atwood machine (p. 81), a four-force
   comparison card for §৩.২, and a Newton's-cradle momentum demo
10. Chapter 3's spring-scale calibration activity (pp. 82–83) is read but not
    pinned to a numbered section heading — confirm before seeding
11. Chapter 3's নমুনা প্রশ্ন MCQs (p. 94+) are not yet digitised into
    `Question` rows
12. Chapter 4 Tier 2 (optional): a renewable/non-renewable energy-source
    gallery (§৪.৪), an energy-conversion chain diagram (§৪.৫.২), and a
    qualitative nuclear-fission diagram (§৪.৬)
13. Chapter 4's নমুনা প্রশ্ন MCQs (p. 123+) are not yet digitised into
    `Question` rows
14. Chapter 5 Tier 2 (optional): a Pascal's-law hydraulic-press demo (§৫.৩.৩),
    a pressure-vs-altitude explorer (§৫.৪, চিত্র ৫.০৯), and a qualitative
    solid/liquid/gas/plasma molecular-spacing gallery (§৫.৬–৫.৬.২)
15. Chapter 5's নমুনা প্রশ্ন MCQs (p. 155+) are not yet digitised into
    `Question` rows
16. Chapter 6 Tier 2 (optional): an evaporation-factors checklist (pp. 177–178),
    a regelation/pressure-cooker demo (§৬.৭, চিত্র ৬.০৯), and a PV=nRT-based
    gas-expansion coefficient demo (§৬.৩.৩)
17. Chapter 6's নমুনা প্রশ্ন MCQs (p. 183+) are not yet digitised into
    `Question` rows
18. Chapter 7 Tier 2 (optional): a transverse/longitudinal wave-type gallery
    (§৭.২.২), a constructive/destructive superposition demo (§৭.২.১(v)), and
    a noise-pollution decibel-level comparison (§৭.৩.৫, টেবিল ৭.০২)
19. Chapter 7's নমুনা প্রশ্ন MCQs (p. 206+) are not yet digitised into
    `Question` rows
20. Chapter 8 has not yet been identified or read from the source PDF
