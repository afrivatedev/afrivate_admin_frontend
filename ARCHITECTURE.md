# Architecture: Afrivate Admin Dashboard

Last updated: 26 November 2026

The admin dashboard is a React single-page app for the Afrivate internal team. It is separate from the volunteer app (`Afrivate_Volunteer_Module_Frontend`). It talks to the same Django backend, but only through the admin API under `/api/admin/`. Admin accounts (`AdminUser`) are separate from volunteer and organisation logins.

## Stack

| Part | Choice |
|---|---|
| Framework | React 18, built with Vite 6 (`vite`, `@vitejs/plugin-react`) |
| Routing | React Router v6, `HashRouter` (URLs look like `#/users`, so no server rewrites are needed) |
| Styling | Tailwind CSS v3, brand colour `#6A00B1` |
| Icons | `lucide-react` |
| Font | Montserrat, self-hosted through `@fontsource/montserrat` |
| API | Native `fetch` in `src/api.js`, with cookies |
| Hosting | Static site (Render). `build/` is the output. |

## Entry points

- `src/index.js` loads the fonts and CSS, then renders `App`.
- `src/App.js` checks the session on load (`/api/admin/auth/me/`), shows a short loading state, then renders the route tree. Signed-out users are sent to `#/login`. A session-ended event from the API client also sends them there.
- `src/api.js` is the only place that calls the backend.

## Screens and routes

| Route | Component | What it does |
|---|---|---|
| `#/login` | `pages/Login.js` | Admin sign-in |
| `#/` | `pages/Dashboard.js` | Analytics, funnel, activity, geography, CSV export |
| `#/users` | `pages/Users.js` | Searchable directory of all users, CSV export |
| `#/users/:id` | `pages/UserDetail.js` | Profile, notes, suspend/reinstate, edit, message |
| `#/connections` | `pages/Connections.js` | All connections, status correction, CSV export |
| `#/broadcasts` | `pages/Broadcasts.js` | Segment and broadcast messages with history |
| `#/actions` | `pages/ActionLog.js` | Audit log of admin actions |

`components/Layout.js` holds the sidebar (desktop) and drawer (mobile), and the logout button.

## Sessions in the browser

```
Browser                          Backend (/api/admin/)
  |  POST auth/login/  --------->  checks password, sets 2 HttpOnly cookies
  |  GET  auth/me/     --------->  reads access cookie, returns admin
  |  GET  users/ ...   --------->  reads access cookie
  |  POST suspend/     --------->  needs cookie + X-Admin-Request + allowed Origin
  |  POST auth/refresh/ -------->  reads refresh cookie, sets new cookies (on 401)
  |  POST auth/logout/  -------->  bumps token_version, clears cookies
```

- Cookies: `afrivate_admin_access` (1 hour, path `/api/admin/`) and `afrivate_admin_refresh` (12 hours, path `/api/admin/auth/`). Both are `HttpOnly`, `Secure`, and `SameSite=None` by default (set by the backend `ADMIN_COOKIE_SAMESITE` setting).
- Every request sends `credentials: 'include'` and `X-Admin-Request: 1`.
- Concurrent 401s share one refresh call (`refreshInFlight` in `src/api.js`).
- Logout on the server revokes every earlier token for that admin. That logs the admin out on all devices, which is intended.

## Trade-offs (plain words)

- **Cookies instead of tokens in JavaScript.** A script injected into the page (XSS) cannot read the session, which is the main gain. The cost is that every write needs the custom header check, so a new kind of request needs care.
- **`SameSite=None`.** Needed because the admin site and the API are on different hostnames. The cost: browsers that block third-party cookies (Safari, some Chrome settings) can stop sign-in. The longer-term fix is one domain for both: `admin.afrivate.org` calling `api.afrivate.org`, with `SameSite=Lax`. Until that move, test sign-in in Safari before launch.
- **Revoke-all on logout.** Simple and safe. The cost: signing out on one device signs out all devices.

## Environments

- **Local:** `npm start` on `http://localhost:3001`. The backend allows this origin in CORS. Backend on `http://localhost:8000`.
- **Live:** the admin static site on Render. Its build must set `VITE_API_BASE_URL` to the live backend URL, because the CSP and the API calls use it. Vite reads it at build time, so a change needs a rebuild.

## Build and tooling

- `npm run build` creates `build/` (Vite `outDir`). Use `npm run build` as the check. Vite does not fail on lint warnings, so run `npm audit` and test by hand as well.
- `npm start` runs the Vite dev server on port 3001. `npm run preview` serves the built `build/` folder for a local check.
- Config lives in `vite.config.js`. The `.js` files in `src/` are treated as JSX, as Create React App did, so no file renames were needed.
- No automated test suite yet.
- Migration history: Create React App (`react-scripts`) was replaced by Vite in November 2026 because `react-scripts` was unmaintained and caused most `npm audit` findings (see `SECURITY.md`). The env variables moved from `REACT_APP_*` to `VITE_*`, and `index.html` moved from `public/` to the project root.

## Backend contract

The admin API lives in the backend at `app/adminpanel/` (`urls.py`). Key rules the frontend depends on:

- Login, refresh and logout accept requests only with `X-Admin-Request`.
- Login returns `{ admin }` only. Tokens are never in the response body.
- Admin-only endpoints return 401 without a valid admin session. Volunteer or organisation tokens are rejected the same way.
- CSV endpoints return the file directly (`export=csv` or `/analytics/export/`).

## Folder map

| Folder | Contents |
|---|---|
| `src/` | `App.js`, `api.js`, `index.js`, `index.css` |
| `src/components/` | `Layout.js` (navigation shell), `ui.js` (shared pieces: `Card`, `StatTile`, `StatusBadge`, `Table`, `ExportButton`, `PrimaryButton`, `DateRangePicker`, `ErrorNote`, `fmtDate`) |
| `src/pages/` | One file per route |
| project root | `index.html` (CSP and meta tags), `vite.config.js`, `package.json`, `.env.example` |
| `public/` | Static files copied as-is: `logo.png`, `favicon.ico` |

## Where to look next

- `README.md`: setup and screen list (product notes)
- `SECURITY.md`: security rules and headers
- `CODE_STYLE.md`: coding rules
- `AGENTS.md`: instructions for AI and new contributors
- Backend `app/adminpanel/authentication.py` and `views_auth.py`: the session rules this app relies on
