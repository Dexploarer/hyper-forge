#!/usr/bin/env bun
import { db } from './packages/core/server/db';
import { users } from './packages/core/server/db/schema/users.schema';

async function testDatabase() {
  console.log('🔍 Testing database connection...\n');

  try {
    // Test connection by querying users
    const allUsers = await db.select().from(users);

    console.log('✅ Database connection successful!');
    console.log(`📊 Users in database: ${allUsers.length}\n`);

    if (allUsers.length > 0) {
      console.log('👥 Existing users:');
      allUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.displayName || 'Unnamed User'}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Privy ID: ${user.privyUserId}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log(`   Wallet: ${user.walletAddress || 'N/A'}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Profile Completed: ${user.profileCompleted ? 'Yes' : 'No'}`);
        console.log(`   Created: ${user.createdAt}`);
      });
    } else {
      console.log('ℹ️  No users found in database (this is normal before first login)');
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

testDatabase();
