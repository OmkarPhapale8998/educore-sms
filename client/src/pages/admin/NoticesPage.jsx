// ============================================================
// NoticesPage.jsx
// Campus notice board: category filter pills, notice cards
// (with pin/unpin, delete and attachment downloads) and a
// "Publish Notice" modal that accepts an optional PDF.
// ============================================================
import React, { useState, useEffect } from "react";
import { noticeAPI } from "../../api";
import { API_ORIGIN } from "../../api/client";
import { TableSkeleton, Modal } from "../../components/ui";
import toast from "react-hot-toast";

// Filter pill options at the top of the board.
const CATEGORIES = ["All", "General", "Exam", "Event", "Holiday", "Academic", "Urgent"];

export const NoticesPage = () => {
  // Notices currently displayed as cards.
  const [notices, setNotices] = useState([]);
  // Selected category pill ("All" shows everything).
  const [category, setCategory] = useState("All");
  // True while notices are being fetched.
  const [loading, setLoading] = useState(true);

  // Post Notice Modal
  // Opens/closes the publish dialog.
  const [isPostOpen, setIsPostOpen] = useState(false);
  // True while the publish request runs.
  const [submitting, setSubmitting] = useState(false);
  // Fields of the publish form.
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "General",
    targetAudience: "all",
    isPinned: false
  });
  // Optional PDF file attached to a new notice.
  const [attachment, setAttachment] = useState(null);

  // Re-fetches notices whenever a category pill is clicked.
  useEffect(() => {
    fetchNotices();
  }, [category]);

  // Fetches notices filtered by the selected category.
  const fetchNotices = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category !== "All") params.category = category;
      const res = await noticeAPI.getAll(params);
      if (res.data.success) setNotices(res.data.data);
    } catch (err) {
      toast.error("Failed to load notices");
    } finally {
      setLoading(false);
    }
  };

  // Publishes a new notice; packs fields + optional file into FormData.
  const handleCreateNotice = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // FormData lets us send both text fields and the attachment together.
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("description", formData.description);
      payload.append("category", formData.category);
      payload.append("targetAudience", formData.targetAudience);
      payload.append("isPinned", formData.isPinned);
      if (attachment) payload.append("attachment", attachment);

      const res = await noticeAPI.create(payload);
      if (res.data.success) {
        toast.success("Notice posted and audience notified!");
        setIsPostOpen(false);
        setFormData({ title: "", description: "", category: "General", targetAudience: "all", isPinned: false });
        setAttachment(null);
        fetchNotices();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post notice");
    } finally {
      setSubmitting(false);
    }
  };

  // Pins/unpins a notice so it stays on top of the board.
  const handleTogglePin = async (id) => {
    try {
      const res = await noticeAPI.togglePin(id);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchNotices();
      }
    } catch (err) {
      toast.error("Failed to pin notice");
    }
  };

  // Asks for confirmation, deletes the notice, refreshes the board.
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notice?")) return;
    try {
      await noticeAPI.delete(id);
      toast.success("Notice deleted");
      fetchNotices();
    } catch (err) {
      toast.error("Failed to delete notice");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">Campus Notices & Bulletin</h1>
          <p className="text-sm text-on-surface-variant mt-1">Broadcast official announcements, circulars & exam alerts</p>
        </div>

        <button
          onClick={() => setIsPostOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs shadow-sm hover:shadow-md hover:bg-primary-container transition-all"
        >
          <span className="material-symbols-outlined text-base">campaign</span>
          Publish Notice
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              category === cat
                ? "bg-primary text-on-primary shadow-sm"
                : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container border border-outline-variant/30"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notice Cards Grid */}
      {loading ? (
        <TableSkeleton rows={4} cols={2} />
      ) : notices.length === 0 ? (
        <div className="p-12 text-center text-on-surface-variant bg-surface-container-lowest rounded-3xl border border-outline-variant/30">
          <span className="material-symbols-outlined text-5xl mb-2 text-on-surface-variant/40">campaign</span>
          <p className="text-base font-bold text-on-surface">No notices found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* One notice card (highlighted when pinned) */}
          {notices.map((notice) => (
            <div
              key={notice._id}
              className={`p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                notice.isPinned
                  ? "bg-surface-container-lowest border-primary/40 ring-1 ring-primary/20"
                  : "bg-surface-container-lowest border-outline-variant/30"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold rounded-full uppercase">
                      {notice.category}
                    </span>
                    {notice.isPinned && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        <span className="material-symbols-outlined text-xs">push_pin</span>
                        Pinned
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTogglePin(notice._id)}
                      title={notice.isPinned ? "Unpin notice" : "Pin notice to top"}
                      className={`p-1.5 rounded-lg transition-colors ${
                        notice.isPinned ? "text-primary bg-primary/10" : "text-on-surface-variant hover:bg-surface-container"
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">push_pin</span>
                    </button>
                    <button
                      onClick={() => handleDelete(notice._id)}
                      title="Delete notice"
                      className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-base text-on-surface">{notice.title}</h3>
                <p className="text-xs text-on-surface-variant mt-2 leading-relaxed whitespace-pre-line">
                  {notice.description}
                </p>

                {notice.attachment && notice.attachment.path && (
                  <div className="mt-4 p-3 bg-surface-container-low rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="material-symbols-outlined text-primary text-lg">attachment</span>
                      <span className="font-semibold text-on-surface truncate">{notice.attachment.name || "Attachment"}</span>
                    </div>
                    <a
                      href={`${API_ORIGIN}/${notice.attachment.path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 bg-primary text-on-primary font-bold rounded-lg text-[11px] hover:bg-primary-container shrink-0"
                    >
                      Download
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-on-surface-variant">
                <span>Posted by {notice.postedBy?.name || "Admin"}</span>
                <span>{new Date(notice.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Publish Notice modal */}
      <Modal
        isOpen={isPostOpen}
        onClose={() => setIsPostOpen(false)}
        title="Publish Campus Notice"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateNotice} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-on-surface-variant uppercase mb-1">Notice Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Schedule for Mid-Term Examinations"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
              >
                {CATEGORIES.filter((c) => c !== "All").map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Target Audience</label>
              <select
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
              >
                <option value="all">Everyone (All Campus)</option>
                <option value="students">Students Only</option>
                <option value="faculty">Faculty Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-on-surface-variant uppercase mb-1">Detailed Description *</label>
            <textarea
              rows={4}
              required
              placeholder="Write the full circular announcement..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block font-bold text-on-surface-variant uppercase mb-1">Optional PDF Attachment</label>
            <input
              type="file"
              onChange={(e) => setAttachment(e.target.files[0])}
              className="w-full text-xs text-on-surface-variant file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-on-primary hover:file:bg-primary-container"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isPinned"
              checked={formData.isPinned}
              onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
              className="rounded text-primary focus:ring-primary"
            />
            <label htmlFor="isPinned" className="text-xs font-bold text-on-surface cursor-pointer">
              Pin notice to top of the bulletin
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={() => setIsPostOpen(false)}
              className="px-4 py-2 bg-surface-container text-on-surface font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs shadow hover:bg-primary-container disabled:opacity-50"
            >
              {submitting ? "Publishing..." : "Publish Notice"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
