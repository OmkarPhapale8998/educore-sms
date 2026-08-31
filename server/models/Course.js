const mongoose = require('mongoose');

const syllabusMaterialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  path: { type: String, required: true }
});

const syllabusUnitSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  completed: { type: Boolean, required: true, default: false },
  position: { type: Number, required: true, default: 0 },
  materials: [syllabusMaterialSchema]
});

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  department: { 
    type: String, required: true, 
    enum: ['Computer Science', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Electronics', 'Information Technology', 'Automobile Engineering'] 
  },
  semester: { type: Number, required: true, min: 1, max: 6 },
  credits: { type: Number, required: true },
  type: { type: String, required: true, default: 'Theory', enum: ['Theory', 'Practical', 'Both'] },
  assigned_faculty_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
  syllabus_file: String,
  is_active: { type: Boolean, required: true, default: true },
  syllabus_units: [syllabusUnitSchema]
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Course', courseSchema);
