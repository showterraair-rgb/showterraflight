import User from '../models/User.js';

export async function generateStaffId() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const id = String(Math.floor(100000 + Math.random() * 900000));
    const exists = await User.findOne({ staffId: id }).select('_id').lean();
    if (!exists) return id;
  }
  throw new Error('Could not generate unique staff ID');
}

export default { generateStaffId };
