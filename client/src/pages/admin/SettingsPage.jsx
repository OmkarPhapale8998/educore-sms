import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../api";
import toast from "react-hot-toast";

export const SettingsPage = () => {
  const { user, updateUser } = useAuth();

  // Profile Form
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [photo, setPhoto] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      if (photo) formData.append("photo", photo);

      const res = await authAPI.updateProfile(formData);
      if (res.data.success) {
        toast.success("Profile updated successfully!");
        updateUser(res.data.user);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await authAPI.changePassword({ currentPassword, newPassword });
      if (res.data.success) {
        toast.success("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">Account & System Settings</h1>
        <p className="text-sm text-on-surface-variant mt-1">Manage profile credentials, password security & campus preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
            <span className="material-symbols-outlined text-primary text-2xl">person</span>
            <h2 className="text-base font-bold text-on-surface">My Profile</h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Institutional Email</label>
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/40 rounded-xl opacity-70 cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Contact Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Profile Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files[0])}
                className="w-full text-xs text-on-surface-variant file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-on-primary hover:file:bg-primary-container"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow hover:bg-primary-container disabled:opacity-50"
            >
              {savingProfile ? "Updating..." : "Save Profile Details"}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
            <span className="material-symbols-outlined text-primary text-2xl">lock</span>
            <h2 className="text-base font-bold text-on-surface">Security & Password</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Current Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow hover:bg-primary-container disabled:opacity-50"
            >
              {savingPassword ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
