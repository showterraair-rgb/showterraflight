import mongoose from 'mongoose';
import { AGENT_TRANSACTION_TYPES } from '../config/agentConstants.js';

const agentTransactionSchema = new mongoose.Schema(
  {
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true, index: true },
    bookingRef: { type: String, trim: true },
    type: { type: String, enum: AGENT_TRANSACTION_TYPES, required: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, required: true, trim: true },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

agentTransactionSchema.index({ agent: 1, createdAt: -1 });

const AgentTransaction = mongoose.model('AgentTransaction', agentTransactionSchema);

export default AgentTransaction;
