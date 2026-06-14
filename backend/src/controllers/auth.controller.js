import env from '../config/env.js';
import * as authService from '../services/auth.service.js';
import getClientIp from '../utils/getClientIp.js';
import asyncHandler from '../utils/asyncHandler.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.login({
    email,
    password,
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'],
  });

  res.cookie(env.jwt.cookieName, result.token, result.cookieOptions);

  res.json({
    success: true,
    data: { user: result.user },
    message: 'Login successful',
  });
});

export const logout = asyncHandler(async (req, res) => {
  const result = await authService.logout(
    req.user?.id,
    getClientIp(req),
    req.headers['user-agent']
  );

  res.clearCookie(env.jwt.cookieName, authService.getClearCookieOptions());

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);

  res.json({
    success: true,
    data: { user },
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const result = await authService.changePassword(
    req.user.id,
    currentPassword,
    newPassword
  );

  res.json({
    success: true,
    message: result.message,
  });
});

export default { login, logout, me, changePassword };
