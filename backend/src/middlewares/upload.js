import multer from 'multer';
import path from 'path';
import fs from 'fs';
import env from '../config/env.js';

function ensureDir(subdir) {
  const dir = path.join(process.cwd(), env.upload.dir, subdir);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function createUpload(subdir, maxMb, allowedMimes) {
  const dir = ensureDir(subdir);
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const safe = String(file.originalname || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${Date.now()}-${safe}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: maxMb * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const mime = file.mimetype || '';
      if (allowedMimes.some((m) => mime.startsWith(m) || mime === m)) cb(null, true);
      else cb(new Error('File type not allowed'));
    },
  });
}

const cmsDir = ensureDir('cms');

export const cmsUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, cmsDir),
    filename: (_req, file, cb) => {
      const safe = String(file.originalname || 'image').replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${Date.now()}-${safe}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image uploads are allowed'));
  },
});

/** Passport scan — JPEG, PNG, PDF up to 8MB */
export const passportUpload = createUpload('passports', 8, ['image/', 'application/pdf']);

/** Agent ticket files — PDF/images up to 10MB */
export const agentTicketUpload = createUpload('agent-tickets', 10, ['image/', 'application/pdf']);

export function toPublicUploadPath(absolutePath) {
  const rel = path.relative(path.join(process.cwd(), env.upload.dir), absolutePath).replace(/\\/g, '/');
  return `/uploads/${rel}`;
}

export default cmsUpload;
