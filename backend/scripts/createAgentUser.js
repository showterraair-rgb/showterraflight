/**
 * Seed a demo B2B agent account (run once on server or locally).
 * Usage: node backend/scripts/createAgentUser.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Agent from '../src/models/Agent.js';
import { generateAgentId } from '../src/services/numberGenerator.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const EMAIL = process.env.SEED_AGENT_EMAIL || 'agent@demo.com';
const PASSWORD = process.env.SEED_AGENT_PASSWORD || 'Agent@123456';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const existing = await Agent.findOne({ email: EMAIL.toLowerCase() });
  if (existing) {
    console.log(`Agent already exists: ${existing.agentId} (${existing.email})`);
    process.exit(0);
  }
  const agentId = await generateAgentId();
  const agent = await Agent.create({
    agentId,
    companyName: 'Demo Travel Agency',
    contactPerson: 'Demo Agent',
    email: EMAIL.toLowerCase(),
    password: PASSWORD,
    phone: '+8801700000000',
    address: 'Dhaka',
    city: 'Dhaka',
    country: 'Bangladesh',
    agentType: 'regular',
    creditLimit: 500000,
    currentBalance: 0,
    isActive: true,
    notes: 'Seeded demo agent',
  });
  console.log('Created agent:', agent.agentId, agent.email, 'password:', PASSWORD);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
