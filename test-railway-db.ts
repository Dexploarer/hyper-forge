#!/usr/bin/env bun
/**
 * Test Railway PostgreSQL Connection
 * This script connects to your Railway database to verify it's working
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const RAILWAY_DB_URL = 'postgresql://postgres:xkIkGHxaoOHyYDcoImazXmCtWlhYKLBi@interchange.proxy.rlwy.net:14786/railway';

async function testRailwayDB() {
  console.log('🚂 Testing Railway PostgreSQL Connection...\n');

  try {
    // Connect to Railway database
    const client = postgres(RAILWAY_DB_URL, {
      max: 1,
      ssl: 'require'
    });

    const db = drizzle(client);

    console.log('✅ Connected to Railway PostgreSQL\n');

    // Test 1: Check if users table exists
    console.log('📊 Checking if users table exists...');
    const tableCheck = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `;

    if (tableCheck[0].exists) {
      console.log('✅ users table exists\n');

      // Test 2: Count users
      console.log('👥 Checking users in database...');
      const userCount = await client`SELECT COUNT(*) FROM users;`;
      console.log(`Found ${userCount[0].count} users\n`);

      // Test 3: Get all users
      if (parseInt(userCount[0].count) > 0) {
        console.log('📋 User details:');
        const users = await client`SELECT * FROM users ORDER BY created_at DESC;`;

        users.forEach((user: any, index: number) => {
          console.log(`\n${index + 1}. ${user.display_name || 'Unnamed User'}`);
          console.log(`   ID: ${user.id}`);
          console.log(`   Privy ID: ${user.privy_user_id}`);
          console.log(`   Email: ${user.email || 'N/A'}`);
          console.log(`   Role: ${user.role}`);
          console.log(`   Created: ${user.created_at}`);
        });
      } else {
        console.log('ℹ️  No users found - database is empty');
        console.log('This means either:');
        console.log('  1. Migrations haven\'t run on Railway');
        console.log('  2. No one has logged in yet');
        console.log('  3. Auth isn\'t working on Railway');
      }

    } else {
      console.log('❌ users table does NOT exist!');
      console.log('\nThis means migrations haven\'t run on Railway.');
      console.log('\nTo fix:');
      console.log('1. Check Railway logs for migration errors');
      console.log('2. Manually run: bun run db:migrate (with Railway DATABASE_URL)');
      console.log('3. Verify start:api script runs db:migrate');
    }

    // Test 4: Check all tables
    console.log('\n📋 All tables in database:');
    const tables = await client`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    if (tables.length > 0) {
      tables.forEach((table: any) => {
        console.log(`  - ${table.table_name}`);
      });
    } else {
      console.log('  (no tables found - migrations not run)');
    }

    await client.end();
    console.log('\n✅ Test complete');

  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error);
    console.error('\nPossible causes:');
    console.error('1. DATABASE_URL is incorrect');
    console.error('2. Railway database is not running');
    console.error('3. Network/firewall blocking connection');
    process.exit(1);
  }

  process.exit(0);
}

testRailwayDB();
