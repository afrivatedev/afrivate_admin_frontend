# Security Policy: Afrivate Admin Dashboard

Last updated: 26 November 2026

## Reporting a vulnerability

Do not open a public GitHub issue for a security problem.

Email: **[security contact email, to be filled in]**

Include the page or route affected, steps to reproduce, and what an attacker could see or change.

## Rules for this codebase

**Never put secrets in the frontend**
- Anything named `VITE_*` is built into the JavaScript and is public.
- Only the API base URL belongs in `.env`. Never add passwords, API keys, the Django `SECRET_KEY` or database URLs.
- `.env` is not committed (see `.gitignore`). Copy `.env.example` to start.

**Sessions are cookies, not JavaScript state**
- Login and refresh set two `HttpOnly`, `Secure` cookies from the backend:
  - `afrivate_admin_access` (1 hour, path `/api/admin/`)
  - `afrivate_admin_refresh` (12 hours, path `/api/admin/auth/`)
- The frontend never reads, stores or sends a token. `localStorage` is not used. Earlier builds stored tokens there; `clearLegacySession()` in `src/api.js` removes that old key on load.
- Every request sends `credentials: 'include'` and the header `X-Admin-Request: 1`.
- The backend rejects cookie-authenticated POST, PATCH, PUT and DELETE requests that lack that header, or whose `Origin` is not in the backend's allowed list. This blocks cross-site request forgery. A cross-site page cannot add a custom header without a CORS preflight, and the backend only allows its own origins.
- On a 401, the client refreshes the session once and retries. If the refresh fails, the app shows the login page.
- Logout calls `POST /api/admin/auth/logout/`. The backend bumps the admin's `token_version`, so every session issued earlier stops working at once, not just this browser.

**Never render raw HTML from the server**
- Do not use `dangerouslySetInnerHTML` or `innerHTML`.
- Use React's normal text rendering, which escapes content automatically.

**Build query strings safely**
- Build query strings with `URLSearchParams` or `encodeURIComponent`. Never splice user input or route params into a URL with a template string.

**Content Security Policy (CSP)**
- `index.html` (project root) sets a CSP meta tag: scripts and styles only from this origin (inline styles allowed for React), images from this origin and `data:`, fonts from this origin, and requests only to this origin and the API origin.
- Meta tags cannot set `frame-ancestors`, `X-Frame-Options`, `Strict-Transport-Security` or `Permissions-Policy`. Set those as HTTP headers on the host. See "Headers to set on the host" below.
- The API origin is filled in from `VITE_API_BASE_URL` at build time. If the variable is missing at build time, the CSP contains the literal text `%VITE_API_BASE_URL%` and API calls will be blocked. Always set it in the build environment.
- The CSP meta tag is removed only by the dev server (`npm start`), so the React refresh script can run. Production builds always keep it (see `vite.config.js`).

**Fonts**
- Montserrat is self-hosted through `@fontsource/montserrat`. Nothing is loaded from Google Fonts, so visitors' IP addresses are not sent to Google.

**Private pages**
- The whole app is private. `index.html` carries `noindex, nofollow`.
- Every route except `/login` requires a valid session. The app checks `/api/admin/auth/me/` on load.
- Do not put any link to this app on public pages.

**Downloads**
- CSV exports are downloaded through the authenticated client, so the session cookie is sent. A plain `<a href>` cannot be used, because it would not send the custom header.
- The backend prefixes formula-looking cells (starting with `=`, `+`, `-`, `@`, tab or CR) with an apostrophe, so a spreadsheet will not run them.

**Errors**
- Show a short message. Never show stack traces, raw response bodies or internal details.

## Headers to set on the host

Set these on the static host (Render static site: Headers settings or `render.yaml`). Values are a starting point, to be tested before launch.

| Header | Value | Why |
|---|---|---|
| `Content-Security-Policy` | `frame-ancestors 'none'` (send as a header; browsers ignore this directive in a meta tag) | Stops this app being framed (clickjacking) |
| `X-Frame-Options` | `DENY` | Older browsers, same purpose |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Forces HTTPS |
| `X-Content-Type-Options` | `nosniff` | Stops MIME guessing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits what is sent to other sites |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Turns off browser features the app does not use |
| `X-Robots-Tag` | `noindex, nofollow` | Keeps search engines out, as a second layer after the meta tag |

## Dependencies

- Run `npm audit` before each release. Fix high and critical issues in runtime libraries first.
- The build tool is Vite 6 (it replaced `react-scripts`, which was the source of most earlier findings). After the move, `npm audit` reports 0 critical and 0 high. Three moderate findings remain:
  - `react-router-dom` 6 (direct dependency): a moderate advisory. The fix is the 7.x line, which needs Node 20 or newer. That upgrade is planned as a separate change.
  - `react-router` and `postcss-selector-parser` (transitive, through React Router and Tailwind's tooling). They go away with the React Router 7 upgrade and the Tailwind tooling update.
- `overrides` in `package.json` pin `nanoid` and `source-map-js` to patched versions. Remove an override only after checking the audit again.

## Known gaps

- The admin site and the API are on different hostnames. Cookies sent between them are cross-site and need `SameSite=None; Secure`. Some browsers block third-party cookies, which can stop sign-in. The fix is to serve both under one domain (for example `admin.afrivate.org` and `api.afrivate.org`) and set `SameSite=Lax` or `Strict`. See `ARCHITECTURE.md`.
- No automated tests yet. The check is `npm run build` plus a manual browser check of sign-in, navigation and logout.
