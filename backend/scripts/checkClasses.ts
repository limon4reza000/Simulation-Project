import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const rows = await prisma.class.findMany({
    orderBy: { level: 'asc' },
    select: { level: true, nameBn: true, nameEn: true, status: true },
  })
  for (const r of rows) {
    console.log(`${r.level}\t${r.nameBn}\t${r.nameEn}\t${r.status}`)
  }
}

main().finally(() => prisma.$disconnect())
