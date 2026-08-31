// ============================================================
// StudentsPage.jsx
// Students directory: a searchable, filterable, paginated
// table of every student with an Excel export button and a
// delete confirmation dialog.
// ============================================================
import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { studentAPI, reportAPI } from "../../api";
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

export const StudentsPage = () => {
  // Reads/writes ?search=... in the URL so filters survive a refresh.
  const [searchParams, setSearchParams] = useSearchParams();
  // Students shown in the table (one page worth).
  const [students, setStudents] = useState([]);
  // Page info returned by the API (total count, current page, last page).
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  // True while the list is being fetched.
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [department, setDepartment] = useState(searchParams.get("department") || "");
  const [semester, setSemester] = useState(searchParams.get("semester") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  // Current page number of the table.
  const [page, setPage] = useState(1);

  // Delete modal state
  // Student picked for deletion - when set, the confirm dialog opens.
  const [studentToDelete, setStudentToDelete] = useState(null);
  // Prevents double-clicks while the delete request runs.
  const [isDeleting, setIsDeleting] = useState(false);

  // Re-fetches the student list whenever filters or page change.
  useEffect(() => {
    fetchStudents();
  }, [department, semester, status, page, searchParams]);

  // Fetches one page of students from the API using the active filters.
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search: searchParams.get("search") || search,
      };
      if (department && department !== "All Departments") params.department = department;
      if (semester) params.semester = semester;
      if (status) params.status = status;

      const res = await studentAPI.getAll(params);
      if (res.data.success) {
        setStudents(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  // Applies the search text to the URL and jumps back to page 1.
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ search, ...(department ? { department } : {}), ...(semester ? { semester } : {}) });
    setPage(1);
  };

  // Called by the confirm dialog: deletes the student then refreshes the table.
  const handleDelete = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      await studentAPI.delete(studentToDelete._id);
      toast.success("Student record deleted successfully");
      setStudentToDelete(null);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete student");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">Students Directory</h1>
          <p className="text-sm text-on-surface-variant mt-1">Manage enrollment records, academic profiles & status</p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={reportAPI.getExportStudentsUrl({ department, semester })}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-container text-on-surface font-bold rounded-xl text-xs hover:bg-surface-container-high transition-all"
          >
            <span className="material-symbols-outlined text-base">download</span>
            Export Excel
          </a>
          <Link
            to="/students/add"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs shadow-sm hover:shadow-md hover:bg-primary-container transition-all"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            Add Student
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
            search
          </span>
          <input
            type="text"
            placeholder="Search by name, roll no, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>

        {/* Department Filter */}
        <select
          value={department}
          onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept === "All Departments" ? "" : dept}>
              {dept}
            </option>
          ))}
        </select>

        {/* Semester Filter */}
        <select
          value={semester}
          onChange={(e) => { setSemester(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Semesters</option>
          {[1,2,3,4,5,6].map((s) => (
            <option key={s} value={s}>Semester {s}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="graduated">Graduated</option>
        </select>
      </div>

      {/* Table Container */}
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden">
        {/* Loading skeleton / empty state / table, depending on fetch result */}
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={6} />
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-2 text-on-surface-variant/40">group_off</span>
            <p className="text-base font-bold text-on-surface">No students found</p>
            <p className="text-xs mt-1">Try adjusting your search criteria or add a new student.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* One row per student */}
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low border-b border-outline-variant/30 text-on-surface-variant uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-4 px-6">Student</th>
                  <th className="py-4 px-4">Roll Number</th>
                  <th className="py-4 px-4">Department</th>
                  <th className="py-4 px-4">Semester</th>
                  <th className="py-4 px-4">Admission</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {student.userId?.name ? student.userId.name.slice(0, 2) : "ST"}
                        </div>
                        <div>
                          <Link
                            to={`/students/${student._id}`}
                            className="font-bold text-on-surface hover:text-primary transition-colors text-sm"
                          >
                            {student.userId?.name || "Unnamed"}
                          </Link>
                          <p className="text-[11px] text-on-surface-variant">{student.userId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-on-surface">{student.rollNo}</td>
                    <td className="py-3.5 px-4 text-on-surface-variant font-medium">{student.department}</td>
                    <td className="py-3.5 px-4 font-semibold text-on-surface">Sem {student.semester}</td>
                    <td className="py-3.5 px-4 text-on-surface-variant">{student.admissionYear}</td>
                    <td className="py-3.5 px-4">
                      <Badge status={student.status} />
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          to={`/students/${student._id}`}
                          title="View Profile"
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </Link>
                        <button
                          onClick={() => setStudentToDelete(student)}
                          title="Delete Student"
                          className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
            <p>
              Showing <span className="font-bold text-on-surface">{students.length}</span> of{" "}
              <span className="font-bold text-on-surface">{pagination.total}</span> students
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 border border-outline-variant/40 rounded-lg font-bold disabled:opacity-40 hover:bg-surface-container"
              >
                Previous
              </button>
              <span className="px-2 font-bold text-on-surface">
                {page} / {pagination.pages}
              </span>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 border border-outline-variant/40 rounded-lg font-bold disabled:opacity-40 hover:bg-surface-container"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        title="Delete Student Record"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">
            Are you sure you want to delete <strong className="text-on-surface">{studentToDelete?.userId?.name}</strong> (Roll: {studentToDelete?.rollNo})?
            This will permanently remove the student's profile, user account, and associated records.
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
            <button
              onClick={() => setStudentToDelete(null)}
              className="px-4 py-2 bg-surface-container text-on-surface font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-error text-on-error font-bold rounded-xl text-xs hover:bg-error/90 transition-colors disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Confirm Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
