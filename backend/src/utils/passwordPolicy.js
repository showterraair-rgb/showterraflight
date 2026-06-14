import SecuritySetting from '../models/SecuritySetting.js';

const DEFAULTS = {
  minPasswordLength: 10,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: false,
};

export async function getSecuritySettings() {
  let settings = await SecuritySetting.findOne({ key: 'security' }).lean();
  if (!settings) {
    settings = await SecuritySetting.create({ key: 'security', ...DEFAULTS });
    settings = settings.toObject();
  }
  return settings;
}

export function validatePasswordStrength(password, settings = DEFAULTS) {
  const errors = [];
  const minLen = settings.minPasswordLength || 10;

  if (!password || password.length < minLen) {
    errors.push(`Password must be at least ${minLen} characters`);
  }
  if (settings.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (settings.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (settings.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain a number');
  }
  if (settings.requireSpecialChar && !/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain a special character');
  }

  return errors;
}

export default { getSecuritySettings, validatePasswordStrength };
