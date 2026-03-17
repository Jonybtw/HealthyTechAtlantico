# HealthyTech Atlantico

Production-grade Next.js application for school health operations, including biometrics, fitness tests, SOS workflows, guardian reporting, and auditability.

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 App Router |
| Language | TypeScript 5 |
| Auth | Auth.js / next-auth v5 with JWT sessions |
| Data | Prisma 7 + PostgreSQL |
| Styling | Tailwind CSS v4 |
| i18n | next-intl (`pt`, `en`) |
| Testing | Vitest + Testing Library + Playwright |

## Role model

| Role | Scope |
| --- | --- |
| `ADMIN` | Full platform access, audit, staff management |
| `PROFESSOR` | Student operations, reports, guardians, class views, SOS inbox |
| `PSICOLOGO` | SOS inbox and questionnaire review |
| `PAIS` | Read-only access to linked students only |
| `ALUNO` | Self-service only for the linked student profile |

Important security rules:

- `ALUNO` and `PAIS` never access global SOS inbox data.
- Student-level routes are enforced with ownership / guardian linkage checks in `src/lib/student-access.ts`.
- Consent updates are pushed into the active JWT session through `useSession().update(...)`.

## Environment

Copy `.env.example` to `.env` and set the required values.

### Required variables

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
AUTH_SECRET="replace_with_a_strong_random_secret"
NEXTAUTH_SECRET="replace_with_a_strong_random_secret"
NEXTAUTH_URL="http://127.0.0.1:3000"
```

### Database TLS

SSL is environment-driven through `src/lib/database-ssl.ts`.

```env
PGSSLMODE="require"
PGSSL_REJECT_UNAUTHORIZED="true"
# Optional:
# DATABASE_SSL="disable"
# PGSSL_CA="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
```

Defaults:

- production enables certificate verification
- `PGSSLMODE=disable` or `DATABASE_SSL=disable` disables SSL
- `PGSSL_CA` / `DATABASE_CA_CERT` injects a custom CA bundle

### SMTP

```env
SMTP_HOST="smtp.office365.com"
SMTP_PORT=587
SMTP_USER="your_mailbox@yourdomain.pt"
SMTP_FROM="HealthyTech Atlantico <your_mailbox@yourdomain.pt>"
SMTP_AUTH_TYPE="login"
SMTP_PASS="your_mailbox_password_or_app_password"
```

OAuth2 is also supported through `SMTP_CLIENT_ID`, `SMTP_CLIENT_SECRET`, `SMTP_REFRESH_TOKEN`, and `SMTP_ACCESS_TOKEN`.

## Local development

```bash
npm install
copy .env.example .env
npm exec prisma generate
npx prisma db seed
npm run dev
```

Useful commands:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Health checks

`GET /api/health` validates process readiness and database connectivity.

Response shape:

```json
{
  "data": {
    "ok": true,
    "status": "ready",
    "services": {
      "database": "up"
    },
    "latencyMs": 8,
    "timestamp": "2026-03-10T12:00:00.000Z"
  }
}
```

When the database is unavailable, the endpoint returns `503` with `data.status: "degraded"`.

## Tests

Unit and component coverage lives under `next/tests/`.

```bash
npm test
npx playwright install chromium
npm run test:smoke
```

`npm run test:smoke` performs a fresh production build and boots the standalone server from `.next/standalone/server.js`.

Current automated coverage includes:

- RBAC rules and owner / guardian access checks
- SOS inbox protection for non-staff roles
- consent refresh in the profile flow
- authenticated shell navigation rendering
- public auth pages and protected-route smoke checks

## Docker

```bash
docker build -t healthytech-atlantico .
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e AUTH_SECRET="..." \
  -e NEXTAUTH_SECRET="..." \
  -e NEXTAUTH_URL="https://your-domain.com" \
  healthytech-atlantico
```

The Docker image:

- uses a multi-stage build
- generates Prisma Client during the build stage
- runs the standalone Next.js output
- uses a non-root runtime user

## CI

GitHub Actions runs:

1. Prisma Client generation
2. lint
3. type-check
4. Vitest suite
5. production build
6. Playwright smoke tests

## Notes

- Active application code lives in `next/`.
- `old/` is legacy archive code and should not track secrets or `node_modules`.
- Security headers are applied in `src/proxy.ts`.
- For multi-instance production rate limiting, replace the in-memory limiter in `src/proxy.ts` with Redis or another shared backend.
