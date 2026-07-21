"""AI-powered artifact generation for SDLC projects.

Reuses the existing LLM-calling infrastructure (stream_external_provider and
Ollama fallback) from query.py, following the same prompt-in → text-out
pattern as generate_report() for non-streaming artifact generation.
"""

from app.query import stream_external_provider

# System prompts for each artifact type — tailored to produce the style and
# structure expected by that stage of the SDLC.
ARTIFACT_SYSTEM_PROMPTS = {
    "requirement": (
        "You are a business analyst writing software requirements. "
        "Produce a well-structured requirements document covering: "
        "1) Overview & Business Context, 2) Functional Requirements (as bullet-point use cases), "
        "3) Non-Functional Requirements (performance, security, scalability), "
        "4) Constraints & Assumptions, 5) Acceptance Criteria. "
        "Use clear, concise language suitable for both technical and non-technical stakeholders. "
        "Format the output in plain text with clear section headers (no markdown)."
    ),
    "design_doc": (
        "You are a software architect writing a technical design document. "
        "Produce a design document covering: "
        "1) Architecture Overview (high-level components and their interactions), "
        "2) Data Model (key entities and relationships), "
        "3) API / Interface Design (endpoints, contracts), "
        "4) Technology Choices (with rationale), "
        "5) Security & Performance Considerations. "
        "Focus on practical, implementable design decisions. "
        "Format the output in plain text with clear section headers (no markdown)."
    ),
    "wireframe": (
        "You are a UX designer describing wireframes and user interface mockups. "
        "Produce a textual wireframe specification covering: "
        "1) Page / Screen Layout (describe the visual structure), "
        "2) Key UI Components (navigation, forms, data displays), "
        "3) User Flows (step-by-step interaction paths), "
        "4) Responsive / Mobile Considerations. "
        "Be descriptive enough that a frontend developer could implement the layout. "
        "Format the output in plain text with clear section headers (no markdown)."
    ),
    "source_code": (
        "You are a senior software engineer writing production-quality source code. "
        "Write clean, well-structured code following best practices. "
        "Include appropriate error handling, input validation, and comments. "
        "Use modern language features and design patterns. "
        "Provide the full implementation with file structure shown, not just snippets. "
        "Format the output in plain text with language annotations for code blocks."
    ),
    "test_suite": (
        "You are a QA engineer designing a comprehensive test suite. "
        "Produce a test plan covering: "
        "1) Unit Tests (test cases for core logic functions), "
        "2) Integration Tests (endpoints, database interactions), "
        "3) Edge Cases (boundary conditions, error handling), "
        "4) Test Data / Fixtures needed. "
        "For each test case describe: purpose, preconditions, steps, expected result. "
        "Format the output in plain text with clear section headers (no markdown)."
    ),
    "test_report": (
        "You are a QA engineer writing a test execution report. "
        "Summarize testing results covering: "
        "1) Test Summary (total tests, passed, failed, skipped), "
        "2) Key Findings (critical bugs, regressions), "
        "3) Test Coverage Analysis, "
        "4) Quality Assessment & Recommendations. "
        "Format the output in plain text with clear section headers (no markdown)."
    ),
    "deployment_script": (
        "You are a DevOps engineer writing deployment scripts and configuration. "
        "Produce a deployment guide covering: "
        "1) Deployment Architecture (environments, infrastructure), "
        "2) Prerequisites & Dependencies, "
        "3) Step-by-Step Deployment Process, "
        "4) Rollback & Recovery Plan, "
        "5) Monitoring & Health Checks. "
        "Include configuration examples and environment variable listings. "
        "Format the output in plain text with clear section headers (no markdown)."
    ),
    "documentation": (
        "You are a technical writer creating comprehensive documentation. "
        "Produce documentation covering: "
        "1) Overview & Purpose, "
        "2) Getting Started / Quick Start, "
        "3) Detailed Usage Guide (step-by-step instructions), "
        "4) Configuration & Settings Reference, "
        "5) Troubleshooting & FAQs. "
        "Write for an audience familiar with the technology but new to this specific project. "
        "Format the output in plain text with clear section headers (no markdown)."
    ),
    "diagram": (
        "You are a system architect describing architecture diagrams. "
        "Produce a detailed textual description of a system diagram covering: "
        "1) Diagram Overview (what the diagram represents), "
        "2) Components & Their Responsibilities, "
        "3) Data Flows Between Components, "
        "4) External Integrations & Interfaces. "
        "Describe in enough detail that the diagram can be drawn from your description. "
        "Format the output in plain text with clear section headers (no markdown)."
    ),
    "other": (
        "You are a technical document writer. "
        "Produce a well-structured document based on the user's description. "
        "Use clear, professional language suitable for technical documentation. "
        "Format the output in plain text with clear section headers (no markdown)."
    ),
}

DEFAULT_SYSTEM_PROMPT = ARTIFACT_SYSTEM_PROMPTS["documentation"]


def build_artifact_prompt(artifact_type, name, description, user_prompt=None):
    """Construct the full user prompt for artifact generation.

    Combines the artifact's metadata with any additional user guidance
    into a single prompt string that the LLM will use to generate content.
    """
    if user_prompt:
        return (
            f"Generate a {artifact_type} artifact titled '{name}'.\n\n"
            f"Description: {description or 'No description provided.'}\n\n"
            f"Additional Guidance:\n{user_prompt}\n\n"
            f"Produce the complete {artifact_type} content below:"
        )

    return (
        f"Generate a {artifact_type} artifact titled '{name}'.\n\n"
        f"Description: {description or 'No description provided.'}\n\n"
        f"Produce the complete {artifact_type} content below:"
    )


def generate_artifact(
    artifact_type,
    name,
    description=None,
    artifact_prompt=None,
    external_provider=None,
    external_api_key=None,
    external_base_url=None,
    external_model=None,
    ollama_url="http://localhost:11434",
    llm_model="llama3.2",
):
    """Generate artifact content using the configured AI provider.

    Follows the same pattern as generate_report() in query.py: collects all
    streamed tokens into a single string (non-streaming from the caller's
    perspective) and returns it with metadata about how it was generated.

    Returns a dict with keys:
      - content (str): the generated text
      - generated_by (str): "ollama" or the provider name
    """
    system_prompt = ARTIFACT_SYSTEM_PROMPTS.get(artifact_type, DEFAULT_SYSTEM_PROMPT)
    user_prompt_text = build_artifact_prompt(artifact_type, name, description, artifact_prompt)

    if external_provider:
        content_parts = []
        for delta in stream_external_provider(
            external_provider,
            external_api_key,
            external_base_url,
            external_model,
            system_prompt,
            user_prompt_text,
        ):
            if delta:
                content_parts.append(delta)
        content = "".join(content_parts)
        return {
            "content": content or "Generation returned empty response.",
            "generated_by": external_provider,
        }

    # Fallback to Ollama
    import httpx
    import ollama

    ollama_client = ollama.Client(host=ollama_url)
    try:
        response = ollama_client.chat(
            model=llm_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt_text},
            ],
            stream=True,
        )
        content_parts = []
        for chunk in response:
            content = chunk.get("message", {}).get("content", "")
            if content:
                content_parts.append(content)
        content = "".join(content_parts)
        return {
            "content": content or "Generation returned empty response.",
            "generated_by": "ollama",
        }
    except httpx.ConnectError:
        return {
            "content": (
                "Local AI (Ollama) isn't running, so the artifact couldn't be generated. "
                "Start Ollama on this machine, or add a provider under Settings > Integrations "
                "and select it from the provider menu."
            ),
            "generated_by": "error",
        }


PLAYWRIGHT_SPEC_FILES = [
    ("auth.spec.ts", "authentication flows: sign up, login, logout, invalid credentials, session persistence"),
    ("navigation.spec.ts", "primary navigation: main menu, routing between pages, breadcrumbs, 404 handling"),
    ("crud.spec.ts", "create, read, update, and delete operations for the project's core resources"),
    ("forms.spec.ts", "form validation: required fields, error messages, successful submission"),
    ("critical-journeys.spec.ts", "end-to-end critical user journeys covering the project's main value proposition"),
]


def generate_playwright_suite(
    project_name,
    description,
    external_provider=None,
    external_api_key=None,
    external_base_url=None,
    external_model=None,
    ollama_url="http://localhost:11434",
    llm_model="llama3.2",
):
    """Generate a runnable Playwright E2E test project for the given app.

    Returns a dict with:
      - files (dict[str, str]): full Playwright project file map (config, package.json, spec files, README)
      - generated_by (str)
    """
    import json
    import re

    system_prompt = (
        "You are a senior QA automation engineer writing Playwright end-to-end tests in TypeScript. "
        "Given a project description, write realistic Playwright test specs using @playwright/test. "
        "Use page.goto, expect(), and role/label-based locators. Assume a base URL of http://localhost:3000 "
        "unless the description implies otherwise. Where exact selectors are unknown, use sensible "
        "data-testid or role-based locators and add a short comment noting they may need adjustment. "
        "Respond with ONLY a valid JSON object (no markdown fences, no extra text) of this exact shape:\n"
        '{ "files": { "tests/auth.spec.ts": "...", "tests/navigation.spec.ts": "...", '
        '"tests/crud.spec.ts": "...", "tests/forms.spec.ts": "...", "tests/critical-journeys.spec.ts": "..." } }\n'
        "Each value is the complete, valid TypeScript file content (as a JSON string, escaping newlines as \\n). "
        "Cover authentication, navigation, CRUD operations, forms, and the critical user journeys implied by the description."
    )
    user_prompt = (
        f"Project Name: {project_name}\n\n"
        f"Project Description:\n{description or 'No description provided.'}\n\n"
        "Generate the Playwright test spec files as JSON:"
    )

    generated_by = "ollama"
    raw_text = ""

    if external_provider:
        content_parts = []
        for delta in stream_external_provider(
            external_provider, external_api_key, external_base_url, external_model,
            system_prompt, user_prompt,
        ):
            if delta:
                content_parts.append(delta)
        raw_text = "".join(content_parts)
        generated_by = external_provider
    else:
        import httpx
        import ollama

        ollama_client = ollama.Client(host=ollama_url)
        try:
            response = ollama_client.chat(
                model=llm_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                stream=True,
            )
            content_parts = []
            for chunk in response:
                content = chunk.get("message", {}).get("content", "")
                if content:
                    content_parts.append(content)
            raw_text = "".join(content_parts)
        except httpx.ConnectError:
            generated_by = "error"

    spec_files = {}
    if raw_text:
        try:
            match = re.search(r"\{.*\}", raw_text, re.DOTALL)
            if match:
                spec_files = json.loads(match.group(0)).get("files", {})
        except Exception:
            spec_files = {}

    if not spec_files:
        spec_files = {
            f"tests/{filename}": (
                "import { test, expect } from '@playwright/test';\n\n"
                f"// TODO: fill in real coverage for: {focus}\n"
                f"test.describe('{filename.replace('.spec.ts', '')}', () => {{\n"
                "  test('placeholder', async ({ page }) => {\n"
                "    await page.goto('/');\n"
                "    await expect(page).toHaveURL(/.*/);\n"
                "  });\n"
                "});\n"
            )
            for filename, focus in PLAYWRIGHT_SPEC_FILES
        }

    files = dict(spec_files)
    files["playwright.config.ts"] = (
        "import { defineConfig, devices } from '@playwright/test';\n\n"
        "export default defineConfig({\n"
        "  testDir: './tests',\n"
        "  fullyParallel: true,\n"
        "  retries: 1,\n"
        "  reporter: 'html',\n"
        "  use: {\n"
        "    baseURL: process.env.BASE_URL || 'http://localhost:3000',\n"
        "    trace: 'on-first-retry',\n"
        "  },\n"
        "  projects: [\n"
        "    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },\n"
        "  ],\n"
        "});\n"
    )
    files["package.json"] = json.dumps({
        "name": (re.sub(r"[^a-z0-9-]", "-", (project_name or "cognexa-project").lower()) or "cognexa-project") + "-e2e-tests",
        "version": "1.0.0",
        "private": True,
        "scripts": {
            "test": "playwright test",
            "test:headed": "playwright test --headed",
            "test:ui": "playwright test --ui",
            "report": "playwright show-report",
        },
        "devDependencies": {
            "@playwright/test": "^1.48.0",
        },
    }, indent=2)
    files["README.md"] = (
        f"# {project_name or 'Project'} — Playwright E2E Test Suite\n\n"
        "AI-generated end-to-end tests covering authentication, navigation, CRUD operations, "
        "forms, and critical user journeys.\n\n"
        "## Setup\n\n"
        "```\nnpm install\nnpx playwright install --with-deps\n```\n\n"
        "## Run the tests\n\n"
        "```\nnpm test\n```\n\n"
        "Run in headed mode: `npm run test:headed`. Open the interactive UI runner: `npm run test:ui`. "
        "View the last HTML report: `npm run report`.\n\n"
        "Set `BASE_URL` if the app under test isn't running on `http://localhost:3000`.\n"
    )

    return {"files": files, "generated_by": generated_by}


def generate_sdlc_plan(
    description,
    document_texts,
    external_provider=None,
    external_api_key=None,
    external_base_url=None,
    external_model=None,
    ollama_url="http://localhost:11434",
    llm_model="llama3.2",
):
    """Generate an SDLC plan (stages + artifacts) from project description and documents.

    Returns a dict with:
      - raw (str): the model's raw response text
      - generated_by (str): provider name or 'ollama' or 'error'
    """
    import json
    import re

    system_prompt = (
        "You are a software development lifecycle architect. "
        "Given a project description and optionally extracted document texts, design a complete, practical SDLC workflow. "
        "Respond with ONLY a valid JSON object (no markdown fences, no extra text) using this exact structure:\n"
        "{\n"
        '  "workflow_name": "string",\n'
        '  "stages": [\n'
        "    {\n"
        '      "stage_type": "requirements|design|development|testing|documentation|deployment",\n'
        '      "name": "string",\n'
        '      "description": "string",\n'
        '      "priority": 100,\n'
        '      "artifacts": [\n'
        "        {\n"
        '          "artifact_type": "requirement|design_doc|wireframe|source_code|test_suite|test_report|deployment_script|documentation|diagram|other",\n'
        '          "name": "string",\n'
        '          "description": "string",\n'
        '          "prompt": "string describing what to generate"\n'
        "        }\n"
        "      ]\n"
        "    }\n"
        "  ]\n"
        "}\n"
        "Rules:\n"
        "- Stages must be sequential with strictly descending priority (requirements=100, design=90, development=80, testing=70, deployment=60, documentation=50).\n"
        "- Include 3-5 artifacts per stage.\n"
        "- artifact_type must be one of the listed values.\n"
        "- Be specific and actionable."
    )
    combined_text = "\n\n".join(document_texts) if document_texts else "No documents provided."
    user_prompt = (
        f"Project Description:\n{description}\n\n"
        f"Extracted Document Texts:\n{combined_text}\n\n"
        "Design the SDLC workflow as JSON:"
    )

    if external_provider:
        content_parts = []
        for delta in stream_external_provider(
            external_provider,
            external_api_key,
            external_base_url,
            external_model,
            system_prompt,
            user_prompt,
        ):
            if delta:
                content_parts.append(delta)
        raw = "".join(content_parts)
        return {"raw": raw, "generated_by": external_provider}

    import httpx
    import ollama

    ollama_client = ollama.Client(host=ollama_url)
    try:
        response = ollama_client.chat(
            model=llm_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            stream=True,
        )
        content_parts = []
        for chunk in response:
            content = chunk.get("message", {}).get("content", "")
            if content:
                content_parts.append(content)
        raw = "".join(content_parts)
        return {"raw": raw, "generated_by": "ollama"}
    except httpx.ConnectError:
        return {"raw": "", "generated_by": "error"}
