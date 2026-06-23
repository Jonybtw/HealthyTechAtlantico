import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import { compare } from "bcryptjs";
import type { Role } from "@prisma/client";
import { auditLog } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { prisma } from "@/lib/prisma";
import { getRolePermissions, type Permission } from "@/lib/rbac";

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
}

class DatabaseUnavailableError extends CredentialsSignin {
  code = "database_unavailable";
}

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string | null;
    role: Role;
    consentRgpd: boolean;
    consentShare: boolean;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: Role;
      consentRgpd: boolean;
      consentShare: boolean;
      permissions: Permission[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    name?: string | null;
    role?: Role;
    consentRgpd?: boolean;
    consentShare?: boolean;
    permissions?: Permission[];
  }
}

type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  consentRgpd: boolean;
  consentShare: boolean;
};

type SessionUpdate = Partial<{
  name: string | null;
  consentRgpd: boolean;
  consentShare: boolean;
}>;

function hasAuthUser(user: unknown): user is AuthUser {
  return (
    typeof user === "object" &&
    user !== null &&
    "id" in user &&
    "email" in user &&
    "role" in user &&
    "consentRgpd" in user &&
    "consentShare" in user
  );
}

type SessionToken = JWT & {
  id?: string;
  name?: string | null;
  role?: Role;
  consentRgpd?: boolean;
  consentShare?: boolean;
  permissions?: Permission[];
};

function getAuditActorId(message: unknown): string | null {
  if (
    typeof message === "object" &&
    message !== null &&
    "user" in message &&
    message.user &&
    typeof message.user === "object" &&
    "id" in message.user &&
    typeof message.user.id === "string"
  ) {
    return message.user.id;
  }

  if (
    typeof message === "object" &&
    message !== null &&
    "session" in message &&
    message.session &&
    typeof message.session === "object" &&
    "user" in message.session &&
    message.session.user &&
    typeof message.session.user === "object" &&
    "id" in message.session.user &&
    typeof message.session.user.id === "string"
  ) {
    return message.session.user.id;
  }

  if (
    typeof message === "object" &&
    message !== null &&
    "token" in message &&
    message.token &&
    typeof message.token === "object"
  ) {
    const token = message.token as Record<string, unknown>;

    if (typeof token.id === "string") {
      return token.id;
    }

    if (typeof token.sub === "string") {
      return token.sub;
    }
  }

  return null;
}

function isDatabaseUnavailableError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const code = "code" in error ? error.code : undefined;

  return (
    code === "P1001" ||
    code === "ECONNREFUSED" ||
    code === "ETIMEDOUT" ||
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN"
  );
}

export function applyUserToToken(
  token: SessionToken,
  user: Pick<AuthUser, "id" | "name" | "role" | "consentRgpd" | "consentShare">,
): SessionToken {
  return {
    ...token,
    id: user.id,
    name: user.name,
    role: user.role,
    consentRgpd: user.consentRgpd,
    consentShare: user.consentShare,
    permissions: getRolePermissions(user.role),
  };
}

function applySessionUpdateToToken(
  token: SessionToken,
  session: SessionUpdate,
): SessionToken {
  return {
    ...token,
    ...(session.name !== undefined ? { name: session.name } : {}),
    ...(session.consentRgpd !== undefined
      ? { consentRgpd: session.consentRgpd }
      : {}),
    ...(session.consentShare !== undefined
      ? { consentShare: session.consentShare }
      : {}),
  };
}

export const { handlers, auth } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) {
          throw new InvalidCredentialsError();
        }

        const user = await prisma.user
          .findUnique({
            where: { email },
          })
          .catch((error: unknown) => {
            if (isDatabaseUnavailableError(error)) {
              throw new DatabaseUnavailableError();
            }

            throw error;
          });

        if (!user) {
          throw new InvalidCredentialsError();
        }

        const isValid = await compare(password, user.passwordHash);

        if (!isValid) {
          throw new InvalidCredentialsError();
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          consentRgpd: user.consentRgpd,
          consentShare: user.consentShare,
        };
      },
    }),
  ],
  events: {
    async signIn(message) {
      await auditLog({
        userId: getAuditActorId({ user: message.user }),
        action: AUDIT_ACTIONS.LOGIN,
      }).catch(console.error);
    },
    async signOut(message) {
      await auditLog({
        userId: getAuditActorId(message),
        action: AUDIT_ACTIONS.LOGOUT,
      }).catch(console.error);
    },
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      let sessionToken = token as SessionToken;

      if (user && hasAuthUser(user)) {
        sessionToken = applyUserToToken(sessionToken, user);
      }

      if (trigger === "update" && session && typeof session === "object") {
        sessionToken = applySessionUpdateToToken(
          sessionToken,
          session as SessionUpdate,
        );
      }

      return sessionToken;
    },
    async session({ session, token }) {
      const sessionToken = token as SessionToken;

      session.user.id = sessionToken.id ?? "";
      session.user.email = session.user.email ?? token.email ?? "";
      session.user.name = sessionToken.name ?? session.user.name ?? null;
      session.user.role = sessionToken.role as Role;
      session.user.consentRgpd = sessionToken.consentRgpd ?? false;
      session.user.consentShare = sessionToken.consentShare ?? false;
      session.user.permissions = sessionToken.permissions ?? [];
      return session;
    },
  },
});
