import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { studentAPI } from "../../api";
import toast from "react-hot-toast";

const DEPARTMENTS = [
  "Computer Science",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Electronics",
  "Information Technology"
];

export const AddStudentPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "Student@1234",
    gender: "Male",
    dateOfBirth: "",
    category: "General",
    
    rollNo: "",
    department: "Computer Science",
    semester: "1",
    admissionYear: new Date().getFullYear().toString(),
    
    guardianName: "",
    guardianPhone: "",
    address: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateStep = (s) => {
    if (s === 1) {
      if (!formData.name || !formData.email || !formData.phone) {
        toast.error("Please fill in Name, Email and Phone");
        return false;
      }
    } else if (s === 2) {
      if (!formData.rollNo || !formData.department || !formData.semester || !formData.admissionYear) {
        toast.error("Please fill in Roll Number, Department and Semester");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep(step + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await studentAPI.create(formData);
      if (res.data.success) {
        toast.success("Student registered successfully!");
        navigate(`/students/${res.data.data._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to register student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to="/students" className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mb-2">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Directory
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
            New Student Enrollment
          </h1>
          <p className="text-sm text-on-surface-variant">Complete all 3 stages to enroll a student</p>
        </div>
      </div>

      {/* Stepper Progress */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
        {[
          { num: 1, title: "Personal Details", icon: "person" },
          { num: 2, title: "Academic Profile", icon: "school" },
          { num: 3, title: "Guardian & Address", icon: "home" },
        ].map((s, idx) => (
          <div key={s.num} className="flex items-center gap-3 flex-1">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-colors shrink-0 ${
                step === s.num
                  ? "bg-primary text-on-primary shadow-md"
                  : step > s.num
                  ? "bg-emerald-600 text-white"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {step > s.num ? (
                <span className="material-symbols-outlined text-base">check</span>
              ) : (
                s.num
              )}
            </div>
            <div className="hidden sm:block min-w-0">
              <p className="text-xs font-bold text-on-surface truncate">{s.title}</p>
              <p className="text-[10px] text-on-surface-variant">Step {s.num} of 3</p>
            </div>
            {idx < 2 && <div className="flex-1 h-0.5 bg-outline-variant/30 hidden md:block mx-2" />}
          </div>
        ))}
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6">
        {/* Step 1: Personal Details */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-base font-bold text-on-surface border-b border-outline-variant/20 pb-3">
              Step 1: Student Personal Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Aarav Mehta"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Institutional Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="aarav.mehta@student.educore.edu"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Initial Password
                </label>
                <input
                  type="text"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Academic Profile */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-base font-bold text-on-surface border-b border-outline-variant/20 pb-3">
              Step 2: Academic Program Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Roll / Enrollment Number *
                </label>
                <input
                  type="text"
                  name="rollNo"
                  required
                  placeholder="e.g. CS2024001"
                  value={formData.rollNo}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Engineering Department *
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Current Semester *
                </label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary"
                >
                  {[1,2,3,4,5,6,7,8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Admission Year *
                </label>
                <input
                  type="number"
                  name="admissionYear"
                  required
                  value={formData.admissionYear}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Guardian & Address */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-base font-bold text-on-surface border-b border-outline-variant/20 pb-3">
              Step 3: Guardian & Contact Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Guardian / Father's Name
                </label>
                <input
                  type="text"
                  name="guardianName"
                  placeholder="e.g. Ramesh Mehta"
                  value={formData.guardianName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Guardian Contact Phone
                </label>
                <input
                  type="tel"
                  name="guardianPhone"
                  placeholder="9876543211"
                  value={formData.guardianPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Permanent Residential Address
                </label>
                <textarea
                  name="address"
                  rows={3}
                  placeholder="House / Street / City / PIN"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-outline-variant/20">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-5 py-2.5 bg-surface-container text-on-surface font-bold rounded-xl text-xs hover:bg-surface-container-high"
            >
              Previous
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs shadow-md hover:bg-primary-container"
            >
              Next Step →
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-primary text-on-primary font-bold rounded-xl text-xs shadow-md hover:bg-primary-container disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? "Registering Student..." : "Complete Enrollment"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
