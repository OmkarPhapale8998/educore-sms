const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  employee_id: { type: String, required: true, unique: true },
  department: { 
    type: String, required: true, 
    enum: ['Computer Science', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Electronics', 'Information Technology', 'Automobile Engineering'] 
  },
  designation: { type: String, required: true, default: 'Assistant Professor' },
  qualification: [{ type: String }],
  joining_date: { type: Date, required: true, default: Date.now },
  experience: { type: Number, required: true, default: 0 },
  status: { type: String, required: true, default: 'active', enum: ['active', 'inactive', 'on_leave'] },
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Faculty', facultySchema);
