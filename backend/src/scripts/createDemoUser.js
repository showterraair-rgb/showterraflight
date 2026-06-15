/**
 * Create or reset a demo admin account for testing the panel.
 *
 * Usage:
 *   npm run create-demo-user
 *
 * Optional env overrides (backend/.env):
 *   DEMO_USER_EMAIL=demo@showterraair.com
 *   DEMO_USER_PASSWORD=Demo@123456
 *   DEMO_USER_ROLE=demo|admin|executive|accountant
 */
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { ROLES, COMPANY_DEFAULTS } from '../config/constants.js';
import User from '../models/User.js';

const DEMO_DEFAULTS = {
  name: 'Demo User',
  email: 'demo@showterraair.com',
  password: 'Demo@123456',
  phone: '01700000000',
  role: ROLES.DEMO,
};

async function run() {
  const email = (process.env.DEMO_USER_EMAIL || DEMO_DEFAULTS.email).toLowerCase().trim();
  const password = process.env.DEMO_USER_PASSWORD || DEMO_DEFAULTS.password;
  const role = process.env.DEMO_USER_ROLE || DEMO_DEFAULTS.role;

  if (!Object.values(ROLES).includes(role)) {
    console.error(`Invalid DEMO_USER_ROLE: ${role}. Use admin, accountant, executive, or demo.`);
    process.exit(1);
  }

  await mongoose.connect(env.mongodbUri);

  const existing = await User.findOne({ email }).select('+password');

  if (existing) {
    existing.name = DEMO_DEFAULTS.name;
    existing.phone = DEMO_DEFAULTS.phone;
    existing.role = role;
    existing.password = password;
    existing.isActive = true;
    await existing.save();
    console.log('Demo user updated (password reset):');
  } else {
    await User.create({
      name: DEMO_DEFAULTS.name,
      email,
      phone: DEMO_DEFAULTS.phone || COMPANY_DEFAULTS.directorPhone,
      password,
      role,
      isActive: true,
    });
    console.log('Demo user created:');
  }

  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  Role:     ${role}`);
  console.log('\nUse these credentials at your admin login URL.');
  console.log('Change or delete this account before going fully live.');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
