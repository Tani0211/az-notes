# AZ Notes

An authenticated digital DSA notes library for students everywhere. It includes light and dark themes, phase and week organization, saved/revised progress, an owner-managed admin team, direct PDF uploads, Google Drive notes, usage analytics and a live online count.

The library contains only the author's digital lecture notes. Links embedded inside those PDFs continue to work.

## How the project works

The browser renders React pages from `app/` and reusable interface pieces from `components/`. API routes in `app/api/` enforce login and roles before reading or changing data.

- **Next.js on Vercel** runs the pages and API routes.
- **Google OAuth through Auth.js** verifies each user's identity and stores an encrypted session cookie.
- **Neon PostgreSQL** stores notes, members, reading progress, analytics, admins and the editable phase calendar.
- **Private Vercel Blob** stores uploaded PDFs. Files are uploaded directly from the browser, checked on the server and streamed only after login.
- Existing Google Drive PDFs remain subject to their Drive sharing settings.

The owner is `singhalrashmi0211@gmail.com`. The owner can grant or revoke admin access by email from the admin panel. These permissions are checked on every request.

## Phase calendar

Automatic phase assignment uses the original upload date:

| Phase | Dates                                | Course weeks |
| ----- | ------------------------------------ | ------------ |
| 0     | 31 May–27 June 2026                  | 1–4          |
| 1     | 5 July–1 August 2026                 | 5–8          |
| 2     | 9 August–5 September 2026            | 9–12         |
| 3–5   | Set later in Admin → Course calendar | —            |

Dates between those ranges are gap/test weeks and remain unassigned unless an admin overrides them.

## Local setup

Use Node.js 22 or later. Copy `.env.example` to `.env.local` and fill in the values. Never commit `.env.local`.

```text
npm install
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`. The local Google callback is `http://localhost:3000/api/auth/callback/google`.

## Production setup

The Vercel project needs these environment variables:

| Variable                | Purpose                                                              |
| ----------------------- | -------------------------------------------------------------------- |
| `DATABASE_URL`          | Neon pooled PostgreSQL connection, supplied by the integration       |
| `BLOB_READ_WRITE_TOKEN` | Private Vercel Blob access, supplied by the connected store          |
| `AUTH_SECRET`           | Random session-encryption secret                                     |
| `GOOGLE_CLIENT_ID`      | Google OAuth web client identifier                                   |
| `GOOGLE_CLIENT_SECRET`  | Google OAuth client secret                                           |
| `PUBLIC_ORIGIN`         | The production origin, such as `https://az-notes-tanishq.vercel.app` |

The production Google callback is:

```text
https://az-notes-tanishq.vercel.app/api/auth/callback/google
```

Run `npm run db:migrate` after connecting a new database. It applies checked migrations and imports the 20 digital notes once. Re-running it does not overwrite later admin edits.

## Useful commands

```text
npm run check
npm run test:calendar
npm run test:database
npm run test:security
npm run build
```

`npm run check` runs TypeScript and lint checks. The three focused tests validate phase boundaries, safe PostgreSQL query conversion and the important authentication/storage rules.

## A good first learning exercise

Change the subtitle in `components/library.tsx`, start `npm run dev`, and save the file. Next.js refreshes the page automatically. Then change one color variable near the top of `app/globals.css` and run `npm run check` before committing it.

Google setup reference: [Google OAuth web-server guide](https://developers.google.com/identity/protocols/oauth2/web-server). Storage reference: [Vercel private Blob documentation](https://vercel.com/docs/vercel-blob/private-storage).
