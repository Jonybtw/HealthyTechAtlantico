# HealthyTech Atlantico

HealthyTech Atlantico is a robust, full-stack Progressive Web Application (PWA) designed to manage and monitor the health, physical fitness, and psychological well-being of students. Designed with a premium aesthetic and modern architecture, this platform facilitates data tracking and reporting for schools, physical education teachers, psychologists, and administrators.

## 🚀 Features

- **Role-Based Access Control (RBAC):** Tailored dashboards and permissions for Administrators, Teachers (*Professor*), Psychologists (*Psicólogo*), Students (*Aluno*), and Parents/Guardians (*Guardiões/Pais*).
- **Comprehensive Academic Tracking:**
  - **Classes (*Turmas*):** Manage school classes and assign students and teachers.
  - **Student Management:** Biometrics tracking powered by a specialized **Z-score engine (`zaf.ts`)** for precise WHO developmental percentile calculations (height, weight, BMI, body fat).
  - **Medical Dispensations:** Manage student medical dispensations from physical activities.
- **Fitness & Psychological Evaluations:**
  - Standardized physical fitness tests.
  - Psychological state questionnaires engine (KIDMED, Self-concept, Self-esteem).
  - Standardized clinical & physical protocols tracking.
- **SOS Alert System:** Real-time alert system allowing teachers and staff to raise psychological/safety alerts for students, directly notifying the school psychologist.
- **Data Export, Importing & Real-Time Stats:**
  - Generate and email PDF reports of student progress (using `jspdf` and `nodemailer`).
  - CSV data import and export tools via dedicated bulk import API endpoints.
  - Real-time/aggregated statistical dashboards utilizing dedicated stats APIs.
- **Internationalization (i18n):** Full multi-language support (English, Portuguese) using `next-intl`.
- **System Administration & Auditing:** Keep a secure audit log of all system actions.
- **Premium UX & Accessibility:** 
  - Installable PWA support in development.
  - Includes robust application shells: **Command Palette**, **Notification Center**, and specialized charts.
  - Full accessibility features like hotkey support, reduced motion, and Server-Side Rendered (SSR) Dark/Light theme persistence preferences.

## 🛠️ Tech Stack

This project is built using modern, cutting-edge web technologies:

- **Framework:** [Next.js 16.2.1](https://nextjs.org/) (App Router, Server Components & Server Actions)
- **UI/UX:** [React 19](https://react.dev/), [TailwindCSS v4](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Database & ORM:** [PostgreSQL](https://www.postgresql.org/) managed by [Prisma ORM](https://www.prisma.io/)
- **Authentication:** [NextAuth.js (v5 Beta)](https://authjs.dev/) with Credentials and Role verification
- **Validation:** [Zod](https://zod.dev/) & React Hook Form
- **Data Fetching:** [@tanstack/react-query](https://tanstack.com/query/latest)
- **Internationalization:** [next-intl](https://next-intl-docs.vercel.app/)
- **Charts & Visualization:** [Recharts](https://recharts.org/)
- **Testing:** [Vitest](https://vitest.dev/) & [@testing-library/react](https://testing-library.com/)
- **Deployment:** Docker & containerized deployment support.

---

## 💻 Getting Started

### Prerequisites

- **Node.js:** v18+ (v22+ recommended)
- **Database:** A running PostgreSQL database instance.
- **Docker:** (Optional) For containerized deployments.

### 1. Clone & Install
Clone the repository and install the dependencies:
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory (you can copy `.env.example` if available). Example setup:

```env
# Database connection string
DATABASE_URL="postgresql://user:password@localhost:5432/healthytech"

# Optional: Add Database SSL Cert if your Postgres requires secure connections
# DATABASE_SSL_CERT="path/to/cert"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key"

# Microsoft 365 report email delivery through the shared mailbox
M365_TENANT_ID="your-tenant-id"
M365_CLIENT_ID="your-app-client-id"
M365_CLIENT_SECRET="your-app-client-secret"
M365_SHARED_MAILBOX="Healthytec@colegioatlantico.pt"
```

For report emails, `Healthytec@colegioatlantico.pt` is treated as a Microsoft
365 shared mailbox. Configure the Entra app with Microsoft Graph application
permission `Mail.Send` and admin consent, then restrict mailbox access in
Exchange Online where appropriate. SMTP fallback is disabled by default; enable
`M365_REPORT_ALLOW_SMTP_FALLBACK="true"` only for a deliberate legacy setup.

### 3. Database Setup (Prisma)
Run Prisma migrations to set up your PostgreSQL database and generate the Prisma Client:

```bash
npx prisma migrate dev
```

### 4. Seeding the Database
To populate the database with initial configurations, academic years, and the default administrator account:

```bash
npm run bootstrap:admin
```
*(Optionally run `npx tsx prisma/seed.ts` if additional mocked data is required for development).*

### 5. Running the Application
Start the development server:

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. If configured, you may also intercept requests via the frontend `src/proxy.ts`.

---

## 🏗️ Project Structure

```text
├── messages/             # i18n translation dictionaries (en.json, pt.json)
├── prisma/               # Database schema (schema.prisma) and seed scripts
├── public/               # Static assets, PWA manifests, images, icons
├── scripts/              # Automated tasks (UI checks, Typegen, DB utilities)
├── src/
│   ├── app/              # Next.js App Router root
│   │   ├── (app)/        # Authenticated application domains
│   │   │   ├── acompanhamento/ # Ongoing student tracking views
│   │   │   ├── admin/    # System Administration
│   │   │   ├── alunos/   # Student Management
│   │   │   ├── analise/  # Analytical/Comparative health dashboards
│   │   │   ├── auditoria/# System event routing/logs tracking
│   │   │   ├── biometria/# Dedicated biometrics management
│   │   │   ├── dashboard/# Main user Dashboard overview
│   │   │   ├── dispensas/# Medical Dispensations
│   │   │   ├── guardioes/# Parent/Guardian portal
│   │   │   ├── perfil/   # User profile management
│   │   │   ├── protocolos/# Clinical and Physical Protocols
│   │   │   ├── questionarios/# Questionnaire engine interfaces
│   │   │   ├── relatorio/# Standalone reporting generation
│   │   │   ├── sos/      # Emergency SOS tracking
│   │   │   ├── testes/   # Fitness & Psychological Tests
│   │   │   └── turma/    # Class grouping management
│   │   ├── (auth)/       # Authentication pages (login/register)
│   │   └── api/          # Next.js REST API endpoints
│   │       ├── health/   # System health checks
│   │       ├── [domain]/ # Specific endpoints (auth, students, stats, etc.)
│   │       └── .../import# Bulk data import handlers
│   ├── components/       # Reusable React components (UI, Forms, Charts)
│   │   ├── app-shell.tsx # Core layout shells and providers
│   │   ├── command-palette.tsx # Global search palette feature
│   │   └── notification-center.tsx # Unified notification system
│   ├── hooks/            # Custom React hooks (hotkeys, hydration skips, etc.)
│   ├── i18n/             # next-intl configuration and localized routing setup
│   ├── lib/              # Core logic and internal systems
│   │   ├── zaf.ts        # Z-score/Anthropometric WHO calculation engine
│   │   ├── theme.ts      # SSR Theme persistence & cookie management
│   │   ├── email-rules.ts# Business logic coordinating targeted mail sequences
│   │   └── ...           # (Prisma instance, RBAC matrices, generic Utils)
│   ├── types/            # TypeScript ambient types and definitions
│   └── proxy.ts          # Core service proxy configuration wrapper
├── tests/                # Testing architecture using Vitest
│   ├── frontend/         # Component and App render tests
│   └── unit/             # Logic, Utilities, and API testing
├── Dockerfile            # Container configuration for production deployments
├── eslint.config.mjs     # Flat ESLint configuration
├── next.config.ts        # Next.js routing and PWA/plugin configuration
├── postcss.config.mjs    # PostCSS config (used by Tailwind v4)
├── prisma.config.ts      # Prisma runtime extensions/adapter config
├── tsconfig.json         # TypeScript configuration
└── vitest.config.ts      # Vitest testing configuration
```

## 🛠️ Developer Scripts

Several utility scripts are located in `scripts/` to help maintain the codebase:
- `npm run bootstrap:admin` / `npx tsx scripts/bootstrap-admin.ts`: Seeds the initial system admin.
- `npx tsx scripts/db-count.ts`: Connects to the Prisma client and provides quick database record population statistics.

## 🧪 Testing
The project uses `vitest` with a dual-layer strategy covering Frontend Components and Unit Logic separately. To run the test suite:
```bash
npx vitest run
```

## 📦 Building for Production

### Standard Build
To create an optimized production build:
```bash
npm run build
npm run start
```

### Docker Deployment
The application provides a ready-to-run `Dockerfile` for self-hosted containerization:
```bash
# Build the image
docker build -t healthytech-app .

# Run the container (Make sure to pass required .env bounds)
docker run -p 3000:3000 --env-file .env healthytech-app
```

---
*Developed for HealthyTech Atlantico.*
