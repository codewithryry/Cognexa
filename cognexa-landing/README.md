# cognexa-landing

A standalone, static marketing site for Cognexa — Hero, Features, Solutions,
AI Capabilities, Resources, About, and Contact sections.

This project has **no dependency** on `cognexa-web` or `cognexa-api`: no
shared code, no authentication, no database, no server-side API calls to a
first-party backend. The only network calls made are client-side, to the
public GitHub API (star count) — everything else is static content baked in
at build time.

## Develop

```bash
npm install
npm run dev
```

## Build (static export)

```bash
npm run build
```

Output goes to `out/` — a plain folder of HTML/CSS/JS you can upload to any
static host (Netlify, GitHub Pages, S3 + CloudFront, Vercel static, etc.).
Preview the exported build locally with:

```bash
npm run preview
```

## Before deploying

Update [`lib/constants.ts`](lib/constants.ts):

- `APP_URL` — where "Get Started" / resource links should point (the actual
  Cognexa web app's deployed URL).
- `REPO_URL` — the GitHub repository URL, if it differs.
- `CONTACT_EMAIL` — the support/contact address shown on the Contact section.
