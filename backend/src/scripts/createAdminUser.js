/**
 * Create or reset the main administrator account.
 *
 * Usage:
 *   npm run create-admin-user
 *
 * Optional env overrides (backend/.env):
 *   SEED_ADMIN_EMAIL=admin@showterraair.com
 *   SEED_ADMIN_PASSWORD=Admin@123456
 */
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { ROLES, COMPANY_DEFAULTS } from '../config/constants.js';
import User from '../models/User.js';

const ADMIN_DEFAULTS = {
  name: 'System Admin',
  email: 'admin@showterraair.com',
  password: 'Admin@123456',
  phone: COMPANY_DEFAULTS.directorPhone,
  role: ROLES.ADMIN,
};

async function run() {
  const email = (process.env.SEED_ADMIN_EMAIL || ADMIN_DEFAULTS.email).toLowerCase().trim();
  const password = process.env.SEED_ADMIN_PASSWORD || ADMIN_DEFAULTS.password;

  await mongoose.connect(env.mongodbUri);

  const existing = await User.findOne({ email }).select('+password');

  if (existing) {
    existing.name = ADMIN_DEFAULTS.name;
    existing.phone = ADMIN_DEFAULTS.phone;
    existing.role = ROLES.ADMIN;
    existing.password = password;
    existing.isActive = true;
    await existing.save();
    console.log('Main admin account updated (password reset, role activated):');
  } else {
    await User.create({
      name: ADMIN_DEFAULTS.name,
      email,
      phone: ADMIN_DEFAULTS.phone,
      password,
      role: ROLES.ADMIN,
      isActive: true,
    });
    console.log('Main admin account created:');
  }

  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  Role:     ${ROLES.ADMIN}`);
  console.log('\nThis is the full-access administrator. Use demo@showterraair.com for read-only preview.');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
