-- Adds file size and page count metadata to documents for the Knowledge Base UI.
ALTER TABLE `documents`
  ADD COLUMN `size_bytes` INT NULL AFTER `preview`,
  ADD COLUMN `page_count` INT NULL AFTER `size_bytes`;
