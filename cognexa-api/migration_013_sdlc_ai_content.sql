-- Adds AI-generated content storage to project artifacts, and lets the
-- existing per-user RAG document store be scoped to a specific SDLC project.

ALTER TABLE project_artifacts
    ADD COLUMN content LONGTEXT NULL AFTER content_hash,
    ADD COLUMN generated_by VARCHAR(20) NULL AFTER content;

-- documents.project_id already exists (added by an earlier migration) but
-- was never indexed since nothing filtered on it until now.
ALTER TABLE documents
    ADD INDEX idx_documents_project_id (project_id);
