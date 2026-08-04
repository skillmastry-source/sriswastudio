# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

## Deploy failure alerts

`.github/workflows/deploy.yml` sends a WhatsApp alert to the owner when a VPS deploy fails (silent on success).

### Step 1 — Activate CallMeBot (one-time, free)

1. Open WhatsApp and send this message to **+34 644 57 61 48**:
   ```
   I allow callmebot to send me messages
   ```
2. You will receive an API key back (e.g. `123456`). Save it.

### Step 2 — Add secrets to the GitHub repo

Go to **github.com/skillmastry-source/sriswastudio → Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret name | Value |
|-------------|-------|
| `ALERT_WHATSAPP_TO` | Your WhatsApp number — 10-digit (e.g. `9876543210`) or with country code (e.g. `+919876543210`) |
| `CALLMEBOT_API_KEY` | The key you received from CallMeBot in step 1 |

Optional Twilio fallback (if you already have a Twilio account with a WhatsApp-enabled number):

| Secret name | Value |
|-------------|-------|
| `TWILIO_ACCOUNT_SID` | From Twilio console |
| `TWILIO_AUTH_TOKEN` | From Twilio console |
| `TWILIO_WHATSAPP_FROM` | Your Twilio WhatsApp number, e.g. `+14155238886` |

### Step 3 — Run the end-to-end test

1. In the GitHub repo, go to **Actions → "Deploy to VPS"**.
2. Click **Run workflow** (top-right of the runs table).
3. In the SSH step, the deploy will likely succeed or fail against the real VPS. To force a failure without touching production:
   - Open `.github/workflows/deploy.yml` in a temporary branch, replace the `script:` line with `exit 1`, push the branch, and trigger the workflow from that branch instead.
4. After the run fails, **check WhatsApp within ~2 minutes** for a message from CallMeBot containing the run URL.
5. If a message arrived → alert is working. Delete the test branch.
6. If no message → check the "Notify owner on WhatsApp" step logs in the failed run; they show which secrets were found and which API call failed.

### Status
- [ ] CallMeBot activated and API key obtained
- [ ] `ALERT_WHATSAPP_TO` secret set in GitHub repo
- [ ] `CALLMEBOT_API_KEY` secret set in GitHub repo
- [ ] End-to-end test run confirmed WhatsApp message received
