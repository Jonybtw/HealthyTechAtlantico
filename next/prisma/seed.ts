import "dotenv/config";
import { PrismaClient, Role, Sex, QuestionnaireType } from "@prisma/client";
//Utiliza o PrismaPg com um pool de ligações do pacote pg para gerir 
// eficientemente as comunicações com o PostgreSQL.
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
//Implementa o bcryptjs para garantir que todos os utilizadores criados 
//(Admin, Professor, Psicólogo, Alunos) possuam hashes de palavras-passe seguros (Password1).
import bcrypt from "bcryptjs";
import { getPgSslConfig } from "../src/lib/database-ssl";
import { INTERNAL_EMAIL_DOMAIN } from "../src/lib/email-rules";

// Configura a ligação ao PostgreSQL utilizando um pool de ligações, e
//  o PrismaPg como adaptador para o Prisma Client, garantindo uma 
// gestão eficiente das conexões com a base de dados durante o processo de seeding.
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: false,
});
// Para ambientes de produção, é importante configurar o SSL corretamente
//  para garantir a segurança da ligação à base de dados.
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

// Define as opções de teste que serão utilizadas para gerar resultados 
// realistas
const TEST_OPTIONS = [
  { id: "vai", unit: "percursos" },
  { id: "cooper", unit: "m" },
  { id: "milha", unit: "mm:ss" },
  { id: "velocidade", unit: "s" },
  { id: "agilidade", unit: "s" },
  { id: "abd", unit: "reps" },
  { id: "bracos", unit: "reps" },
  { id: "senta", unit: "cm" },
];

// A função principal do seed é responsável por gerar uma quantidade 
// significativa de dados realistas para a aplicação, incluindo 
// utilizadores, alunos, sessões de avaliação, dados biométricos e 
// resultados de testes, para criar um ambiente de teste robusto e 
// representativo do mundo real.
async function main() {
  console.log("🌱 Advanced Seeding database with massive realistic demo data...");

  // Limpa os dados existentes para evitar duplicações e garantir um 
  // estado consistente antes de inserir os novos dados.
  console.log("Cleaning existing data...");
  await prisma.auditLog.deleteMany();
  await prisma.studentGuardian.deleteMany();
  await prisma.exemption.deleteMany();
  await prisma.report.deleteMany();
  await prisma.sosAlert.deleteMany();
  await prisma.questionnaire.deleteMany();
  await prisma.test.deleteMany();
  await prisma.biometric.deleteMany();
  await prisma.evaluationSession.deleteMany();
  await prisma.student.deleteMany();
  await prisma.schoolClass.deleteMany();
  await prisma.academicYear.deleteMany();
  // Mantém os utilizadores essenciais (Admin, Professor, Psicólogo, e um 
  // exemplo de Pais) e remove apenas os alunos demo para evitar a 
  // exclusão acidental de contas importantes.
  await prisma.user.deleteMany({
    where: {
      email: {
        notIn: [`admin@${INTERNAL_EMAIL_DOMAIN}`, `professor@${INTERNAL_EMAIL_DOMAIN}`, `psicologo@${INTERNAL_EMAIL_DOMAIN}`, "joao.ferreira@gmail.com"]
      }
    }
  });

  // Define os emails para os utilizadores essenciais (Admin, Professor, Psicólogo, 
  // e um exemplo de Pais) e cria-os na base de dados com palavras-passe 
  // seguras, garantindo que esses utilizadores tenham acesso ao sistema 
  // para fins de teste e administração.
  const adminEmail = `admin@${INTERNAL_EMAIL_DOMAIN}`;
  const professorEmail = `professor@${INTERNAL_EMAIL_DOMAIN}`;
  const psychologistEmail = `psicologo@${INTERNAL_EMAIL_DOMAIN}`;
  const parentEmail = "joao.ferreira@gmail.com";
  const hash = await bcrypt.hash("Password1", 12);

  // Utiliza o método upsert para criar os utilizadores essenciais, garantindo
  //  que eles sejam criados apenas se não existirem, evitando duplicações 
  // e mantendo a integridade dos dados, especialmente considerando que 
  // esses utilizadores são fundamentais para o funcionamento do sistema.
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, name: "Admin Atlântico", passwordHash: hash, role: Role.ADMIN, consentRgpd: true, consentShare: true },
  });

  const professor = await prisma.user.upsert({
    where: { email: professorEmail },
    update: {},
    create: { email: professorEmail, name: "Prof. Carlos Silva", passwordHash: hash, role: Role.PROFESSOR, consentRgpd: true },
  });

  await prisma.user.upsert({
    where: { email: psychologistEmail },
    update: {},
    create: { email: psychologistEmail, name: "Dr. Ana Rodrigues", passwordHash: hash, role: Role.PSICOLOGO, consentRgpd: true },
  });

  // Cria um utilizador para o pai "João Ferreira" com o email "
  const parentUser = await prisma.user.upsert({
    where: { email: parentEmail },
    update: {},
    create: { email: parentEmail, name: "João Ferreira", passwordHash: hash, role: Role.PAIS, consentRgpd: true },
  });

  // Define os anos letivos para os quais serão criadas as turmas e os 
  // alunos, e insere esses anos na base de dados, garantindo que haja 
  // uma estrutura organizacional clara para associar as turmas e os 
  // alunos aos anos letivos correspondentes.
  const years = ["2024/2025", "2025/2026"];
  const dbYears = [];
  for (const y of years) {
    const ay = await prisma.academicYear.create({ data: { label: y } });
    dbYears.push(ay);
  }

  // Define as classes para cada ano letivo e armazena-as num mapa 
  // para referência futura.
  const classesConfig = ["7ºA", "7ºB", "8ºA", "8ºB", "9ºA"];
  const clsMap = new Map();
  
  for (const year of dbYears) {
    for (const c of classesConfig) {
      const cls = await prisma.schoolClass.create({
        data: { name: c, academicYearId: year.id }
      });
      clsMap.set(`${year.label}-${c}`, cls);
    }
  }

  // Gera uma lista de nomes masculinos e femininos comuns em Portugal, 
  // bem como uma lista de apelidos comuns, para criar nomes realistas para os alunos.
  const firstNamesM = ["Diogo", "João", "Tiago", "Miguel", "Gonçalo", "Pedro", "Rui", "Tomás", "Martim", "Dinis", "Rodrigo", "Guilherme", "Afonso", "Francisco"];
  const firstNamesF = ["Maria", "Ana", "Beatriz", "Inês", "Sofia", "Margarida", "Leonor", "Carolina", "Mariana", "Matilde", "Laura", "Lara", "Joana"];
  const lastNames = ["Silva", "Santos", "Ferreira", "Pereira", "Oliveira", "Costa", "Rodrigues", "Martins", "Jesus", "Sousa", "Fernandes", "Gomes", "Marques", "Almeida", "Ribeiro"];

  const students = [];
  let studentCounter = 1;

  // Para cada classe definida, gera um número específico de alunos (15 neste caso) com atributos realistas,
  // incluindo nome, sexo, data de nascimento, email, e os associa a um utilizador e a uma turma específica.
  for (const className of classesConfig) {
    const numStudents = 15; 
    // Para cada aluno, gera um nome realista combinando um nome próprio (masculino ou feminino) com um apelido,
    // e atribui um sexo correspondente. A data de nascimento é gerada com base na idade típica para a classe, 
    // adicionando um toque de realismo ao perfil dos alunos. O email é 
    // criado de forma consistente com um padrão específico para alunos 
    // demo, garantindo que seja fácil de identificar e gerenciar esses 
    // utilizadores na base de dados.
    for (let i = 0; i < numStudents; i++) {
      const isM = Math.random() > 0.5;
      const firstName = isM ? firstNamesM[Math.floor(Math.random() * firstNamesM.length)] : firstNamesF[Math.floor(Math.random() * firstNamesF.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${lastName}`;
      const sex = isM ? Sex.M : Sex.F;
      
      const ageOff = className.startsWith('7') ? 12 : className.startsWith('8') ? 13 : 14;
      const birthYear = 2025 - ageOff;
      const birthDate = new Date(`${birthYear}-0${Math.floor(Math.random()*8)+1}-15`);

      const email = `aluno.demo.${studentCounter}@${INTERNAL_EMAIL_DOMAIN}`;
      studentCounter++;
      
      const user = await prisma.user.create({
        data: { email, name, passwordHash: hash, role: Role.ALUNO, consentRgpd: true }
      });

      const student = await prisma.student.create({
        data: {
          name,
          sex,
          birthDate,
          linkedUserId: user.id,
          createdById: admin.id,
          schoolYear: "2025/2026",
          className,
          processNumber: `P${new Date().getFullYear()}${studentCounter.toString().padStart(4, '0')}`,
        }
      });
      students.push({ student, ageOff });
    }
  }

  // Define os períodos de avaliação para cada ano letivo, incluindo o 
  // rótulo do período e o ano letivo correspondente, para criar sessões 
  // de avaliação realistas para cada aluno.
  const terms = [
    { year: "2024/2025", term: "1º Período" },
    { year: "2024/2025", term: "2º Período" },
    { year: "2024/2025", term: "3º Período" },
    { year: "2025/2026", term: "1º Período" },
    { year: "2025/2026", term: "2º Período" },
  ];

  // Inicializa um contador de progresso para acompanhar o número de 
  // alunos processados durante a geração dos dados, e exibe uma mensagem 
  // inicial no console indicando o início do processo de geração de dados
  //  para os alunos.
  let progress = 0;
  console.log(`Generating records for ${students.length} students across 5 evaluation sessions...`);

  // Para cada aluno, gera sessões de avaliação para cada período definido, 
  // com datas realistas, e insere dados biométricos e resultados de 
  // testes para cada sessão, simulando o progresso dos alunos ao longo 
  // do tempo.
  for (const {student, ageOff} of students) {
    let baseHeight = student.sex === "M" ? 1.45 + (ageOff - 12) * 0.05 + Math.random() * 0.1 : 1.48 + (ageOff - 12) * 0.02 + Math.random() * 0.1;
    let baseWeight = student.sex === "M" ? 38 + (ageOff - 12) * 5 + Math.random() * 10 : 40 + (ageOff - 12) * 3 + Math.random() * 8;
    
    let baseVai = Math.floor(20 + Math.random() * 40);
    let baseCooper = Math.floor(1600 + Math.random() * 800);
    let baseVelocidade = 8.5 - Math.random() * 1.5;

    // Para cada período de avaliação, gera uma sessão de avaliação com
    //  uma data realista, e insere dados biométricos e resultados de 
    // testes para cada sessão, simulando o progresso dos alunos ao longo
    //  do tempo.
    for (let t = 0; t < terms.length; t++) {
      const sessionLabel = terms[t].term;
      const schoolYear = terms[t].year;

      const sessionDate = new Date();
      sessionDate.setFullYear(parseInt(schoolYear.substring(0, 4)) + (sessionLabel.includes("1º") ? 0 : 1));
      sessionDate.setMonth(sessionLabel.includes("1º") ? 10 : sessionLabel.includes("2º") ? 2 : 5);
      sessionDate.setDate(15 + Math.floor(Math.random() * 10));

      // Utiliza uma transação para garantir que a criação da sessão de
      //  avaliação, dos dados biométricos e dos resultados dos testes 
      // sejam atômicas, mantendo a integridade dos dados mesmo em caso 
      // de falhas durante o processo de inserção.
      await prisma.$transaction(async (tx) => {
        const session = await tx.evaluationSession.create({
          data: {
            studentId: student.id,
            label: sessionLabel,
            schoolYear: schoolYear,
            createdById: professor.id,
            createdAt: sessionDate
          },
        });

        // Para cada sessão, gera dados biométricos realistas para o aluno,
        // incluindo altura, peso, perímetro da cintura, percentagem de 
        // gordura corporal, índice de massa corporal (IMC) e zonas de 
        // avaliação, simulando o progresso físico dos alunos ao longo do 
        // tempo. Para adicionar realismo, os dados biométricos são ajustados a cada 
        // sessão para refletir mudanças naturais no crescimento e 
        // desenvolvimento dos alunos, especialmente considerando as idades 
        // envolvidas.
        baseHeight += 0.01 + Math.random() * 0.01;
        baseWeight += 0.5 + Math.random() * 1.5;
        baseVai += Math.floor(Math.random() * 3);
        baseCooper += Math.floor(Math.random() * 50);
        baseVelocidade -= Math.random() * 0.1;

        const bmi = baseWeight / (baseHeight * baseHeight);

        // Insere os dados biométricos na base de dados para cada sessão 
        // de avaliação, associando-os ao aluno e à sessão correspondente,
        //  para criar um histórico detalhado do progresso físico dos 
        // alunos ao longo do tempo.
        await tx.biometric.create({
          data: {
            studentId: student.id,
            sessionId: session.id,
            heightM: Math.round(baseHeight * 100) / 100,
            weightKg: Math.round(baseWeight * 10) / 10,
            waistCm: Math.round((55 + Math.random() * 15) * 10) / 10,
            fatPct: Math.round((12 + Math.random() * 12) * 10) / 10,
            imc: Math.round(bmi * 10) / 10,
            imcZone: bmi < 18 ? "ZMF - Zona de Melhoria" : bmi < 24 ? "ZSAF - Zona Saudável" : "ZMF - Zona de Melhoria",
            waistZone: Math.random() > 0.8 ? "ZMF - Zona de Melhoria" : "ZSAF - Zona Saudável",
            fatZone: Math.random() > 0.8 ? "ZMF - Zona de Melhoria" : "ZSAF - Zona Saudável",
            recordedAt: sessionDate
          },
        });

        // Para cada teste definido em TEST_OPTIONS, gera resultados 
        // realistas para o aluno, com base em seus dados biométricos e 
        // idade, e insere esses resultados na base de dados, simulando o 
        // desempenho dos alunos em diferentes testes físicos ao longo do 
        // tempo.
        for (const opt of TEST_OPTIONS) {
          let valNum = 0;
          let strVal = "";
          
          switch (opt.id) {
            case "vai": valNum = baseVai; break;
            case "cooper": valNum = baseCooper; break;
            case "milha": 
              valNum = 8 + Math.random() * 4; 
              const m = Math.floor(valNum); 
              const s = Math.floor((valNum - m) * 60);
              strVal = `${m}:${s < 10 ? '0' : ''}${s}`; 
              break;
            case "velocidade": valNum = baseVelocidade; break;
            case "agilidade": valNum = 11 + Math.random() * 3; break;
            case "abd": valNum = Math.floor(15 + Math.random() * 35); break;
            case "bracos": valNum = Math.floor(5 + Math.random() * 25); break;
            case "senta": valNum = Math.round((15 + Math.random() * 20) * 10) / 10; break;
          }

          // Para os testes que não sejam a milha, arredonda os valores 
          // numéricos para uma casa decimal para manter a consistência 
          // e realismo dos dados, enquanto a milha mantém o formato de 
          // minutos e segundos.
          if(valNum > 0 && opt.id !== "milha") {
            valNum = Math.round(valNum * 10) / 10;
            strVal = valNum.toString();
          }

          const isGood = Math.random() > 0.3;

          // Insere os resultados dos testes na base de dados, associando-os
          //  ao aluno, à sessão de avaliação e ao teste correspondente, 
          // e atribui zonas de avaliação com base no desempenho, para criar 
          // um histórico detalhado do progresso dos alunos em diferentes 
          // testes físicos ao longo do tempo.
          await tx.test.create({
            data: {
              studentId: student.id,
              sessionId: session.id,
              testId: opt.id,
              valueNum: valNum,
              valueText: strVal,
              unit: opt.unit,
              zone: isGood ? "ZSAF - Zona Saudável" : "ZMF - Zona de Melhoria",
              recordedAt: sessionDate
            }
          });
        }
      
        // Para os períodos a partir do segundo, gera questionários de autoconceito 
        // com respostas realistas, simulando o feedback dos alunos sobre seus 
        // hábitos de sono, uso de telas, níveis de stress e bem-estar, para 
        // fornecer uma visão mais completa do estado dos alunos ao longo do 
        // tempo.
        if (t > 1) { 
          await tx.questionnaire.create({
            data: {
              studentId: student.id,
              type: QuestionnaireType.AUTOCONCEITO,
              payload: {
                sleepHours: 7 + Math.round(Math.random() * 2),
                screenHours: 1 + Math.round(Math.random() * 4),
                stressLevel: Math.floor(Math.random() * 6),
                wellnessLevel: 5 + Math.floor(Math.random() * 5),
              },
              submittedAt: sessionDate
            },
          });
        }
      }, {
        timeout: 30000 
      });
      
    }
    // Atualiza o progresso no console a cada 10 alunos processados para 
    // fornecer feedback visual durante a execução do seed, especialmente 
    // considerando o volume de dados sendo gerado.
    progress++;
    if (progress % 10 === 0) console.log(`  ...${progress} students processed`);

   // Para adicionar realismo, gera alertas SOS para cerca de 15% dos 
   // alunos, com datas de criação realistas e estados de resolução 
   // variados, associando-os ao psicólogo e professor definidos anteriormente.
    if (Math.random() < 0.15) {
      const isResolved = Math.random() > 0.5;
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 60)); // Up to 60 days ago
      
      // Insere um alerta SOS na base de dados para o aluno, associando-o 
      // ao psicólogo e professor definidos anteriormente, e atribui um 
      // estado
      await prisma.sosAlert.create({
        data: {
          studentId: student.id,
          psych: psychologistEmail, 
          teacher: professorEmail,
          psychEmail: psychologistEmail,
          teacherEmail: professorEmail,
          createdAt: createdDate,
          resolved: isResolved,
          resolvedAt: isResolved ? new Date() : null,
          resolvedById: isResolved ? admin.id : null, 
        }
      });
    }
  }
  // Após a geração de todos os dados, exibe um resumo no console indicando a conclusão do processo 
  // e o número total de alunos gerados, para fornecer uma visão geral do 
  // resultado do seed.
  console.log("✅ Advanced demo data seed complete!");
  console.log(`Generated ${students.length} students across 5 classes.`);
}

// Executa a função principal e captura quaisquer erros que possam ocorrer durante o
//  processo de seeding, garantindo que sejam logados no console e que 
// o processo seja encerrado com um código de erro apropriado. Além disso,
//  garante que as conexões com a base de dados sejam fechadas corretamente após a execução, 
// independentemente do sucesso ou falha do processo.
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
