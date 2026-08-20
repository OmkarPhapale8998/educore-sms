import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authAPI } from "../../api";
import toast from "react-hot-toast";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await authAPI.forgotPassword({ email });
      if (res.data.success) {
        setSubmitted(true);
        toast.success("Password reset link sent to your email!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low p-4">
      <div className="max-w-md w-full bg-surface-container-lowest rounded-3xl shadow-xl border border-outline-variant/30 p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
            <span className="material-symbols-outlined text-3xl">lock_reset</span>
          </div>
          <h2 className="text-2xl font-black text-on-surface">Reset Password</h2>
          <p className="text-sm text-on-surface-variant mt-2">
            Enter your registered institutional email to receive a password reset link.
          </p>
        </div>

        {submitted ? (
          <div className="text-center space-y-4">
            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-sm">
              <p className="font-bold">Email Sent!</p>
              <p className="mt-1 text-xs">
                Check your inbox for instructions to reset your password. The link is valid for 10 minutes.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-block w-full py-3 bg-primary text-on-primary font-bold rounded-xl text-center"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="name@educore.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary hover:bg-primary-container text-on-primary font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs font-semibold text-primary hover:underline">
                ← Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
