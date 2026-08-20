import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const DEPARTMENTS = [
  "Computer Science",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Electronics",
  "Information Technology"
];

const FACULTY_DESIGNATIONS = [
  "Assistant Professor",
  "Associate Professor",
  "Professor",
  "Lecturer",
  "Head of Department"
];

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState("student"); // "student" | "faculty" | "admin"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Student-specific fields
  const [department, setDepartment] = useState("Computer Science");
  const [semester, setSemester] = useState("1");
  const [admissionYear, setAdmissionYear] = useState(new Date().getFullYear().toString());
  const [rollNo, setRollNo] = useState("");
  const [gender, setGender] = useState("Male");

  // Faculty-specific fields
  const [designation, setDesignation] = useState("Assistant Professor");
  const [employeeId, setEmployeeId] = useState("");
  const [qualification, setQualification] = useState("M.Tech");
  const [experience, setExperience] = useState("2");

  // Admin secret / access code (optional institutional safety check)
  const [adminCode, setAdminCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter a valid institutional email");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      phone: phone.trim() || undefined,
    };

    if (role === "student") {
      payload.department = department;
      payload.semester = parseInt(semester);
      payload.admissionYear = parseInt(admissionYear) || new Date().getFullYear();
      if (rollNo.trim()) payload.rollNo = rollNo.trim().toUpperCase();
      payload.gender = gender;
    } else if (role === "faculty") {
      payload.department = department;
      payload.designation = designation;
      if (employeeId.trim()) payload.employeeId = employeeId.trim().toUpperCase();
      payload.qualification = qualification;
      payload.experience = parseInt(experience) || 1;
    }

    const res = await register(payload);
    setLoading(false);

    if (res?.success) {
      if (res.user.role === "student") navigate("/student/portal");
      else if (res.user.role === "faculty") navigate("/faculty/dashboard");
      else navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl w-full bg-surface-container-lowest rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/30 grid grid-cols-1 lg:grid-cols-12">
        {/* Left Visual & Role Switcher Column */}
        <div className="lg:col-span-5 bg-primary p-8 sm:p-10 text-on-primary flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-primary-container/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -top-16 w-64 h-64 bg-secondary/30 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-primary text-3xl material-symbols-fill">
                  school
                </span>
              </div>
              <div>
                <h1 className="font-extrabold text-2xl tracking-tight text-white">EduCore</h1>
                <p className="text-xs text-on-primary/80 font-medium">Diploma Engineering SMS</p>
              </div>
            </div>

            <div className="space-y-3 my-6">
              <span className="inline-block px-3 py-1 bg-white/20 text-white rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                Get Started
              </span>
              <h2 className="text-3xl font-black text-white leading-tight">
                Create Your <br />
                <span className="text-secondary-fixed">Campus Account</span>
              </h2>
              <p className="text-sm text-on-primary/80 leading-relaxed">
                Join our integrated campus portal to access coursework, marks, attendance, notifications, and academic records.
              </p>
            </div>
          </div>

          {/* Role Selection Tabs */}
          <div className="relative z-10 my-4">
            <p className="text-xs font-bold uppercase tracking-wider text-on-primary/90 mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">person_add</span>
              Select Your Role:
            </p>
            <div className="grid grid-cols-3 gap-2 bg-black/20 p-1.5 rounded-2xl backdrop-blur-md border border-white/10">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  role === "student"
                    ? "bg-white text-primary shadow-lg scale-[1.02]"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="material-symbols-outlined text-xl">school</span>
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("faculty")}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  role === "faculty"
                    ? "bg-white text-primary shadow-lg scale-[1.02]"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="material-symbols-outlined text-xl">badge</span>
                <span>Faculty</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  role === "admin"
                    ? "bg-white text-primary shadow-lg scale-[1.02]"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
                <span>Admin</span>
              </button>
            </div>

            <div className="mt-4 p-3.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-xs text-on-primary/90 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-lg text-secondary-fixed shrink-0 mt-0.5">info</span>
              <div>
                {role === "student" && (
                  <p>Register as a student to view attendance, exam schedules, results & download fee receipts.</p>
                )}
                {role === "faculty" && (
                  <p>Register as a faculty member to manage assigned courses, record student attendance & grade exams.</p>
                )}
                {role === "admin" && (
                  <p>Register as an administrator to oversee campus operations, manage students & faculty profiles.</p>
                )}
              </div>
            </div>
          </div>

          <div className="relative z-10 text-xs text-on-primary/70">
            Already have an account?{" "}
            <Link to="/login" className="text-white font-bold underline hover:text-secondary-fixed transition-colors">
              Sign In here
            </Link>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center overflow-y-auto max-h-[90vh]">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-on-surface">
                {role === "student" && "Student Registration"}
                {role === "faculty" && "Faculty Registration"}
                {role === "admin" && "Administrator Registration"}
              </h2>
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-extrabold rounded-full uppercase tracking-wider">
                {role}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Please enter your personal and institutional details below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Core Account Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                    person
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="name@educore.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                    call
                  </span>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {role === "student" && (
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}
            </div>

            {/* Role-Specific Fields */}
            {role === "student" && (
              <div className="p-4 bg-surface-container-low/60 rounded-2xl border border-outline-variant/30 space-y-4">
                <p className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">school</span>
                  Academic Profile
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">
                      Department <span className="text-error">*</span>
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-xs font-semibold text-on-surface focus:ring-2 focus:ring-primary"
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">
                      Current Semester <span className="text-error">*</span>
                    </label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-xs font-semibold text-on-surface focus:ring-2 focus:ring-primary"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">
                      Roll Number <span className="text-xs font-normal text-on-surface-variant/70">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Auto-generated if empty"
                      value={rollNo}
                      onChange={(e) => setRollNo(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">
                      Admission Year
                    </label>
                    <input
                      type="number"
                      value={admissionYear}
                      onChange={(e) => setAdmissionYear(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {role === "faculty" && (
              <div className="p-4 bg-surface-container-low/60 rounded-2xl border border-outline-variant/30 space-y-4">
                <p className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">badge</span>
                  Faculty Credentials
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">
                      Department <span className="text-error">*</span>
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-xs font-semibold text-on-surface focus:ring-2 focus:ring-primary"
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">
                      Designation <span className="text-error">*</span>
                    </label>
                    <select
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-xs font-semibold text-on-surface focus:ring-2 focus:ring-primary"
                    >
                      {FACULTY_DESIGNATIONS.map((des) => (
                        <option key={des} value={des}>{des}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">
                      Employee ID <span className="text-xs font-normal text-on-surface-variant/70">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Auto-generated"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">
                      Qualification
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. M.Tech, Ph.D"
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">
                      Exp. (Years)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Password Credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Password <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                    lock
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Min 6 chars"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
                  >
                    <span className="material-symbols-outlined text-base">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Confirm Password <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                    lock_check
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 bg-surface-container-low border rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      confirmPassword && password !== confirmPassword
                        ? "border-error focus:ring-error"
                        : "border-outline-variant/50 focus:ring-primary"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-primary hover:bg-primary-container text-on-primary font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create {role.charAt(0).toUpperCase() + role.slice(1)} Account</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6 pt-4 border-t border-outline-variant/30">
            <p className="text-xs text-on-surface-variant">
              Already have an account?{" "}
              <Link to="/login" className="font-bold text-primary hover:underline">
                Sign In to EduCore
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
