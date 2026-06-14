import mongoose from 'mongoose';
import env from '../config/env.js';
import {
  ROLES,
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  DEFAULT_EXPENSE_CATEGORIES,
  COMPANY_DEFAULTS,
  CMS_PAGE_KEYS,
} from '../config/constants.js';
import { ROLE_PERMISSIONS } from '../config/permissions.js';
import Role from '../models/Role.js';
import User from '../models/User.js';
import Account from '../models/Account.js';
import ExpenseCategory from '../models/ExpenseCategory.js';
import Setting from '../models/Setting.js';
import CmsPage from '../models/CmsPage.js';
import SecuritySetting from '../models/SecuritySetting.js';

const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.ACCOUNTANT]: 'Accountant',
  [ROLES.EXECUTIVE]: 'Executive',
};

async function seedRoles() {
  for (const name of Object.values(ROLES)) {
    await Role.findOneAndUpdate(
      { name },
      {
        name,
        label: ROLE_LABELS[name],
        permissions: ROLE_PERMISSIONS[name],
        isActive: true,
      },
      { upsert: true, new: true }
    );
  }
  console.log('✓ Roles seeded');
}

async function seedAccounts() {
  for (const type of ACCOUNT_TYPES) {
    await Account.findOneAndUpdate(
      { type },
      {
        name: ACCOUNT_TYPE_LABELS[type],
        type,
        openingBalance: 0,
        currentBalance: 0,
        isActive: true,
      },
      { upsert: true, new: true }
    );
  }
  console.log('✓ Accounts seeded (Cash, Bank, bKash, Nagad)');
}

async function seedExpenseCategories() {
  for (const name of DEFAULT_EXPENSE_CATEGORIES) {
    await ExpenseCategory.findOneAndUpdate(
      { name },
      { name, isSystem: true, isActive: true },
      { upsert: true, new: true }
    );
  }
  console.log('✓ Expense categories seeded');
}

async function seedSettings() {
  await Setting.findOneAndUpdate(
    { key: 'company' },
    {
      key: 'company',
      company: COMPANY_DEFAULTS,
      socialLinks: {},
      orderNumberPrefix: 'ORD',
      bookingNumberPrefix: 'BKG',
      invoicePrefix: 'INV',
    },
    { upsert: true, new: true }
  );
  console.log('✓ Company settings seeded');
}

async function seedCmsPages() {
  const pages = [
    {
      pageKey: 'home',
      title: 'Home',
      slug: 'home',
      content: {
        heroTitle: 'Your Trusted Air Ticket Partner in Sylhet',
        heroSubtitle:
          'Show Terra Air provides reliable domestic and international air ticket booking with personal service from Kanaighat, Sylhet.',
        ctaText: 'Request a Ticket',
      },
      sections: [
        { type: 'feature', title: 'Best Fare Options', text: 'We compare fares across airlines to find competitive prices.' },
        { type: 'feature', title: 'Personal Support', text: 'Speak directly with our team via phone or WhatsApp.' },
        { type: 'feature', title: 'Local Office', text: 'Visit us at Gasbari Bazar, Kanaighat for walk-in service.' },
      ],
    },
    {
      pageKey: 'about',
      title: 'About Us',
      slug: 'about',
      content: {
        heading: 'About Show Terra Air',
        body: `Show Terra Air is a Sylhet-based air ticket sales company located at Gasbari Bazar, Ground Floor of BRAC Bank, Kanaighat, Sylhet-3183. Led by Director Kamil Hussen, we help travelers book domestic and international flights with honest pricing and dedicated follow-up.`,
      },
    },
    {
      pageKey: 'services',
      title: 'Our Services',
      slug: 'services',
      content: { heading: 'What We Offer' },
      sections: [
        { type: 'service', title: 'Domestic Air Tickets', text: 'All major Bangladesh domestic routes.' },
        { type: 'service', title: 'International Air Tickets', text: 'Middle East, Asia, Europe and beyond.' },
        { type: 'service', title: 'Group Bookings', text: 'Umrah, Hajj groups and family travel.' },
        { type: 'service', title: 'Ticket Changes & Support', text: 'Date changes, cancellations and reissue assistance.' },
      ],
    },
    {
      pageKey: 'contact',
      title: 'Contact',
      slug: 'contact',
      content: {
        heading: 'Get in Touch',
        note: 'Visit our office or contact us by phone, email, or WhatsApp.',
      },
    },
    {
      pageKey: 'faq',
      title: 'FAQ & Notices',
      slug: 'faq',
      content: { heading: 'Frequently Asked Questions' },
    },
    {
      pageKey: 'booking',
      title: 'Book a Ticket',
      slug: 'booking',
      content: {
        heading: 'Request an Air Ticket',
        note: 'Submit your travel details and our team will contact you with the best available fare.',
      },
    },
  ];

  for (const page of pages) {
    if (!CMS_PAGE_KEYS.includes(page.pageKey)) continue;
    await CmsPage.findOneAndUpdate(
      { pageKey: page.pageKey },
      {
        pageKey: page.pageKey,
        title: page.title,
        slug: page.slug,
        content: page.content || {},
        sections: page.sections || [],
        isPublished: true,
        seo: {
          metaTitle: `${page.title} | ${COMPANY_DEFAULTS.name}`,
          metaDescription: `${COMPANY_DEFAULTS.name} - Air ticket sales in Sylhet, Bangladesh`,
        },
      },
      { upsert: true, new: true }
    );
  }
  console.log('✓ CMS pages seeded');
}

async function seedAdminUser() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@showterraair.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123456';

  const existing = await User.findOne({ email: adminEmail });
  if (existing) {
    console.log('✓ Admin user already exists — skipped');
    return;
  }

  await User.create({
    name: 'System Admin',
    email: adminEmail,
    phone: COMPANY_DEFAULTS.directorPhone,
    password: adminPassword,
    role: ROLES.ADMIN,
    isActive: true,
  });

  console.log(`✓ Admin user created: ${adminEmail}`);
  console.log('  ⚠ Change the default password after first login');
}

async function seedSecuritySettings() {
  await SecuritySetting.findOneAndUpdate(
    { key: 'security' },
    { key: 'security' },
    { upsert: true, new: true }
  );
  console.log('✓ Security settings seeded');
}

async function runSeed() {
  try {
    await mongoose.connect(env.mongodbUri);
    console.log('Connected to MongoDB for seeding...\n');

    await seedRoles();
    await seedAccounts();
    await seedExpenseCategories();
    await seedSettings();
    await seedCmsPages();
    await seedSecuritySettings();
    await seedAdminUser();

    console.log('\n✅ Seed completed successfully');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runSeed();
