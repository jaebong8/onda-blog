import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.ADMIN_PASSWORD ?? "changeme";
  const name = process.env.ADMIN_NAME ?? "Admin";

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", password: hashed },
    create: { email, password: hashed, name, role: "ADMIN" },
  });

  console.log(`Admin user upserted: ${email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
