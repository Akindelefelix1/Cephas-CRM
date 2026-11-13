# Cephas CRM UI

A responsive, TypeScript-first React UI based on the Cephas CRM software requirements document. This is a front-end preview with sample records; it does not connect to a CRM API, email/SMS provider, authentication service, or durable audit store.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`.

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
