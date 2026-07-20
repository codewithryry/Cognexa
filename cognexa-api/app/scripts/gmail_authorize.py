"""One-time local setup for Gmail API sending (welcome emails, security
alerts). Run this on your own machine, not on Render -- it opens a browser
for you to grant consent, which a headless server can't do.

Usage:
    python -m app.scripts.gmail_authorize

Before running:
    1. In Google Cloud Console, create an OAuth 2.0 Client ID of type
       "Desktop app" (APIs & Services > Credentials).
    2. Enable the Gmail API for that project.
    3. Download its client secret JSON and save it at
       app/uploads/credentials.json (or set GMAIL_CREDENTIALS_PATH).

After running, this writes app/uploads/token.json (or GMAIL_TOKEN_PATH) --
copy that file to the server (env var / Render Secret File / your own
deploy step). The Gmail API client refreshes its access token from the
refresh token inside it automatically, so this script only needs to be run
again if that token is later revoked.
"""

import os

from google_auth_oauthlib.flow import InstalledAppFlow

from app.services.gmail_service import CREDENTIALS_PATH, SCOPES, TOKEN_PATH


def main():
    if not os.path.exists(CREDENTIALS_PATH):
        raise SystemExit(
            f"{CREDENTIALS_PATH} not found. Download your OAuth client's credentials "
            "JSON from Google Cloud Console and save it at that path first "
            "(or point GMAIL_CREDENTIALS_PATH at it)."
        )

    flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_PATH, SCOPES)
    creds = flow.run_local_server(port=0)

    os.makedirs(os.path.dirname(TOKEN_PATH) or ".", exist_ok=True)
    with open(TOKEN_PATH, "w", encoding="utf-8") as f:
        f.write(creds.to_json())

    print(f"Saved {TOKEN_PATH}. Copy this file to the server to enable Gmail sending there.")


if __name__ == "__main__":
    main()
