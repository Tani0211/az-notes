# B15 Notes

A digital-notes companion for AlgoZenith B15. This project is separate from the senior's reference site in the sibling `az-notes-master` folder.

## What is included

- Login before reading or downloading; ChatGPT sign-in is available on Sites. Google sign-in activates when its OAuth settings are supplied.
- Twenty digital-note entries imported from the supplied Sheet. No handwritten PDFs or links from its code column are included.
- Phases 0–5, search, topic/week filters, bookmarks, saved page numbers and revision progress.
- An admin publishing workspace with drafts, Google Drive links, PDF uploads (30 MB limit), optional links to your own code, and usage statistics.
- An owner account, `singhalrashmi0211@gmail.com`, which can grant and revoke admin access. Other admins cannot manage roles.
- An editable phase calendar. The original upload date suggests phase and course week. Dates in gaps or unscheduled periods require a manual choice. Existing records are not silently reassigned when the calendar changes.
- No AI tutor in this release, as agreed.

## Learn the project in this order

1. **Pages:** Open `app/page.tsx`, then `app/library/page.tsx`. A page chooses what to show and asks the server for data. The library requires an authenticated viewer before it loads notes.
2. **Components:** Open `components/library.tsx`. Components describe the interface and react to actions such as typing in search or clicking Save. Files starting with `'use client'` run interactive code in the browser.
3. **Styles:** Open `app/globals.css`. Variables such as `--surface` and `--text` give the whole interface consistent colors. Dark mode changes these variables.
4. **Server logic:** Open `lib/server.ts`. It checks the signed-in user, resolves roles and queries the database. Never grant admin access using a browser variable.
5. **API routes:** Open `app/api/notes/route.ts`. An API receives a request from the interface, validates it, checks authorization and saves or returns data. State-changing requests also check their origin.
6. **Database:** Open `db/schema.ts`. It defines tables: notes, members, reading state, events, admins and settings. Generated files in `drizzle/` are migrations: an ordered history of database structure changes.
7. **Files:** Read `app/api/upload/route.ts` and `app/api/notes/[id]/file/route.ts`. The database stores a file key; R2 stores PDF bytes. Protected routes stream files after checking login. Uploaded PDFs are not placed in the public assets folder.
8. **Deployment:** `npm run build` compiles the source into `dist/`. Sites deploys that build and connects its production database and file storage. Your local database is not uploaded.

## Run locally

Use Node.js 22.16 or later. Open a terminal inside this folder.

```powershell
npm install
npx wrangler d1 execute DB --local --file=drizzle/0000_bent_falcon.sql --config wrangler.local.json
npx wrangler d1 execute DB --local --file=drizzle/0001_cultured_wallflower.sql --config wrangler.local.json
npx wrangler d1 execute DB --local --file=drizzle/0002_clumsy_mandarin.sql --config wrangler.local.json
npx wrangler d1 execute DB --local --file=drizzle/0003_typical_maximus.sql --config wrangler.local.json
npm run dev
```

Run each migration once per new local database. On this computer they have already been applied. Open the URL printed by the development server. The Sites development plugin simulates sign-in as `seedy@sites.test`; this identity is not in production. Local database/files are under the ignored `.wrangler` folder. The owner email remains the real account in production.

## Checks

```powershell
npm run check
npm run test:calendar
npm run test:api
npm run build
```

The API test requires the development server and a clean local test database. Admin API integration tests are in `tests/check-api.mjs admin`; they require a temporary local admin grant and create disposable QA records. Do not run them against production. They test PDF upload and bytes/ranges, drafts, updates and permission checks.

## Activate Google sign-in

The Auth.js Google provider handles OAuth, CSRF, identity verification and encrypted session cookies. Only Google's verified email claim can sign in. Configure these runtime values in Sites, never in Git:

| Setting                | Purpose                                                    |
| ---------------------- | ---------------------------------------------------------- |
| `GOOGLE_CLIENT_ID`     | Identifies the Google OAuth web application                |
| `GOOGLE_CLIENT_SECRET` | Secret used by the server to complete Google sign-in       |
| `AUTH_SECRET`          | Random encryption secret for login sessions                |
| `PUBLIC_ORIGIN`        | `https://b15-notes-library.singhalrashmi0211.chatgpt.site` |

In Google Cloud, create or choose a project, configure Google Auth Platform branding and audience, and create an OAuth client of type **Web application**. Use the site origin above as an authorized JavaScript origin. Add this exact authorized redirect URI:

```text
https://b15-notes-library.singhalrashmi0211.chatgpt.site/api/auth/callback/google
```

If testing locally, add `http://localhost:3000` and `http://localhost:3000/api/auth/callback/google` too. While Google's app is in Testing, add intended test users in Google Auth Platform. Configure the appropriate production audience before inviting everyone. Follow Google's domain and verification requirements for the domain used.

For local OAuth testing only, copy `.env.example` to `.dev.vars` and fill in the settings. Do not commit that file. Production values are managed through Sites. A deployment is required after changing them. Before settings exist the Google button is explicitly unavailable; ChatGPT sign-in still works. Actual Google sign-in must be tested after credentials are configured.

References: [Google's web-server OAuth guide](https://developers.google.com/identity/protocols/oauth2/web-server), [Auth.js Google provider](https://authjs.dev/getting-started/providers/google).

## Limits to understand

- Drive links retain their existing Google sharing rules. A public Drive URL can be opened outside this website. Upload directly if you need the site's login checks on the stored copy.
- Online count means distinct signed-in accounts active in the last two minutes, refreshed about every 45 seconds while the page is visible.
- Lecture opens/download requests are deduplicated per user and lecture in five-minute windows. External Drive downloads are not included. Counts include admins.
- A saved page is manually entered; the browser's native PDF viewer does not report its current page to the app.
- Google and ChatGPT sign-ins have separate provider identities and reading histories. Use the same provider consistently.
- The optional WebMCP search tool is feature-detected. It is not required for the website and has not been verified in a supporting browser.

## A small first change to try

Change the library subtitle in `components/library.tsx`, save the file and watch the local preview update. This is hot reload. Next, adjust one color variable in `app/globals.css`. Run `npm run check` before deploying a change.
