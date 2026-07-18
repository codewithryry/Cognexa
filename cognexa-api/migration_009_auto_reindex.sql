-- Backs the Knowledge Base page's "Auto Re-index" setting: when enabled,
-- documents stuck in Processing are automatically resubmitted for indexing.
ALTER TABLE `settings`
  ADD COLUMN `auto_reindex_stuck` BOOLEAN NULL DEFAULT FALSE AFTER `email_notifications`;
