# HealthyTech Atlantico

HealthyTech Atlantico is a robust, full-stack Progressive Web Application (PWA) designed to manage and monitor the health, physical fitness, and psychological well-being of students. Designed with a premium aesthetic and modern architecture, this platform facilitates data tracking and reporting for schools, physical education teachers, psychologists, and administrators.

## 🚀 Features

- **Role-Based Access Control (RBAC):** Tailored dashboards and permissions for Administrators, Teachers (*Professor*), Psychologists (*Psicólogo*), Students (*Aluno*), and Parents (*Pais*).
- **Student Management & Biometrics:** Track height, weight, BMI, body fat percentage, and developmental percentiles (WHO standards).
- **Fitness & Psychological Evaluations:**
  - Standardized physical fitness tests.
  - Psychological state questionnaires (KIDMED, Self-concept, Self-esteem).
- **SOS Alert System:** Real-time alert system allowing teachers and staff to raise psychological/safety alerts for students, directly notifying the school psychologist.
- **Reporting & Auditing:** Generate and email PDF reports of student progress. Keep a secure audit log of all system actions.
- **PWA Optimized:** Fully installable as a Progressive Web App for offline capabilities and native-like mobile experience.

## 🛠️ Tech Stack

This project is built using modern, cutting-edge web technologies:

- **Framework:** [Next.js 16.2.1](https://nextjs.org/) (App Router, Server Components & Server Actions, Turbopack)
- **UI/UX:** [React 19](https://react.dev/), [TailwindCSS v4](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Database & ORM:** [PostgreSQL](https://www.postgresql.org/) managed by [Prisma ORM](https://www.prisma.io/)
- **Authentication:** [NextAuth.js (v5 Beta)](https://authjs.dev/) with Credentials and Role verification
- **Validation:** [Zod](https://zod.dev/) & React Hook Form
- **Data Fetching:** [@tanstack/react-query](https://tanstack.com/query/latest)
- **Charts & Visualization:** [Recharts](https://recharts.org/)
- **Testing:** [Vitest](https://vitest.dev/) & [@testing-library/react](https://testing-library.com/)

---

## 💻 Getting Started

### Prerequisites

- **Node.js:** v18+ (v22+ recommended)
- **Database:** A running PostgreSQL database instance.

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
Push the Prisma schema to your PostgreSQL database and generate the Prisma Client:

```bash
npx prisma db push
npx prisma generate
```

### 4. Seeding the Database
To populate the database with initial configurations, academic years, and the default administrator account:

```bash
npm run bootstrap:admin
```
*(Optionally run `npx tsx seed-sos.ts` or `prisma/seed.ts` if additional mocked data is required for development).*

### 5. Running the Application
Start the development server with Turbopack for ultra-fast compilation:

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🏗️ Project Structure

```text
├── src/
│   ├── app/              # Next.js App Router pages, APIs, and layouts
│   ├── components/       # Reusable React components (UI, Forms, Charts)
│   ├── hooks/            # Custom React hooks (e.g., use-queries)
│   ├── lib/              # Utility functions, Prisma instance, auth guards, RBAC
│   └── types/            # TypeScript type definitions
├── prisma/               # Prisma schema and seed scripts
├── public/               # Static assets, PWA manifests, icons
├── tests/                # Unit and Integration tests (Vitest)
├── scripts/              # Utility scripts for bootstrap & UI consistency
└── tailwind.config.ts    # TailwindCSS configuration
```

## 🧪 Testing
The project uses `vitest` for reliable and fast testing. To run the test suite:
```bash
npm run vitest
```
*(Or specify `npx vitest run` for a CI execution).*

## 📦 Building for Production

To create an optimized production build:
```bash
npm run build
```
Once the build concludes, start the production server:
```bash
npm run start
```

---
*Developed for HealthyTech Atlantico.*
