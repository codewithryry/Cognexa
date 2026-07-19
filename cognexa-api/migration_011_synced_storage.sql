-- Backs the Data Sources page's "Synced Storage" figure: the total size of
-- documents Cognexa has actually pulled in from a connection, as opposed to
-- the connected account's overall Drive storage quota.
ALTER TABLE `data_source_connections`
  ADD COLUMN `synced_size_bytes` BIGINT NULL DEFAULT 0 AFTER `last_synced_at`;
