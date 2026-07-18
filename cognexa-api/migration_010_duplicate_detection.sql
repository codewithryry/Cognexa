-- Backs the Knowledge Base page's "Duplicate Detection" setting: blocks
-- uploading a file byte-for-byte identical to one already in the user's
-- knowledge base.
ALTER TABLE `documents`
  ADD COLUMN `content_hash` VARCHAR(64) NULL AFTER `page_count`,
  ADD INDEX `ix_documents_content_hash` (`content_hash`);

ALTER TABLE `settings`
  ADD COLUMN `duplicate_detection` BOOLEAN NULL DEFAULT TRUE AFTER `auto_reindex_stuck`;
