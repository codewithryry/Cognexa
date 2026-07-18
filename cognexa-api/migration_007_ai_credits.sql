-- Backs the Community plan's "100 AI credits/month (OpenRouter models)" limit.
-- Credits are only tracked/enforced for the Community plan; Pro/Unlimited are
-- uncapped and never consult these columns.
ALTER TABLE `users`
  ADD COLUMN `ai_credits_used` INT NULL DEFAULT 0 AFTER `plan`,
  ADD COLUMN `ai_credits_period_start` TIMESTAMP NULL DEFAULT NULL AFTER `ai_credits_used`;
