-- Cognexa SDLC Platform Migration
-- Adds tables for project management, SDLC stages, artifacts, pipelines, and tool integrations

-- Projects table - top-level workspace for SDLC lifecycle
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(30) DEFAULT 'planning',
    -- planning, design, development, testing, documentation, deployment, maintenance, completed, archived
    sdlc_stage VARCHAR(30) DEFAULT 'planning',
    repository_url VARCHAR(500),
    start_date TIMESTAMP NULL,
    target_date TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX ix_projects_user_id (user_id)
);

-- SDLC Stages - individual lifecycle stages within a project
CREATE TABLE IF NOT EXISTS sdlc_stages (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    project_id INTEGER NOT NULL,
    stage_type VARCHAR(30) NOT NULL,
    -- requirements, design, development, testing, documentation, deployment, maintenance
    status VARCHAR(30) DEFAULT 'pending',
    -- pending, in_progress, review, completed, blocked
    name VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to INTEGER,
    priority INTEGER DEFAULT 0,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX ix_sdlc_stages_project_id (project_id)
);

-- Project Artifacts - typed files associated with SDLC stages
CREATE TABLE IF NOT EXISTS project_artifacts (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    project_id INTEGER NOT NULL,
    stage_id INTEGER,
    artifact_type VARCHAR(30) NOT NULL,
    -- requirement, design_doc, wireframe, source_code, test_suite, test_report, deployment_script, documentation, diagram, other
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_path TEXT,
    file_type VARCHAR(50),
    size_bytes INTEGER,
    content_hash VARCHAR(64),
    metadata JSON,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES sdlc_stages(id) ON DELETE SET NULL,
    INDEX ix_project_artifacts_project_id (project_id),
    INDEX ix_project_artifacts_stage_id (stage_id)
);

-- Pipelines - workflow orchestration definitions
CREATE TABLE IF NOT EXISTS pipelines (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    project_id INTEGER,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    pipeline_type VARCHAR(50) NOT NULL DEFAULT 'sdlc',
    -- sdlc, ci_cd, testing, deployment, documentation
    config JSON,
    is_template BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    INDEX ix_pipelines_user_id (user_id),
    INDEX ix_pipelines_project_id (project_id)
);

-- Pipeline Steps - individual steps in a pipeline workflow
CREATE TABLE IF NOT EXISTS pipeline_steps (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    pipeline_id INTEGER NOT NULL,
    step_order INTEGER NOT NULL,
    step_type VARCHAR(50) NOT NULL,
    -- ai_query, code_generation, test_execution, document_build, deploy, notify, condition, transform
    name VARCHAR(255) NOT NULL,
    config JSON,
    input_mapping JSON,
    output_mapping JSON,
    timeout_seconds INTEGER DEFAULT 300,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE,
    INDEX ix_pipeline_steps_pipeline_id (pipeline_id)
);

-- Pipeline Executions - runtime tracking of pipeline runs
CREATE TABLE IF NOT EXISTS pipeline_executions (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    pipeline_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    project_id INTEGER,
    status VARCHAR(30) DEFAULT 'pending',
    -- pending, running, completed, failed, cancelled
    triggered_by VARCHAR(50) DEFAULT 'manual',
    -- manual, auto, webhook, schedule
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    result JSON,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    INDEX ix_pipeline_executions_pipeline_id (pipeline_id),
    INDEX ix_pipeline_executions_user_id (user_id)
);

-- Pipeline Execution Steps - individual step results
CREATE TABLE IF NOT EXISTS pipeline_execution_steps (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    execution_id INTEGER NOT NULL,
    step_id INTEGER,
    step_order INTEGER NOT NULL,
    step_type VARCHAR(50) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending',
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    input_data JSON,
    output_data JSON,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (execution_id) REFERENCES pipeline_executions(id) ON DELETE CASCADE,
    FOREIGN KEY (step_id) REFERENCES pipeline_steps(id) ON DELETE SET NULL,
    INDEX ix_pipeline_execution_steps_execution_id (execution_id)
);

-- Tool Integrations - external tool configurations (Cline, Playwright, SigNoz, etc.)
CREATE TABLE IF NOT EXISTS tool_integrations (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    project_id INTEGER,
    tool_name VARCHAR(100) NOT NULL,
    -- cline, playwright, signoz, github_actions, jenkins, docker
    display_name VARCHAR(255),
    config JSON,
    credentials_encrypted TEXT,
    status VARCHAR(30) DEFAULT 'disconnected',
    -- disconnected, connected, error
    status_message TEXT,
    version VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    INDEX ix_tool_integrations_user_id (user_id),
    INDEX ix_tool_integrations_project_id (project_id)
);

-- SDLC Activity Log - audit trail for all SDLC actions
CREATE TABLE IF NOT EXISTS sdlc_activity_log (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    project_id INTEGER,
    stage_id INTEGER,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    description TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (stage_id) REFERENCES sdlc_stages(id) ON DELETE SET NULL,
    INDEX ix_sdlc_activity_log_user_id (user_id),
    INDEX ix_sdlc_activity_log_project_id (project_id),
    INDEX ix_sdlc_activity_log_created_at (created_at)
);