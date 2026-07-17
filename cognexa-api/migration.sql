-- Cognexa schema migration
-- Run this against your existing `cognexa` database to bring it up to date
-- with the app's current models (auth, per-document ownership, settings, chat history).

USE `cognexa`;

-- documents: add ownership + chunk count
-- NOTE: MySQL has no "ADD COLUMN IF NOT EXISTS" — if you already ran this once,
-- skip this ALTER (or drop the two columns first) to avoid a duplicate-column error.
ALTER TABLE `documents`
  ADD COLUMN `user_id` INT NULL,
  ADD COLUMN `chunks` INT DEFAULT 0;

-- settings: one row per user, AI/UI configuration
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `ollama_url` VARCHAR(255) DEFAULT 'http://localhost:11434',
  `llm_model` VARCHAR(100) DEFAULT 'llama3.2',
  `embedding_model` VARCHAR(100) DEFAULT 'all-MiniLM-L6-v2',
  `chunk_size` INT DEFAULT 500,
  `chunk_overlap` INT DEFAULT 50,
  `theme` VARCHAR(20) DEFAULT 'light',
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `settings_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- chat_messages: per-user AI Q&A history
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `question` TEXT,
  `answer` TEXT,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `chat_messages_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- optional: foreign key from documents to users (skip if it errors due to existing orphan rows)
ALTER TABLE `documents`
  ADD CONSTRAINT `documents_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
