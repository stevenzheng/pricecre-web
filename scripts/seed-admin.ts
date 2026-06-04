// scripts/seed-admin.ts
// One-time run: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/seed-admin.ts
// Creates the initial admin user for the management dashboard

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "steven@pricecre.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user ${email} already exists. Role: ${existing.role}`);
    if (existing.role !== "SUPER_ADMIN") {
      await prisma.user.update({ where: { email }, data: { role: "SUPER_ADMIN" } });
      console.log(`Updated role to SUPER_ADMIN.`);
    }
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  const { nanoid } = await import("nanoid");
  const code = nanoid(8);

  await prisma.user.create({
    data: {
      email,
      password: hashed,
      role: "SUPER_ADMIN",
      myReferralCode: code,
      referralViewCount: 999,
      purchasedViewCount: 999,
    },
  });

  console.log(`Admin user created: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Role: SUPER_ADMIN`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
