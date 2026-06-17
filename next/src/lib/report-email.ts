import { escapeHtml } from "@/lib/utils";

export type ReportEmailBiometric = {
  heightM: number;
  weightKg: number;
  imc: number;
  imcZone: string;
} | null;

export type ReportEmailTest = {
  testId: string;
  valueText: string;
  unit: string;
  zone: string;
};

export function buildReportHtml(params: {
  studentName: string;
  guardianName: string | null;
  className: string | null;
  schoolYear: string | null;
  title: string;
  latestBiometric: ReportEmailBiometric;
  latestTests: ReportEmailTest[];
}) {
  const biometricBlock = params.latestBiometric
    ? `
      <p><strong>Altura:</strong> ${params.latestBiometric.heightM} m</p>
      <p><strong>Peso:</strong> ${params.latestBiometric.weightKg} kg</p>
      <p><strong>IMC:</strong> ${params.latestBiometric.imc} (${escapeHtml(params.latestBiometric.imcZone)})</p>
    `
    : "<p>Sem dados biométricos recentes.</p>";

  const testsBlock = params.latestTests.length
    ? `<ul>${params.latestTests
        .map(
          (test) =>
            `<li><strong>${escapeHtml(test.testId)}</strong>: ${escapeHtml(test.valueText)} ${escapeHtml(test.unit)} (${escapeHtml(test.zone)})</li>`,
        )
        .join("")}</ul>`
    : "<p>Sem testes físicos recentes.</p>";

  return `
    <div style="font-family: Arial, sans-serif; color: #14304c; line-height: 1.5;">
      <h2>${escapeHtml(params.title)}</h2>
      <p>Olá${params.guardianName ? ` ${escapeHtml(params.guardianName)}` : ""},</p>
      <p>Segue o resumo mais recente do aluno <strong>${escapeHtml(params.studentName)}</strong>.</p>
      <p><strong>Turma:</strong> ${escapeHtml(params.className ?? "Sem turma")}<br /><strong>Ano letivo:</strong> ${escapeHtml(params.schoolYear ?? "N/D")}</p>
      <h3>Biometria</h3>
      ${biometricBlock}
      <h3>Testes físicos</h3>
      ${testsBlock}
    </div>
  `;
}
