-- Backs the Settings > Notifications toggles. Preferences only -- no mail
-- provider is wired up yet, so these are stored but not currently acted on.
ALTER TABLE `settings`
  ADD COLUMN `email_notifications` BOOLEAN NULL DEFAULT TRUE AFTER `theme`,
  ADD COLUMN `notify_indexing_finished` BOOLEAN NULL DEFAULT TRUE AFTER `email_notifications`,
  ADD COLUMN `notify_failed_uploads` BOOLEAN NULL DEFAULT TRUE AFTER `notify_indexing_finished`,
  ADD COLUMN `notify_ai_errors` BOOLEAN NULL DEFAULT TRUE AFTER `notify_failed_uploads`,
  ADD COLUMN `notify_weekly_report` BOOLEAN NULL DEFAULT FALSE AFTER `notify_ai_errors`;
