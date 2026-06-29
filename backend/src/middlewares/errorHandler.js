import mongoose from 'mongoose';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import { isTransactionNotSupported } from '../utils/mongoSession.js';

function toOperationalError(err) {
  if (err?.isOperational) return err;

  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return ApiError.badRequest('Validation failed', errors);
  }

  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid value for ${err.path}`);
  }

  if (err?.name === 'MongoServerError' && err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'record';
    return ApiError.badRequest(`Duplicate ${field} — please try again`);
  }

  if (isTransactionNotSupported(err)) {
    return ApiError.badRequest('Database transactions are unavailable. Contact your administrator.');
  }

  return err;
}

export function errorHandler(err, _req, res, _next) {
  const normalized = toOperationalError(err);
  const statusCode = normalized.statusCode || 500;
  const isOperational = normalized.isOperational === true;

  if (!isOperational) {
    console.error(normalized);
  }

  res.status(statusCode).json({
    success: false,
    message: isOperational ? normalized.message : env.isProduction ? 'Internal server error' : normalized.message,
    errors: normalized.errors || undefined,
  });
}

export default errorHandler;
