# HealthyTech Atlântico - Política de Proteção de Dados (GDPR)

Esta política descreve a classificação de dados, esquemas de encriptação, e fluxos DPIA/DSAR implementados pela aplicação escolar, em resposta direta às auditorias técnicas. 

Dada a natureza regulada desta plataforma (lida com menores de idade e dados de saúde e psicológicos), as regras de segurança aplicamos as seguintes abordagens estritas.

## 1. Classificação de Dados

A base de dados lida com quatro (4) níveis de classificação de dados:

1. **Nível 1 - Dados Públicos**: Informações que não identificam pessoalmente estudantes ou staff, tais como listas de Escolas ou Anos Letivos genéricos. Risco: Nulo.
2. **Nível 2 - Dados Identificativos (PII)**: Nomes, endereços de email de Encarregados de Educação (`guardians`), ou IDs de Processo Administrativo (`processNumber`). Risco: Médio.
   - Proteção exigida: Restrição por Role-Based Access Control (RBAC). 
3. **Nível 3 - Dados Biométricos / Físicos**: IMC, Altura, Peso, Registos de Testes Físicos. Risco: Alto.
   - Proteção exigida: Requer campo `consentRgpd = true` e consentimento expresso gravado na plataforma, sem ser partilhável de forma livre.
4. **Nível 4 - Dados Psicológicos Restritos (Special Category)**: Os payloads resultantes dos inquéritos KIDMED, Autoconceito e Autoestima (`Questionnaire.payload`), assim como os alertas de Risco de Suicídio e Intervenção Rápida (`SosAlert`). Risco: Crítico.
   - Proteção exigida: Os dados estruturados (`Questionnaire.payload`) DEVEM ser encriptados _At Rest_ via cifra de campos. Apenas o Staff Médico ou o Psicólogo autorizado podem acedê-los via desencriptação em tempo real. 

## 2. Padrões de Retenção e "Soft Deletion"

Para mitigar a perda acidental de dados de menores de idade, ou em casos de disputas parentais relativas a registos médicos pregressos, a base de dados adota exclusão lógica ("pseudonimização via Soft Delete"):

* **[Planned / In-progress]** Os registos de Estudante possuirão uma coluna `archivedAt`. Estes registos não serão excluídos fisicamente (`onDelete: Cascade` será revogado para evitar Perda Indevida de Dados).
* **[Planned / In-progress]** Após inatividade contratual superior a 3 Anos ou pedido do titular (DSAR), o script de Anonymization em `cronjobs/` limpará o CPF e Dados Pessoais do Aluno sem perder as médias globais agragadas sobre as coortes letivas de saúde.
* Alertas do tipo `SosAlert` não sofrem cascading-delete, permanecendo gravados para averiguação judicial e escolar.

## 3. Encriptação Baseada em Campo (Field-Level Encryption)

Em vez de depender apenas do Storage Encyption do fornecedor Cloud, utilizamos o módulo `crypto` do NodeJS (`AES-256-GCM`) presente em `src/lib/encryption.ts` em Payload Fields sensíveis:

- **[Planned / In-progress]** O Campo `payload (JSON)` no modelo Prisma de `Questionnaire` passará primeiramente pelo utilitário `encryptData(payload: object)`. Isto acobertará as respostas sensíveis aos questionários contra eventuais capturas do Snapshot do Backend Subjacente (via injecção, roubo de credenciais da Admin ou DataBreach global Cloud).
- O módulo utiliza uma cifra inicializada (`IV`) autêntica, gerando strings com a formatação: `IV:AuthTag:CipherDataBase64`.
- A chave-mestra `ENCRYPTION_KEY` será forçosamente passada nas Variaveis de Ambiente do Serviço Vercel Produtivo, mantida selada pela Segurança do Cliente de Hosting.

## 4. Direito ao Apagamento e DSAR (Data Subject Access Request)

A Lei Nacional exige suporte formal ao RGPD.
A plataforma HealthyTech suporta dois tipos principais de Fluxos RGPD (DSAR):

- **Pedido de Acesso:** Exportação dos dados de um utilizador específico ou estudante de forma JSON limpa e interoperável (Data Portability). 
- **Pedido de Retificação / Eliminação Total ("Right to be Forgotten"):** Por defeito os utilizadores acionam um _Soft Delete_ (que é o `archivedAt`). A deleção física absoluta é aplicada apenas após a resolução total de qualquer _SosAlert_ ativo ou período contratual via Staff Administrador ou Pedido Formal.

--- 
*Documento aprovado como parte da Auditoria Técnica e Remediação Tecnológica Central.*
