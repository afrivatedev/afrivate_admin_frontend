# Code Style: Afrivate Admin Dashboard

Last updated: 26 November 2026

These rules describe how the code is written today. Follow them for new code. Do not rewrite working code just to match them.

## Stack

- React 18, built with Vite 6
- React Router v6 with `HashRouter`
- Tailwind CSS v3. Brand colour: `#6A00B1`.
- `lucide-react` for icons
- Native `fetch` through `src/api.js`. Do not add axios.

## Folder layout

```
src/
├── App.js              session check, route tree
├── index.js            entry point, fonts and global CSS
├── index.css           Tailwind base
├── api.js              every API call and session handling
├── components/
│   ├── Layout.js       sidebar, drawer, logout
│   └── ui.js           shared UI pieces (Card, Table, StatusBadge, buttons, date helpers)
└── pages/              one file per route
index.html              meta tags and the Content Security Policy (project root)
vite.config.js          build and dev-server settings
public/
├── logo.png
└── favicon.ico
```

## Components and pages

- Function components with hooks. No class components.
- Put reusable UI in `components/ui.js` (or a new file in `components/`). Do not copy a widget into two pages.
- Keep backend calls out of components where practical. Add a helper to `src/api.js` and use it from the page. Pages that already call `apiGet`, `apiSend` or `apiDownload` may keep doing so.
- Pass the signed-in admin through props from `App.js` (as `Layout` does). Do not read it from storage.

## Networking

- Always use `apiGet`, `apiSend`, `apiDownload` or `apiFetch` from `src/api.js`. Do not call `fetch` directly from a page.
- Never read, store or send a token in the browser. The session lives in cookies.
- Build query strings with `URLSearchParams`, for example `new URLSearchParams({ days })`.
- Encode route params before putting them in a path: `encodeURIComponent(id)`.
- Show loading, empty and error states for every request.

## Styling

- Use Tailwind classes. Avoid new CSS files unless Tailwind cannot do the job.
- Use the brand colour `#6A00B1` for primary actions.
- Keep the UI usable on phones first (the sidebar becomes a drawer below `md`).

## Naming

- Components and files that export a component: `PascalCase.js`.
- Helpers: `camelCase`.
- Route paths: lowercase with hyphens or plain words (`users`, `actions`).

## Assets

- Use lowercase names with hyphens and no spaces.
- Compress images before committing.
- Fonts are self-hosted with `@fontsource`. Do not add a `<link>` to a font CDN.

## Accessibility

- Every image needs `alt` text (empty `alt=""` only for decorative images).
- Every form field needs a label.
- Buttons need text a screen reader can read. Icon-only buttons need `aria-label`.

## Build and lint

- The build must pass before merging. Vite has no `CI=true` lint gate, so also check the build output for warnings.

```bash
npm run build
```

## Commits and pull requests

- Short, present-tense commit messages.
- One topic per pull request.
- Never commit `.env`, `build/` or `node_modules/`.
