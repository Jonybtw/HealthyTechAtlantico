# Manual Técnico — HealthyTech Atlântico

> **Versão do documento:** 1.0.0 — Junho 2026  
> **Audiência:** Programadores, Administradores de Sistemas, Integradores  
> **Idioma:** Português Europeu (PT-PT)

---

## Índice

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Stack Tecnológica](#3-stack-tecnológica)
4. [Estrutura de Pastas](#4-estrutura-de-pastas)
5. [Modelo de Dados](#5-modelo-de-dados)
6. [Autenticação e Autorização](#6-autenticação-e-autorização)
7. [Segurança](#7-segurança)
8. [API Routes](#8-api-routes)
9. [Questionários](#9-questionários)
10. [Sistema de Email](#10-sistema-de-email)
11. [Internacionalização (i18n)](#11-internacionalização-i18n)
12. [Geração de PDF e Relatórios](#12-geração-de-pdf-e-relatórios)
13. [Alertas SOS em Tempo Real](#13-alertas-sos-em-tempo-real)
14. [Variáveis de Ambiente](#14-variáveis-de-ambiente)
15. [Instalação e Configuração](#15-instalação-e-configuração)
16. [Scripts Disponíveis](#16-scripts-disponíveis)
17. [Testes](#17-testes)
18. [CI/CD](#18-cicd)
19. [Operação e Manutenção](#19-operação-e-manutenção)
20. [Resolução de Problemas Comuns](#20-resolução-de-problemas-comuns)
21. [Conformidade RGPD](#21-conformidade-rgpd)
22. [Glossário](#22-glossário)

---

## 1. Visão Geral do Projeto

O **HealthyTech Atlântico** é uma plataforma web de gestão de saúde e bem-estar estudantil desenvolvida para o Colégio Atlântico. A aplicação permite o registo, acompanhamento e análise de dados biométricos, resultados de testes físicos e questionários psicológicos de alunos, com um forte enfoque em privacidade (RGPD), segurança dos dados e comunicação entre os diferentes intervenientes do ecossistema escolar.

### Objectivos Principais

- **Registo biométrico** — altura, peso, IMC, percentagem de gordura e perímetro da cintura, classificados por zonas de referência.
- **Testes físicos** — registo de resultados de testes de aptidão física com unidades e classificações por zona.
- **Questionários psicológicos** — quatro instrumentos validados (AUTOCONCEITO, AUTOESTIMA, EMOCIONAL, KIDMED) com payloads encriptados em AES-256-GCM.
- **Alertas SOS** — mecanismo de alerta imediato para situações de risco psicológico, com stream em tempo real por SSE.
- **Relatórios** — geração de PDFs e envio por email para encarregados de educação e staff.
- **Multi-papel** — cinco perfis distintos (ADMIN, PROFESSOR, PSICÓLOGO, ALUNO, PAIS) com permissões granulares via RBAC.
- **Internacionalização** — interface disponível em Português (PT) e Inglês (EN).

> [!IMPORTANT]
> Esta plataforma processa dados de saúde de menores. Toda a equipa técnica deve estar familiarizada com as obrigações legais impostas pelo **RGPD** antes de aceder ou manipular dados de produção.

---

## 2. Arquitetura do Sistema

### 2.1 Diagrama de Arquitetura de Alto Nível

```mermaid
graph TB
    subgraph "Cliente (Browser)"
        UI["Next.js App Router (React 19)"]
    end

    subgraph "Servidor Next.js"
        MW["Middleware (proxy.ts)\nRate Limiting + Security Headers"]
        RSC["React Server Components\n(App Router)"]
        API["API Route Handlers\n(/api/*)"]
        AUTH["NextAuth v5\n(Credentials Provider)"]
        LIB["lib/\n(rbac, auth, crypto, validações)"]
    end

    subgraph "Base de Dados"
        PG["PostgreSQL"]
        PRISMA["Prisma ORM v7"]
    end

    subgraph "Serviços Externos"
        GRAPH["Microsoft Graph API\n(M365 / Office 365)"]
        SMTP["SMTP Fallback\n(smtp.office365.com)"]
    end

    UI -->|"HTTPS"| MW
    MW --> RSC
    MW --> API
    API --> AUTH
    API --> LIB
    RSC --> LIB
    LIB --> PRISMA
    PRISMA --> PG
    API -->|"Envio de emails"| GRAPH
    API -->|"Fallback"| SMTP
```

### 2.2 Fluxo de Pedido HTTP

```mermaid
sequenceDiagram
    participant C as Cliente
    participant MW as Middleware (proxy.ts)
    participant AUTH as NextAuth
    participant API as API Route Handler
    participant RBAC as lib/rbac.ts
    participant DB as Prisma + PostgreSQL

    C->>MW: HTTP Request
    MW->>MW: Verificar Rate Limit (por IP)
    MW->>MW: Injetar Security Headers
    MW->>AUTH: Verificar Sessão JWT
    AUTH-->>MW: Sessão válida / inválida
    MW->>API: Reencaminhar pedido autorizado
    API->>RBAC: hasPermission(role, permission)
    RBAC-->>API: true / false
    API->>DB: Query via Prisma
    DB-->>API: Dados
    API->>API: Validação Zod
    API-->>C: JSON Response
```

---

## 3. Stack Tecnológica

### 3.1 Dependências de Produção

| Pacote | Versão | Função |
|--------|--------|--------|
| `next` | 16.2.4 | Framework principal (App Router + Turbopack) |
| `react` / `react-dom` | 19 | Biblioteca de UI |
| `typescript` | 5 | Tipagem estática |
| `prisma` + `@prisma/client` | 7 | ORM e cliente de base de dados |
| `next-auth` | v5 (beta) | Autenticação (Credentials Provider) |
| `tailwindcss` | v4 | Framework CSS utilitário |
| `zod` | v4 | Validação de esquemas e parsing |
| `next-intl` | v4 | Internacionalização (PT + EN) |
| `@radix-ui/*` | — | Primitivos de acessibilidade UI |
| `recharts` | — | Gráficos e visualizações de dados |
| `sonner` | — | Sistema de notificações toast |
| `motion` | — | Animações (sucessor do Framer Motion) |
| `jspdf` | — | Geração de PDFs no lado do servidor |
| `bcryptjs` | — | Hashing seguro de passwords |
| `nodemailer` | — | Envio de email via SMTP |
| `@microsoft/microsoft-graph-client` | — | Integração com Microsoft 365 |

### 3.2 Dependências de Desenvolvimento e Teste

| Pacote | Versão | Função |
|--------|--------|--------|
| `vitest` | v4 | Framework de testes unitários |
| `@testing-library/react` | — | Testes de componentes React |
| `@playwright/test` | — | Testes E2E e capturas de ecrã |
| `eslint` | — | Linting de código |
| `prettier` | — | Formatação de código |

---

## 4. Estrutura de Pastas

```
HealthyTechAtlantico/
└── next/                          # Raiz da aplicação Next.js
    ├── messages/                  # Ficheiros de tradução
    │   ├── pt.json                # Traduções PT-PT (idioma principal)
    │   └── en.json                # Traduções EN
    ├── prisma/                    # Camada de persistência
    │   ├── schema.prisma          # Definição do modelo de dados
    │   ├── migrations/            # Migrações de base de dados
    │   └── seed.ts                # Script de seeding inicial
    ├── public/                    # Assets estáticos
    ├── scripts/                   # Scripts auxiliares Node.js
    │   ├── bootstrap-admin.ts     # Criação da conta ADMIN inicial
    │   └── backfill/              # Scripts de migração de dados
    ├── src/
    │   ├── app/
    │   │   ├── (app)/             # Rotas protegidas (requer sessão)
    │   │   │   ├── dashboard/
    │   │   │   ├── alunos/
    │   │   │   ├── turmas/
    │   │   │   ├── sos/
    │   │   │   ├── admin/
    │   │   │   └── perfil/
    │   │   ├── (auth)/            # Rotas públicas de autenticação
    │   │   │   ├── login/
    │   │   │   ├── registo/
    │   │   │   └── verificar/
    │   │   └── api/               # API Route Handlers
    │   │       ├── auth/
    │   │       ├── students/
    │   │       ├── classes/
    │   │       ├── admin/
    │   │       ├── sos/
    │   │       ├── stats/
    │   │       ├── audit/
    │   │       ├── tests/
    │   │       ├── users/
    │   │       ├── me/
    │   │       └── health/
    │   ├── components/            # Componentes React reutilizáveis
    │   │   ├── ui/                # Primitivos shadcn/ui
    │   │   ├── charts/            # Componentes Recharts
    │   │   ├── forms/             # Formulários com validação Zod
    │   │   └── layout/            # Sidebar, Header
    │   ├── hooks/                 # React Hooks partilhados
    │   └── lib/                   # Lógica de negócio
    │       ├── auth.ts
    │       ├── rbac.ts
    │       ├── crypto.ts
    │       ├── prisma.ts
    │       ├── validations/
    │       └── email/
    └── tests/
        ├── unit/
        └── frontend/
```

> [!NOTE]
> Os grupos de rotas entre parênteses — `(app)` e `(auth)` — são uma funcionalidade do Next.js App Router. Estes diretórios **não aparecem no URL**, servindo apenas para agrupar layouts e middleware de forma lógica.

---

## 5. Modelo de Dados

### 5.1 Diagrama Entidade-Relação

```mermaid
erDiagram
    User {
        String id PK
        String email
        String passwordHash
        Role role
        Boolean consentRgpd
        Boolean consentShare
        Boolean mustChangePassword
        DateTime emailVerified
    }

    Student {
        String id PK
        String linkedUserId FK
        String processNumber
        String name
        Sex sex
        DateTime birthDate
        Int age
        String schoolYear
        String className
        DateTime kidmedConsentAt
        DateTime archivedAt
    }

    Biometric {
        String id PK
        String sessionId FK
        Float heightM
        Float weightKg
        Float fatPct
        Float waistCm
        Float imc
        String imcZone
        String fatZone
        String waistZone
    }

    Test {
        String testId PK
        String sessionId FK
        Float valueNum
        String valueText
        String unit
        String zone
    }

    EvaluationSession {
        String id PK
        String studentId FK
        DateTime date
        String schoolYear
        String periodKey
    }

    Questionnaire {
        String id PK
        String studentId FK
        QuestionnaireType type
        String instrumentVersion
        String schoolYear
        String periodKey
        Float score
        QuestionnaireClassification classification
        Json payload
        String payloadEncrypted
        Int deferredCount
    }

    SosAlert {
        String id PK
        String studentId FK
        String psych
        String teacher
        String psychEmail
        String teacherEmail
        Boolean resolved
        DateTime resolvedAt
        String resolvedById FK
    }

    Report {
        String id PK
        String studentId FK
        String title
        String emailedTo
        String schoolYear
    }

    Exemption {
        String id PK
        String studentId FK
        String reason
        DateTime startDate
        DateTime endDate
        String medicalCertificate
    }

    StudentGuardian {
        String studentId FK
        String guardianUserId FK
        String relationship
    }

    AuditLog {
        String id PK
        String userId FK
        String action
        String targetId
        String ipAddress
        DateTime createdAt
    }

    AcademicYear {
        String id PK
        String label
        Boolean isCurrent
    }

    SchoolClass {
        String id PK
        String academicYearId FK
        String name
        String year
    }

    User ||--o{ Student : "linkedUserId"
    Student ||--o{ EvaluationSession : "studentId"
    EvaluationSession ||--o| Biometric : "sessionId"
    EvaluationSession ||--o{ Test : "sessionId"
    Student ||--o{ Questionnaire : "studentId"
    Student ||--o{ SosAlert : "studentId"
    Student ||--o{ Report : "studentId"
    Student ||--o{ Exemption : "studentId"
    Student ||--o{ StudentGuardian : "studentId"
    User ||--o{ StudentGuardian : "guardianUserId"
    User ||--o{ AuditLog : "userId"
    AcademicYear ||--o{ SchoolClass : "academicYearId"
```

### 5.2 Enumerações

| Enum | Valores | Descrição |
|------|---------|----------|
| `Role` | `ADMIN`, `ALUNO`, `PROFESSOR`, `PSICOLOGO`, `PAIS` | Papel do utilizador no sistema |
| `Sex` | `M`, `F` | Sexo biológico do aluno |
| `QuestionnaireType` | `AUTOCONCEITO`, `AUTOESTIMA`, `EMOCIONAL`, `KIDMED` | Tipo de instrumento |
| `QuestionnaireClassification` | `OPTIMAL`, `AVERAGE`, `VERY_LOW` | Resultado da classificação |

### 5.3 Modelos Detalhados

#### User

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | `String` | UUID gerado automaticamente |
| `email` | `String` | Único, identificador de login |
| `passwordHash` | `String` | Hash bcrypt da password |
| `role` | `Role` | Papel no sistema |
| `consentRgpd` | `Boolean` | Consentimento RGPD explícito |
| `consentShare` | `Boolean` | Consentimento de partilha |
| `mustChangePassword` | `Boolean` | Força mudança de password no próximo login |
| `emailVerified` | `DateTime?` | Timestamp de verificação |

#### Student

| Campo | Tipo | Notas |
|-------|------|-------|
| `processNumber` | `String` | Número de processo escolar, único |
| `schoolYear` | `String` | Ano letivo (ex.: `2025/2026`) |
| `className` | `String` | Turma (ex.: `10ºA`) |
| `kidmedConsentAt` | `DateTime?` | Data do consentimento parental para KIDMED |
| `archivedAt` | `DateTime?` | Data de arquivo (soft-delete) |

#### EvaluationSession

Agrupa medições biométricas e testes físicos realizados na mesma sessão/data, identificados por `schoolYear` e `periodKey`.

#### Questionnaire

| Campo | Tipo | Notas |
|-------|------|-------|
| `payload` | `Json?` | Payload legacy não-encriptado (deprecated) |
| `payloadEncrypted` | `String?` | Payload encriptado AES-256-GCM (`IV:AuthTag:Cifrado`) |
| `deferredCount` | `Int` | Número de vezes deferido (máximo: 3) |

#### SosAlert

Registo de alerta de risco psicológico. Inclui snapshots dos contactos do psicólogo e professor no momento do alerta para preservação histórica.

#### AuditLog

Registo imutável de ações sensíveis. Inclui `ipAddress` para rastreabilidade forense.

---

## 6. Autenticação e Autorização

### 6.1 NextAuth v5 — Credentials Provider

A autenticação é gerida pelo **NextAuth v5 (beta)** com o `CredentialsProvider`.

```mermaid
sequenceDiagram
    participant U as Utilizador
    participant NX as NextAuth /api/auth/signin
    participant DB as PostgreSQL (via Prisma)

    U->>NX: POST {email, password}
    NX->>DB: findUnique({where: {email}})
    DB-->>NX: User record
    NX->>NX: bcryptjs.compare(password, passwordHash)
    alt Password válida
        NX->>NX: Verificar emailVerified
        NX->>NX: Verificar consentRgpd
        NX-->>U: JWT Session Cookie (httpOnly, Secure)
    else Password inválida
        NX-->>U: 401 Unauthorized
    end
```

**Notas de implementação (`src/lib/auth.ts`):**

- O JWT inclui `id`, `role`, `email` e `mustChangePassword`.
- Se `mustChangePassword === true`, o middleware redireciona para `/change-password`.
- A sessão é mantida via **JWT** (sem sessões de base de dados).

> [!WARNING]
> A variável `AUTH_SECRET` deve ser gerada aleatoriamente e nunca reutilizada entre ambientes. Uma fuga desta chave compromete **todas** as sessões ativas do sistema.

### 6.2 RBAC — Controlo de Acesso Baseado em Papéis

O ficheiro `src/lib/rbac.ts` define um mapa estático de permissões por papel.

#### Tabela de Permissões por Papel

| Permissão | ADMIN | PROFESSOR | PSICOLOGO | ALUNO | PAIS |
|-----------|:-----:|:---------:|:---------:|:-----:|:----:|
| `CREATE_STUDENT` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `UPDATE_STUDENT` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `LIST_STUDENTS` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `READ_STUDENT_PROFILE` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `RECORD_BIOMETRICS` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `READ_BIOMETRICS` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `RECORD_TESTS` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `READ_TESTS` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `SUBMIT_QUESTIONNAIRES` | ✅ | ❌ | ❌ | ✅ | ❌ |
| `READ_QUESTIONNAIRES` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `TRIGGER_SOS` | ✅ | ❌ | ❌ | ✅ | ❌ |
| `READ_SOS` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `SEND_REPORTS` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `READ_REPORTS` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `MANAGE_EXEMPTIONS` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `READ_CLASS_REPORTS` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `MANAGE_GUARDIANS` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `READ_LINKED_STUDENTS` | ✅ | ❌ | ❌ | ❌ | ✅ |
| `MANAGE_STAFF` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `READ_AUDIT` | ✅ | ❌ | ❌ | ❌ | ❌ |

> [!NOTE]
> O papel **ADMIN** tem todas as permissões do sistema. Recomenda-se que seja usada apenas para configuração inicial e manutenção.

---

## 7. Segurança

### 7.1 Encriptação de Dados em Repouso

Os payloads dos questionários são encriptados com **AES-256-GCM** antes de serem persistidos.

**Formato:** `<IV base64>:<AuthTag base64>:<Texto Cifrado base64>`

```bash
# Gerar uma chave de 32 bytes segura:
openssl rand -hex 32 | head -c 32
```

> [!CAUTION]
> A variável `ENCRYPTION_KEY` **deve ter exatamente 32 bytes**. O sistema implementa **fail-closed**: se a chave estiver ausente ou incorreta em produção, a aplicação **recusa iniciar**. Nunca commitar esta chave em repositórios.

> [!WARNING]
> A perda da `ENCRYPTION_KEY` resulta na **perda irreversível** de todos os payloads de questionários. Esta chave deve ser armazenada num gestor de segredos (HashiCorp Vault, Azure Key Vault).

### 7.2 Rate Limiting

O middleware `proxy.ts` implementa rate limiting por IP com limpeza automática quando o store ultrapassa 5000 entradas.

| Endpoint / Categoria | Limite | Janela |
|---------------------|--------|--------|
| `POST /api/auth/signin` | 8 pedidos | 15 minutos |
| `POST /api/auth/change-password` | 8 pedidos | 15 minutos |
| `POST /api/students/import` | 10 pedidos | 1 hora |
| `POST /api/classes/import` | 10 pedidos | 1 hora |
| `POST /api/tests/import` | 10 pedidos | 1 hora |
| `POST /api/students/[id]/sos` | 5 pedidos | 5 minutos |
| API em geral | 120 pedidos | 1 minuto |

### 7.3 Security Headers HTTP

| Header | Valor | Propósito |
|--------|-------|----------|
| `X-Frame-Options` | `DENY` | Prevenir clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevenir MIME sniffing |
| `X-Permitted-Cross-Domain-Policies` | `none` | Bloquear acesso cross-domain |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controlar Referer |
| `Permissions-Policy` | Restritivo | Desativar APIs não necessárias |
| `X-DNS-Prefetch-Control` | `off` | Prevenir DNS prefetching |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolar contexto de browsing |
| `Cross-Origin-Resource-Policy` | `same-origin` | Restringir carregamento cross-origin |
| `Content-Security-Policy` | Completo | Prevenir XSS |

### 7.4 HSTS

O cabeçalho `Strict-Transport-Security` é injetado **apenas em produção e sobre HTTPS**:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## 8. API Routes

Todos os endpoints requerem autenticação via JWT, exceto `/api/auth/*` e `/api/health`.

### 8.1 Autenticação

| Método | Endpoint | Descrição | Acesso |
|--------|----------|-----------|--------|
| `POST` | `/api/auth/signin` | Login com email e password | Público |
| `POST` | `/api/auth/register` | Registo público (ALUNO / PAIS) | Público |
| `POST` | `/api/auth/register/student` | Registo de aluno por staff | PROFESSOR, ADMIN |
| `POST` | `/api/auth/register/guardian` | Registo de encarregado | PROFESSOR, ADMIN |
| `GET` | `/api/auth/verify-email` | Verificar token de email | Público |
| `POST` | `/api/auth/verify-email` | Reenviar verificação | Autenticado |
| `POST` | `/api/auth/change-password` | Alterar password | Autenticado |

### 8.2 Alunos

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|----------|
| `GET` | `/api/students` | Listar alunos | `LIST_STUDENTS` |
| `POST` | `/api/students` | Criar aluno | `CREATE_STUDENT` |
| `GET` | `/api/students/[id]` | Perfil do aluno | `READ_STUDENT_PROFILE` |
| `PUT` | `/api/students/[id]` | Atualizar aluno | `UPDATE_STUDENT` |
| `GET` | `/api/students/[id]/biometrics` | Listar biometria | `READ_BIOMETRICS` |
| `POST` | `/api/students/[id]/biometrics` | Registar biometria | `RECORD_BIOMETRICS` |
| `GET` | `/api/students/[id]/tests` | Listar testes | `READ_TESTS` |
| `POST` | `/api/students/[id]/tests` | Registar teste | `RECORD_TESTS` |
| `GET` | `/api/students/[id]/questionnaires` | Listar questionários | `READ_QUESTIONNAIRES` |
| `POST` | `/api/students/[id]/questionnaires` | Submeter questionário | `SUBMIT_QUESTIONNAIRES` |
| `GET` | `/api/students/[id]/reports/email` | Listar relatórios | `READ_REPORTS` |
| `POST` | `/api/students/[id]/reports/email` | Enviar relatório PDF | `SEND_REPORTS` |
| `GET` | `/api/students/[id]/sos` | Alertas SOS do aluno | `READ_SOS` |
| `POST` | `/api/students/[id]/sos` | Criar alerta SOS | `TRIGGER_SOS` |
| `GET` | `/api/students/[id]/dispensas` | Listar dispensas | `MANAGE_EXEMPTIONS` |
| `POST` | `/api/students/[id]/dispensas` | Registar dispensa | `MANAGE_EXEMPTIONS` |
| `GET` | `/api/students/[id]/guardians` | Listar encarregados | `MANAGE_GUARDIANS` |
| `POST` | `/api/students/[id]/guardians` | Associar encarregado | `MANAGE_GUARDIANS` |
| `POST` | `/api/students/import` | Importar alunos em lote | `CREATE_STUDENT` |
| `POST` | `/api/students/import/preview` | Pré-visualizar importação | `CREATE_STUDENT` |

### 8.3 Turmas

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|----------|
| `GET` | `/api/classes` | Listar turmas | `READ_CLASS_REPORTS` |
| `POST` | `/api/classes` | Criar turma | `MANAGE_STAFF` |
| `POST` | `/api/classes/import` | Importar turmas | `MANAGE_STAFF` |
| `GET` | `/api/classes/report` | Relatório de turma | `READ_CLASS_REPORTS` |
| `POST` | `/api/classes/reports/email` | Enviar relatório por email | `SEND_REPORTS` |

### 8.4 Administração

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|----------|
| `GET` | `/api/admin/staff` | Listar staff | `MANAGE_STAFF` |
| `POST` | `/api/admin/staff` | Criar conta de staff | `MANAGE_STAFF` |
| `GET` | `/api/admin/users` | Listar utilizadores | `MANAGE_STAFF` |
| `POST` | `/api/admin/users/[id]/force-reset-password` | Forçar reset | `MANAGE_STAFF` |

### 8.5 Alertas SOS

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|----------|
| `GET` | `/api/sos/stream` | SSE stream em tempo real | `READ_SOS` |
| `PATCH` | `/api/sos/[alertId]` | Resolver alerta | `READ_SOS` |
| `GET` | `/api/me/sos` | Alertas do utilizador atual | Autenticado |

> [!NOTE]
> O endpoint `/api/sos/stream` usa **Server-Sent Events (SSE)**. A ligação é mantida aberta e as atualizações são enviadas em tempo real. O cliente deve tratar a reconexão automática.

### 8.6 Estatísticas e Auditoria

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|----------|
| `GET` | `/api/stats/summary` | Resumo estatístico | ADMIN, PROFESSOR |
| `GET` | `/api/stats/sos-alerts` | Alertas SOS paginados | `READ_SOS` |
| `GET` | `/api/audit` | Log de auditoria paginado | `READ_AUDIT` |

### 8.7 Outros Endpoints

| Método | Endpoint | Descrição | Acesso |
|--------|----------|-----------|--------|
| `GET` | `/api/health` | Health check | Público |
| `GET` | `/api/users/me` | Perfil do utilizador | Autenticado |
| `PATCH` | `/api/users/me` | Atualizar perfil | Autenticado |
| `PATCH` | `/api/users/me/password` | Alterar password | Autenticado |
| `POST` | `/api/tests/import` | Importar testes em lote | `RECORD_TESTS` |
| `POST` | `/api/tests/import/preview` | Pré-visualizar importação | `RECORD_TESTS` |

---

## 9. Questionários

### 9.1 Tipos e Classificações

#### AUTOCONCEITO
Avalia a perceção que o aluno tem de si próprio em diferentes domínios (académico, social, físico).

#### AUTOESTIMA
Mede o nível global de autoestima do aluno com escalas de Likert validadas.

#### EMOCIONAL
Avalia competências emocionais e regulação afetiva.

#### KIDMED — Índice de Qualidade da Dieta Mediterrânica

| Classificação | Score | Descrição |
|--------------|-------|----------|
| `OPTIMAL` | ≥ 8 | Dieta óptima / Boa adesão mediterrânica |
| `AVERAGE` | 4 – 7 | Dieta média / Necessita melhoria |
| `VERY_LOW` | < 4 | Dieta muito má / Intervenção recomendada |

> [!IMPORTANT]
> O questionário **KIDMED** requer **consentimento parental explícito** registado em `Student.kidmedConsentAt`. A API valida este campo e rejeita submissões sem consentimento. Versão: `KIDMED_2019`.

### 9.2 Periocidade e `periodKey`

Formato: `<AnoLetivo>:<Período>`

```
2025/2026:P1   → Setembro a Novembro
2025/2026:P2   → Dezembro a Março
2025/2026:P3   → Abril a Junho
```

| Período | Meses | Código |
|---------|-------|--------|
| P1 | Setembro – Novembro | `P1` |
| P2 | Dezembro – Março | `P2` |
| P3 | Abril – Junho | `P3` |

### 9.3 Deferimento

Limite máximo de **3 deferrimentos por instrumento por período** (`deferredCount`).

```mermaid
stateDiagram-v2
    [*] --> Pendente
    Pendente --> Deferido : Aluno difere (deferredCount < 3)
    Deferido --> Pendente : Período seguinte
    Pendente --> Submetido : Aluno responde
    Deferido --> Bloqueado : deferredCount == 3
    Bloqueado --> Submetido : Obrigado a responder
    Submetido --> [*]
```

### 9.4 Encriptação do Payload

```typescript
// Pseudo-código (src/lib/crypto.ts)
function encryptPayload(data: object): string {
  const iv = crypto.randomBytes(12);          // 96 bits
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    Buffer.from(ENCRYPTION_KEY),              // 32 bytes
    iv
  );
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data), 'utf8'),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();        // 16 bytes
  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64')
  ].join(':');
}
```

---

## 10. Sistema de Email

### 10.1 Microsoft Graph API (Primário)

```mermaid
graph LR
    APP["Aplicação HealthyTech"] -->|"OAuth 2.0 Client Credentials"| AAD["Azure AD"]
    AAD -->|"Access Token"| APP
    APP -->|"POST /v1.0/users/{from}/sendMail"| GRAPH["Microsoft Graph API"]
    GRAPH -->|"Exchange Online"| DEST["Destinatário"]
```

| Variável | Descrição |
|----------|----------|
| `M365_TENANT_ID` | ID do tenant do Azure AD |
| `M365_CLIENT_ID` | ID da aplicação no Azure AD |
| `M365_CLIENT_SECRET` | Segredo da aplicação |
| `M365_REPORT_FROM` | Endereço de envio |
| `M365_SHARED_MAILBOX` | Mailbox partilhada |

**Configuração no Azure Portal:**
1. Registar nova aplicação em Azure AD.
2. Adicionar permissão `Microsoft Graph > Mail.Send`.
3. Conceder **consentimento de administrador**.
4. Criar segredo de cliente.
5. Copiar IDs para as variáveis de ambiente.

### 10.2 SMTP Fallback

| Variável | Padrão | Descrição |
|----------|--------|----------|
| `SMTP_HOST` | `smtp.office365.com` | Servidor SMTP |
| `SMTP_PORT` | `587` | Porta SMTP (STARTTLS) |
| `SMTP_USER` | — | Utilizador SMTP |
| `SMTP_PASS` | — | Password SMTP |
| `SMTP_FROM` | — | Endereço de envio |
| `SMTP_AUTH_TYPE` | `login` | Tipo de autenticação (`login` ou `oauth2`) |

---

## 11. Internacionalização (i18n)

Gerida pelo **next-intl v4** com dois idiomas: PT-PT (padrão) e EN.

| Idioma | Código | Ficheiro |
|--------|--------|----------|
| Português (PT-PT) | `pt` | `messages/pt.json` |
| Inglês | `en` | `messages/en.json` |

```
/pt/dashboard    → Interface em Português
/en/dashboard    → Interface em Inglês
```

```typescript
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('students');
  return <h1>{t('title')}</h1>;
}
```

---

## 12. Geração de PDF e Relatórios

```mermaid
sequenceDiagram
    participant PROF as Professor
    participant API as POST /api/students/[id]/reports/email
    participant PDF as jsPDF
    participant EMAIL as lib/email

    PROF->>API: Solicitar relatório
    API->>API: Verificar permissão SEND_REPORTS
    API->>API: Agregar dados do aluno
    API->>PDF: Gerar documento PDF
    PDF-->>API: Buffer PDF
    API->>EMAIL: Enviar PDF (M365 / SMTP)
    EMAIL-->>API: Confirmação
    API->>API: Registar Report na BD
    API-->>PROF: 200 OK
```

Os relatórios enviados são registados em `Report` com `emailedTo`, `title` e `schoolYear`.

---

## 13. Alertas SOS em Tempo Real

```mermaid
sequenceDiagram
    participant ALU as Aluno
    participant API as POST /api/students/[id]/sos
    participant DB as PostgreSQL
    participant SSE as GET /api/sos/stream
    participant PSYCH as Psicólogo

    ALU->>API: Acionar SOS
    API->>API: Rate limit (5/5min)
    API->>DB: Criar SosAlert
    API->>API: Notificar por email
    API-->>ALU: 201 Created
    DB-->>SSE: Novo registo
    SSE-->>PSYCH: event: sos-alert
    PSYCH->>API: PATCH resolver alerta
    API->>DB: resolvedAt, resolvedById
```

### Campos do `SosAlert`

| Campo | Descrição |
|-------|----------|
| `psych` | Nome do psicólogo (snapshot histórico) |
| `teacher` | Nome do professor (snapshot histórico) |
| `psychEmail` | Email do psicólogo (snapshot histórico) |
| `teacherEmail` | Email do professor (snapshot histórico) |
| `resolved` | Alerta resolvido? |
| `resolvedAt` | Timestamp de resolução |
| `resolvedById` | Quem resolveu |

> [!IMPORTANT]
> Os campos de snapshot preservam os contactos no momento do alerta, garantindo histórico mesmo que o staff mude.

---

## 14. Variáveis de Ambiente

```bash
# BASE DE DADOS
DATABASE_URL="postgresql://user:password@localhost:5432/healthytech?schema=public"

# AUTENTICAÇÃO (NextAuth v5)
# Gerar com: openssl rand -base64 32
AUTH_SECRET="<segredo-aleatorio-256-bits>"
JWT_SECRET="<segredo-jwt>"

# ENCRIPTAÇÃO (AES-256-GCM) — exatamente 32 bytes
# Gerar com: openssl rand -hex 32 | head -c 32
ENCRYPTION_KEY="<32-bytes-exatos>"

# EMAIL — Microsoft Graph API (primário)
M365_TENANT_ID="<tenant-id>"
M365_CLIENT_ID="<client-id>"
M365_CLIENT_SECRET="<client-secret>"
M365_REPORT_FROM="HealthyTech@colegioatlantico.pt"
M365_SHARED_MAILBOX="HealthyTech@colegioatlantico.pt"

# EMAIL — SMTP (fallback)
SMTP_HOST="smtp.office365.com"
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM=""
SMTP_AUTH_TYPE="login"
```

> [!CAUTION]
> **Nunca** commitar `.env` ou `.env.local` no Git. Em CI/CD, usar **secrets** do repositório.

### Variáveis Obrigatórias em Produção

| Variável | Crítica | Motivo |
|----------|:-------:|--------|
| `DATABASE_URL` | ✅ | Sem BD, a aplicação não inicia |
| `AUTH_SECRET` | ✅ | Sessions inválidas sem segredo |
| `ENCRYPTION_KEY` | ✅ | Fail-closed: recusa iniciar se ausente |
| `M365_TENANT_ID` | ⚠️ | Necessário para M365 |
| `M365_CLIENT_ID` | ⚠️ | Necessário para M365 |
| `M365_CLIENT_SECRET` | ⚠️ | Necessário para M365 |

---

## 15. Instalação e Configuração

### 15.1 Pré-requisitos

| Requisito | Versão | Notas |
|-----------|--------|-------|
| Node.js | 20 LTS | Recomenda-se 22 LTS |
| npm | 10+ | Incluído com Node.js 20+ |
| PostgreSQL | 15+ | Local, Docker ou gerido |
| Git | 2.x | Para clonar o repositório |

### 15.2 Instalação em Desenvolvimento

```bash
git clone <url-do-repositorio>
cd HealthyTechAtlantico/next/
npm install
cp .env.example .env.local
# Editar .env.local
npx prisma generate
npx prisma migrate dev
npm run bootstrap:admin
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`.

### 15.3 Instalação em Produção

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start
```

> [!IMPORTANT]
> Em produção, usar **sempre** `prisma migrate deploy` (não `migrate dev`).

#### Docker (Exemplo)

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY next/package*.json ./
RUN npm ci
COPY next/ .
RUN npx prisma generate && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 16. Scripts Disponíveis

| Comando | Descrição |
|---------|----------|
| `npm run dev` | Servidor de desenvolvimento (Turbopack + hot-reload) |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção |
| `npm run start:standalone` | Modo standalone |
| `npm test` | Vitest (unit + frontend) |
| `npm run typecheck` | TypeScript + Prisma + next typegen |
| `npm run bootstrap:admin` | Criar/atualizar conta ADMIN inicial |
| `npm run screenshots` | Playwright (E2E + capturas) |

> [!WARNING]
> O `bootstrap:admin` define `mustChangePassword: true`. Alterar a password ADMIN no primeiro login.

---

## 17. Testes

### 17.1 Testes Unitários — Vitest

```bash
npm test
npx vitest --watch
npx vitest --coverage
npx vitest tests/unit/rbac.test.ts
```

### 17.2 Testes de Frontend — React Testing Library

```bash
npx vitest --project frontend
```

### 17.3 Testes E2E — Playwright

```bash
npm run screenshots
npx playwright test --ui
npx playwright test --headed
```

> [!NOTE]
> Os testes Playwright requerem um servidor a correr. Verificar `baseURL` em `playwright.config.ts`.

---

## 18. CI/CD

### 18.1 Pipeline de Testes (`ci.yml`)

Acionado em **push** e **pull requests** para a branch `dev`.

```mermaid
graph LR
    PUSH["Push / PR para dev"] --> INSTALL["npm ci"]
    INSTALL --> TYPECHECK["npm run typecheck"]
    TYPECHECK --> TEST["npm test"]
    TEST --> RESULT{Passou?}
    RESULT -->|Sim| OK["CI passou"]
    RESULT -->|Não| FAIL["Bloqueia merge"]
```

| Secret GitHub | Descrição |
|--------------|----------|
| `DATABASE_URL` | BD de teste |
| `AUTH_SECRET` | Segredo NextAuth |
| `ENCRYPTION_KEY` | Chave 32 bytes — crítico |

> [!CAUTION]
> Injetar `ENCRYPTION_KEY` como secret do repositório (`Settings > Secrets > Actions`). Nunca em ficheiros `.yml`.

### 18.2 Análise de Segurança (`codeql.yml`)

Execução automática de **GitHub CodeQL** para detetar vulnerabilidades (XSS, SSRF, injeção, etc.).

---

## 19. Operação e Manutenção

### 19.1 Health Check

```bash
curl https://healthytech.colegioatlantico.pt/api/health
# {"status": "ok", "database": "connected", "timestamp": "..."}
```

### 19.2 Log de Auditoria

```bash
curl -H "Cookie: authjs.session-token=..." \
  https://healthytech.colegioatlantico.pt/api/audit?page=1&limit=50
```

```sql
-- Últimas 100 ações de um utilizador
SELECT al.*, u.email FROM "AuditLog" al
JOIN "User" u ON al."userId" = u.id
WHERE al."userId" = '<user-id>'
ORDER BY al."createdAt" DESC LIMIT 100;
```

### 19.3 Backup da Base de Dados

```bash
# Backup
pg_dump -h localhost -U postgres -d healthytech \
  -F c -f backup_$(date +%Y%m%d_%H%M%S).dump

# Restauro
pg_restore -h localhost -U postgres -d healthytech backup.dump
```

> [!IMPORTANT]
> Backups contêm dados de saúde. Armazenar de forma segura e separada da `ENCRYPTION_KEY`.

### 19.4 Rotação de Chaves de Encriptação

1. Gerar nova chave: `openssl rand -hex 32 | head -c 32`
2. Script de backfill: desencriptar com chave antiga → re-encriptar com nova
3. Executar em transação
4. Atualizar segredo no sistema de gestão
5. Deploy da nova versão

> [!CAUTION]
> Não atualizar a `ENCRYPTION_KEY` antes do backfill. Dados sem re-encriptação tornam-se **irrecuperáveis**.

---

## 20. Resolução de Problemas Comuns

### Aplicação não inicia — ENCRYPTION_KEY

```bash
# Verificar comprimento (deve retornar 32)
echo -n "$ENCRYPTION_KEY" | wc -c

# Gerar nova chave válida
openssl rand -hex 32 | head -c 32
```

### Erro 429 no login

Aguardar 15 minutos (rate limit por IP). Em redes com NAT partilhado, ajustar limite em `proxy.ts`.

### Emails não entregues

1. Verificar logs para erros Graph API / SMTP.
2. Confirmar variáveis `M365_*`.
3. Verificar permissão `Mail.Send` com consentimento de admin no Azure.
4. Testar: `telnet smtp.office365.com 587`.

### Payload de questionário ilegível

A `ENCRYPTION_KEY` foi alterada sem backfill. Restaurar a chave original e executar processo de rotação (secção 19.4).

### `prisma migrate deploy` falha

```bash
npx prisma migrate status
```

> [!CAUTION]
> **Nunca** executar `prisma migrate reset` em produção — apaga **todos os dados**.

### Sessões expiram inesperadamente

`AUTH_SECRET` foi rotacionado. Todos os utilizadores precisam de re-autenticar. Planear rotação para baixo tráfego.

---

## 21. Conformidade RGPD

### Bases Legais de Tratamento

| Dado | Base Legal | Fundamento |
|------|-----------|------------|
| Identificação | Contrato / Interesse Legítimo | Serviço educativo |
| Biometria | Consentimento Explícito (`consentRgpd`) | Art. 9.º RGPD |
| Questionários | Consentimento Explícito | Art. 9.º RGPD |
| KIDMED (menores) | Consentimento Parental (`kidmedConsentAt`) | Art. 8.º RGPD |
| Logs de auditoria | Interesse Legítimo | Segurança e responsabilização |

### Medidas Técnicas

- **Encriptação em repouso:** AES-256-GCM nos payloads.
- **Encriptação em trânsito:** HTTPS obrigatório (HSTS).
- **Minimização de dados:** Apenas dados necessários.
- **RBAC granular:** Cada papel acede só ao necessário.
- **Auditoria completa:** AuditLog para ações sensíveis.
- **Soft-delete:** Alunos arquivados (`archivedAt`), não eliminados.
- **Consentimento rastreável:** Timestamps em todos os campos de consentimento.

### Direitos dos Titulares

| Direito | Mecanismo |
|---------|----------|
| Acesso (Art. 15.º) | Relatório via API |
| Retificação (Art. 16.º) | `PUT /api/students/[id]` |
| Apagamento (Art. 17.º) | Processo manual ADMIN + DBA |
| Portabilidade (Art. 20.º) | Exportação JSON |
| Oposição (Art. 21.º) | Revogação de consentimento |

> [!IMPORTANT]
> Responder a pedidos RGPD em **30 dias** (Art. 12.º). Notificar o DPO de todos os pedidos.

---

## 22. Glossário

| Termo | Definição |
|-------|----------|
| **ADMIN** | Papel com acesso total ao sistema |
| **AES-256-GCM** | Cifra autenticada de 256 bits (Galois/Counter Mode) |
| **App Router** | Sistema de routing do Next.js com RSC e layouts aninhados |
| **AuthTag** | Tag de autenticação de 16 bytes do AES-GCM |
| **bcrypt** | Algoritmo de hashing de passwords com salt |
| **CI/CD** | Continuous Integration / Continuous Deployment |
| **CodeQL** | Análise estática de segurança da GitHub |
| **Credentials Provider** | Módulo NextAuth para autenticação email/password |
| **DPO** | Data Protection Officer — responsável RGPD |
| **EvaluationSession** | Sessão que agrupa biometria e testes do mesmo momento |
| **Fail-closed** | Sistema recusa operar em caso de configuração inválida |
| **IMC** | Índice de Massa Corporal (kg/m²) |
| **IV** | Initialization Vector — valor aleatório 12 bytes para AES-GCM |
| **JWT** | JSON Web Token — token de sessão sem estado |
| **KIDMED** | Índice de Qualidade da Dieta Mediterrânica em Crianças |
| **ORM** | Object-Relational Mapping (Prisma neste projeto) |
| **PAIS** | Encarregados de educação com acesso restrito |
| **periodKey** | Chave de período letivo (ex.: `2025/2026:P2`) |
| **Prisma** | ORM TypeScript-first com client type-safe |
| **PSICOLOGO** | Psicólogo escolar com acesso de leitura clínica |
| **RBAC** | Role-Based Access Control |
| **RGPD** | Regulamento Geral sobre a Proteção de Dados |
| **RSC** | React Server Components |
| **SSE** | Server-Sent Events — streaming unidirecional HTTP |
| **Turbopack** | Bundler de alto desempenho (substituto do Webpack) |
| **Zod** | Biblioteca de validação TypeScript-first |

---

*Manual Técnico — HealthyTech Atlântico*  
*Última atualização: Junho 2026*  
*Para reportar erros, abrir uma issue no repositório do projeto.*
