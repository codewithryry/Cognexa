-- Cognexa Async Generation Migration
-- Adds fields to support background async project generation with progress tracking

ALTER TABLE projects
  ADD COLUMN generation_stage VARCHAR(50) DEFAULT NULL,
  ADD COLUMN generation_progress JSON DEFAULT NULL,
  ADD COLUMN generation_error TEXT DEFAULT NULL;