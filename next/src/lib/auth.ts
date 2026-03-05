import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

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

declare module "next-auth" {
  interface JWT {
    id: string;
    role: Role;
    consentRgpd: boolean;
    permissions: string[];
  }
}

// Import RBAC inline to avoid circular dependency
import { getRolePermissions } from "@/lib/rbac";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        const isValid = await compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

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
      if (user) {
        token.id = user.id!;
        token.role = (user as any).role;
        token.consentRgpd = (user as any).consentRgpd;
        token.permissions = getRolePermissions((user as any).role);
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      session.user.consentRgpd = token.consentRgpd as boolean;
      session.user.permissions = token.permissions as string[];
      return session;
    },
  },
});
