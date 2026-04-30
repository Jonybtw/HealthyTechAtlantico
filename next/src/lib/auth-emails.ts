import { sendMail } from "@/lib/mailer";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendVerificationEmail({
  email,
  name,
  verificationUrl,
  audience,
}: {
  email: string;
  name?: string | null;
  verificationUrl: string;
  audience: "student" | "guardian";
}) {
  const safeName = name?.trim() ? escapeHtml(name.trim()) : "utilizador";
  const subject =
    audience === "student"
      ? "Ative a sua conta de aluno"
      : "Ative a sua conta de encarregado";

  const intro =
    audience === "student"
      ? "Recebemos o seu pedido de registo como aluno."
      : "Recebemos o seu pedido de registo como encarregado de educação.";

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#102a43">
      <p>Olá ${safeName},</p>
      <p>${intro}</p>
      <p>Confirme o seu e-mail para ativar a conta:</p>
      <p>
        <a href="${verificationUrl}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#102a43;color:#ffffff;text-decoration:none;font-weight:700">
          Confirmar e-mail
        </a>
      </p>
      <p>Se o botão não funcionar, copie este link:</p>
      <p style="word-break: break-all; color: #718096;">${verificationUrl}</p>
      <p>Se não pediu este registo, pode ignorar este e-mail.</p>
    </div>
  `;

  const text = [
    `Olá ${name?.trim() || "utilizador"},`,
    intro,
    "Confirme o seu e-mail para ativar a conta:",
    verificationUrl,
    "Se não pediu este registo, pode ignorar este e-mail.",
  ].join("\n\n");

  await sendMail({
    to: email,
    subject,
    html,
    text,
  });
}

export async function sendTemporaryPasswordEmail({
  email,
  name,
  temporaryPassword,
  resetUrl,
}: {
  email: string;
  name?: string | null;
  temporaryPassword: string;
  resetUrl: string;
}) {
  const safeName = name?.trim() ? escapeHtml(name.trim()) : "utilizador";
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#102a43">
      <p>Olá ${safeName},</p>
      <p>Um administrador gerou uma palavra-passe temporária para a sua conta.</p>
      <p><strong>Palavra-passe temporária:</strong> ${escapeHtml(temporaryPassword)}</p>
      <p>Abra o link abaixo para definir uma nova palavra-passe:</p>
      <p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#102a43;color:#ffffff;text-decoration:none;font-weight:700">
          Alterar palavra-passe
        </a>
      </p>
      <p>Se o botão não funcionar, copie este link:</p>
      <p style="word-break: break-all; color: #718096;">${resetUrl}</p>
      <p>Use a palavra-passe temporária no campo de palavra-passe atual.</p>
    </div>
  `;

  const text = [
    `Olá ${name?.trim() || "utilizador"},`,
    "Um administrador gerou uma palavra-passe temporária para a sua conta.",
    `Palavra-passe temporária: ${temporaryPassword}`,
    "Abra o link abaixo para definir uma nova palavra-passe:",
    resetUrl,
    "Use a palavra-passe temporária no campo de palavra-passe atual.",
  ].join("\n\n");

  await sendMail({
    to: email,
    subject: "Palavra-passe temporária da sua conta",
    html,
    text,
  });
}
