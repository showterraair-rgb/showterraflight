import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

export function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational === true;

  if (!isOperational) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message: isOperational ? err.message : env.isProduction ? 'Internal server error' : err.message,
    errors: err.errors || undefined,
  });
}

export default errorHandler;
