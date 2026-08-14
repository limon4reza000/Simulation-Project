# Database Schema — Design Decisions and Deviations

This record explains where the implemented schema (`backend/prisma/schema.prisma`)
departs from Chapter 6 of the project documentation, and why. Each deviation
either fixes an internal contradiction in the documented design or fills a gap
that would have blocked a documented requirement.

Keep this file current. In a viva, "I changed the design and here is the defect
that forced it" scores; an undocumented mismatch between the report and the code
reads as carelessness.

---

## Summary of changes

| # | Change | Fixes |
|---|---|---|
| 1 | Added `TeacherAssignment` | FR-019, §17.2, TC-TEACH-01 had no data to run against |
| 2 | Replaced polymorphic `StudentProgress` with `LessonProgress` / `TopicProgress` / `SubjectProgress` | Self-contradiction between §6.3 and §6.7; NFR-013 |
| 3 | Removed `language` from `LearningContent` | Bilingual variants had two possible homes (§6.3 vs §19.2) |
| 4 | Added `publishedForLanguage` nullable-unique column | Nothing enforced "one live version per language" |
| 5 | Removed `Quiz.topicId` | Two independent paths attached a quiz to the hierarchy |
| 6 | Added `QuizAttemptAnswer` | Result screen (§21) and FR-018 had no per-question data |
| 7 | `Textbook` now references `Class` + `Subject` | Textbooks floated free of the academic hierarchy |
| 8 | Added `titleBn` / `titleEn` across the hierarchy | §19 made content bilingual but not navigation |
| 9 | Added `deletedAt` to academic and content entities | §6.7 required soft deletes; no column existed |
| 10 | Added CHECK constraints in `prisma/sql/01_check_constraints.sql` | Exclusive arc, percentage bounds, page ordering |
| 11 | Set `utf8mb4_unicode_ci` on Bangla text columns | Bangla sorting and search were silently broken |
| 12 | Marked `Notification`, `Achievement`, `StudentAchievement` as Phase 2 | MVP scope reduction |
| 13 | Added `LessonComponent.parameterOverrides` | One simulation could not be reused at two settings |

---

## 1. `TeacherAssignment` — a missing entity, not a refinement

Section 17.2 states that teachers access "only the students, classes and
analytics explicitly assigned to them." FR-019 manages class membership.
TC-TEACH-01 tests that a teacher sees assigned student data, and TC-SEC-01 tests
that scope cannot be bypassed.

None of the thirty documented entities mapped a teacher to a class. The
authorization rule the report describes was therefore unimplementable as
specified.

`subjectId` is nullable so one table covers both real arrangements in a Class
1–10 school: a homeroom teacher owning an entire primary class (`NULL`), and a
subject teacher owning one subject in one class (set).

## 2. Progress: concrete tables instead of a polymorphic target

The documented `StudentProgress` used `target_type` + `target_id` with no
foreign key. Section 6.7 then required that "progress records must not exist for
deleted/nonexistent targets," and NFR-013 required foreign keys to protect
relational consistency.

**These cannot both be true.** A polymorphic `target_id` cannot carry a foreign
key in MySQL, so the stated integrity rule was unenforceable by construction.

The replacement is three tables — lesson, topic and subject level — each with a
real composite primary key and real foreign keys. Overall progress is *computed*
from these rather than stored, which also removes a class of staleness bugs
where an aggregate drifts from the rows it summarises.

This costs one extra table relative to the document and buys enforceable
integrity, simpler queries, and honest agreement with NFR-013.

## 3 & 4. Where a Bangla variant actually lives

Section 6.3 gave `LearningContent` a `language` column. Section 19.2 said the
design is "a base content entity plus language-specific ContentVersion records."
Both cannot hold: if the base entity has a language, it is not language-neutral.

`LearningContent` is now purely the logical concept — type, status, lifecycle.
All prose, media and language live on `ContentVersion`.

That raises a question the document never asked: *which* version does a student
actually see? A content item may have many versions in many states across two
languages. The rule must be "at most one PUBLISHED version per (content,
language)," and nothing enforced it.

`ContentVersion.publishedForLanguage` is nullable and set to the version's
language only while that version is live, with `@@unique([contentId,
publishedForLanguage])`. MySQL permits unlimited `NULL`s in a unique index, so
draft and archived versions never collide, while two simultaneously-published
Bangla versions are rejected by the database rather than by hopeful application
code.

> **Be ready to explain this one.** It is the least obvious line in the schema
> and it is exactly the kind of detail an examiner will ask you to justify.

## 5. One path from quiz to topic

The document attached a quiz two ways: `Quiz.topicId`, and
`LessonComponent.quiz_id`. When both are set and disagree, "which topic does
this score belong to?" has no defined answer — and §15.3 requires topic-level
performance aggregation.

`Quiz.topicId` is removed. Topic is always derived:
`quiz → lesson_component → lesson → topic`. Every quiz therefore lives inside a
lesson. An end-of-topic quiz is modelled as a lesson containing a single quiz
component, which costs one row and keeps the aggregation path unambiguous.

## 6. `QuizAttemptAnswer`

`QuizAttempt` stored only a total score. The Result screen in Chapter 21
promises a "correct/incorrect summary," and FR-018 requires identifying weak
topics from recorded learning data. Neither is derivable from a single number.

Per-question rows also make re-scoring possible after a question is corrected,
without destroying attempt history.

## 8. Bilingual navigation, not just bilingual content

Chapter 19 treats bilingualism as a content-versioning problem. But a student
selecting Class → Subject → Chapter → Topic reads five screens of navigation
labels before reaching any versioned content. If those labels are stored once,
the "Bangla interface" is English with a Bangla body.

Hierarchy titles are stored as paired `titleBn` / `titleEn` columns rather than
through the version machinery, because they are short, rarely revised, and do
not need independent review workflows.

## 11. Bangla collation

Prisma emits `utf8mb4` but leaves collation at the server default, commonly
`utf8mb4_0900_ai_ci`, which does not order Bangla script correctly. Subject and
topic lists sorted by title would return an order that looks arbitrary to a
Bangla reader, and the FR-035 search would miss obvious matches.

The affected columns are re-declared as `utf8mb4_unicode_ci`. This is a good
concrete example for the report of Bangladesh-specific engineering, as opposed
to generic internationalisation.

## 12. Phase 2 boundary

`Notification`, `Achievement` and `StudentAchievement` remain in the schema so
it still matches the entity list in the report, but no MVP endpoint or screen
depends on them. Build them only after the full
learn → practise → assess → progress loop works end to end.

`LearningActivity` is kept in the MVP because
`POST /api/simulations/:id/activity` is in the documented MVP API surface.
Keep its payload minimal — the users are children, and data minimisation should
appear in Chapter 20 as a deliberate control rather than as an accident of
collecting whatever was easy.

---

## 13. `LessonComponent.parameterOverrides`

Surfaced while building the lesson API, not while drawing the ERD.

A lesson wants the same instrument twice: once in explore mode and once in
practice mode. `SimulationParameter` holds defaults per *Simulation*, not per
*placement*, so the only ways to express that were to duplicate the whole
`Simulation` row — splitting its configuration, version and status across two
records that must then be kept in step — or to invent an `Exercise` row that
merely points back at the same instrument.

A nullable JSON column on the placement solves it directly. The API merges
`SimulationParameter` defaults first and these on top, so an override is always
a narrowing of a declared parameter rather than a new one.

Note what this is *not*: a general-purpose settings bag. Anything that belongs
to the instrument itself still belongs in `SimulationParameter`, where it is
typed, bounded and labelled in both languages.

## Tooling note: Prisma 6, not 7

Prisma 7 moves the datasource connection URL out of `schema.prisma` and into a
`prisma.config.ts` file. The dependency is pinned to `prisma@^6` because the
overwhelming majority of tutorials, Stack Overflow answers and course material
still assume the v5/v6 layout. On a fixed final-year timeline, matching the
available documentation is worth more than being on the newest major version.

Record this as a deliberate choice, not an oversight.

---

## Open questions still to resolve

1. **Is "Programming" actually a Class 1–10 subject?** ICT typically appears
   around Class 6 in the national curriculum. The schema does not care — it is
   driven by seed data — but Chapter 1 should acknowledge the mismatch rather
   than let an examiner raise it first.
2. **What is `Exercise.configuration` allowed to contain?** It is currently
   untyped JSON. Define a schema for it before the practice module is built, or
   it becomes an unversioned dumping ground.
3. **Retention policy for `LearningActivity`.** Rows accumulate per student per
   interaction with no defined expiry. Decide a retention window and state it in
   the child-data section of Chapter 20.
