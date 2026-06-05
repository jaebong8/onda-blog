import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
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
        if (!user || !user.password) return null;
        const isValid = await bcrypt.compare(credentials.password as string, user.password);
        if (!isValid) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24,
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "kakao") {
        // 카카오는 이메일을 제공하지 않을 수 있으므로 고유 식별자로 대체
        const email = user.email ?? `${account.provider}_${account.providerAccountId}@oauth.local`;
        try {
          await prisma.user.upsert({
            where: { email },
            update: { name: user.name ?? "User", provider: account.provider },
            create: { email, name: user.name ?? "User", provider: account.provider, role: "USER" },
          });
        } catch {
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        try {
          if (account?.provider === "credentials") {
            token.id = user.id;
            const dbUser = await prisma.user.findUnique({
              where: { id: user.id as string },
              select: { role: true },
            });
            token.role = dbUser?.role ?? "USER";
          } else if (account?.providerAccountId) {
            const email = user.email ?? `${account.provider}_${account.providerAccountId}@oauth.local`;
            const dbUser = await prisma.user.findUnique({
              where: { email },
              select: { id: true, role: true, provider: true },
            });
            if (dbUser) {
              token.id = dbUser.id;
              token.role = dbUser.role;
              token.provider = dbUser.provider;
            }
          }
        } catch (e) {
          console.error("[jwt callback error]", e);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.provider = (token.provider as string) ?? null;
      }
      return session;
    },
  },
});
