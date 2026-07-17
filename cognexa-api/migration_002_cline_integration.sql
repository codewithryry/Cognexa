-- Adds chatbot integration support (Cline or any other API-key based assistant) to the settings table.
-- MySQL has no ADD COLUMN IF NOT EXISTS, so drop this file after it has run once.
ALTER TABLE `settings`
  ADD COLUMN `cline_api_key` VARCHAR(255) NULL AFTER `theme`,
  ADD COLUMN `integration_provider` VARCHAR(100) NULL DEFAULT 'Cline' AFTER `cline_api_key`;
