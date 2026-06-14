import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SEED_DIR = path.join(__dirname, '../../seeds/media/home');
const UPLOAD_DIR = path.join(__dirname, '../../uploads/cms/home');

/** Copy bundled starter photos into VPS upload storage */
export function seedHomeMedia() {
  if (!fs.existsSync(SEED_DIR)) {
    console.warn('⚠ No seed media folder — skip copy');
    return 0;
  }

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const files = fs.readdirSync(SEED_DIR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  for (const file of files) {
    fs.copyFileSync(path.join(SEED_DIR, file), path.join(UPLOAD_DIR, file));
  }
  console.log(`✓ Homepage media copied (${files.length} files → uploads/cms/home/)`);
  return files.length;
}

export default seedHomeMedia;
