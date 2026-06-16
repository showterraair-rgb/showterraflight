import Agent from '../models/Agent.js';
import ApiError from '../utils/ApiError.js';
import { verifyToken } from '../utils/jwt.js';
import env from '../config/env.js';

export default async function authAgent(req, res, next) {
  try {
    const token = req.cookies?.[env.jwt.agentCookieName];

    if (!token) {
      throw ApiError.unauthorized('Agent authentication required');
    }

    const decoded = verifyToken(token);

    if (decoded.type !== 'agent' || !decoded.agentId) {
      throw ApiError.unauthorized('Invalid agent token');
    }

    const agent = await Agent.findById(decoded.agentId).select('+password');

    if (!agent || !agent.isActive) {
      throw ApiError.unauthorized('Agent account inactive or not found');
    }

    if (agent.passwordChangedAt && decoded.iat * 1000 < agent.passwordChangedAt.getTime()) {
      throw ApiError.unauthorized('Session expired — please log in again');
    }

    agent.lastActivityAt = new Date();
    await agent.save({ validateBeforeSave: false });

    req.agent = {
      id: agent._id.toString(),
      agentId: agent.agentId,
      email: agent.email,
      companyName: agent.companyName,
    };

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Invalid or expired agent session'));
    }
    next(err);
  }
}
