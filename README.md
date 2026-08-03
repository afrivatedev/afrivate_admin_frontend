# AfriVate Admin Dashboard (frontend)

Internal-team dashboard for the AfriVate platform — built to the **AfriVate Admin
Dashboard PRD (Simple / MVP)**. This is a separate app from the public
`Afrivate_Volunteer_Module_Frontend`; regular users never see it. Deploy it on its
own subdomain (e.g. `admin.afrivate.org`).

It talks to the same Django backend via the admin-only API under `/api/admin/...`
(see `Afrivate-Backend/app/adminpanel/`), which uses its own `AdminUser` accounts —
Pathfinder/Enabler logins do not work here, and admin tokens do not work on the
public app.

## Screens

| Route | PRD section | What it does |
|---|---|---|
| `#/login` | 11.1 | Admin sign-in (separate auth) |
| `#/` | 6.5 | Analytics: growth, funnel, activity, geography, org activity + CSV exports |
| `#/users` | 6.1 | Unified searchable/filterable directory of both user types + CSV |
| `#/users/:id` | 6.2–6.3 | Full profile, activity timeline, connections, admin notes, suspend/reinstate/edit/message |
| `#/connections` | 6.4 | All connections, filterable; direct status correction with required reason |
| `#/broadcasts` | 6.6 | Broadcast & segment messaging (email + in-app) with send history |
| `#/actions` | 8.3 | Audit log of every admin action |

## Run locally

```bash
npm install
npm start          # runs on http://localhost:3001 (the backend allows this origin in CORS)
```

Backend must be running on the URL in `.env` (`REACT_APP_API_BASE_URL`,
default `http://localhost:8000`).

To create your first admin account, from `Afrivate-Backend/app`:

```bash
python manage.py create_admin --email you@afrivate.org --name "Your Name"
```

## Build & deploy

```bash
npm run build      # static output in build/
```

Deploy `build/` anywhere static (the app uses hash routing, so no server rewrites
are needed). Set `REACT_APP_API_BASE_URL` to the production backend URL at build
time, and make sure the admin site's origin is included in the backend's
`CORS_ALLOWED_ORIGINS` env var.

## Notes / conventions

- A connection status of `accepted` is displayed as **"active (accepted)"** — the
  platform's stored value predates the PRD's naming.
- Suspending a user sets `is_suspended` and `is_active=False`, so the main app's
  login check rejects them; reinstating reverses both.
- Users with no login in 30 days count as **inactive/dormant** (see
  `adminpanel/utils.py INACTIVITY_DAYS`).
# afrivate_admin_frontend
