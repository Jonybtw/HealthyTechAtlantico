# HealthyTech Atlantico

Next.js school health platform for biometric tracking, fitness testing, guardian reporting, and student well-being workflows.

## Stack

- Next.js App Router
- NextAuth credentials auth
- Prisma + PostgreSQL
- `next-intl` for `pt` / `en`
- Serwist PWA support

## Roles

- `ADMIN`
  Full platform administration, staff management, audit log access, and school-wide views.
- `PROFESSOR`
  Student/class workflows, biometrics, tests, reports, guardians, and exemptions.
- `PSICOLOGO`
  SOS and questionnaire review workflows only.
- `PAIS`
  Read-only access to linked student data.
- `ALUNO`
  Self-service access to their own linked student profile only.

## Student model

Student profiles are no longer required to be the same thing as login accounts.

- `Student.linkedUserId`
  Optional one-to-one link to a student login.
- `Student.createdById`
  Staff/admin user who created the profile.
- Staff can create standalone student profiles without creating login accounts first.
- Self-registered student accounts remain valid user accounts, but they only gain self-service data access after being linked to a student profile.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
copy .env.example .env
```

3. Prepare the database:

- Fresh database:

```bash
psql -U postgres -d atlanticofit -f init.sql
```

- Existing database upgrade:

```bash
psql -U postgres -d atlanticofit -f prisma/migrations/20260306_security_hardening_step1/migration.sql
```

After verification, remove the legacy `students.user_id` column:

```bash
psql -U postgres -d atlanticofit -f prisma/migrations/20260306_security_hardening_step2_cleanup/migration.sql
```

4. Generate Prisma client and seed sample data if needed:

```bash
npx prisma generate
npx prisma db seed
```

5. Start the app:

```bash
npm run dev
```

## Admin bootstrap

The old HTTP bootstrap endpoint was removed. Use the local ops script instead.

- Promote an existing user:

```bash
npm run bootstrap:admin -- --email admin@school.pt
```

- Create a new admin:

```bash
npm run bootstrap:admin -- --email admin@school.pt --name "School Admin" --password "StrongPass123"
```

## Email reporting

- Server-side report emails are restricted to `ADMIN` and `PROFESSOR`.
- Reports can only be sent to guardians already linked to the student.
- Email content is rendered on the server; arbitrary HTML input is not accepted.
- Students and parents can still generate local PDFs.

## Notes

- `reset_and_init.sql` recreates the schema from scratch for local/dev reset flows.
- The active app lives in `next/`. The `old/` directory is legacy and not part of the current runtime.
