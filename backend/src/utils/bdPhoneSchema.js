import { z } from 'zod';
import { isValidBdMobile } from './phoneUtils.js';

const BD_PHONE_ERROR = 'Use Bangladesh mobile: 017/018/019XXXXXXXX or +88017XXXXXXXX';

/** Zod string validator for BD mobile (does not transform — services normalize on save). */
export function bdPhoneString(options = {}) {
  const { optional = false } = options;
  let schema = z.string().trim();
  if (optional) {
    return schema
      .optional()
      .or(z.literal(''))
      .refine((v) => !v || isValidBdMobile(v), { message: BD_PHONE_ERROR });
  }
  return schema
    .min(10, 'Phone number is too short')
    .max(22, 'Phone number is too long')
    .refine(isValidBdMobile, { message: BD_PHONE_ERROR });
}

export default { bdPhoneString };
