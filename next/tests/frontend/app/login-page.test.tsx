import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginClient from "@/app/(auth)/login/login-client";

const routerPush = vi.fn();
const routerReplace = vi.fn();
const routerRefresh = vi.fn();
const signInMock = vi.fn();
const searchParams = {
  get: () => null,
};

function getActionButton(name: string) {
  const button = screen
    .getAllByRole("button", { name })
    .find((element) => element.getAttribute("type") === "submit");

  if (!button) {
    throw new Error(`Could not find submit button named ${name}`);
  }

  return button;
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPush,
    replace: routerReplace,
    refresh: routerRefresh,
  }),
  useSearchParams: () => searchParams,
}));

vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
}));

vi.mock("next-intl", () => ({
  useTranslations:
    (namespace?: string) =>
    (key: string) =>
      (
        {
          "auth.login": "Entrar",
          "auth.register": "Criar conta",
          "auth.loginSubtitle": "Aceda a sua conta.",
          "auth.registerSubtitle": "Crie uma nova conta.",
          "auth.name": "Nome",
          "auth.email": "Email",
          "auth.password": "Password",
          "auth.confirmPassword": "Confirmar password",
          "auth.roleLabel": "Perfil",
          "auth.role_aluno": "Aluno",
          "auth.role_pais": "Pais",
          "auth.rgpdConsent": "Aceito a politica RGPD.",
          "auth.enter": "Entrar",
          "auth.createAccount": "Criar conta",
          "auth.noAccount": "Ainda nao tem conta?",
          "auth.hasAccount": "Ja tem conta?",
          "auth.showPassword": "Mostrar password",
          "auth.hidePassword": "Ocultar password",
          "auth.wrongCredentials": "Credenciais invalidas",
          "auth.connectionError": "Erro de ligacao",
        } as Record<string, string>
      )[`${namespace}.${key}`] ?? key,
}));

describe("LoginClient", () => {
  beforeEach(() => {
    routerPush.mockReset();
    routerReplace.mockReset();
    routerRefresh.mockReset();
    signInMock.mockReset();
  });

  it("opens the public account registration chooser", async () => {
    const user = userEvent.setup();

    render(<LoginClient />);

    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();

    const createAccountButton = screen.getByText("Criar conta").closest("button");
    expect(createAccountButton).toBeInTheDocument();
    await user.click(createAccountButton);

    expect(routerPush).toHaveBeenCalledWith("/register");
  });

  it("submits login credentials and redirects on success", async () => {
    signInMock.mockResolvedValue({});
    const user = userEvent.setup();

    render(<LoginClient />);

    await user.type(screen.getByLabelText("Email"), "admin@example.com");
    await user.type(screen.getByLabelText("Password"), "Password1");
    await user.click(getActionButton("Entrar"));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith("credentials", {
        email: "admin@example.com",
        password: "Password1",
        redirect: false,
      });
    });

    expect(routerPush).toHaveBeenCalledWith("/dashboard");
    expect(routerRefresh).toHaveBeenCalled();
  });

  it("shows a connection error when credentials auth reports database outage", async () => {
    signInMock.mockResolvedValue({
      error: "CredentialsSignin",
      code: "database_unavailable",
    });
    const user = userEvent.setup();

    render(<LoginClient />);

    await user.type(screen.getByLabelText("Email"), "admin@example.com");
    await user.type(screen.getByLabelText("Password"), "Password1");
    await user.click(getActionButton("Entrar"));

    expect(await screen.findByRole("alert")).toHaveTextContent("Erro de ligacao");
    expect(routerPush).not.toHaveBeenCalled();
  });
});
