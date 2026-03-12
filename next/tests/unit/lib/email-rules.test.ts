import { describe, expect, it } from "vitest";
import { getEmailRuleMessage, isAllowedEmailForRole, isInternalEmail } from "@/lib/email-rules";
import { createStaffSchema, guardianSchema, registerSchema, sosSchema } from "@/lib/validations";

describe("email rules", () => {
  it("classifies colegioatlantico.pt as internal", () => {
    expect(isInternalEmail("aluno1@colegioatlantico.pt")).toBe(true);
    expect(isInternalEmail("encarregado@gmail.com")).toBe(false);
  });

  it("requires internal emails for internal roles", () => {
    expect(isAllowedEmailForRole("ALUNO", "aluno1@colegioatlantico.pt")).toBe(true);
    expect(isAllowedEmailForRole("ALUNO", "aluno1@gmail.com")).toBe(false);

    expect(
      registerSchema.safeParse({
        name: "Aluno Teste",
        email: "aluno1@gmail.com",
        password: "Password1",
        role: "ALUNO",
        consentRgpd: true,
      }).success
    ).toBe(false);

    expect(
      createStaffSchema.safeParse({
        name: "Prof Teste",
        email: "professor@colegioatlantico.pt",
        password: "Password1",
        role: "PROFESSOR",
      }).success
    ).toBe(true);
  });

  it("requires external emails for parents and guardians", () => {
    expect(isAllowedEmailForRole("PAIS", "encarregado@gmail.com")).toBe(true);
    expect(isAllowedEmailForRole("PAIS", "pai@colegioatlantico.pt")).toBe(false);
    expect(getEmailRuleMessage("PAIS")).toContain("email externo");

    expect(
      registerSchema.safeParse({
        name: "Encarregado Teste",
        email: "pai@colegioatlantico.pt",
        password: "Password1",
        role: "PAIS",
        consentRgpd: true,
      }).success
    ).toBe(false);

    expect(
      guardianSchema.safeParse({
        guardianEmail: "encarregado@gmail.com",
        relationship: "Mae",
      }).success
    ).toBe(true);

    expect(
      guardianSchema.safeParse({
        guardianEmail: "encarregado@colegioatlantico.pt",
        relationship: "Mae",
      }).success
    ).toBe(false);
  });

  it("requires internal staff emails in SOS contacts", () => {
    expect(
      sosSchema.safeParse({
        psych: "Ana Rodrigues",
        teacher: "Carlos Silva",
        psychEmail: "psicologo@colegioatlantico.pt",
        teacherEmail: "professor@colegioatlantico.pt",
      }).success
    ).toBe(true);

    expect(
      sosSchema.safeParse({
        psych: "Ana Rodrigues",
        teacher: "Carlos Silva",
        psychEmail: "psicologo@gmail.com",
        teacherEmail: "professor@colegioatlantico.pt",
      }).success
    ).toBe(false);
  });
});
