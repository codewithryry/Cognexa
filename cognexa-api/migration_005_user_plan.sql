-- Adds a subscription plan field to users, backing the pricing/limits feature.
ALTER TABLE `users`
  ADD COLUMN `plan` VARCHAR(20) NULL DEFAULT 'community' AFTER `password`;
