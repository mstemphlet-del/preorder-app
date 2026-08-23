import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash a simple password for testing
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create a Guest Customer
  const guestCustomer = await prisma.user.create({
    data: {
      email: 'guest@example.com',
      name: 'Guest Customer',
      password: hashedPassword,
      role: 'CUSTOMER',
    },
  });

  // 2. Create a Vendor User
  const vendorUser = await prisma.user.create({
    data: {
      email: 'vendor@example.com',
      name: 'Test Vendor',
      password: hashedPassword,
      role: 'VENDOR',
    },
  });

  // 3. Create the Vendor linked to that User
  const vendor = await prisma.vendor.create({
    data: {
      userId: vendorUser.id,
      name: 'Sweet Honey Farm',
      paymentInstructions: 'Bank: Chase, Account: 123456789, Routing: 021000021',
    },
  });

  // 4. Create a product
  const product = await prisma.product.create({
    data: {
      vendorId: vendor.id,
      title: 'Organic Raw Honey',
      description: 'Pure, unfiltered honey from local bees. 16oz jar.',
      basePrice: 24.99,
      imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400',
    },
  });

  // 5. Create an inventory window
  const now = new Date();
  const endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await prisma.inventoryWindow.create({
    data: {
      productId: product.id,
      windowName: 'August Harvest Batch',
      startTime: now,
      endTime: endTime,
      maxQuantity: 50,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('🔑 You can now log in with:');
  console.log('   Vendor: vendor@example.com / password123');
  console.log('   Customer: guest@example.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });