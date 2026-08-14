-- Integrity rules that Prisma schema syntax cannot express.
--
-- HOW TO APPLY
--   Run `npx prisma migrate dev --name init` once to generate the initial
--   migration, then paste the statements below at the END of the generated
--   prisma/migrations/<timestamp>_init/migration.sql and re-run the migration
--   against a clean database. Committing them into the migration (rather than
--   applying them by hand) is what makes them reproducible for the examiner.
--
-- REQUIRES MySQL 8.0.16 or newer. Earlier versions parse CHECK constraints but
-- silently ignore them, which is worse than not having them. Verify with:
--   SELECT VERSION();

-- ---------------------------------------------------------------------------
-- 1. LessonComponent exclusive arc
--
-- LessonComponent carries five nullable foreign keys, one per component kind.
-- This is a polymorphic association, chosen over a single `target_id` column so
-- that every reference remains a real foreign key (NFR-013 Data Integrity).
-- The cost of that choice is that "exactly one target" is not expressible as a
-- column constraint, so it is asserted here instead.
-- ---------------------------------------------------------------------------

ALTER TABLE `lesson_component`
  ADD CONSTRAINT `chk_lesson_component_exactly_one_target` CHECK (
    (`content_id`       IS NOT NULL) +
    (`visualization_id` IS NOT NULL) +
    (`simulation_id`    IS NOT NULL) +
    (`exercise_id`      IS NOT NULL) +
    (`quiz_id`          IS NOT NULL) = 1
  );

-- The target that is set must also match the declared component_type.
-- EXPLANATION and DIAGRAM both resolve to LearningContent; they differ only in
-- how the frontend registry renders them.

ALTER TABLE `lesson_component`
  ADD CONSTRAINT `chk_lesson_component_type_matches_target` CHECK (
    (`component_type` IN ('EXPLANATION', 'DIAGRAM') AND `content_id`       IS NOT NULL) OR
    (`component_type` = 'VISUALIZATION'             AND `visualization_id` IS NOT NULL) OR
    (`component_type` = 'SIMULATION'                AND `simulation_id`    IS NOT NULL) OR
    (`component_type` = 'EXERCISE'                  AND `exercise_id`      IS NOT NULL) OR
    (`component_type` = 'QUIZ'                      AND `quiz_id`          IS NOT NULL)
  );

-- ---------------------------------------------------------------------------
-- 2. Percentage and score bounds
--
-- Progress is written by aggregation code. A bug there should fail loudly at
-- the database boundary rather than quietly render a 340% complete topic on a
-- student dashboard.
-- ---------------------------------------------------------------------------

ALTER TABLE `topic_progress`
  ADD CONSTRAINT `chk_topic_progress_percent_range`
  CHECK (`completion_percent` BETWEEN 0 AND 100);

ALTER TABLE `subject_progress`
  ADD CONSTRAINT `chk_subject_progress_percent_range`
  CHECK (`completion_percent` BETWEEN 0 AND 100);

ALTER TABLE `quiz_attempt`
  ADD CONSTRAINT `chk_quiz_attempt_score_not_negative`
  CHECK (`score` IS NULL OR `score` >= 0);

-- ---------------------------------------------------------------------------
-- 3. Textbook page ordering
-- ---------------------------------------------------------------------------

ALTER TABLE `textbook_reference`
  ADD CONSTRAINT `chk_textbook_reference_page_order` CHECK (
    `page_start` IS NULL OR `page_end` IS NULL OR `page_end` >= `page_start`
  );

-- ---------------------------------------------------------------------------
-- 4. Bangla collation
--
-- Prisma emits utf8mb4 but leaves collation at the server default, which on
-- many installations is utf8mb4_0900_ai_ci. That collation does not order
-- Bangla script correctly, so subject and topic lists sorted by title come back
-- in a sequence that looks arbitrary to a Bangla reader, and the search in
-- FR-035 misses obvious matches.
--
-- Apply utf8mb4_unicode_ci to every user-visible Bangla text column.
-- ---------------------------------------------------------------------------

ALTER TABLE `class`   MODIFY `name_bn`  VARCHAR(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
ALTER TABLE `subject` MODIFY `name_bn`  VARCHAR(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
ALTER TABLE `chapter` MODIFY `title_bn` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
ALTER TABLE `topic`   MODIFY `title_bn` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
ALTER TABLE `lesson`  MODIFY `title_bn` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
