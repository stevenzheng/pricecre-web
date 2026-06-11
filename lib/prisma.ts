// lib/prisma.ts — Singleton PrismaClient (prevent connection exhaustion)
// 注意：不要显式传 datasources.url 覆盖（构建期/边缘环境 env 解析时机不同会导致
// 整个 Client 实例化抛错 → 所有 API 500 → 仪表盘等页面数据全部归零）。
// schema.prisma 中的 env("DATABASE_URL") 由 Prisma 自行解析即可。
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
