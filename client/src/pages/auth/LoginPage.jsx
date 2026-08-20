import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    if (!cleanEmail || !cleanPassword) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    const res = await login(cleanEmail, cleanPassword);
    setLoading(false);

    if (res?.success) {
      if (res.user.role === "student") navigate("/student/portal");
      else if (res.user.role === "faculty") navigate("/faculty/dashboard");
      else navigate("/dashboard");
    }
  };

  const handleDemoFill = (roleEmail, rolePass) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    toast.success(`Demo credentials filled for ${roleEmail.split("@")[0]}! Click Sign In.`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl w-full bg-surface-container-lowest rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/30 grid grid-cols-1 md:grid-cols-2">
        {/* Left Visual / Branding Column */}
        <div className="bg-primary p-8 sm:p-12 text-on-primary flex flex-col justify-between relative overflow-hidden">
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

            <div className="space-y-4 my-8">
              <h2 className="text-3xl font-black text-white leading-tight">
                Modern Campus <br />
                <span className="text-secondary-fixed">Management Portal</span>
              </h2>
              <p className="text-sm text-on-primary/80 leading-relaxed">
                Streamline academics, attendance, fees, exams, and notices in one unified intelligent system.
              </p>
            </div>
          </div>

          {/* Quick Demo Logins */}
          <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <p className="text-xs font-bold uppercase tracking-wider text-on-primary/90 mb-2">
              ⚡ Quick Fill Demo Logins:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill("admin@educore.edu", "Admin@1234")}
                className="px-2 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill("priya@educore.edu", "Faculty@1234")}
                className="px-2 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Faculty
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill("aarav.mehta@student.educore.edu", "Student@1234")}
                className="px-2 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Student
              </button>
            </div>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-on-surface">Welcome Back</h2>
            <p className="text-sm text-on-surface-variant mt-1">Sign in with your institutional credentials</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Institutional Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
                  mail
                </span>
                <input
                  type="email"
                  required
                  placeholder="name@educore.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
                  lock
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-primary hover:bg-primary-container text-on-primary font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6 pt-4 border-t border-outline-variant/30">
            <p className="text-xs text-on-surface-variant">
              Don't have an account?{" "}
              <Link to="/register" className="font-bold text-primary hover:underline inline-flex items-center gap-0.5">
                <span>Create an Account</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-on-surface-variant/70 mt-6">
            © 2026 EduCore SMS. Protected by institutional security policies.
          </p>
        </div>
      </div>
    </div>
  );
};
