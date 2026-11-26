# AGENTS.md: Afrivate Admin Dashboard

Instructions for AI coding agents and new contributors. Read this first, then `ARCHITECTURE.md`, `SECURITY.md` and `CODE_STYLE.md`.

## Ground rules

1. **Preserve working features and content.** Do not delete or rewrite pages, components or docs unless the owner asks.
2. **Audits are report-only.** When asked for a security or launch check, report findings first. Change code only after the owner approves.
3. **Never put secrets in the frontend.** Anything `REACT_APP_*` is public. Never open, print or commit `.env` files, and never paste admin passwords or tokens into code, docs or chat.
4. **Never touch tokens in JavaScript.** Sessions are HttpOnly cookies set by the backend. Do not reintroduce `localStorage`, `sessionStorage` or an `Authorization` header in this app.
5. **Explain trade-offs in plain words.** When a fix has a cost, say what it is.
6. **Leave other people's files alone.** Do not commit or delete files you did not create.

## Setup

```bash
npm install
cp .env.example .env   # then check REACT_APP_API_BASE_URL
npm start              # http://localhost:3001 (the backend allows this origin)
```

The backend must run on the URL in `.env` (default `http://localhost:8000`). To create an admin account, run `python manage.py create_admin --email you@afrivate.org --name "Your Name"` from the backend's `app/` folder.

Node.js 18 or newer and npm 9 or newer.

## Commands

```bash
npm start               # dev server
CI=true npm run build   # production build. Same check to pass before merging.
npm audit               # review before each release (see SECURITY.md)
```

## Git workflow

- Work on a feature branch, for example `security/audit-fixes` or `feature/<short-name>`.
- Do not push to `main` directly. Open a pull request.
- Pushes happen only when the owner says so.

## Definition of done

- `CI=true npm run build` passes with no warnings.
- No `fetch` calls outside `src/api.js`.
- Every new query string is built with `URLSearchParams` or `encodeURIComponent`.
- Every new page is behind the session check in `App.js`.
- Signed in and signed out flows still work: sign in, navigate, sign out returns to `#/login`.
- No secrets added. Any new `REACT_APP_*` variable is public, so confirm it is safe.
- If the CSP changes, check the browser console for CSP violations.

## Files to be careful with

| File | Why |
|---|---|
| `src/api.js` | Every API call and session handling. Changes can break sign-in for everyone. |
| `src/App.js` | Session check and route guard. |
| `public/index.html` | The Content Security Policy. A wrong rule blocks the whole app. |
| `.env.example` | Names only. Never put real values here. |
| `.gitignore` | Keeps `.env` out of git. Do not remove the `.env` line. |
