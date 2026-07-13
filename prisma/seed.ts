import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.budgetSetting.findFirst({ where: { status: "ACTIVE" } });
  if (existing) {
    console.log("이미 예산 설정이 존재합니다:", existing.amount + "원");
    return;
  }

  const budget = await prisma.budgetSetting.create({
    data: {
      amount: 25000,
      effectiveFrom: new Date("2025-01-01"),
      status: "ACTIVE",
    },
  });

  console.log("초기 예산 설정 완료:", budget.amount + "원 / 일");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
