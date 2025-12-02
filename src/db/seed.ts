import { db, users } from './index';

/**
 * Seed database with initial data
 */
async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Check if users already exist
    const existingUsers = await db.select().from(users).limit(1);

    if (existingUsers.length > 0) {
      console.log('⚠️  Database already seeded, skipping...');
      process.exit(0);
    }

    // Hash password using Bun's built-in API
    const hashedPassword = await Bun.password.hash('password123', {
      algorithm: 'bcrypt',
      cost: 10,
    });

    // Insert demo users
    await db.insert(users).values([
      {
        email: 'admin@halolight.com',
        username: 'admin',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true,
        isVerified: true,
      },
      {
        email: 'user@halolight.com',
        username: 'testuser',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isActive: true,
        isVerified: true,
      },
    ]);

    console.log('✅ Database seeded successfully');
    console.log('\n📝 Demo accounts:');
    console.log('   Admin: admin@halolight.com / password123');
    console.log('   User:  user@halolight.com / password123');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
