import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const student = await prisma.studentDetail.findFirst();
  console.log("Found student childSno:", student?.childSno);
}
main().catch(console.error).finally(() => prisma.$disconnect());
