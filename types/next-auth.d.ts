import { Role } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: string;
      referralViewCount: number;
      purchasedViewCount: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    referralViewCount: number;
    purchasedViewCount: number;
  }
}
