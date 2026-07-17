-- Adds base_url and model fields so the chatbot integration can support
-- local providers (Ollama, LM Studio) in addition to API-key providers.
ALTER TABLE `settings`
  ADD COLUMN `integration_base_url` VARCHAR(255) NULL AFTER `integration_provider`,
  ADD COLUMN `integration_model` VARCHAR(100) NULL AFTER `integration_base_url`;
