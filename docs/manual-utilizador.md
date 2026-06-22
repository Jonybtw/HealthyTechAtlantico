# Manual de Utilizador — HealthyTech Atlântico

> **Versão:** 1.0 · **Data:** Junho 2026 · **Idioma:** Português (Portugal)

*[Logótipo da plataforma HealthyTech Atlântico — fundo escuro com ícone de coração e seta ascendente]*

---

## Índice

1. [Introdução](#1-introdução)
2. [O que é o HealthyTech Atlântico?](#2-o-que-é-o-healthytech-atlântico)
3. [Perfis de Utilizador](#3-perfis-de-utilizador)
4. [Primeiros Passos — Acesso à Plataforma](#4-primeiros-passos--acesso-à-plataforma)
   - 4.1 [Entrar na Plataforma (Login)](#41-entrar-na-plataforma-login)
   - 4.2 [Criar uma Conta (Registo)](#42-criar-uma-conta-registo)
   - 4.3 [Verificação de Email](#43-verificação-de-email)
   - 4.4 [Mudar a Palavra-passe](#44-mudar-a-palavra-passe)
5. [O Dashboard — Página Principal](#5-o-dashboard--página-principal)
   - 5.1 [Dashboard do Administrador](#51-dashboard-do-administrador)
   - 5.2 [Dashboard do Professor](#52-dashboard-do-professor)
   - 5.3 [Dashboard do Psicólogo](#53-dashboard-do-psicólogo)
   - 5.4 [Dashboard do Encarregado de Educação](#54-dashboard-do-encarregado-de-educação)
   - 5.5 [Dashboard do Aluno](#55-dashboard-do-aluno)
6. [Gestão de Alunos](#6-gestão-de-alunos)
   - 6.1 [Lista de Alunos](#61-lista-de-alunos)
   - 6.2 [Criar um Aluno Individualmente](#62-criar-um-aluno-individualmente)
   - 6.3 [Importar Alunos em Lote (CSV)](#63-importar-alunos-em-lote-csv)
   - 6.4 [Perfil Completo do Aluno](#64-perfil-completo-do-aluno)
7. [Biometria](#7-biometria)
   - 7.1 [Registar uma Medição](#71-registar-uma-medição)
   - 7.2 [Consultar o Histórico de Medições](#72-consultar-o-histórico-de-medições)
   - 7.3 [Zonas de Saúde e IMC](#73-zonas-de-saúde-e-imc)
8. [Testes Físicos](#8-testes-físicos)
   - 8.1 [Registar Resultados de Testes](#81-registar-resultados-de-testes)
   - 8.2 [Importar Resultados em Lote](#82-importar-resultados-em-lote)
   - 8.3 [Zona de Aptidão Física (ZAF)](#83-zona-de-aptidão-física-zaf)
9. [Questionários](#9-questionários)
   - 9.1 [Tipos de Questionário](#91-tipos-de-questionário)
   - 9.2 [Como Responder a um Questionário (Aluno)](#92-como-responder-a-um-questionário-aluno)
   - 9.3 [Períodos Letivos e Regras de Submissão](#93-períodos-letivos-e-regras-de-submissão)
   - 9.4 [Questionário KIDMED e Consentimento Parental](#94-questionário-kidmed-e-consentimento-parental)
   - 9.5 [Ver Questionários dos Alunos (Staff)](#95-ver-questionários-dos-alunos-staff)
10. [Alertas SOS](#10-alertas-sos)
    - 10.1 [Enviar um Alerta SOS (Aluno)](#101-enviar-um-alerta-sos-aluno)
    - 10.2 [Gerir Alertas SOS (Staff)](#102-gerir-alertas-sos-staff)
11. [Dispensas Médicas](#11-dispensas-médicas)
    - 11.1 [Criar uma Dispensa](#111-criar-uma-dispensa)
    - 11.2 [Consultar Dispensas Ativas e Históricas](#112-consultar-dispensas-ativas-e-históricas)
12. [Turmas](#12-turmas)
    - 12.1 [Ver o Resumo da Turma](#121-ver-o-resumo-da-turma)
    - 12.2 [Importar Turmas via CSV](#122-importar-turmas-via-csv)
    - 12.3 [Enviar Relatório da Turma por Email](#123-enviar-relatório-da-turma-por-email)
13. [Acompanhamento Psicológico](#13-acompanhamento-psicológico)
14. [Análise e Estatísticas](#14-análise-e-estatísticas)
15. [Relatórios](#15-relatórios)
    - 15.1 [Gerar um Relatório Individual](#151-gerar-um-relatório-individual)
    - 15.2 [Enviar Relatório por Email](#152-enviar-relatório-por-email)
16. [Guardiões (Encarregados de Educação)](#16-guardiões-encarregados-de-educação)
    - 16.1 [Associar um Encarregado a um Aluno](#161-associar-um-encarregado-a-um-aluno)
    - 16.2 [Ver os Alunos Associados (Encarregado)](#162-ver-os-alunos-associados-encarregado)
17. [Perfil de Utilizador](#17-perfil-de-utilizador)
18. [Administração da Plataforma](#18-administração-da-plataforma)
    - 18.1 [Criar Contas de Staff](#181-criar-contas-de-staff)
    - 18.2 [Gerir Utilizadores](#182-gerir-utilizadores)
    - 18.3 [Reset de Palavra-passe](#183-reset-de-palavra-passe)
19. [Auditoria](#19-auditoria)
20. [Elementos de Interface Comuns](#20-elementos-de-interface-comuns)
    - 20.1 [Barra de Navegação Lateral](#201-barra-de-navegação-lateral)
    - 20.2 [Modo Claro e Modo Escuro](#202-modo-claro-e-modo-escuro)
    - 20.3 [Idioma PT / EN](#203-idioma-pt--en)
    - 20.4 [Notificações (Toasts)](#204-notificações-toasts)
    - 20.5 [Tabelas, Pesquisa e Paginação](#205-tabelas-pesquisa-e-paginação)
    - 20.6 [Estados Vazios e Carregamento](#206-estados-vazios-e-carregamento)
21. [Privacidade e RGPD](#21-privacidade-e-rgpd)
22. [Perguntas Frequentes (FAQ)](#22-perguntas-frequentes-faq)
23. [Resolução de Problemas](#23-resolução-de-problemas)
24. [Contacto e Suporte](#24-contacto-e-suporte)

---

## 1. Introdução

Bem-vindo ao **Manual de Utilizador do HealthyTech Atlântico**.

Este documento foi criado para o ajudar a utilizar a plataforma de forma simples, segura e eficaz — independentemente do seu papel na comunidade escolar. Quer seja professor, aluno, psicólogo, pai ou administrador, vai encontrar aqui todas as explicações de que precisa.

O manual está organizado por funcionalidades e por tipo de utilizador. Pode consultar o Índice no início deste documento para saltar diretamente para o capítulo que precisa.

> [!NOTE]
> Este manual refere-se à versão 1.0 da plataforma. Algumas funcionalidades podem ser atualizadas ao longo do tempo. Sempre que existir uma nova versão do manual, será disponibilizada na mesma localização.

**Como utilizar este manual:**

- Se é **novo na plataforma**, comece pelo capítulo [4 — Primeiros Passos](#4-primeiros-passos--acesso-à-plataforma).
- Se é **aluno**, os capítulos mais importantes para si são o [9 — Questionários](#9-questionários) e o [10 — Alertas SOS](#10-alertas-sos).
- Se é **professor**, foque-se nos capítulos [6](#6-gestão-de-alunos), [7](#7-biometria), [8](#8-testes-físicos), [11](#11-dispensas-médicas) e [12](#12-turmas).
- Se é **psicólogo**, o capítulo [13 — Acompanhamento Psicológico](#13-acompanhamento-psicológico) foi escrito especialmente para si.
- Se é **encarregado de educação**, consulte os capítulos [4](#4-primeiros-passos--acesso-à-plataforma), [15](#15-relatórios) e [16](#16-guardiões-encarregados-de-educação).
- Se é **administrador**, os capítulos [18](#18-administração-da-plataforma) e [19](#19-auditoria) contêm informação essencial.

---

## 2. O que é o HealthyTech Atlântico?

O **HealthyTech Atlântico** é uma plataforma digital de saúde e bem-estar escolar, desenvolvida especificamente para o Colégio Atlântico. O seu objetivo é centralizar e facilitar o acompanhamento da saúde física e emocional dos alunos — de forma segura, organizada e acessível a toda a comunidade educativa.

### O que a plataforma permite fazer?

- **Registar e acompanhar dados biométricos** dos alunos (peso, altura, IMC, entre outros)
- **Registar resultados de testes físicos** e calcular automaticamente a zona de aptidão
- **Aplicar questionários** de bem-estar emocional, autoconceito, autoestima e alimentação
- **Enviar e gerir alertas SOS** em situações de emergência emocional
- **Criar dispensas médicas** para alunos impossibilitados de realizar atividade física
- **Gerar relatórios individuais** e enviá-los por email aos encarregados de educação
- **Monitorizar a saúde de turmas inteiras** com gráficos e indicadores de cobertura
- **Garantir a privacidade e a conformidade** com o Regulamento Geral de Proteção de Dados (RGPD)

### Para quem é esta plataforma?

| Perfil | Papel principal |
|---|---|
| Administrador | Gestão global da plataforma e dos utilizadores |
| Professor | Registo de dados, acompanhamento das turmas e comunicação com famílias |
| Psicólogo | Acompanhamento do bem-estar emocional e resposta a situações de crise |
| Aluno | Consulta dos próprios dados, resposta a questionários e pedido de ajuda |
| Encarregado de Educação | Consulta dos dados do seu educando e receção de relatórios |

---

## 3. Perfis de Utilizador

O HealthyTech Atlântico foi concebido com diferentes níveis de acesso, adaptados a cada papel na comunidade escolar. Cada perfil vê apenas o que é relevante para as suas funções.

### Tabela de Permissões por Perfil

| Funcionalidade | Admin | Professor | Psicólogo | Aluno | Encarregado |
|---|:---:|:---:|:---:|:---:|:---:|
| Ver todos os alunos | ✅ | ✅ | ✅ | ❌ | ❌ |
| Criar/editar alunos | ✅ | ✅ | ❌ | ❌ | ❌ |
| Registar biometria | ✅ | ✅ | ❌ | ❌ | ❌ |
| Registar testes físicos | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver questionários dos alunos | ✅ | ✅ | ✅ | Apenas os próprios | ❌ |
| Responder questionários | ❌ | ❌ | ❌ | ✅ | ❌ |
| Enviar alerta SOS | ❌ | ❌ | ❌ | ✅ | ❌ |
| Gerir alertas SOS | ✅ | ✅ | ✅ | ❌ | ❌ |
| Criar dispensas médicas | ✅ | ✅ | ❌ | ❌ | ❌ |
| Gerar relatórios PDF | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver relatórios | ✅ | ✅ | ❌ | ❌ | ✅ (do educando) |
| Ver análises e gráficos | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ver acompanhamento psicológico | ❌ | ❌ | ✅ | ❌ | ❌ |
| Gerir contas de staff | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ver auditoria | ✅ | ❌ | ❌ | ❌ | ❌ |

> [!IMPORTANT]
> As permissões são definidas automaticamente aquando da criação da conta. Não é possível alterar o próprio perfil. Se precisar de alterar o seu nível de acesso, contacte o Administrador da plataforma.

### Descrição detalhada de cada perfil

**🔧 Administrador**
O administrador tem acesso total à plataforma. É responsável por criar e gerir as contas de professores e psicólogos, por monitorizar a atividade de todos os utilizadores através do registo de auditoria, e por garantir o bom funcionamento geral do sistema.

**👨‍🏫 Professor**
O professor é o utilizador mais ativo na plataforma no que diz respeito ao registo de dados. Gere as suas turmas, regista medições biométricas e resultados de testes físicos dos alunos, cria dispensas médicas, envia relatórios e comunica com os encarregados de educação.

**🧠 Psicólogo**
O psicólogo tem uma vista privilegiada sobre o bem-estar emocional dos alunos. Recebe e gere alertas SOS em tempo real, consulta os questionários respondidos pelos alunos e acompanha o percurso de saúde de cada aluno de forma integrada — mas sem poder modificar dados.

**🎒 Aluno**
O aluno acede à plataforma para consultar os seus próprios dados de saúde, responder a questionários de bem-estar nos três períodos letivos, e pedir ajuda através do botão SOS em situações de emergência emocional.

**👨‍👩‍👧 Encarregado de Educação (Pais)**
Os pais ou encarregados de educação podem ver os dados de saúde do(s) seu(s) educando(s) e receber relatórios por email. O acesso à plataforma é read-only — não é possível alterar dados.

---

## 4. Primeiros Passos — Acesso à Plataforma

### 4.1 Entrar na Plataforma (Login)

*[Ecrã de login — à esquerda, carrossel de fotografias do Colégio Atlântico; à direita, formulário com campos de email e palavra-passe com etiquetas flutuantes, botão "Entrar" e opções de tema e idioma no topo]*

Para aceder ao HealthyTech Atlântico, siga estes passos:

1. Abra o seu browser preferido (recomendamos Chrome, Edge ou Firefox).
2. Aceda ao endereço da plataforma fornecido pela escola.
3. No formulário à direita do ecrã, introduza o seu **endereço de email** institucional.
4. Introduza a sua **palavra-passe**.
5. Clique no botão **"Entrar"**.

Se as credenciais estiverem corretas, será redirecionado automaticamente para o seu Dashboard personalizado.

> [!TIP]
> Se quiser que a plataforma recorde o seu email para sessões futuras, certifique-se de que não está a navegar em modo privado/anónimo.

> [!WARNING]
> Após várias tentativas de login falhadas, a conta pode ser temporariamente bloqueada por razões de segurança. Aguarde alguns minutos antes de tentar novamente, ou contacte o Administrador.

**Alternar entre modo claro e modo escuro:**
No canto superior direito do ecrã de login, encontrará um ícone de sol/lua. Clique nele para alternar entre o tema claro e o tema escuro. A preferência é guardada para a sua próxima visita.

**Alternar o idioma (PT / EN):**
Junto ao ícone de tema, existe um seletor de idioma. Clique em **PT** ou **EN** para mudar o idioma da interface.

---

### 4.2 Criar uma Conta (Registo)

*[Ecrã de registo — seleção de perfil com cards animados para "Aluno" e "Encarregado de Educação"; formulário com nome, email e palavra-passe; barra de força da palavra-passe; caixa de consentimento RGPD]*

> [!IMPORTANT]
> O auto-registo público está disponível apenas para **Alunos** e **Encarregados de Educação**. As contas de Professor e Psicólogo são criadas pelo Administrador da plataforma — se for professor ou psicólogo, não precisa de criar conta; ela será criada pelo administrador e receberá um email com as credenciais de acesso.

**Para criar uma conta como Aluno ou Encarregado:**

1. Na página de login, clique em **"Criar conta"** ou **"Registar"**.
2. Escolha o seu perfil clicando no card correspondente:
   - 🎒 **Aluno**
   - 👨‍👩‍👧 **Encarregado de Educação**
3. Preencha os campos do formulário:
   - **Nome completo**
   - **Endereço de email** (use um email que acede regularmente — será para aí que receberá confirmações e relatórios)
   - **Palavra-passe** (veja abaixo os requisitos)
4. Observe a **barra de força da palavra-passe** — ela tem 4 níveis (Fraca, Razoável, Boa, Forte). Recomendamos pelo menos o nível "Boa".
5. Leia e aceite os **Termos de Privacidade e Consentimento RGPD** (obrigatório). Clique na caixa de verificação para confirmar que leu e aceita.
6. Clique em **"Criar Conta"**.
7. Receberá um email de verificação no endereço indicado.

**Requisitos da palavra-passe:**
- Mínimo de 8 caracteres
- Pelo menos uma letra maiúscula
- Pelo menos um número
- Recomendado: incluir um símbolo especial (ex: !, @, #)

> [!TIP]
> Use uma palavra-passe que não utilize noutros serviços. Pode usar um gestor de palavras-passe (como Bitwarden ou 1Password) para criar e guardar uma palavra-passe segura.

---

### 4.3 Verificação de Email

*[Ecrã de verificação — mensagem a informar que foi enviado um email, com botão para reenviar o link de verificação]*

Após criar a sua conta, receberá automaticamente um email com um **link de verificação**. Este passo é obrigatório — a sua conta ficará bloqueada até que o email seja verificado.

**Para verificar o seu email:**

1. Abra a caixa de entrada do email que indicou no registo.
2. Procure um email com o assunto **"HealthyTech Atlântico — Verificação de Email"**.
3. Clique no botão ou no link de verificação dentro do email.
4. Será redirecionado para a plataforma, confirmando que a sua conta está ativa.

> [!NOTE]
> Se não receber o email em 5 minutos, verifique a pasta de **Spam** ou **Correio Indesejado**. Se continuar sem receber, clique em **"Reenviar email de verificação"** na página de verificação.

---

### 4.4 Mudar a Palavra-passe

*[Ecrã de alteração de palavra-passe — dois campos: "Nova palavra-passe" e "Confirmar palavra-passe"; barra de força em tempo real; botão "Guardar"]*

Existem duas situações em que é necessário mudar a palavra-passe:

**a) Mudança voluntária (no Perfil)**

Pode alterar a sua palavra-passe a qualquer momento:
1. Clique no ícone de perfil no canto superior direito.
2. Selecione **"Perfil"** no menu.
3. Na secção **"Segurança"**, clique em **"Mudar Palavra-passe"**.
4. Introduza a palavra-passe atual e depois a nova palavra-passe (duas vezes para confirmar).
5. Clique em **"Guardar alterações"**.

**b) Reset forçado pelo Administrador**

Se o Administrador fizer reset à sua palavra-passe (por motivo de segurança ou pedido seu), quando fizer login pela primeira vez após esse reset, será automaticamente redirecionado para o ecrã de alteração de palavra-passe. Não conseguirá aceder a nenhuma outra página antes de definir uma nova palavra-passe.

> [!WARNING]
> Após alterar a palavra-passe, todas as sessões abertas noutros dispositivos serão terminadas. Terá de fazer login novamente nesses dispositivos com a nova palavra-passe.

---

## 5. O Dashboard — Página Principal

O **Dashboard** é a primeira página que vê após fazer login. O seu conteúdo é personalizado de acordo com o seu perfil — cada utilizador vê apenas a informação relevante para as suas funções.

*[Ecrã do Dashboard — barra lateral de navegação à esquerda com ícones, área central com KPIs em cards, gráficos de resumo e lista de tarefas pendentes]*

---

### 5.1 Dashboard do Administrador

*[Dashboard Admin — cards com KPIs: total de alunos, turmas ativas, sessões registadas, alertas SOS ativos; gráficos de cobertura de dados; fila de prioridades institucionais]*

O dashboard do **Administrador** oferece uma vista panorâmica de toda a plataforma:

- **KPIs principais:**
  - Número total de alunos registados
  - Número de turmas ativas
  - Sessões de testes registadas
  - Alertas SOS ativos

- **Fila de prioridades institucionais:** lista das situações que requerem atenção imediata (alertas SOS não resolvidos, contas sem verificação, etc.)

- **Cobertura de dados:** percentagem de alunos com biometria registada, testes realizados e questionários submetidos

- **ZAF (Zona de Aptidão Física):** distribuição dos alunos por zona de aptidão

- **Relatórios recentes:** últimos relatórios gerados na plataforma

---

### 5.2 Dashboard do Professor

*[Dashboard Professor — atalhos rápidos para registar biometria ou testes; lista de alunos com biometrias em falta; alertas SOS da turma; dispensas ativas]*

O dashboard do **Professor** está focado nas tarefas diárias:

- **Biometrias em falta:** lista de alunos que ainda não têm medições biométricas no período atual
- **Testes em falta:** lista de alunos sem resultados de testes físicos no período atual
- **Dispensas ativas:** alunos com dispensa médica ativa neste momento
- **SOS da turma:** alertas SOS enviados por alunos da(s) sua(s) turma(s)
- **Atalhos rápidos:** botões para registar biometria, lançar testes ou criar uma dispensa

---

### 5.3 Dashboard do Psicólogo

*[Dashboard Psicólogo — fila de intervenção com alertas SOS não resolvidos em destaque; lista de questionários recentes de alunos acompanhados]*

O dashboard do **Psicólogo** está centrado no bem-estar emocional:

- **Fila de intervenção:** todos os alertas SOS não resolvidos, ordenados por data e urgência
- **Questionários recentes:** os questionários mais recentemente submetidos pelos alunos, disponíveis para leitura

> [!IMPORTANT]
> Os alertas SOS são atualizados em **tempo real** — não precisa de refrescar a página para ver novos alertas. Se houver um novo alerta, será notificado de imediato no ecrã.

---

### 5.4 Dashboard do Encarregado de Educação

*[Dashboard Encarregado — cards com os alunos associados; lista de relatórios disponíveis para consulta]*

O dashboard do **Encarregado de Educação** é simples e direto:

- **Alunos associados:** cards com o nome e foto (se disponível) de cada educando
- **Relatórios disponíveis:** lista dos relatórios mais recentes gerados pelos professores para os seus educandos

Clique no card de um aluno para ver os seus dados de saúde em detalhe.

---

### 5.5 Dashboard do Aluno

*[Dashboard Aluno — card de estado de saúde com IMC e z-score; tarefas pendentes com questionários por responder; botão SOS bem visível]*

O dashboard do **Aluno** mostra:

- **Estado de saúde pessoal:**
  - IMC atual e respetiva classificação
  - Z-score de condição física
  - Última data de medição biométrica

- **Tarefas pendentes:** questionários que ainda não respondeu neste período letivo

- **Alerta SOS ativo:** se tiver um alerta SOS aberto, aparecerá aqui em destaque

> [!TIP]
> Se tiver questionários por responder, aparecem aqui como cartões com a data limite. Não deixe para o último momento — cada questionário demora apenas alguns minutos.

---

## 6. Gestão de Alunos

**Para quem:** Professor, Administrador

Esta secção explica como gerir a lista de alunos da plataforma — criar novos alunos, importar em lote e aceder ao perfil completo de cada aluno.

---

### 6.1 Lista de Alunos

*[Ecrã de lista de alunos — tabela com nome, número de processo, turma, ano letivo e ações; barra de pesquisa no topo; botões "Novo Aluno" e "Importar CSV"]*

A página **Alunos** (`/alunos`) apresenta uma lista completa de todos os alunos registados na plataforma.

**Funcionalidades disponíveis:**

- **Pesquisa:** utilize a barra de pesquisa no topo da tabela para filtrar por nome, número de processo ou turma
- **Ordenação:** clique no cabeçalho de qualquer coluna para ordenar a lista
- **Paginação:** se houver muitos alunos, a lista está dividida em páginas — utilize os controlos de paginação na parte inferior
- **Abrir perfil:** clique em qualquer linha da tabela (ou no ícone de ver) para aceder ao perfil completo do aluno

---

### 6.2 Criar um Aluno Individualmente

**Para quem:** Professor, Administrador

Para criar um novo aluno:

1. Na página **Alunos**, clique no botão **"Novo Aluno"**.
2. Preencha o formulário com os dados do aluno:
   - **Nome completo** *(obrigatório)*
   - **Data de nascimento** *(obrigatório)*
   - **Número de processo** *(obrigatório — deve ser único)*
   - **Turma** *(obrigatório)*
   - **Ano letivo** *(obrigatório)*
3. Clique em **"Guardar"**.

O aluno ficará imediatamente disponível na lista e no sistema.

> [!NOTE]
> A criação de um aluno na plataforma não cria automaticamente uma conta de login. Se o aluno precisar de aceder à plataforma, deverá registar-se de forma autónoma (auto-registo) utilizando o mesmo email e número de processo.

---

### 6.3 Importar Alunos em Lote (CSV)

**Para quem:** Professor, Administrador

Quando tem uma turma inteira para registar, é muito mais rápido usar a importação por ficheiro CSV.

1. Na página **Alunos**, clique em **"Importar CSV"**.
2. O sistema mostrará o formato esperado do ficheiro. Certifique-se de que o seu ficheiro CSV tem as colunas corretas (tipicamente: Nome, Data de Nascimento, Número de Processo, Turma, Ano Letivo).
3. Clique em **"Selecionar Ficheiro"** e escolha o ficheiro CSV no seu computador.
4. O sistema analisará o ficheiro e mostrará uma pré-visualização dos dados.
5. Confirme os dados e clique em **"Importar"**.

> [!WARNING]
> Verifique o ficheiro CSV antes de importar. Se existirem erros de formato (datas incorretas, campos em falta), o sistema avisará linha por linha. Corrija os erros e tente novamente.

> [!TIP]
> Pode descarregar um modelo de ficheiro CSV diretamente na página de importação clicando em **"Descarregar modelo"**. Preencha esse modelo com os dados dos seus alunos para garantir que o formato está correto.

---

### 6.4 Perfil Completo do Aluno

*[Ecrã de perfil do aluno — cabeçalho com nome, foto, turma e número de processo; separadores: Biometria, Testes, Questionários, Relatórios, Dispensas, Encarregados]*

O perfil de cada aluno (`/alunos/[id]`) é o hub central de toda a informação de saúde desse aluno. Está organizado em **separadores**:

| Separador | O que contém | Quem pode editar |
|---|---|---|
| **Biometria** | Histórico de medições (peso, altura, IMC) | Professor, Admin |
| **Testes** | Resultados de testes físicos por sessão | Professor, Admin |
| **Questionários** | Respostas a todos os questionários | Apenas o Aluno |
| **Relatórios** | PDF de relatórios gerados | Professor, Admin |
| **Dispensas** | Dispensas médicas ativas e históricas | Professor, Admin |
| **Encarregados** | Lista de encarregados associados | Professor, Admin |

Para mudar de separador, clique no nome do separador no topo do perfil.

Cada separador mostra o **histórico completo** e, quando aplicável, permite adicionar **novas entradas** através de um botão de ação.

---

## 7. Biometria

**Para quem:** Professor, Administrador (registo); Aluno, Psicólogo, Encarregado (consulta)

A secção de biometria permite registar e acompanhar as medições físicas dos alunos ao longo do tempo — altura, peso, IMC e outros indicadores.

*[Ecrã de biometria — formulário de registo à esquerda com campos de altura, peso e medidas opcionais; histórico de medições em tabela à direita com datas e classificações por zona de saúde]*

---

### 7.1 Registar uma Medição

**Para quem:** Professor, Administrador

Para registar uma nova medição biométrica:

1. Aceda a **Biometria** (`/biometria`) na barra de navegação, **ou** abra o perfil do aluno e selecione o separador **Biometria**.
2. Clique em **"Nova Medição"**.
3. Selecione o aluno (se estiver a registar a partir da página de biometria geral).
4. Preencha os campos:
   - **Altura** (em metros, ex: 1.65) *(obrigatório)*
   - **Peso** (em quilogramas, ex: 58.3) *(obrigatório)*
   - **% Gordura Corporal** *(opcional)*
   - **Perímetro da Cintura** (em centímetros) *(opcional)*
   - **Data da medição** *(preenchida automaticamente com a data de hoje, mas pode ser alterada)*
5. O **IMC é calculado automaticamente** assim que introduz a altura e o peso.
6. Clique em **"Guardar Medição"**.

> [!NOTE]
> O IMC (Índice de Massa Corporal) é calculado pela fórmula: **Peso (kg) ÷ Altura² (m²)**. O resultado é apresentado com duas casas decimais.

---

### 7.2 Consultar o Histórico de Medições

Depois de registadas, todas as medições ficam guardadas no histórico do aluno, ordenadas da mais recente para a mais antiga. Pode ver:

- A data de cada medição
- Os valores registados (altura, peso, % gordura, perímetro)
- O IMC calculado
- A classificação por zona de saúde

Este histórico permite acompanhar a evolução do aluno ao longo do ano letivo e entre anos letivos.

---

### 7.3 Zonas de Saúde e IMC

O sistema classifica automaticamente o IMC do aluno numa **zona de saúde**, de acordo com as tabelas de referência para a idade e género:

| Zona | Descrição |
|---|---|
| 🟢 **Saudável** | IMC dentro dos valores recomendados para a idade |
| 🟡 **Risco** | IMC ligeiramente acima ou abaixo dos valores recomendados |
| 🔴 **Fora de Zona** | IMC significativamente afastado dos valores recomendados |

> [!NOTE]
> As classificações do IMC em crianças e adolescentes são diferentes das do adulto. O sistema utiliza tabelas de percentil ajustadas à idade e ao género para garantir classificações rigorosas.

---

## 8. Testes Físicos

**Para quem:** Professor, Administrador (registo); Psicólogo, Admin (consulta)

Os testes físicos permitem avaliar a condição física dos alunos de forma estruturada, registando os resultados de cada sessão e calculando automaticamente a Zona de Aptidão Física.

*[Ecrã de testes físicos — formulário com seleção de aluno, tipo de teste e campos de resultado; tabela com histórico de testes por aluno e sessão; indicador de ZAF à direita]*

---

### 8.1 Registar Resultados de Testes

1. Aceda a **Testes Físicos** (`/testes`) na barra de navegação.
2. Clique em **"Novo Resultado"**.
3. Selecione o **aluno** (ou a **turma**, se estiver a lançar resultados coletivos).
4. Selecione o **tipo de teste** (ex: resistência, força, flexibilidade, velocidade).
5. Introduza os **valores obtidos** nos campos correspondentes.
6. Confirme a **data da sessão** (preenchida automaticamente).
7. Clique em **"Registar"**.

O sistema calculará automaticamente a **Zona de Aptidão Física** com base nos valores introduzidos e nos referenciais normativos para a idade e género do aluno.

---

### 8.2 Importar Resultados em Lote

Quando tem os resultados de uma turma inteira, pode importá-los todos de uma vez através de um ficheiro CSV.

1. Na página **Testes Físicos**, clique em **"Importar Resultados"**.
2. Descarregue o modelo de CSV fornecido pelo sistema.
3. Preencha o modelo com os resultados de todos os alunos.
4. Faça o upload do ficheiro preenchido.
5. Reveja a pré-visualização e confirme a importação.

> [!TIP]
> Use a importação em lote após uma sessão de testes com a turma toda. Poupa tempo e garante que todos os dados são introduzidos de forma consistente.

---

### 8.3 Zona de Aptidão Física (ZAF)

A **ZAF (Zona de Aptidão Física)** é uma classificação automática que indica se o aluno está dentro ou fora dos parâmetros de aptidão física recomendados para a sua idade.

| Zona | Significado |
|---|---|
| 🟢 **Zona Saudável** | Aluno dentro dos valores de aptidão física recomendados |
| 🟡 **Zona de Melhoria** | Aluno abaixo dos valores recomendados, com necessidade de progressão |
| 🔴 **Fora de Zona** | Aluno significativamente abaixo dos valores mínimos recomendados |

A ZAF é visível no perfil do aluno, no Dashboard do Professor, e nos relatórios gerados.

---

## 9. Questionários

**Para quem:** Aluno (responder); Professor, Psicólogo, Admin (consultar)

Os questionários são uma ferramenta central do HealthyTech Atlântico para avaliar o bem-estar emocional, a autoestima, o autoconceito e os hábitos alimentares dos alunos.

*[Ecrã de questionários — lista dos 4 tipos de questionário com estado (respondido/pendente) por período letivo; botão "Responder" em cada questionário pendente]*

---

### 9.1 Tipos de Questionário

Existem **4 instrumentos de avaliação** disponíveis na plataforma:

#### 1. AUTOCONCEITO
Avalia a perceção que o aluno tem de si próprio — a sua imagem em diferentes domínios da vida (académico, social, pessoal, físico).

#### 2. AUTOESTIMA
Avalia a autoestima global do aluno — a avaliação geral que faz de si próprio como pessoa.

#### 3. EMOCIONAL
Avalia o bem-estar emocional do aluno através de quatro dimensões:
- **WHO-5:** Indicador de bem-estar da Organização Mundial de Saúde
- **Escala de Cantril:** Satisfação geral com a vida (0 a 10)
- **Sintomas:** Presença de sintomas físicos ou emocionais frequentes
- **Social:** Qualidade das relações sociais e suporte percebido

#### 4. KIDMED
Avalia a qualidade da dieta mediterrânica do aluno — hábitos alimentares, consumo de frutas, vegetais, peixe, fast food, etc.

> [!IMPORTANT]
> O questionário **KIDMED** requer **consentimento parental** antes de poder ser respondido. A escola (professor/admin) deve registar o consentimento do encarregado de educação no perfil do aluno antes de o questionário ficar disponível.

---

### 9.2 Como Responder a um Questionário (Aluno)

*[Ecrã de resposta a questionário — pergunta com opções de resposta em formato de escala ou seleção múltipla; barra de progresso no topo; botão "Seguinte" e "Anterior"]*

Para responder a um questionário:

1. Aceda a **Questionários** (`/questionarios`) na barra de navegação, ou clique na tarefa pendente no seu Dashboard.
2. Verá a lista dos questionários disponíveis para o período letivo atual. Os que já respondeu aparecem com o estado **"Respondido"**.
3. Clique em **"Responder"** no questionário que pretende completar.
4. Leia cada pergunta com atenção e selecione a resposta que melhor o descreve.
5. Use os botões **"Seguinte"** e **"Anterior"** para navegar entre perguntas.
6. A barra de progresso no topo mostra quantas perguntas já respondeu.
7. Na última pergunta, clique em **"Submeter"** para enviar as suas respostas.
8. Após a submissão, verá imediatamente o seu **resultado** e um **feedback personalizado**.

> [!NOTE]
> Não há respostas certas nem erradas. Os questionários são ferramentas de acompanhamento, não de avaliação. Responda com honestidade — isso é o que nos permite ajudá-lo melhor.

> [!WARNING]
> Depois de submeter um questionário, **não é possível alterar as respostas**. Leia cada pergunta cuidadosamente antes de submeter.

---

### 9.3 Períodos Letivos e Regras de Submissão

O ano letivo está dividido em **3 períodos**, cada um com uma janela temporal para responder aos questionários:

| Período | Meses |
|---|---|
| **P1 — 1.º Período** | Setembro a Novembro |
| **P2 — 2.º Período** | Dezembro a Março |
| **P3 — 3.º Período** | Abril a Junho |

**Regras importantes:**

- Cada questionário só pode ser respondido **uma vez por período** — se já respondeu ao questionário EMOCIONAL no P1, só poderá respondê-lo novamente no P2.
- Se não puder responder num determinado momento, pode **adiar até 3 vezes por instrumento** — mas tenha atenção ao prazo do período.
- Após o fim do período letivo, os questionários não respondidos ficam bloqueados e não podem ser completados retroativamente.

> [!TIP]
> Não adie os questionários mais do que necessário. Cada adiamento reduz o número de tentativas disponíveis. Se estiver com dificuldades em responder, fale com o seu professor ou psicólogo.

---

### 9.4 Questionário KIDMED e Consentimento Parental

O questionário **KIDMED** avalia os hábitos alimentares. Por envolver informações sobre a alimentação do aluno em contexto familiar, a sua escola exige o **consentimento explícito do encarregado de educação** antes de o aluno poder responder.

**Processo para ativar o KIDMED:**

1. O Professor ou Administrador abre o perfil do aluno.
2. No separador **Questionários**, localiza o questionário KIDMED.
3. Regista que o encarregado de educação deu o consentimento (verbal ou por escrito).
4. A partir desse momento, o questionário KIDMED fica disponível para o aluno.

**Para o aluno:**
Se o questionário KIDMED aparecer como "Bloqueado — Aguarda Consentimento Parental", fale com o seu professor. Não é possível desbloquear sem que o encarregado de educação dê autorização.

---

### 9.5 Ver Questionários dos Alunos (Staff)

**Para quem:** Professor, Psicólogo, Administrador

O staff pode consultar os questionários respondidos por qualquer aluno, mas **não pode alterar as respostas**.

Para consultar os questionários de um aluno:

1. Aceda ao perfil do aluno (`/alunos/[id]`).
2. Clique no separador **"Questionários"**.
3. Verá a lista de todos os questionários respondidos, organizados por período letivo.
4. Clique em qualquer questionário para ver as respostas e o resultado obtido.

O psicólogo pode também aceder a esta informação através da página de **Acompanhamento** (`/acompanhamento/[id]`), onde toda a informação do aluno está integrada numa só vista.

---

## 10. Alertas SOS

**Para quem:** Aluno (enviar); Professor, Psicólogo, Administrador (receber e gerir)

O sistema de **Alertas SOS** é uma das funcionalidades mais importantes da plataforma. Permite que um aluno peça ajuda de forma rápida e discreta quando está a passar por uma situação difícil.

*[Ecrã SOS do aluno — botão SOS grande e bem visível no centro; campos para selecionar o professor e o psicólogo a notificar]*

---

### 10.1 Enviar um Alerta SOS (Aluno)

> [!IMPORTANT]
> O alerta SOS **não substitui os serviços de emergência**. Em situações de perigo imediato para a vida, ligue sempre para o **112**.

Para enviar um alerta SOS:

1. Aceda a **SOS** (`/sos`) na barra de navegação.
2. Clique no botão **"Pedir Ajuda"** ou **"Enviar SOS"**.
3. Indique **quem deve ser notificado**:
   - Selecione o nome do seu **professor**
   - Selecione o nome do **psicólogo** responsável
4. Se quiser, pode adicionar uma breve nota descrevendo a situação (opcional).
5. Clique em **"Enviar Alerta"**.

O alerta chegará imediatamente ao professor e ao psicólogo selecionados. Não precisa de refrescar a página — o sistema notifica-os em tempo real.

**Após enviar o alerta:**
- O seu alerta aparece no Dashboard como "SOS Ativo".
- O professor ou psicólogo entrará em contacto consigo o mais brevemente possível.
- Quando a situação estiver resolvida, o staff marcará o alerta como "Resolvido".

> [!NOTE]
> Pode ter apenas **um alerta SOS ativo** de cada vez. Quando o alerta atual for marcado como resolvido pelo staff, poderá enviar outro se necessário.

---

### 10.2 Gerir Alertas SOS (Staff)

**Para quem:** Professor, Psicólogo, Administrador

*[Ecrã de gestão de alertas SOS — lista com alertas ativos em destaque (cor de alerta), nome do aluno, data/hora, estado; filtros de estado no topo; botão "Marcar como Resolvido"]*

Os alertas SOS são exibidos em tempo real — a página atualiza-se automaticamente quando chega um novo alerta.

**Funcionalidades disponíveis:**

- **Filtrar alertas:** utilize os filtros para ver apenas alertas **Ativos**, apenas **Resolvidos**, ou **Todos**
- **Ver detalhes:** clique num alerta para ver o nome do aluno, a data/hora, e a nota enviada (se existir)
- **Marcar como resolvido:** após intervir, clique em **"Marcar como Resolvido"** para fechar o alerta
- **Histórico:** os alertas resolvidos ficam guardados no histórico para referência futura

> [!WARNING]
> Um alerta SOS **nunca deve ser ignorado**. Mesmo que pareça não urgente, responda sempre ao aluno e confirme que está bem. Marque o alerta como resolvido apenas depois de verificar a situação do aluno.

---

## 11. Dispensas Médicas

**Para quem:** Professor, Administrador

As dispensas médicas registam os períodos em que um aluno está impossibilitado de participar nas aulas de Educação Física, por razão médica.

*[Ecrã de dispensas — formulário de criação com campos de aluno, motivo, datas e certificado médico; tabela de dispensas ativas com indicador visual de estado]*

---

### 11.1 Criar uma Dispensa

1. Aceda a **Dispensas** (`/dispensas`) na barra de navegação, **ou** abra o perfil do aluno e vá ao separador **Dispensas**.
2. Clique em **"Nova Dispensa"**.
3. Preencha os campos:
   - **Aluno:** selecione o aluno da lista
   - **Motivo:** descreva brevemente o motivo (ex: fratura do tornozelo, pós-operatório)
   - **Data de início:** data em que a dispensa começa
   - **Data de fim:** data em que a dispensa termina (ou marque "Indefinida" se não souber)
   - **Certificado médico:** assinale se o aluno apresentou ou não certificado médico
4. Clique em **"Guardar Dispensa"**.

A dispensa ficará visível no Dashboard do Professor, no perfil do aluno, e nos relatórios.

---

### 11.2 Consultar Dispensas Ativas e Históricas

Na página **Dispensas**, pode ver:

- **Dispensas ativas:** alunos atualmente dispensados, com a data de fim prevista
- **Histórico de dispensas:** todas as dispensas anteriores de todos os alunos

Utilize o filtro **"Por aluno"** para ver apenas as dispensas de um aluno específico.

> [!TIP]
> Quando uma dispensa termina, o sistema não a remove automaticamente — fica arquivada no histórico. Não é necessário fazer nada para "fechar" uma dispensa.

---

## 12. Turmas

**Para quem:** Professor, Administrador

A gestão de turmas permite ter uma visão global da cobertura de dados por turma e ano letivo.

*[Ecrã de turmas — cards por turma com percentagens de cobertura (biometria, testes, questionários); filtros de turma e ano letivo; botões "Importar Turma" e "Enviar Relatório"]*

---

### 12.1 Ver o Resumo da Turma

Na página **Turma** (`/turma`), pode ver para cada turma:

- **Cobertura de biometria:** % de alunos com medições registadas no período atual
- **Cobertura de testes:** % de alunos com resultados de testes físicos
- **Cobertura de questionários:** % de alunos que responderam a cada questionário

Estes indicadores ajudam a identificar rapidamente quais as turmas (ou alunos) que precisam de atenção.

**Filtros disponíveis:**

- Por **turma** (ex: 10.º A, 11.º B)
- Por **ano letivo** (ex: 2025/2026)

---

### 12.2 Importar Turmas via CSV

Se recebeu uma lista de turmas e alunos em formato de tabela (Excel ou CSV), pode importá-la diretamente:

1. Na página **Turma**, clique em **"Importar Turma"**.
2. Descarregue o modelo de CSV.
3. Preencha o modelo com os dados dos alunos e a turma a que pertencem.
4. Faça o upload do ficheiro.
5. Reveja e confirme a importação.

---

### 12.3 Enviar Relatório da Turma por Email

Pode enviar um relatório de resumo de uma turma inteira por email — útil para comunicar com a direção ou com os encarregados de educação em bloco.

1. Na página **Turma**, selecione a turma desejada.
2. Clique em **"Enviar Relatório"**.
3. Escolha os destinatários (encarregados de educação da turma, direção, etc.).
4. Confirme o envio.

> [!NOTE]
> O relatório enviado por email é gerado automaticamente com os dados mais recentes da turma. Não é necessário criar um documento separado.

---

## 13. Acompanhamento Psicológico

**Para quem:** Psicólogo (exclusivo)

A página de **Acompanhamento** (`/acompanhamento/[id]`) é uma vista integrada e exclusiva para o psicólogo, que reúne toda a informação de saúde de um aluno numa única página.

*[Ecrã de acompanhamento — perfil do aluno no topo; quatro secções verticais: Biometria (evolução gráfica), Testes Físicos, Questionários (resultados e tendências), Alertas SOS (histórico)]*

### O que pode ver nesta página

- **Biometria:** evolução do IMC ao longo do tempo, com gráfico de linha
- **Testes Físicos:** resultados e ZAF por sessão
- **Questionários:** todos os questionários respondidos, com resultados e comparação entre períodos
- **Alertas SOS:** histórico completo de alertas enviados pelo aluno, incluindo os já resolvidos

### Como aceder ao acompanhamento de um aluno

1. Na barra de navegação, clique em **"Acompanhamento"**.
2. Pesquise o nome ou número de processo do aluno.
3. Clique no aluno pretendido para abrir a sua página de acompanhamento.

> [!IMPORTANT]
> A página de acompanhamento é **apenas de leitura** para o psicólogo. Não é possível modificar, criar ou eliminar dados a partir desta página. Se identificar um erro nos dados, informe o professor responsável.

> [!NOTE]
> A confidencialidade dos dados do aluno é garantida pela plataforma. O psicólogo vê toda a informação de saúde, mas os seus acessos ficam registados no log de auditoria.

---

## 14. Análise e Estatísticas

**Para quem:** Professor, Psicólogo, Administrador

A página de **Análise** (`/analise`) oferece uma visão gráfica e estatística da saúde e aptidão física dos alunos, permitindo identificar tendências e áreas de melhoria.

*[Ecrã de análise — gráficos de linha para evolução do IMC por turma; gráfico de barras de distribuição ZAF; filtros de ano letivo e turma no topo; painel lateral com estatísticas resumidas]*

### Gráficos e indicadores disponíveis

- **Evolução do IMC:** gráfico de linha que mostra a evolução média do IMC por turma ao longo do ano letivo
- **Condição Física:** evolução dos resultados médios dos testes físicos por turma
- **Distribuição ZAF:** gráfico de barras ou circular que mostra quantos alunos estão em cada zona de aptidão (Saudável, Melhoria, Fora de Zona)

### Filtros disponíveis

- **Ano letivo:** compare dados de diferentes anos letivos
- **Turma:** analise uma turma específica ou todas as turmas em conjunto

> [!TIP]
> Use os filtros de ano letivo para comparar a evolução de uma turma entre o 1.º e o 3.º período. Isto permite identificar se as intervenções estão a ter efeito.

---

## 15. Relatórios

**Para quem:** Professor, Administrador (gerar e enviar); Encarregado de Educação (consultar)

Os relatórios são documentos PDF individuais que resumem toda a informação de saúde de um aluno, gerados de forma automática pela plataforma.

*[Ecrã de relatórios — lista de relatórios gerados com data, aluno e estado de envio; botão "Gerar Relatório" com seleção de aluno; botão "Enviar por Email"]*

---

### 15.1 Gerar um Relatório Individual

1. Aceda a **Relatórios** (`/relatorio`) na barra de navegação.
2. Clique em **"Gerar Relatório"**.
3. Selecione o **aluno** para quem pretende gerar o relatório.
4. Selecione o **período letivo** que pretende incluir (ou "Ano completo").
5. Clique em **"Gerar"**.
6. O relatório será criado automaticamente em PDF.
7. Pode **descarregar** o PDF ou **enviar por email** diretamente a partir desta página.

**O relatório inclui:**
- Dados de identificação do aluno
- Medições biométricas e evolução do IMC
- Resultados dos testes físicos e ZAF
- Resumo dos questionários respondidos e respetivos resultados
- Dispensas médicas ativas no período
- Data de geração e professor responsável

---

### 15.2 Enviar Relatório por Email

Para enviar o relatório ao encarregado de educação:

1. Na página **Relatórios**, localize o relatório que pretende enviar.
2. Clique em **"Enviar por Email"**.
3. O sistema mostrará a lista de encarregados de educação associados ao aluno.
4. Selecione os destinatários.
5. Opcionalmente, adicione uma mensagem personalizada.
6. Clique em **"Enviar"**.

O encarregado de educação receberá o email com o relatório PDF em anexo.

> [!NOTE]
> O histórico de todos os relatórios enviados fica registado na plataforma. Pode ver quando foi enviado, para quem e por que professor.

---

## 16. Guardiões (Encarregados de Educação)

**Para quem:** Professor, Administrador (associar); Encarregado de Educação (consultar)

A funcionalidade de **Guardiões** (`/guardioes`) permite associar encarregados de educação a alunos e garantir que os pais têm acesso à informação dos seus educandos.

*[Ecrã de guardiões — lista de alunos com respetivos encarregados associados; botão "Associar Encarregado"; painel de detalhe com email e relação (pai/mãe/outro)]*

---

### 16.1 Associar um Encarregado a um Aluno

**Para quem:** Professor, Administrador

1. Aceda a **Guardiões** (`/guardioes`) na barra de navegação.
2. Clique em **"Associar Encarregado"**.
3. Selecione o **aluno** da lista.
4. Introduza o **email do encarregado de educação** (deve coincidir com o email da conta do encarregado na plataforma).
5. Selecione a **relação** (Pai, Mãe, Encarregado Legal, Outro).
6. Clique em **"Guardar"**.

A partir desse momento, o encarregado terá acesso aos dados de saúde do aluno através da sua conta na plataforma.

> [!NOTE]
> Um aluno pode ter **mais de um encarregado** associado. Todos os encarregados associados receberão os relatórios enviados por email.

---

### 16.2 Ver os Alunos Associados (Encarregado)

Quando faz login como encarregado de educação, vê automaticamente no seu **Dashboard** e na página **Guardiões** a lista dos alunos que lhe estão associados.

Para cada aluno, pode:
- Ver os **dados de saúde** (biometria, testes, questionários) — em modo de leitura
- Consultar os **relatórios** disponíveis
- Descarregar relatórios em PDF

> [!IMPORTANT]
> Como encarregado de educação, **não pode alterar nenhum dado** do seu educando. Caso identifique algum erro, contacte o professor responsável.

---

## 17. Perfil de Utilizador

**Para quem:** Todos os perfis

A página **Perfil** (`/perfil`) permite gerir a sua conta pessoal na plataforma.

*[Ecrã de perfil — foto de perfil (ou inicial do nome); campos editáveis: nome; secção de segurança com botão "Mudar Palavra-passe"; secção RGPD com data de consentimento e botão para consultar]*

### O que pode fazer no perfil

- **Alterar o nome:** clique no campo do nome, faça a alteração e clique em "Guardar".
- **Mudar a palavra-passe:** clique em "Mudar Palavra-passe" e siga as instruções (ver secção [4.4](#44-mudar-a-palavra-passe)).
- **Consultar o consentimento RGPD:** veja a data em que aceitou os termos de privacidade e consulte o documento de consentimento.

> [!NOTE]
> Não é possível alterar o endereço de email da sua conta. Se precisar de alterar o email, contacte o Administrador da plataforma.

---

## 18. Administração da Plataforma

**Para quem:** Administrador (exclusivo)

A página de **Administração** (`/admin`) é o painel de controlo central do administrador. Permite criar e gerir todas as contas da plataforma.

*[Ecrã de administração — lista de utilizadores com filtro por perfil; botão "Criar Conta de Staff"; ações por utilizador: reset de password, remover conta]*

---

### 18.1 Criar Contas de Staff

Como administrador, é da sua responsabilidade criar as contas dos professores e psicólogos. Eles **não podem criar as suas próprias contas** de forma pública.

1. Aceda a **Administração** (`/admin`).
2. Clique em **"Criar Conta de Staff"**.
3. Preencha o formulário:
   - **Nome completo**
   - **Email** (será o email de login do utilizador)
   - **Perfil:** Professor ou Psicólogo
   - **Palavra-passe temporária** (o utilizador será obrigado a alterar no primeiro login)
4. Clique em **"Criar"**.

O utilizador receberá um email com as suas credenciais de acesso e instruções para fazer o primeiro login.

> [!TIP]
> Use uma palavra-passe temporária simples mas que cumpra os requisitos de segurança, e certifique-se de que o utilizador a altera no primeiro login. O sistema forçará essa alteração automaticamente.

---

### 18.2 Gerir Utilizadores

Na página de Administração, pode ver a lista completa de todos os utilizadores registados na plataforma, incluindo alunos, encarregados, professores e psicólogos.

**Filtros disponíveis:**
- Por **perfil** (Admin, Professor, Psicólogo, Aluno, Encarregado)
- Por **estado** (ativo, pendente de verificação)
- **Pesquisa** por nome ou email

**Ações disponíveis por utilizador:**
- Fazer **reset de palavra-passe**
- **Remover conta** (com confirmação obrigatória)

---

### 18.3 Reset de Palavra-passe

Se um utilizador esqueceu a palavra-passe e não consegue recuperá-la, pode fazer um reset manual:

1. Na página **Administração**, localize o utilizador.
2. Clique em **"Reset de Password"**.
3. O sistema pedirá confirmação — clique em **"Confirmar"**.
4. O utilizador receberá um email com uma nova palavra-passe temporária.
5. No próximo login, o utilizador será obrigado a definir uma nova palavra-passe.

> [!CAUTION]
> O reset de palavra-passe termina imediatamente todas as sessões ativas do utilizador. Use apenas quando estritamente necessário e avise o utilizador que irá receber um email com as novas credenciais.

---

## 19. Auditoria

**Para quem:** Administrador (exclusivo)

A página de **Auditoria** (`/auditoria`) regista automaticamente todas as ações sensíveis realizadas na plataforma — quem fez o quê, quando e a partir de que endereço IP.

*[Ecrã de auditoria — tabela com colunas: Data/Hora, Utilizador, Ação, IP; filtros de data, utilizador e tipo de ação; botão de exportação]*

### Para que serve o log de auditoria?

- **Rastreabilidade:** saber quem acedeu a que informação e quando
- **Segurança:** identificar acessos suspeitos ou não autorizados
- **Conformidade RGPD:** demonstrar que o acesso aos dados pessoais é controlado e registado

### Informações registadas

| Campo | Descrição |
|---|---|
| **Data/Hora** | Timestamp exato da ação |
| **Utilizador** | Nome e email de quem realizou a ação |
| **Ação** | Descrição da ação (ex: "Login", "Reset de password", "Visualização de perfil de aluno") |
| **IP** | Endereço IP a partir do qual a ação foi realizada |

### Filtros disponíveis

- **Por tipo de ação:** filtre apenas logins, resets, acessos a perfis, etc.
- **Por utilizador:** veja todas as ações de um utilizador específico
- **Por intervalo de datas:** defina uma data de início e fim para o período que pretende analisar

> [!NOTE]
> O log de auditoria é **imutável** — nenhum utilizador, incluindo o administrador, pode apagar ou editar os registos de auditoria. Isto garante a integridade do registo.

---

## 20. Elementos de Interface Comuns

Esta secção descreve os elementos de interface que estão presentes em toda a plataforma, independentemente da página em que se encontra.

### 20.1 Barra de Navegação Lateral

*[Barra lateral — ícones com etiquetas de texto para cada secção; secção ativa destacada; parte inferior com ícone de perfil e logout]*

A barra de navegação lateral está sempre visível no lado esquerdo do ecrã. Permite navegar entre as diferentes secções da plataforma com um único clique.

Os ícones apresentados variam consoante o seu perfil — cada utilizador vê apenas as secções a que tem acesso.

Para **fechar sessão**, clique no ícone de logout (🚪) na parte inferior da barra lateral.

---

### 20.2 Modo Claro e Modo Escuro

*[Header da plataforma — ícone de sol/lua no canto superior direito; quando clicado, toda a interface muda de tema]*

Pode alternar entre o tema claro (fundo branco) e o tema escuro (fundo escuro) a qualquer momento, clicando no ícone de **sol/lua** no canto superior direito de qualquer página.

A sua preferência é guardada automaticamente e aplicada na próxima vez que fizer login.

> [!TIP]
> O modo escuro é especialmente útil para utilizar a plataforma em ambientes com pouca luz — por exemplo, numa sala com projetor ligado.

---

### 20.3 Idioma PT / EN

A plataforma está disponível em **Português (Portugal)** e **Inglês**. Para mudar o idioma, clique no seletor de idioma (PT / EN) no canto superior direito.

A mudança de idioma é instantânea e afeta toda a interface, incluindo labels, mensagens de erro e botões.

---

### 20.4 Notificações (Toasts)

*[Toast de confirmação — mensagem verde no canto inferior direito com texto "Medição registada com sucesso" e ícone de visto]*

Após realizar uma ação (guardar dados, enviar email, criar registo), aparecerá uma **notificação breve** (toast) no canto inferior direito do ecrã a confirmar o resultado:

- 🟢 **Verde / Sucesso:** a ação foi concluída com êxito
- 🔴 **Vermelho / Erro:** ocorreu um problema — leia a mensagem para saber o que corrigir
- 🟡 **Amarelo / Aviso:** a ação foi concluída, mas há algo a ter em atenção

As notificações desaparecem automaticamente após alguns segundos.

---

### 20.5 Tabelas, Pesquisa e Paginação

Todas as listas longas (alunos, dispensas, relatórios, etc.) são apresentadas em tabelas com:

- **Barra de pesquisa:** filtrar a lista em tempo real enquanto escreve
- **Cabeçalhos clicáveis:** clique num cabeçalho de coluna para ordenar a lista por esse campo (ascendente/descendente)
- **Paginação:** controles no fundo da tabela para navegar entre páginas (ex: Anterior | 1 2 3 ... | Seguinte)
- **Seletor de itens por página:** escolha quantas linhas ver por página (10, 25, 50)

---

### 20.6 Estados Vazios e Carregamento

**Estado Vazio ("Sem dados"):**
Quando uma lista não tem entradas, a plataforma mostra uma mensagem informativa no centro da área de conteúdo (ex: "Ainda não existem alunos registados"). Isto é normal e não indica um erro.

**Carregamento (Loading Skeletons):**
Enquanto os dados estão a ser carregados, a plataforma mostra um efeito de "esqueleto" — retângulos cinzentos animados no lugar onde os dados aparecerão. Isto indica que a plataforma está a trabalhar e que não precisa de fazer nada.

**Confirmações de ações destrutivas:**
Antes de executar uma ação irreversível (como eliminar um registo ou remover uma conta), a plataforma mostrará um modal de confirmação com os botões **"Cancelar"** e **"Confirmar"**. Só após clicar em "Confirmar" é que a ação será executada.

---

## 21. Privacidade e RGPD

O HealthyTech Atlântico foi desenvolvido em conformidade com o **Regulamento Geral de Proteção de Dados (RGPD)** e com a legislação nacional de proteção de dados.

### Princípios aplicados

- **Minimização de dados:** recolhemos apenas os dados estritamente necessários para os objetivos da plataforma
- **Finalidade explícita:** os dados são utilizados exclusivamente para acompanhamento da saúde e bem-estar escolar
- **Controlo de acesso:** cada utilizador acede apenas à informação relevante para as suas funções
- **Registo de auditoria:** todos os acessos a dados pessoais são registados e rastreáveis
- **Consentimento:** o registo na plataforma exige aceitação explícita dos termos de privacidade

### Os seus direitos

Enquanto titular dos dados (ou encarregado de educação de menor), tem o direito de:

- **Aceder** aos seus dados pessoais armazenados na plataforma
- **Retificar** dados incorretos (através do professor ou administrador)
- **Apagar** os seus dados (mediante pedido formal à escola)
- **Portabilidade:** receber os seus dados num formato estruturado
- **Opor-se** ao tratamento de dados em determinadas circunstâncias

Para exercer qualquer um destes direitos, contacte o responsável pelo tratamento de dados da escola.

### Dados recolhidos e finalidade

| Tipo de dado | Finalidade |
|---|---|
| Nome e data de nascimento | Identificação do aluno |
| Email | Autenticação e comunicação |
| Dados biométricos (altura, peso, IMC) | Acompanhamento da saúde física |
| Resultados de testes físicos | Avaliação da aptidão física |
| Respostas a questionários | Avaliação do bem-estar emocional e alimentar |
| Alertas SOS | Resposta a situações de crise |
| Registos de acesso (IP, timestamps) | Segurança e conformidade legal |

> [!CAUTION]
> Os dados de saúde dos alunos são considerados **dados sensíveis** ao abrigo do RGPD. O acesso a estes dados é estritamente controlado e limitado ao pessoal autorizado.

### Consentimento RGPD no registo

No momento do registo, todos os utilizadores devem aceitar explicitamente os termos de privacidade. Esta aceitação fica registada na plataforma com data e hora. Pode consultar o documento de consentimento a qualquer momento na página **Perfil**.

---

## 22. Perguntas Frequentes (FAQ)

### ❓ Não recebi o email de verificação. O que faço?

1. Verifique a pasta de **Spam** ou **Correio Indesejado** do seu email.
2. Se não estiver lá, regresse à página de verificação e clique em **"Reenviar email"**.
3. Se continuar sem receber, contacte o Administrador da plataforma.

---

### ❓ Esqueci-me da minha palavra-passe. Como recupero?

Na página de login, clique em **"Esqueci a palavra-passe"** e introduza o seu email. Receberá um link de recuperação. Se não funcionar, contacte o Administrador para fazer um reset manual.

---

### ❓ O meu aluno não consegue responder ao questionário KIDMED. Porquê?

O questionário KIDMED requer consentimento parental registado na plataforma. O professor responsável deve registar esse consentimento no perfil do aluno, no separador Questionários. Só depois o questionário ficará disponível para o aluno.

---

### ❓ Posso alterar as respostas a um questionário depois de o submeter?

Não. Após a submissão, as respostas ficam bloqueadas. Esta é uma regra de integridade dos dados — os questionários são instrumentos de avaliação e as respostas não podem ser alteradas retroativamente.

---

### ❓ Como sei se o meu educando respondeu aos questionários?

Como encarregado de educação, pode ver os questionários respondidos pelo seu educando na página do seu perfil (aceda através do Dashboard). O estado de cada questionário (Respondido / Pendente) é visível na lista.

---

### ❓ O que acontece ao alerta SOS quando é marcado como resolvido?

O alerta SOS muda de estado para "Resolvido" e passa para o histórico. O aluno pode ver no seu Dashboard que o alerta foi resolvido. Os dados do alerta ficam guardados para referência futura.

---

### ❓ Posso usar a plataforma no telemóvel?

Sim. A plataforma foi desenvolvida de forma responsiva e funciona em dispositivos móveis (telemóvel e tablet), embora a experiência seja otimizada para ecrãs maiores (computador ou tablet).

---

### ❓ Os dados dos alunos são partilhados com terceiros?

Não. Os dados dos alunos são utilizados exclusivamente para as finalidades descritas neste manual e na política de privacidade da plataforma. Não são partilhados com terceiros sem consentimento explícito.

---

### ❓ Como posso mudar o idioma da plataforma?

Clique no seletor de idioma (**PT / EN**) no canto superior direito de qualquer página. A mudança é instantânea.

---

### ❓ Sou professor e não consigo criar uma conta. O que faço?

As contas de Professor e Psicólogo são criadas pelo Administrador da plataforma. Contacte o administrador da sua escola para que crie a sua conta e lhe envie as credenciais de acesso.

---

### ❓ O que são os "loading skeletons" que aparecem às vezes?

São animações visuais que indicam que a plataforma está a carregar dados. Aparecem brevemente enquanto a página processa a informação. Não precisa de fazer nada — desaparecem assim que os dados estiverem prontos.

---

## 23. Resolução de Problemas

### A plataforma não carrega / está muito lenta

1. Verifique a sua ligação à Internet.
2. Tente refrescar a página (tecla **F5** ou botão de atualizar do browser).
3. Limpe o cache e os cookies do browser (normalmente em Definições → Privacidade → Limpar dados de navegação).
4. Tente noutro browser.
5. Se o problema persistir, contacte o suporte.

---

### Estou a ver uma mensagem de erro a vermelho

As mensagens de erro são informativas — leia-as com atenção. As mais comuns são:

| Mensagem de erro | O que significa | O que fazer |
|---|---|---|
| "Email ou palavra-passe incorretos" | Credenciais de login erradas | Verifique o email e a palavra-passe; use a recuperação de password se necessário |
| "Conta não verificada" | O email ainda não foi verificado | Verifique a caixa de entrada e clique no link de verificação |
| "Sessão expirada" | A sessão ficou inativa durante demasiado tempo | Faça login novamente |
| "Sem permissão para esta ação" | O seu perfil não tem acesso a esta funcionalidade | Contacte o Administrador se achar que é um erro |
| "Ficheiro CSV inválido" | O ficheiro de importação tem erros de formato | Verifique o formato e use o modelo fornecido pelo sistema |

---

### Não consigo fazer upload de um ficheiro

- Verifique se o ficheiro está no formato correto (CSV para importações).
- Verifique se o tamanho do ficheiro não ultrapassa o limite (geralmente 5 MB).
- Certifique-se de que o ficheiro não está aberto noutro programa (ex: Excel).

---

### A página de SOS não está a atualizar

Os alertas SOS atualizam-se em tempo real. Se não estiver a ver atualizações:

1. Verifique a sua ligação à Internet.
2. Tente refrescar a página.
3. Verifique se o browser está atualizado.

---

### Não recebi o relatório por email

1. Verifique a pasta de Spam do seu email.
2. Confirme com o professor se o relatório foi realmente enviado (ver histórico de relatórios na plataforma).
3. Se o email associado à conta estiver errado, contacte o professor ou administrador para corrigir.

---

## 24. Contacto e Suporte

Se encontrar algum problema que não consiga resolver com a ajuda deste manual, contacte a equipa de suporte da plataforma:

| Canal | Detalhes |
|---|---|
| **Email de suporte** | suporte@healthytech-atlantico.pt |
| **Responsável na escola** | Contacte o Administrador da plataforma ou o Diretor de Turma |
| **RGPD / Proteção de Dados** | privacidade@healthytech-atlantico.pt |

**Antes de contactar o suporte, tenha à mão:**
- O seu email de login
- O nome do browser que está a usar
- Uma descrição do problema ou erro (se possível, com a mensagem de erro exata)
- Os passos que realizou antes do problema aparecer

---

> [!NOTE]
> Este manual será atualizado sempre que existirem alterações significativas à plataforma. A versão mais recente está sempre disponível em `docs/manual-utilizador.md` no repositório do projeto.

---

*Manual elaborado pela equipa HealthyTech Atlântico · Colégio Atlântico · Junho 2026*

*Versão 1.0 — Para uso interno. Todos os direitos reservados.*
