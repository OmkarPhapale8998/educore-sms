const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, default: 'student', enum: ['admin', 'faculty', 'student'] },
  phone: { type: String, default: '' },
  photo: { type: String, default: '' },
  is_active: { type: Boolean, required: true, default: true },
  reset_password_token: String,
  reset_password_expire: Date,
  last_login: Date,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('User', userSchema);
