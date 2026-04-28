import {
  PrismaClient,
  Role,
  CategoryType,
  TxosnaStatus,
  CounterSetup,
  OrderingChannel,
  PaymentMethod,
  NotificationMode,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Association
  const association = await prisma.association.upsert({
    where: { id: 'seed-association-1' },
    update: {},
    create: {
      id: 'seed-association-1',
      name: 'Erreka Gaztedi',
      phone: '+34 600 000 000',
    },
  });

  // Admin volunteer
  const passwordHash = await bcrypt.hash('test1234', 10);
  await prisma.volunteer.upsert({
    where: { email: 'amaia@elkartea.eus' },
    update: {},
    create: {
      name: 'Amaia',
      email: 'amaia@elkartea.eus',
      passwordHash,
      role: Role.ADMIN,
      associationId: association.id,
    },
  });

  // Event
  const event = await prisma.event.upsert({
    where: { id: 'seed-event-1' },
    update: {},
    create: {
      id: 'seed-event-1',
      name: 'Aste Nagusia 2026',
      date: new Date('2026-08-15'),
      location: 'Bilbao',
      associationId: association.id,
    },
  });

  // Txosna
  const pinHash = await bcrypt.hash('1234', 10);
  const txosna = await prisma.txosna.upsert({
    where: { slug: 'txosna-1' },
    update: {},
    create: {
      name: 'Aste Nagusia 2026',
      slug: 'txosna-1',
      pinHash,
      status: TxosnaStatus.OPEN,
      counterSetup: CounterSetup.SINGLE,
      enabledChannels: [OrderingChannel.COUNTER],
      enabledPaymentMethods: [PaymentMethod.CASH],
      notificationModes: [NotificationMode.DISPLAY],
      associationId: association.id,
      eventId: event.id,
    },
  });

  // Category + product so products page has content
  const category = await prisma.category.upsert({
    where: { id: 'seed-category-1' },
    update: {},
    create: {
      id: 'seed-category-1',
      name: 'Edariak',
      type: CategoryType.DRINKS,
      associationId: association.id,
    },
  });

  const product = await prisma.product.upsert({
    where: { id: 'seed-product-1' },
    update: {},
    create: {
      id: 'seed-product-1',
      name: 'Garagardoa',
      defaultPrice: 2.5,
      categoryId: category.id,
    },
  });

  await prisma.txosnaProduct.upsert({
    where: { txosnaId_productId: { txosnaId: txosna.id, productId: product.id } },
    update: {},
    create: {
      txosnaId: txosna.id,
      productId: product.id,
      available: true,
    },
  });

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
