import mongoose from 'mongoose';
import env from '../config/env.js';
import {
  ROLES,
  ROLE_LABELS,
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  DEFAULT_EXPENSE_CATEGORIES,
  COMPANY_DEFAULTS,
  CMS_PAGE_KEYS,
  DEFAULT_NOTIFICATION_TEMPLATES,
  DEFAULT_AUTOMATION_RULES,
} from '../config/constants.js';
import { DEFAULT_CURRENCIES } from '../config/currencies.js';
import { ROLE_PERMISSIONS } from '../config/permissions.js';
import Role from '../models/Role.js';
import User from '../models/User.js';
import Account from '../models/Account.js';
import ExpenseCategory from '../models/ExpenseCategory.js';
import Setting from '../models/Setting.js';
import CmsPage from '../models/CmsPage.js';
import { buildFullHomeSeedContent } from '../config/fullHomeSeedContent.js';
import { seedHomeMedia } from './seedHomeMedia.js';
import SecuritySetting from '../models/SecuritySetting.js';
import SmsSetting from '../models/SmsSetting.js';
import EmailSetting from '../models/EmailSetting.js';
import WhatsAppSetting from '../models/WhatsAppSetting.js';
import NotificationTemplate from '../models/NotificationTemplate.js';
import NotificationAutomationRule from '../models/NotificationAutomationRule.js';

const ROLE_SEED_LABELS = ROLE_LABELS;

async function seedRoles() {
  for (const name of Object.values(ROLES)) {
    await Role.findOneAndUpdate(
      { name },
      {
        name,
        label: ROLE_SEED_LABELS[name] || name,
        permissions: ROLE_PERMISSIONS[name] || [],
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
      { type, name: ACCOUNT_TYPE_LABELS[type] },
      {
        title: ACCOUNT_TYPE_LABELS[type],
        name: ACCOUNT_TYPE_LABELS[type],
        type,
        mobileBankingType: ['bkash', 'nagad'].includes(type) ? type : null,
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
      bookingNumberPrefix: 'TFBR',
      invoicePrefix: 'INV',
      currencies: DEFAULT_CURRENCIES,
      currenciesUpdatedAt: new Date(),
    },
    { upsert: true, new: true }
  );
  console.log('✓ Company settings seeded');
}

async function seedCmsPages() {
  seedHomeMedia();

  const pages = [
    {
      pageKey: 'home',
      title: 'Home',
      slug: 'home',
      content: buildFullHomeSeedContent(),
      sections: [],
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
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@showterraair.com').toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123456';

  const existing = await User.findOne({ email: adminEmail });
  if (existing) {
    existing.name = 'System Admin';
    existing.role = ROLES.ADMIN;
    existing.isActive = true;
    if (process.env.SEED_ADMIN_PASSWORD) {
      existing.password = adminPassword;
    }
    await existing.save();
    console.log(`✓ Main admin active: ${adminEmail}`);
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

async function seedDemoUser() {
  if (process.env.SEED_DEMO_USER !== 'true') return;

  const email = (process.env.DEMO_USER_EMAIL || 'demo@showterraair.com').toLowerCase();
  const password = process.env.DEMO_USER_PASSWORD || 'Demo@123456';
  const role = process.env.DEMO_USER_ROLE || ROLES.DEMO;

  const existing = await User.findOne({ email });
  if (existing) {
    existing.name = 'Demo User';
    existing.phone = '01700000000';
    existing.role = role;
    existing.password = password;
    existing.isActive = true;
    await existing.save();
  } else {
    await User.create({
      name: 'Demo User',
      email,
      phone: '01700000000',
      password,
      role,
      isActive: true,
    });
  }

  console.log(`✓ Demo user ready: ${email} (${role})`);
}

async function seedSecuritySettings() {
  await SecuritySetting.findOneAndUpdate(
    { key: 'security' },
    { key: 'security' },
    { upsert: true, new: true }
  );
  console.log('✓ Security settings seeded');
}

async function seedNotificationSettings() {
  const smsFromEnv = {
    providerName: 'BulkSMSBD',
    apiUrl: process.env.BULKSMSBD_API_URL || 'http://bulksmsbd.net/api/smsapi',
    apiKey: process.env.BULKSMSBD_API_KEY || '',
    senderId: process.env.BULKSMSBD_SENDER_ID || '',
    isEnabled: process.env.BULKSMSBD_ENABLED === 'true'
      || Boolean(process.env.BULKSMSBD_API_KEY && process.env.BULKSMSBD_SENDER_ID),
  };

  const emailFromEnv = {
    smtpHost: process.env.SMTP_HOST || process.env.EMAIL_SMTP_HOST || '',
    smtpPort: parseInt(process.env.SMTP_PORT || process.env.EMAIL_SMTP_PORT || '587', 10),
    username: process.env.SMTP_USER || process.env.EMAIL_SMTP_USER || '',
    password: process.env.SMTP_PASS || process.env.EMAIL_SMTP_PASS || '',
    encryption: process.env.SMTP_ENCRYPTION || 'tls',
    fromEmail: process.env.SMTP_FROM || process.env.EMAIL_FROM || '',
    fromName: process.env.SMTP_FROM_NAME || process.env.EMAIL_FROM_NAME || 'Show Terra Flight',
    replyTo: process.env.SMTP_FROM || process.env.EMAIL_FROM || '',
    isEnabled: process.env.SMTP_ENABLED === 'true'
      || process.env.EMAIL_ENABLED === 'true'
      || Boolean(
        (process.env.SMTP_USER || process.env.EMAIL_SMTP_USER)
        && (process.env.SMTP_PASS || process.env.EMAIL_SMTP_PASS)
      ),
  };

  const whatsappFromEnv = {
    isEnabled: process.env.WHATSAPP_ENABLED === 'true' || Boolean(process.env.WASENDER_API_KEY),
    defaultCountryCode: process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '880',
    defaultLanguageCode: process.env.WHATSAPP_DEFAULT_LANGUAGE || 'en',
  };

  await SmsSetting.findOneAndUpdate(
    { key: 'sms' },
    { key: 'sms', ...smsFromEnv },
    { upsert: true, new: true }
  );
  await EmailSetting.findOneAndUpdate(
    { key: 'email' },
    { key: 'email', ...emailFromEnv },
    { upsert: true, new: true }
  );
  await WhatsAppSetting.findOneAndUpdate(
    { key: 'whatsapp' },
    { key: 'whatsapp', ...whatsappFromEnv },
    { upsert: true, new: true }
  );
  console.log('✓ SMS, email & WhatsApp settings seeded');
}

async function seedNotificationTemplates() {
  for (const tpl of DEFAULT_NOTIFICATION_TEMPLATES) {
    await NotificationTemplate.findOneAndUpdate(
      { templateKey: tpl.templateKey },
      {
        templateKey: tpl.templateKey,
        name: tpl.name,
        smsBody: tpl.smsBody,
        whatsappBody: tpl.whatsappBody || tpl.smsBody || '',
        emailSubject: tpl.emailSubject,
        emailBody: tpl.emailBody,
        isActive: true,
      },
      { upsert: true, new: true }
    );
  }
  console.log('✓ Notification templates seeded');
}

async function seedAutomationRules() {
  for (const rule of DEFAULT_AUTOMATION_RULES) {
    await NotificationAutomationRule.findOneAndUpdate(
      { eventType: rule.eventType },
      rule,
      { upsert: true, new: true }
    );
  }
  console.log('✓ Notification automation rules seeded');
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
    await seedNotificationSettings();
    await seedNotificationTemplates();
    await seedAutomationRules();
    await seedAdminUser();
    await seedDemoUser();

    console.log('\n✅ Seed completed successfully');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runSeed();
