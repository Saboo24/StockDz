import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const company = await prisma.company.upsert({
    where: { email: 'hello@StockDz.dz' },
    update: {},
    create: {
      name: 'StockDz Demo',
      email: 'hello@StockDz.dz',
      phone: '+213771000000',
      address: 'Algiers, Algeria',
      taxNumber: '000123456789',
      currency: 'DZD',
    },
  })

  const passwordHash = await bcrypt.hash('StockDz123!', 10)
  const adminEmail = 'admin@stockdz.dz'

  const user = await prisma.user.upsert({
    where: { companyId_email: { companyId: company.id, email: adminEmail } },
    update: {
      status: 'APPROVED',
      isActive: true,
      approvalTokenHash: null,
      approvalTokenExpiresAt: null,
      approvalTokenUsedAt: null,
    },
    create: {
      companyId: company.id,
      firstName: 'Amine',
      lastName: 'Codes',
      email: adminEmail,
      passwordHash,
      phone: '+213555010101',
      status: 'APPROVED',
      isActive: true,
    },
  })

  const category = await prisma.category.upsert({
    where: { companyId_slug: { companyId: company.id, slug: 'electronique' } },
    update: {},
    create: {
      companyId: company.id,
      name: 'Électronique',
      slug: 'electronique',
      color: '#2563eb',
    },
  })

  const product = await prisma.product.upsert({
    where: { companyId_sku: { companyId: company.id, sku: 'PRD-1001' } },
    update: {},
    create: {
      companyId: company.id,
      categoryId: category.id,
      sku: 'PRD-1001',
      name: 'Laptop Dell XPS',
      barcode: '1234567890123',
      description: 'Laptop portable premium',
      buyPrice: 85000,
      sellPrice: 120000,
      stock: 12,
      minStock: 5,
      unit: 'unité',
    },
  })

  await prisma.customer.upsert({
    where: { id: 'cust-demo-1' },
    update: {},
    create: {
      id: 'cust-demo-1',
      companyId: company.id,
      name: 'Client Test',
      email: 'client@test.dz',
      phone: '+213550000000',
    },
  })

  await prisma.supplier.upsert({
    where: { id: 'sup-demo-1' },
    update: {},
    create: {
      id: 'sup-demo-1',
      companyId: company.id,
      name: 'Fournisseur Test',
      email: 'supplier@test.dz',
      phone: '+213560000000',
    },
  })

  await prisma.setting.upsert({
    where: { companyId_key: { companyId: company.id, key: 'company_name' } },
    update: {},
    create: {
      companyId: company.id,
      key: 'company_name',
      value: company.name,
    },
  })

  console.log('Seed complete:', { company: company.name, user: user.email, product: product.name })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
