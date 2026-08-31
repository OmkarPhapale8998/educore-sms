const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  roll_no: { type: String, required: true, unique: true },
  department: { 
    type: String, 
    enum: ['Computer Science', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Electronics', 'Information Technology', 'Automobile Engineering'] 
  },
  semester: { type: Number, min: 1, max: 6 },
  admission_year: { type: Number, required: true },
  guardian_name: { type: String, default: '' },
  guardian_phone: { type: String, default: '' },
  address: { type: String, default: '' },
  date_of_birth: Date,
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  category: { type: String, enum: ['General', 'OBC', 'SC', 'ST', 'EWS'] },
  status: { type: String, required: true, default: 'active', enum: ['active', 'inactive', 'graduated', 'dropped'] },
  documents: [{
    name: { type: String, required: true },
    path: { type: String, required: true },
    uploaded_at: { type: Date, default: Date.now }
  }]
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Student', studentSchema);
