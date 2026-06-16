# HealthyTech Atlântico

Aplicação web para acompanhar saúde, condição física e bem-estar dos alunos em contexto escolar.

Este projeto usa Next.js, React, TypeScript, Prisma, PostgreSQL, NextAuth, Zod e Tailwind CSS. A aplicação inclui gestão de alunos, turmas, biometria, testes físicos, questionários, relatórios, alertas SOS, encarregados de educação, auditoria e permissões por perfil.

Para uma explicação completa do código, consulta:

```text
../docs/guia-codigo-estagiarios.md
```

## Requisitos

- Node.js
- npm
- PostgreSQL
- Variáveis de ambiente configuradas em `.env`

## Instalação

Dentro da pasta `next/`:

```bash
npm install
```

## Variáveis de Ambiente

Criar um ficheiro `.env` em `next/`.

Variáveis principais:

```env
DATABASE_URL=
AUTH_SECRET=
JWT_SECRET=
M365_TENANT_ID=
M365_CLIENT_ID=
M365_CLIENT_SECRET=
M365_REPORT_FROM=HealthyTech@colegioatlantico.pt
M365_SHARED_MAILBOX=HealthyTech@colegioatlantico.pt
```

As credenciais Microsoft 365 só são necessárias para testar o envio real de relatórios por email.

## Base de Dados

Gerar o cliente Prisma:

```bash
npx prisma generate
```

Executar migrations em desenvolvimento:

```bash
npx prisma migrate dev
```

Criar ou atualizar o administrador inicial:

```bash
npm run bootstrap:admin
```

## Desenvolvimento

```bash
npm run dev
```

Por defeito, a aplicação fica disponível em:

```text
http://localhost:3000
```

## Testes e Validação

```bash
npm test
npm run typecheck
```

## Scripts Úteis

| Comando | Função |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento. |
| `npm run build` | Cria a build de produção. |
| `npm run start` | Executa a aplicação em produção. |
| `npm run start:standalone` | Executa o servidor standalone gerado pelo Next.js. |
| `npm test` | Corre os testes com Vitest. |
| `npm run typecheck` | Valida tipos TypeScript e tipos do Next.js. |
| `npm run bootstrap:admin` | Cria ou atualiza o administrador inicial. |
| `npm run screenshots` | Corre testes/capturas Playwright. |

## Estrutura Principal

```text
next/
├── messages/       Traduções em português e inglês.
├── prisma/         Schema da base de dados, migrations e seed.
├── public/         Imagens, ícones, favicon e manifest PWA.
├── scripts/        Scripts auxiliares.
├── src/app/        Páginas, layouts e API routes.
├── src/components/ Componentes React reutilizáveis.
├── src/hooks/      Hooks React partilhados.
├── src/lib/        Regras de negócio, validações, autenticação e utilitários.
└── tests/          Testes unitários e de frontend.
```

## Perfis da Aplicação

- `ADMIN`: administração geral.
- `PROFESSOR`: gestão de alunos, avaliações, relatórios e turmas.
- `ALUNO`: consulta de dados próprios, questionários e SOS.
- `PSICOLOGO`: acompanhamento de alertas e informação relevante.
- `PAIS`: consulta dos alunos associados.

## Antes de Entregar Alterações

Confirma sempre:

- permissões no backend;
- validações Zod;
- ausência de dados sensíveis nas respostas da API;
- traduções atualizadas;
- testes relevantes executados;
- documentação atualizada quando houver mudança de comportamento.
