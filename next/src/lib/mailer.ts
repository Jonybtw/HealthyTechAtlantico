import nodemailer from "nodemailer";

function buildTransporter() {
  const host = process.env.SMTP_HOST || "smtp.office365.com";
  const port = Number(process.env.SMTP_PORT || 587);

  if (process.env.SMTP_AUTH_TYPE === "oauth2") {
    return nodemailer.createTransport({
      host,
      port,
      secure: false,
      auth: {
        type: "OAuth2",
        user: process.env.SMTP_USER,
        clientId: process.env.SMTP_CLIENT_ID,
        clientSecret: process.env.SMTP_CLIENT_SECRET,
        refreshToken: process.env.SMTP_REFRESH_TOKEN,
        accessToken: process.env.SMTP_ACCESS_TOKEN || undefined,
      },
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const transporter = buildTransporter();
const SMTP_FROM =
  process.env.SMTP_FROM ||
  "HealthyTech Atlantico <Healthytec@colegioatlantico.pt>";

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: {
    filename: string;
    contentBase64: string;
    contentType: string;
  }[];
}) {
  if (!process.env.SMTP_USER) {
    throw new Error("SMTP_USER não configurado");
  }
  const { attachments, ...mailOptions } = opts;

  return transporter.sendMail({
    from: SMTP_FROM,
    ...mailOptions,
    attachments: attachments?.map((attachment) => ({
      filename: attachment.filename,
      content: Buffer.from(attachment.contentBase64, "base64"),
      contentType: attachment.contentType,
    })),
  });
}
