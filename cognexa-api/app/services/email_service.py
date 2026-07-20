import logging
import os

logger = logging.getLogger("uvicorn.error")

TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")

SECURITY_EVENT_TITLES = {
    "password_changed": "Your Cognexa password was changed",
    "new_login": "New login to your Cognexa account",
}


def _load_template(name: str) -> str:
    with open(os.path.join(TEMPLATES_DIR, name), "r", encoding="utf-8") as f:
        return f.read()


def _render(template: str, **values) -> str:
    for key, value in values.items():
        template = template.replace("{{" + key + "}}", value or "")
    return template


def _send(to_email: str, subject: str, html: str) -> None:
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        # No key configured (e.g. local dev) -- log and skip instead of
        # failing the request that triggered this email.
        logger.warning("RESEND_API_KEY not set -- skipping email (subject=%r, to=%s)", subject, to_email)
        return

    import resend

    resend.api_key = api_key
    from_email = os.getenv("EMAIL_FROM", "onboarding@resend.dev")

    try:
        resend.Emails.send({
            "from": from_email,
            "to": to_email,
            "subject": subject,
            "html": html,
        })
    except Exception:
        logger.exception("Failed to send email (subject=%r, to=%s)", subject, to_email)


def send_welcome_email(to_email: str, name: str, dashboard_url: str | None = None) -> None:
    html = _render(
        _load_template("welcome.html"),
        name=name or "there",
        dashboard_url=dashboard_url or os.getenv("FRONTEND_URL", "https://cognexa.ai") + "/dashboard",
    )
    _send(to_email, "Welcome to Cognexa", html)


def send_security_alert(to_email: str, name: str, event: str, detail: str = "") -> None:
    subject = SECURITY_EVENT_TITLES.get(event, "Cognexa security alert")
    html = _render(
        _load_template("security.html"),
        name=name or "there",
        event=subject,
        detail=detail,
    )
    _send(to_email, subject, html)
