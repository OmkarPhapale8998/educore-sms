const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true, enum: ['low_attendance', 'new_notice', 'marks_published', 'exam_scheduled', 'general'] },
  title: { type: String, required: true },
  message: { type: String, required: true },
  related_id: mongoose.Schema.Types.ObjectId,
  related_model: String,
  is_read: { type: Boolean, required: true, default: false },
  read_at: Date
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

notificationSchema.index({ recipient: 1, is_read: 1, created_at: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
