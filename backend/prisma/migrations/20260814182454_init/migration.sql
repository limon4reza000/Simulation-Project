-- CreateTable
CREATE TABLE `role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(32) NOT NULL,
    `name` VARCHAR(64) NOT NULL,

    UNIQUE INDEX `role_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_id` INTEGER NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(190) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `status` ENUM('ACTIVE', 'SUSPENDED', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
    `preferred_language` ENUM('BN', 'EN') NOT NULL DEFAULT 'BN',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_email_key`(`email`),
    INDEX `user_role_id_idx`(`role_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student` (
    `user_id` INTEGER NOT NULL,
    `class_id` INTEGER NOT NULL,
    `student_code` VARCHAR(32) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `student_student_code_key`(`student_code`),
    INDEX `student_class_id_idx`(`class_id`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher` (
    `user_id` INTEGER NOT NULL,
    `employee_code` VARCHAR(32) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `teacher_employee_code_key`(`employee_code`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_assignment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teacher_user_id` INTEGER NOT NULL,
    `class_id` INTEGER NOT NULL,
    `subject_id` INTEGER NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `teacher_assignment_class_id_idx`(`class_id`),
    INDEX `teacher_assignment_subject_id_idx`(`subject_id`),
    UNIQUE INDEX `teacher_assignment_teacher_user_id_class_id_subject_id_key`(`teacher_user_id`, `class_id`, `subject_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `level` INTEGER NOT NULL,
    `name_bn` VARCHAR(120) NOT NULL,
    `name_en` VARCHAR(120) NOT NULL,
    `status` ENUM('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `class_level_key`(`level`),
    INDEX `class_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subject` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(32) NOT NULL,
    `name_bn` VARCHAR(120) NOT NULL,
    `name_en` VARCHAR(120) NOT NULL,
    `status` ENUM('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `subject_code_key`(`code`),
    INDEX `subject_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_subject` (
    `class_id` INTEGER NOT NULL,
    `subject_id` INTEGER NOT NULL,

    INDEX `class_subject_subject_id_idx`(`subject_id`),
    PRIMARY KEY (`class_id`, `subject_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chapter` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `subject_id` INTEGER NOT NULL,
    `title_bn` VARCHAR(255) NOT NULL,
    `title_en` VARCHAR(255) NOT NULL,
    `display_order` INTEGER NOT NULL,
    `status` ENUM('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `deleted_at` DATETIME(3) NULL,

    INDEX `chapter_status_idx`(`status`),
    UNIQUE INDEX `chapter_subject_id_display_order_key`(`subject_id`, `display_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `topic` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chapter_id` INTEGER NOT NULL,
    `title_bn` VARCHAR(255) NOT NULL,
    `title_en` VARCHAR(255) NOT NULL,
    `display_order` INTEGER NOT NULL,
    `status` ENUM('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `deleted_at` DATETIME(3) NULL,

    INDEX `topic_status_idx`(`status`),
    UNIQUE INDEX `topic_chapter_id_display_order_key`(`chapter_id`, `display_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lesson` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `topic_id` INTEGER NOT NULL,
    `title_bn` VARCHAR(255) NOT NULL,
    `title_en` VARCHAR(255) NOT NULL,
    `summary_bn` TEXT NULL,
    `summary_en` TEXT NULL,
    `display_order` INTEGER NOT NULL,
    `status` ENUM('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `published_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `lesson_status_idx`(`status`),
    UNIQUE INDEX `lesson_topic_id_display_order_key`(`topic_id`, `display_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `learning_content` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content_type` VARCHAR(48) NOT NULL,
    `status` ENUM('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    INDEX `learning_content_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `content_version` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content_id` INTEGER NOT NULL,
    `version_no` INTEGER NOT NULL,
    `language` ENUM('BN', 'EN') NOT NULL,
    `body` TEXT NOT NULL,
    `media_url` VARCHAR(512) NULL,
    `change_summary` VARCHAR(512) NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `published_for_language` ENUM('BN', 'EN') NULL,

    INDEX `content_version_created_by_idx`(`created_by`),
    UNIQUE INDEX `content_version_content_id_version_no_key`(`content_id`, `version_no`),
    UNIQUE INDEX `content_version_content_id_published_for_language_key`(`content_id`, `published_for_language`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lesson_component` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lesson_id` INTEGER NOT NULL,
    `component_type` ENUM('EXPLANATION', 'DIAGRAM', 'VISUALIZATION', 'SIMULATION', 'EXERCISE', 'QUIZ') NOT NULL,
    `display_order` INTEGER NOT NULL,
    `content_id` INTEGER NULL,
    `visualization_id` INTEGER NULL,
    `simulation_id` INTEGER NULL,
    `exercise_id` INTEGER NULL,
    `quiz_id` INTEGER NULL,
    `parameter_overrides` JSON NULL,

    INDEX `lesson_component_content_id_idx`(`content_id`),
    INDEX `lesson_component_visualization_id_idx`(`visualization_id`),
    INDEX `lesson_component_simulation_id_idx`(`simulation_id`),
    INDEX `lesson_component_exercise_id_idx`(`exercise_id`),
    INDEX `lesson_component_quiz_id_idx`(`quiz_id`),
    UNIQUE INDEX `lesson_component_lesson_id_display_order_key`(`lesson_id`, `display_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visualization` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(64) NOT NULL,
    `configuration` JSON NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',

    INDEX `visualization_type_idx`(`type`),
    INDEX `visualization_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `simulation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(64) NOT NULL,
    `configuration` JSON NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',

    INDEX `simulation_type_idx`(`type`),
    INDEX `simulation_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `simulation_parameter` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `simulation_id` INTEGER NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    `label_bn` VARCHAR(120) NOT NULL,
    `label_en` VARCHAR(120) NOT NULL,
    `data_type` ENUM('INT', 'FLOAT', 'BOOLEAN', 'ENUM') NOT NULL,
    `default_value` VARCHAR(64) NOT NULL,
    `min_value` VARCHAR(64) NULL,
    `max_value` VARCHAR(64) NULL,
    `step_value` VARCHAR(64) NULL,

    UNIQUE INDEX `simulation_parameter_simulation_id_name_key`(`simulation_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exercise` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title_bn` VARCHAR(255) NOT NULL,
    `title_en` VARCHAR(255) NOT NULL,
    `instructions_bn` TEXT NOT NULL,
    `instructions_en` TEXT NOT NULL,
    `configuration` JSON NOT NULL,
    `status` ENUM('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',

    INDEX `exercise_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('MCQ_SINGLE', 'MCQ_MULTI', 'TRUE_FALSE', 'SHORT_ANSWER') NOT NULL,
    `prompt_bn` TEXT NOT NULL,
    `prompt_en` TEXT NOT NULL,
    `options_json` JSON NULL,
    `answer_config` JSON NOT NULL,
    `explanation_bn` TEXT NULL,
    `explanation_en` TEXT NULL,
    `difficulty` INTEGER NULL,
    `status` ENUM('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',

    INDEX `question_status_idx`(`status`),
    INDEX `question_difficulty_idx`(`difficulty`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quiz` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title_bn` VARCHAR(255) NOT NULL,
    `title_en` VARCHAR(255) NOT NULL,
    `time_limit_sec` INTEGER NULL,
    `attempt_limit` INTEGER NULL,
    `pass_mark` INTEGER NULL,
    `status` ENUM('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',

    INDEX `quiz_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quiz_question` (
    `quiz_id` INTEGER NOT NULL,
    `question_id` INTEGER NOT NULL,
    `display_order` INTEGER NOT NULL,
    `marks` INTEGER NOT NULL DEFAULT 1,

    INDEX `quiz_question_question_id_idx`(`question_id`),
    UNIQUE INDEX `quiz_question_quiz_id_display_order_key`(`quiz_id`, `display_order`),
    PRIMARY KEY (`quiz_id`, `question_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quiz_attempt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `quiz_id` INTEGER NOT NULL,
    `student_user_id` INTEGER NOT NULL,
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `submitted_at` DATETIME(3) NULL,
    `score` DECIMAL(6, 2) NULL,
    `max_score` DECIMAL(6, 2) NULL,
    `status` ENUM('IN_PROGRESS', 'SUBMITTED', 'ABANDONED') NOT NULL DEFAULT 'IN_PROGRESS',

    INDEX `quiz_attempt_quiz_id_idx`(`quiz_id`),
    INDEX `quiz_attempt_student_user_id_submitted_at_idx`(`student_user_id`, `submitted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quiz_attempt_answer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `attempt_id` INTEGER NOT NULL,
    `question_id` INTEGER NOT NULL,
    `response` JSON NOT NULL,
    `is_correct` BOOLEAN NULL,
    `marks_awarded` DECIMAL(6, 2) NULL,
    `answered_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `quiz_attempt_answer_question_id_idx`(`question_id`),
    UNIQUE INDEX `quiz_attempt_answer_attempt_id_question_id_key`(`attempt_id`, `question_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lesson_progress` (
    `student_user_id` INTEGER NOT NULL,
    `lesson_id` INTEGER NOT NULL,
    `status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'NOT_STARTED',
    `completed_at` DATETIME(3) NULL,
    `time_spent_seconds` INTEGER NOT NULL DEFAULT 0,
    `last_activity_at` DATETIME(3) NOT NULL,

    INDEX `lesson_progress_lesson_id_idx`(`lesson_id`),
    PRIMARY KEY (`student_user_id`, `lesson_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `topic_progress` (
    `student_user_id` INTEGER NOT NULL,
    `topic_id` INTEGER NOT NULL,
    `completion_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `score_avg` DECIMAL(5, 2) NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `time_spent_seconds` INTEGER NOT NULL DEFAULT 0,
    `last_activity_at` DATETIME(3) NOT NULL,

    INDEX `topic_progress_topic_id_idx`(`topic_id`),
    PRIMARY KEY (`student_user_id`, `topic_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subject_progress` (
    `student_user_id` INTEGER NOT NULL,
    `subject_id` INTEGER NOT NULL,
    `completion_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `last_activity_at` DATETIME(3) NOT NULL,

    INDEX `subject_progress_subject_id_idx`(`subject_id`),
    PRIMARY KEY (`student_user_id`, `subject_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `learning_activity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_user_id` INTEGER NOT NULL,
    `lesson_id` INTEGER NULL,
    `component_id` INTEGER NULL,
    `activity_type` VARCHAR(48) NOT NULL,
    `metadata` JSON NULL,
    `occurred_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `learning_activity_student_user_id_occurred_at_idx`(`student_user_id`, `occurred_at`),
    INDEX `learning_activity_lesson_id_idx`(`lesson_id`),
    INDEX `learning_activity_component_id_idx`(`component_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `textbook` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `class_id` INTEGER NOT NULL,
    `subject_id` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `edition` VARCHAR(64) NULL,
    `publication_year` INTEGER NULL,
    `language` ENUM('BN', 'EN') NOT NULL,
    `source_file` VARCHAR(512) NULL,
    `status` ENUM('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',

    INDEX `textbook_class_id_subject_id_idx`(`class_id`, `subject_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `textbook_reference` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `textbook_id` INTEGER NOT NULL,
    `chapter_label` VARCHAR(255) NULL,
    `topic_label` VARCHAR(255) NULL,
    `page_start` INTEGER NULL,
    `page_end` INTEGER NULL,
    `reference_text` TEXT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    INDEX `textbook_reference_textbook_id_idx`(`textbook_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `content_validation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content_version_id` INTEGER NOT NULL,
    `textbook_reference_id` INTEGER NOT NULL,
    `validator_user_id` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `validation_date` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `content_validation_content_version_id_status_idx`(`content_version_id`, `status`),
    INDEX `content_validation_textbook_reference_id_idx`(`textbook_reference_id`),
    INDEX `content_validation_validator_user_id_idx`(`validator_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `action` VARCHAR(64) NOT NULL,
    `entity_type` VARCHAR(64) NOT NULL,
    `entity_id` VARCHAR(64) NOT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_log_user_id_idx`(`user_id`),
    INDEX `audit_log_entity_type_entity_id_idx`(`entity_type`, `entity_id`),
    INDEX `audit_log_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `type` VARCHAR(48) NOT NULL,
    `title_bn` VARCHAR(255) NOT NULL,
    `title_en` VARCHAR(255) NOT NULL,
    `body_bn` TEXT NULL,
    `body_en` TEXT NULL,
    `read_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notification_user_id_read_at_idx`(`user_id`, `read_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `achievement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(48) NOT NULL,
    `name_bn` VARCHAR(120) NOT NULL,
    `name_en` VARCHAR(120) NOT NULL,
    `criteria_config` JSON NOT NULL,
    `status` ENUM('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',

    UNIQUE INDEX `achievement_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_achievement` (
    `student_user_id` INTEGER NOT NULL,
    `achievement_id` INTEGER NOT NULL,
    `awarded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `student_achievement_achievement_id_idx`(`achievement_id`),
    PRIMARY KEY (`student_user_id`, `achievement_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student` ADD CONSTRAINT `student_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student` ADD CONSTRAINT `student_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher` ADD CONSTRAINT `teacher_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_assignment` ADD CONSTRAINT `teacher_assignment_teacher_user_id_fkey` FOREIGN KEY (`teacher_user_id`) REFERENCES `teacher`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_assignment` ADD CONSTRAINT `teacher_assignment_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_assignment` ADD CONSTRAINT `teacher_assignment_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_subject` ADD CONSTRAINT `class_subject_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_subject` ADD CONSTRAINT `class_subject_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chapter` ADD CONSTRAINT `chapter_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `topic` ADD CONSTRAINT `topic_chapter_id_fkey` FOREIGN KEY (`chapter_id`) REFERENCES `chapter`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson` ADD CONSTRAINT `lesson_topic_id_fkey` FOREIGN KEY (`topic_id`) REFERENCES `topic`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `content_version` ADD CONSTRAINT `content_version_content_id_fkey` FOREIGN KEY (`content_id`) REFERENCES `learning_content`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `content_version` ADD CONSTRAINT `content_version_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_component` ADD CONSTRAINT `lesson_component_lesson_id_fkey` FOREIGN KEY (`lesson_id`) REFERENCES `lesson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_component` ADD CONSTRAINT `lesson_component_content_id_fkey` FOREIGN KEY (`content_id`) REFERENCES `learning_content`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `lesson_component` ADD CONSTRAINT `lesson_component_visualization_id_fkey` FOREIGN KEY (`visualization_id`) REFERENCES `visualization`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `lesson_component` ADD CONSTRAINT `lesson_component_simulation_id_fkey` FOREIGN KEY (`simulation_id`) REFERENCES `simulation`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `lesson_component` ADD CONSTRAINT `lesson_component_exercise_id_fkey` FOREIGN KEY (`exercise_id`) REFERENCES `exercise`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `lesson_component` ADD CONSTRAINT `lesson_component_quiz_id_fkey` FOREIGN KEY (`quiz_id`) REFERENCES `quiz`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `simulation_parameter` ADD CONSTRAINT `simulation_parameter_simulation_id_fkey` FOREIGN KEY (`simulation_id`) REFERENCES `simulation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quiz_question` ADD CONSTRAINT `quiz_question_quiz_id_fkey` FOREIGN KEY (`quiz_id`) REFERENCES `quiz`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quiz_question` ADD CONSTRAINT `quiz_question_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `question`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quiz_attempt` ADD CONSTRAINT `quiz_attempt_quiz_id_fkey` FOREIGN KEY (`quiz_id`) REFERENCES `quiz`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quiz_attempt` ADD CONSTRAINT `quiz_attempt_student_user_id_fkey` FOREIGN KEY (`student_user_id`) REFERENCES `student`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quiz_attempt_answer` ADD CONSTRAINT `quiz_attempt_answer_attempt_id_fkey` FOREIGN KEY (`attempt_id`) REFERENCES `quiz_attempt`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quiz_attempt_answer` ADD CONSTRAINT `quiz_attempt_answer_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `question`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_progress` ADD CONSTRAINT `lesson_progress_student_user_id_fkey` FOREIGN KEY (`student_user_id`) REFERENCES `student`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_progress` ADD CONSTRAINT `lesson_progress_lesson_id_fkey` FOREIGN KEY (`lesson_id`) REFERENCES `lesson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `topic_progress` ADD CONSTRAINT `topic_progress_student_user_id_fkey` FOREIGN KEY (`student_user_id`) REFERENCES `student`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `topic_progress` ADD CONSTRAINT `topic_progress_topic_id_fkey` FOREIGN KEY (`topic_id`) REFERENCES `topic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subject_progress` ADD CONSTRAINT `subject_progress_student_user_id_fkey` FOREIGN KEY (`student_user_id`) REFERENCES `student`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subject_progress` ADD CONSTRAINT `subject_progress_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_activity` ADD CONSTRAINT `learning_activity_student_user_id_fkey` FOREIGN KEY (`student_user_id`) REFERENCES `student`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_activity` ADD CONSTRAINT `learning_activity_lesson_id_fkey` FOREIGN KEY (`lesson_id`) REFERENCES `lesson`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_activity` ADD CONSTRAINT `learning_activity_component_id_fkey` FOREIGN KEY (`component_id`) REFERENCES `lesson_component`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `textbook` ADD CONSTRAINT `textbook_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `textbook` ADD CONSTRAINT `textbook_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `textbook_reference` ADD CONSTRAINT `textbook_reference_textbook_id_fkey` FOREIGN KEY (`textbook_id`) REFERENCES `textbook`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `content_validation` ADD CONSTRAINT `content_validation_content_version_id_fkey` FOREIGN KEY (`content_version_id`) REFERENCES `content_version`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `content_validation` ADD CONSTRAINT `content_validation_textbook_reference_id_fkey` FOREIGN KEY (`textbook_reference_id`) REFERENCES `textbook_reference`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `content_validation` ADD CONSTRAINT `content_validation_validator_user_id_fkey` FOREIGN KEY (`validator_user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification` ADD CONSTRAINT `notification_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_achievement` ADD CONSTRAINT `student_achievement_student_user_id_fkey` FOREIGN KEY (`student_user_id`) REFERENCES `student`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_achievement` ADD CONSTRAINT `student_achievement_achievement_id_fkey` FOREIGN KEY (`achievement_id`) REFERENCES `achievement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
