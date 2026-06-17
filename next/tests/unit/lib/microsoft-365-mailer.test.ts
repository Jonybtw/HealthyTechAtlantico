// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { sendMailMock } = vi.hoisted(() => ({
  sendMailMock: vi.fn(),
}));

vi.mock("@/lib/mailer", () => ({
  sendMail: sendMailMock,
}));

import { sendReportMail365 } from "@/lib/microsoft-365-mailer";

describe("sendReportMail365", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    sendMailMock.mockReset();
    process.env = { ...originalEnv };
    delete process.env.M365_TENANT_ID;
    delete process.env.M365_CLIENT_ID;
    delete process.env.M365_CLIENT_SECRET;
    delete process.env.M365_REPORT_FROM;
    delete process.env.M365_SHARED_MAILBOX;
    delete process.env.M365_FROM;
    delete process.env.M365_REPORT_ALLOW_SMTP_FALLBACK;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = originalEnv;
  });

  it("requires Microsoft Graph config by default for the shared mailbox", async () => {
    await expect(
      sendReportMail365({
        to: "guardian@example.com",
        subject: "Relatorio",
        html: "<p>Teste</p>",
      }),
    ).rejects.toThrow("Microsoft Graph nao configurado");

    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("uses SMTP only when the fallback is explicitly enabled", async () => {
    process.env.M365_REPORT_ALLOW_SMTP_FALLBACK = "true";
    sendMailMock.mockResolvedValue({ messageId: "smtp-1" });

    await sendReportMail365({
      to: "guardian@example.com",
      subject: "Relatorio",
      html: "<p>Teste</p>",
      text: "Teste",
    });

    expect(sendMailMock).toHaveBeenCalledWith({
      to: "guardian@example.com",
      subject: "Relatorio",
      html: "<p>Teste</p>",
      text: "Teste",
    });
  });

  it("sends through the configured shared mailbox with Microsoft Graph", async () => {
    process.env.M365_TENANT_ID = "tenant-1";
    process.env.M365_CLIENT_ID = "client-1";
    process.env.M365_CLIENT_SECRET = "secret-1";
    process.env.M365_SHARED_MAILBOX = "HealthyTech@colegioatlantico.pt";

    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "token-1" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "",
      } as Response);

    await sendReportMail365({
      to: "guardian@example.com",
      recipientName: "Guardian",
      subject: "Relatorio",
      html: "<p>Teste</p>",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://graph.microsoft.com/v1.0/users/HealthyTech%40colegioatlantico.pt/sendMail",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer token-1",
          "Content-Type": "application/json",
        },
      }),
    );

    const [, requestInit] = fetchMock.mock.calls[1]!;
    const body = JSON.parse(String(requestInit?.body));

    expect(body).toMatchObject({
      message: {
        subject: "Relatorio",
        body: {
          contentType: "HTML",
          content: "<p>Teste</p>",
        },
        toRecipients: [
          {
            emailAddress: {
              address: "guardian@example.com",
              name: "Guardian",
            },
          },
        ],
      },
      saveToSentItems: true,
    });
    expect(body.message).not.toHaveProperty("from");
  });
});
