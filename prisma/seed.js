const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@iyosiola.com' },
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('Admin@123456', 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@iyosiola.com',
        password: hashedPassword,
        emailVerified: new Date(),
        role: 'ADMIN',
        isActive: true,
      },
    });

    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@iyosiola.com');
    console.log('🔐 Password: Admin@123456');
    console.log('⚠️  Please change this password after first login');
  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
