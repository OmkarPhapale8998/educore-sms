// ============================================================
// FacultyPage.jsx
// Teaching-staff directory shown as cards: search +
// department filter, an "Add Faculty Member" modal form, and
// delete with a confirmation popup.
// ============================================================
import React, { useState, useEffect } from "react";
import { facultyAPI, courseAPI } from "../../api";
import { Badge, TableSkeleton, Modal } from "../../components/ui";
import toast from "react-hot-toast";

// Options for the department filter dropdown.
const DEPARTMENTS = [
  "All Departments",
  "Computer Science",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Electronics",
  "Information Technology"
];

export const FacultyPage = () => {
  // Faculty members currently displayed as cards.
  const [facultyList, setFacultyList] = useState([]);
  // Department filter value ("" = all).
  const [department, setDepartment] = useState("");
  // Search box text (applied when Enter is pressed).
  const [search, setSearch] = useState("");
  // True while the list is being fetched.
  const [loading, setLoading] = useState(true);

  // Modal states
  // Opens/closes the add-faculty dialog.
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // True while the create request runs.
  const [submitting, setSubmitting] = useState(false);
  // Fields of the add-faculty form.
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "Faculty@1234",
    employeeId: "",
    department: "Computer Science",
    designation: "Assistant Professor",
    qualification: "B.Tech, M.Tech"
  });

  // Re-fetches faculty whenever the department filter changes.
  useEffect(() => {
    fetchFaculty();
  }, [department]);

  // Fetches the faculty list using current department/search filters.
  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const params = {};
      if (department && department !== "All Departments") params.department = department;
      if (search) params.search = search;
      const res = await facultyAPI.getAll(params);
      if (res.data.success) setFacultyList(res.data.data);
    } catch (err) {
      toast.error("Failed to load faculty directory");
    } finally {
      setLoading(false);
    }
  };

  // Registers new faculty; qualification text is split into an array for the API.
  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        qualification: formData.qualification.split(",").map((q) => q.trim())
      };
      const res = await facultyAPI.create(payload);
      if (res.data.success) {
        toast.success("Faculty member registered successfully!");
        setIsAddModalOpen(false);
        setFormData({
          name: "", email: "", phone: "", password: "Faculty@1234",
          employeeId: "", department: "Computer Science",
          designation: "Assistant Professor", qualification: "B.Tech, M.Tech"
        });
        fetchFaculty();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to register faculty");
    } finally {
      setSubmitting(false);
    }
  };

  // Asks for confirmation, deletes the faculty member, refreshes the list.
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this faculty member?")) return;
    try {
      await facultyAPI.delete(id);
      toast.success("Faculty member deleted");
      fetchFaculty();
    } catch (err) {
      toast.error("Failed to delete faculty");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">Faculty Directory</h1>
          <p className="text-sm text-on-surface-variant mt-1">Manage teaching staff, qualifications & department assignments</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs shadow-sm hover:shadow-md hover:bg-primary-container transition-all"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          Add Faculty Member
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
            search
          </span>
          <input
            type="text"
            placeholder="Search by name, employee ID, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchFaculty()}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface font-medium focus:ring-2 focus:ring-primary"
        >
          {DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept === "All Departments" ? "" : dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      {/* Faculty Grid - loading / empty / cards */}
      {loading ? (
        <TableSkeleton rows={4} cols={3} />
      ) : facultyList.length === 0 ? (
        <div className="p-12 text-center text-on-surface-variant bg-surface-container-lowest rounded-3xl border border-outline-variant/30">
          <span className="material-symbols-outlined text-5xl mb-2 text-on-surface-variant/40">badge</span>
          <p className="text-base font-bold text-on-surface">No faculty members found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {facultyList.map((fac) => (
            <div
              key={fac._id}
              className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-secondary text-on-secondary flex items-center justify-center font-bold text-base uppercase shadow-sm">
                    {fac.userId?.name ? fac.userId.name.slice(0, 2) : "FC"}
                  </div>
                  <Badge status={fac.status} />
                </div>

                <h3 className="font-bold text-base text-on-surface">{fac.userId?.name}</h3>
                <p className="text-xs font-semibold text-primary mt-0.5">{fac.designation}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{fac.department}</p>

                <div className="mt-4 pt-4 border-t border-outline-variant/20 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Emp ID:</span>
                    <span className="font-mono font-bold text-on-surface">{fac.employeeId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Email:</span>
                    <span className="font-medium text-on-surface truncate max-w-[150px]">{fac.userId?.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Phone:</span>
                    <span className="font-medium text-on-surface">{fac.userId?.phone || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Qualifications:</span>
                    <span className="font-medium text-on-surface">{fac.qualification?.join(", ") || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between">
                <span className="text-[11px] text-on-surface-variant">
                  {fac.subjectsAssigned?.length || 0} Courses Assigned
                </span>
                <button
                  onClick={() => handleDelete(fac._id)}
                  className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Faculty Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Faculty Member"
        maxWidth="max-w-2xl"
      >
        {/* Registration form (identity, contact, academic details) */}
        <form onSubmit={handleCreateFaculty} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="Dr. Priya Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Official Email *</label>
              <input
                type="email"
                required
                placeholder="priya@educore.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Employee ID *</label>
              <input
                type="text"
                required
                placeholder="FAC005"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Mobile Phone *</label>
              <input
                type="tel"
                required
                placeholder="9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Department *</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
              >
                {DEPARTMENTS.filter((d) => d !== "All Departments").map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Designation</label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-on-surface-variant uppercase mb-1">
                Qualifications (comma separated)
              </label>
              <input
                type="text"
                placeholder="B.Tech, M.Tech, Ph.D"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 bg-surface-container text-on-surface font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs shadow hover:bg-primary-container disabled:opacity-50"
            >
              {submitting ? "Registering..." : "Add Faculty Member"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
