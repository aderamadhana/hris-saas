import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create demo organization
  const org = await prisma.organization.create({
    data: {
      name: 'Demo Company',
      slug: 'demo-company',
      subscriptionTier: 'professional',
      subscriptionStatus: 'active',
      maxEmployees: 200,
    },
  })

  console.log('✅ Seeded organization:', org.name)

  // Create demo department
  const dept = await prisma.department.create({
    data: {
      organizationId: org.id,
      name: 'Engineering',
      description: 'Software Development Team',
    },
  })

  console.log('✅ Seeded department:', dept.name)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })