import mongoose from 'mongoose';
import env from '../config/env.js';
import CmsPage from '../models/CmsPage.js';
import { COMPANY_DEFAULTS } from '../config/constants.js';
import { buildFullHomeSeedContent } from '../config/fullHomeSeedContent.js';
import { seedHomeMedia } from './seedHomeMedia.js';

async function run() {
  try {
    await mongoose.connect(env.mongodbUri);
    console.log('Seeding homepage photos + CMS content...\n');

    seedHomeMedia();

    await CmsPage.findOneAndUpdate(
      { pageKey: 'home' },
      {
        pageKey: 'home',
        title: 'Home',
        slug: 'home',
        content: buildFullHomeSeedContent(),
        sections: [],
        isPublished: true,
        seo: {
          metaTitle: `Home | ${COMPANY_DEFAULTS.name}`,
          metaDescription: `${COMPANY_DEFAULTS.name} - Air tickets, Umrah, and tour packages from Sylhet, Bangladesh`,
        },
      },
      { upsert: true, new: true }
    );

    console.log('✓ Homepage CMS updated with full content + photo paths');
    console.log('\n✅ Done. Reload API: pm2 reload sta-api');
  } catch (err) {
    console.error('Seed home failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

run();
