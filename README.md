# AtlanticoFit

Plataforma escolar de avaliação física (web + PWA) para o Colégio Atlântico.

## Estrutura recomendada

```text
public/
  index.html
  styles.css
  app.js
  manifest.json
  sw.js
server/
  app.js
  server.js
  db.js
  schema.sql
  .env.example
  config/
    env.js
  middleware/
    auth.js
  routes/
    auth.js
    users.js
    students.js
    classes.js
  services/
    mailer.js
  utils/
    async-handler.js
package.json
```

## Setup

1. Base de dados PostgreSQL:

```bash
psql -U postgres -c "CREATE DATABASE atlanticofit;"
psql -U postgres -d atlanticofit -f server/schema.sql
```

2. Variáveis de ambiente:

```bash
copy server\.env.example server\.env
```

3. Instalar e correr:

```bash
npm install
npm start
```

Para correr os testes automáticos:

```bash
npm test
```

API health check:

- `http://localhost:4000/api/health`

## Microsoft 365 (email)

Configuração base SMTP (porta 587 / STARTTLS):

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=utilizador@colegioatlantico.pt
SMTP_PASS=palavra_passe_ou_app_password
SMTP_FROM=AtlanticoFit <utilizador@colegioatlantico.pt>
```

OAuth2 (opcional/recomendado):

```env
SMTP_AUTH_TYPE=oauth2
SMTP_CLIENT_ID=
SMTP_CLIENT_SECRET=
SMTP_REFRESH_TOKEN=
SMTP_ACCESS_TOKEN=
```

## Funcionalidades implementadas

- Registo biométrico: idade, altura, peso, IMC, massa gorda opcional, perímetro da cintura.
- Bateria de testes físicos por categorias (capacidade aeróbia, força muscular, flexibilidade, velocidade/agilidade).
- ZAF automática por sexo e idade (IMC, cintura e testes).
- Análise longitudinal com gráficos.
- Relatórios com envio por email para encarregado de educação.
- Área de protocolos com tabelas de referência IMC/cintura.
- Questionário inicial (com adiamento limitado) e questionário de rotina.
- Botão SOS com notificação para psicólogo e professor.
- Gestão de perfis (Aluno, Professor, Psicólogo, Pais), RGPD e dispensas médicas.
- RBAC por permissões com regras por perfil e vínculo Pai/Encarregado ↔ Aluno.
- PWA instalável em telemóvel.

## Migração recomendada (RBAC Pais ↔ Aluno)

Se a base de dados já existia antes desta versão, aplica novamente o schema:

```bash
psql -U postgres -d atlanticofit -f server/schema.sql
```

Isto cria a tabela `student_guardians` para associar utilizadores com perfil `pais` aos respetivos alunos.

## Endpoints principais

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/me`
- `PUT /api/users/me`
- `POST /api/students`
- `GET /api/students`
- `GET /api/students/linked` (pais)
- `GET /api/students/:id/guardians` (professor)
- `POST /api/students/:id/guardians` (professor)
- `POST /api/students/:id/biometrics`
- `GET /api/students/:id/biometrics`
- `POST /api/students/:id/tests`
- `GET /api/students/:id/tests`
- `POST /api/students/:id/questionnaires`
- `GET /api/students/:id/questionnaires`
- `POST /api/students/:id/sos`
- `GET /api/students/:id/sos`
- `POST /api/students/:id/reports/email`
- `GET /api/students/:id/reports`
- `POST /api/students/:id/dispensas` (professor)
- `GET /api/students/:id/dispensas` (professor)
- `GET /api/classes/:classId/students` (professor)
- `GET /api/classes/:classId/report` (professor)
