import { sendMail } from "@/lib/mailer";

const MICROSOFT_TOKEN_URL_BASE = "https://login.microsoftonline.com";
const MICROSOFT_GRAPH_URL_BASE = "https://graph.microsoft.com/v1.0";
const DEFAULT_REPORT_FROM = "HealthyTech@colegioatlantico.pt";

type GraphEmailAddress = {
  address: string;
  name?: string;
};

type MailAttachment = {
  filename: string;
  contentBase64: string;
  contentType: string;
};

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} nao configurado`);
  }

  return value;
}

function hasMicrosoftGraphConfig() {
  return Boolean(
    process.env.M365_TENANT_ID?.trim() &&
      process.env.M365_CLIENT_ID?.trim() &&
      process.env.M365_CLIENT_SECRET?.trim(),
  );
}

function allowsSmtpFallback() {
  return process.env.M365_REPORT_ALLOW_SMTP_FALLBACK === "true";
}

function getReportSender() {
  return (
    process.env.M365_REPORT_FROM?.trim() ||
    process.env.M365_SHARED_MAILBOX?.trim() ||
    process.env.M365_FROM?.trim() ||
    DEFAULT_REPORT_FROM
  );
}

async function getMicrosoftGraphAccessToken() {
  const tenantId = getRequiredEnv("M365_TENANT_ID");
  const clientId = getRequiredEnv("M365_CLIENT_ID");
  const clientSecret = getRequiredEnv("M365_CLIENT_SECRET");
  const tokenUrl = `${MICROSOFT_TOKEN_URL_BASE}/${encodeURIComponent(
    tenantId,
  )}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
    scope: "https://graph.microsoft.com/.default",
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Falha ao autenticar na app Microsoft 365: ${details}`);
  }

  const payload = (await response.json()) as { access_token?: string };

  if (!payload.access_token) {
    throw new Error("A app Microsoft 365 nao devolveu access_token");
  }

  return payload.access_token;
}

export async function sendReportMail365(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  recipientName?: string | null;
  attachments?: MailAttachment[];
}) {
  if (!hasMicrosoftGraphConfig()) {
    if (!allowsSmtpFallback()) {
      throw new Error(
        "Microsoft Graph nao configurado para a caixa partilhada HealthyTech@colegioatlantico.pt",
      );
    }

    console.warn("Report email: using explicit SMTP fallback.");
    return sendMail({
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      attachments: opts.attachments,
    });
  }

  console.warn("Report email: using Microsoft Graph.");
  const accessToken = await getMicrosoftGraphAccessToken();
  const sender = getReportSender();
  const recipient: GraphEmailAddress = {
    address: opts.to,
  };

  if (opts.recipientName) {
    recipient.name = opts.recipientName;
  }

  const response = await fetch(
    `${MICROSOFT_GRAPH_URL_BASE}/users/${encodeURIComponent(sender)}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject: opts.subject,
          body: {
            contentType: "HTML",
            content: opts.html,
          },
          toRecipients: [
            {
              emailAddress: recipient,
            },
          ],
          attachments: opts.attachments?.map((attachment) => ({
            "@odata.type": "#microsoft.graph.fileAttachment",
            name: attachment.filename,
            contentType: attachment.contentType,
            contentBytes: attachment.contentBase64,
          })),
        },
        saveToSentItems: true,
      }),
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Falha no envio pela app Microsoft 365 para ${opts.to}: ${details}`,
    );
  }
}
