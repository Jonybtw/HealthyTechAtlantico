import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import { getRolePermissions } from "@/lib/rbac";

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
}

declare module "next-auth" {
  interface User {
    role: Role;
    consentRgpd: boolean;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      role: Role;
      consentRgpd: boolean;
      permissions: string[];
    };
  }
}

function hasSessionFields(
  user: unknown
): user is { id?: string; role: Role; consentRgpd: boolean } {
  return (
    typeof user === "object" &&
    user !== null &&
    "role" in user &&
    "consentRgpd" in user
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours — matches original app
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password)
          throw new InvalidCredentialsError();

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) throw new InvalidCredentialsError();

        const isValid = await compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) throw new InvalidCredentialsError();

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          consentRgpd: user.consentRgpd,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const sessionToken = token as typeof token & {
        id?: string;
        role?: Role;
        consentRgpd?: boolean;
        permissions?: string[];
      };

      if (user && hasSessionFields(user)) {
        sessionToken.id = user.id ?? sessionToken.id;
        sessionToken.role = user.role;
        sessionToken.consentRgpd = user.consentRgpd;
        sessionToken.permissions = getRolePermissions(user.role);
      }
      return sessionToken;
    },
    async session({ session, token }) {
      const sessionToken = token as typeof token & {
        id?: string;
        role?: Role;
        consentRgpd?: boolean;
        permissions?: string[];
      };

      session.user.id = sessionToken.id ?? "";
      session.user.role = sessionToken.role as Role;
      session.user.consentRgpd = sessionToken.consentRgpd ?? false;
      session.user.permissions = sessionToken.permissions ?? [];
      return session;
    },
  },
});
