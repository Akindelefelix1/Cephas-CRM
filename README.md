# Cephas CRM UI

A responsive, TypeScript-first React UI based on the Cephas CRM software requirements document. Email account creation, sign-in, session restoration, and sign-out use Neon Managed Better Auth. CRM records remain preview data held in the browser session; they are not yet connected to the CRM API or durable audit store.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`.

The local `.env.local` file needs `VITE_NEON_AUTH_URL` set to the branch's Neon Auth Base URL. To deploy the static site, set the same variable in the hosting provider's build environment. This is a public client URL; do not put `DATABASE_URL` or other server credentials in the Vite environment.

## Deploy to Render

This project is configured as a Render Static Site in `render.yaml`.

1. Push this project to a GitHub or GitLab repository. Include `package-lock.json` and `render.yaml`.
2. In Render, choose **New → Blueprint** and connect the repository.
3. Render reads `render.yaml`, runs `npm ci && npm run build`, and publishes `dist`.
4. When the deploy finishes, open the generated `onrender.com` URL. Render will redeploy when you push changes to the connected branch.

To configure the site manually instead, create a **Static Site** and use build command `npm ci && npm run build` and publish directory `dist`. Add a rewrite rule with source `/*` and destination `/index.html` for client-side navigation fallback.

Sample contact, campaign, and audience edits are held in the browser session, so they are not shared between visitors or devices and will not provide durable CRM storage.

## Included UI areas

- Dashboard with sample contact, campaign, delivery and engagement indicators
- Contacts with search, category and consent-status filters, sorting, selection, CSV export and add-contact flow
- CSV import with email validation, duplicate skipping and pending-by-default consent handling
- Static groups from selected contacts and dynamic audience drafts with editable filter conditions
- Email and SMS campaign lists, saved local drafts and submit-for-approval preview state
- Templates, scheduled campaigns and delivery/reporting views
- Settings for general workspace details, roles, consent/suppression and provider setup
- Scheduled campaign list/calendar views with cancel state shared with campaign lists
- Audit log that starts with sample rows and records this session's contact, campaign, audience, schedule, settings and export actions
- Lead management roadmap placeholder, matching the PRD's later-release scope

The displayed numbers, people and initial activity entries are illustrative sample data. UI actions are held in memory for the current session. Excel import, the drag-and-drop email editor, provider connections, real consent enforcement, server-side permissions and persistent audit events require backend implementation.
