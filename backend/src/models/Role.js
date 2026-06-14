import mongoose from 'mongoose';
import { ROLES } from '../config/constants.js';

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
      unique: true,
    },
    label: { type: String, required: true },
    description: { type: String, default: '' },
    permissions: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Role = mongoose.model('Role', roleSchema);

export default Role;
