import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const GENERIC_AUTH_ERROR = "账号或密码错误";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { type: "text" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error(GENERIC_AUTH_ERROR);
        }
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.password) {
          throw new Error(GENERIC_AUTH_ERROR);
        }
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error(GENERIC_AUTH_ERROR);
        }
        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.referralViewCount = dbUser.referralViewCount;
          token.purchasedViewCount = dbUser.purchasedViewCount;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.referralViewCount = token.referralViewCount as number;
        session.user.purchasedViewCount = token.purchasedViewCount as number;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
