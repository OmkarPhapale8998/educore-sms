// ============================================================
// CoursesPage.jsx
// Curriculum manager: course cards filtered by department and
// semester, plus an "Add New Course" modal that can also
// assign a faculty member to the course.
// ============================================================
import React, { useState, useEffect } from "react";
import { courseAPI, facultyAPI } from "../../api";
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

export const CoursesPage = () => {
  // Courses currently shown as cards.
  const [courses, setCourses] = useState([]);
  // Loaded to fill the "Assign Faculty" dropdown in the modal.
  const [facultyList, setFacultyList] = useState([]);
  // Department filter value ("" = all).
  const [department, setDepartment] = useState("");
  // Semester filter value ("" = all).
  const [semester, setSemester] = useState("");
  // True while courses are being fetched.
  const [loading, setLoading] = useState(true);

  // Add course modal
  // Opens/closes the add-course dialog.
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // True while the create request runs.
  const [submitting, setSubmitting] = useState(false);
  // Fields of the add-course form.
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    department: "Computer Science",
    semester: "3",
    credits: "4",
    type: "Both",
    assignedFaculty: ""
  });

  // Reloads courses whenever a filter changes; faculty list loaded too.
  useEffect(() => {
    fetchCourses();
    fetchFaculty();
  }, [department, semester]);

  // Fetches courses using the current department/semester filters.
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = {};
      if (department && department !== "All Departments") params.department = department;
      if (semester) params.semester = semester;
      const res = await courseAPI.getAll(params);
      if (res.data.success) setCourses(res.data.data);
    } catch (err) {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  // Loads every faculty member for the assignment dropdown.
  const fetchFaculty = async () => {
    try {
      const res = await facultyAPI.getAll();
      if (res.data.success) setFacultyList(res.data.data);
    } catch (err) {}
  };

  // Creates the new course from the modal form and refreshes the grid.
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await courseAPI.create(formData);
      if (res.data.success) {
        toast.success("Course added to curriculum");
        setIsAddModalOpen(false);
        setFormData({
          name: "", code: "", department: "Computer Science",
          semester: "3", credits: "4", type: "Both", assignedFaculty: ""
        });
        fetchCourses();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add course");
    } finally {
      setSubmitting(false);
    }
  };

  // Asks for confirmation, deletes the course, refreshes the grid.
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this course?")) return;
    try {
      await courseAPI.delete(id);
      toast.success("Course deleted");
      fetchCourses();
    } catch (err) {
      toast.error("Failed to delete course");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">Curriculum & Courses</h1>
          <p className="text-sm text-on-surface-variant mt-1">Manage syllabus, course credits & assigned faculty</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs shadow-sm hover:shadow-md hover:bg-primary-container transition-all"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          Add New Course
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col sm:flex-row gap-3">
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface font-medium focus:ring-2 focus:ring-primary"
        >
          {DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept === "All Departments" ? "" : dept}>
              {dept}
            </option>
          ))}
        </select>

        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          className="px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface font-medium focus:ring-2 focus:ring-primary"
        >
          <option value="">All Semesters</option>
          {[1,2,3,4,5,6].map((s) => (
            <option key={s} value={s}>Semester {s}</option>
          ))}
        </select>
      </div>

      {/* Course Cards Grid - loading / empty / cards */}
      {loading ? (
        <TableSkeleton rows={4} cols={3} />
      ) : courses.length === 0 ? (
        <div className="p-12 text-center text-on-surface-variant bg-surface-container-lowest rounded-3xl border border-outline-variant/30">
          <span className="material-symbols-outlined text-5xl mb-2 text-on-surface-variant/40">school</span>
          <p className="text-base font-bold text-on-surface">No courses found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* One course card */}
          {courses.map((course) => (
            <div
              key={course._id}
              className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="font-mono text-xs font-black px-2.5 py-1 bg-primary/10 text-primary rounded-lg">
                    {course.code}
                  </span>
                  <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold rounded-full">
                    {course.type}
                  </span>
                </div>

                <h3 className="font-bold text-base text-on-surface">{course.name}</h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  {course.department} • Semester {course.semester}
                </p>

                <div className="mt-4 pt-4 border-t border-outline-variant/20 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Credits:</span>
                    <span className="font-bold text-on-surface">{course.credits} Credits</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Instructor:</span>
                    <span className="font-bold text-primary">
                      {course.assignedFaculty?.userId?.name || "Unassigned"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between">
                <span className="text-[11px] text-on-surface-variant">
                  {course.syllabusUnits?.length || 4} Units in Syllabus
                </span>
                <button
                  onClick={() => handleDelete(course._id)}
                  className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Course Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Curriculum Course"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-on-surface-variant uppercase mb-1">Course Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Data Structures & Algorithms"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Course Code *</label>
              <input
                type="text"
                required
                placeholder="CS301"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary uppercase"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Credits *</label>
              <input
                type="number"
                required
                min="1"
                max="6"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
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
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Semester *</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
              >
                {[1,2,3,4,5,6].map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Course Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
              >
                <option value="Theory">Theory</option>
                <option value="Practical">Practical</option>
                <option value="Both">Both (Theory + Lab)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Assign Faculty</label>
              <select
                value={formData.assignedFaculty}
                onChange={(e) => setFormData({ ...formData, assignedFaculty: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
              >
                <option value="">Unassigned</option>
                {facultyList.map((f) => (
                  <option key={f._id} value={f._id}>{f.userId?.name} ({f.department})</option>
                ))}
              </select>
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
              {submitting ? "Saving..." : "Add Course"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
