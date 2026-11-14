# Deploying the live demo

Everything here runs on free plans. No secret is ever written into the repository:
each one is pasted into the dashboard of the service that needs it.

| Piece | Service | Why |
|---|---|---|
| Django API | Render web service (free) | Sleeps when idle; the first visit after a pause is slow |
| React app | Render static site (free) | Plain files, always on |
| Database | Neon PostgreSQL (free) | Does not expire |
| Dish photos | Cloudinary (free) | The web host's disk is wiped on every deploy |
| Email | Brevo (free) | Sent over HTTPS, because the web host blocks SMTP |
| Daily jobs | GitHub Actions schedule | The web host has no free scheduler |

## Values to collect

| Name | Where it comes from |
|---|---|
| `DATABASE_URL` | Neon: project dashboard, "Connection string" (the pooled one) |
| `CLOUDINARY_URL` | Cloudinary: dashboard, "API environment variable" (starts with `cloudinary://`) |
| `BREVO_API_KEY` | Brevo: SMTP & API, "API keys" |
| `DEFAULT_FROM_EMAIL` | An address you have verified as a sender in Brevo |

## Render

1. Render dashboard: **New > Blueprint**, pick this repository. Render reads `render.yaml`
   and proposes two services, `bookmymeal-api` and `bookmymeal`.
2. Fill in the four values above when asked. Leave `FRONTEND_URL`,
   `CORS_ALLOWED_ORIGINS` and `VITE_API_URL` for the next step if the addresses
   are not known yet.
3. Once both services have an address:
   - on `bookmymeal-api` set `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` to the
     address of the React site, for example `https://bookmymeal.onrender.com`
     (no slash at the end);
   - on `bookmymeal` set `VITE_API_URL` to the API address followed by `/api/`,
     for example `https://bookmymeal-api.onrender.com/api/`;
   - redeploy both.

The API's build step migrates the database and runs `seed_demo`, so the demo
accounts exist as soon as the first deploy finishes.

## Daily jobs

`.github/workflows/demo-upkeep.yml` tops up the demo data and sends reminder
emails once a day. In the GitHub repository, under
**Settings > Secrets and variables > Actions**:

- Secrets: `DATABASE_URL`, `CLOUDINARY_URL`, `BREVO_API_KEY`, `DEFAULT_FROM_EMAIL`,
  and `DJANGO_SECRET_KEY` (any long random string).
- Variables: `FRONTEND_URL` (the React site's address) and `DEMO_UPKEEP` = `on`.

GitHub pauses scheduled workflows in a repository with no activity for 60 days;
it emails first, and one click re-enables them.

## Known limits of the free setup

- The API takes up to a minute to answer after it has been idle.
- Mail to the demo accounts (`@example.com`) is never sent. Register with a real
  address to see a password reset or reminder email arrive.
