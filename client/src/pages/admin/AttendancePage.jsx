import React, { useState, useEffect } from "react";
import { studentAPI, courseAPI, attendanceAPI } from "../../api";
import { TableSkeleton } from "../../components/ui";
import toast from "react-hot-toast";

const DEPARTMENTS = [
  "Computer Science",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Electronics",
  "Information Technology"
];

export const AttendancePage = () => {
  const [department, setDepartment] = useState("Computer Science");
  const [semester, setSemester] = useState("3");
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { studentId: "present" | "absent" | "leave" }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCoursesForClass();
  }, [department, semester]);

  const fetchCoursesForClass = async () => {
    try {
      const res = await courseAPI.getAll({ department, semester });
      if (res.data.success) {
        setCourses(res.data.data);
        if (res.data.data.length > 0) setSelectedCourse(res.data.data[0]._id);
        else setSelectedCourse("");
      }
    } catch (err) {}
  };

  const handleLoadStudents = async () => {
    if (!selectedCourse) {
      toast.error("Please select a course");
      return;
    }

    setLoading(true);
    try {
      const res = await studentAPI.getAll({ department, semester, limit: 100 });
      if (res.data.success) {
        setStudents(res.data.data);
        // Default all to 'present'
        const initialMap = {};
        res.data.data.forEach((s) => {
          initialMap[s._id] = "present";
        });
        setAttendanceMap(initialMap);
      }
    } catch (err) {
      toast.error("Failed to load students for this class");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSetAll = (status) => {
    const nextMap = {};
    students.forEach((s) => {
      nextMap[s._id] = status;
    });
    setAttendanceMap(nextMap);
  };

  const handleSubmit = async () => {
    if (students.length === 0) return;
    setSaving(true);
    try {
      const records = students.map((s) => ({
        studentId: s._id,
        status: attendanceMap[s._id] || "present"
      }));

      const res = await attendanceAPI.mark({
        courseId: selectedCourse,
        date,
        department,
        semester: parseInt(semester),
        records
      });

      if (res.data.success) {
        toast.success(res.data.message || "Attendance saved successfully!");
      }
    } catch (err) {
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendanceMap).filter((v) => v === "present").length;
  const absentCount = Object.values(attendanceMap).filter((v) => v === "absent").length;
  const leaveCount = Object.values(attendanceMap).filter((v) => v === "leave").length;
  const totalCount = students.length;
  const presentPct = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">Attendance Manager</h1>
          <p className="text-sm text-on-surface-variant mt-1">Record class attendance & track low attendance alerts (&lt;75%)</p>
        </div>
      </div>

      {/* Class Selection Filter Box */}
      <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-bold text-on-surface-variant uppercase mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl font-medium focus:ring-2 focus:ring-primary"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-on-surface-variant uppercase mb-1">Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl font-medium focus:ring-2 focus:ring-primary"
            >
              {[1,2,3,4,5,6,7,8].map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-on-surface-variant uppercase mb-1">Course / Subject</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl font-medium focus:ring-2 focus:ring-primary"
            >
              {courses.length === 0 ? (
                <option value="">No courses found</option>
              ) : (
                courses.map((c) => (
                  <option key={c._id} value={c._id}>{c.code} - {c.name}</option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block font-bold text-on-surface-variant uppercase mb-1">Session Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl font-medium focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleLoadStudents}
            disabled={loading}
            className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs shadow hover:bg-primary-container disabled:opacity-50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">group</span>
            Load Student Roster
          </button>
        </div>
      </div>

      {/* Roster & Marking Area */}
      {students.length > 0 && (
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden space-y-4">
          {/* Summary & Quick Actions Header */}
          <div className="p-6 border-b border-outline-variant/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs">
              <div className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl font-bold border border-emerald-200">
                Present: {presentCount}
              </div>
              <div className="px-3 py-1.5 bg-rose-50 text-rose-800 rounded-xl font-bold border border-rose-200">
                Absent: {absentCount}
              </div>
              <div className="px-3 py-1.5 bg-amber-50 text-amber-800 rounded-xl font-bold border border-amber-200">
                Leave: {leaveCount}
              </div>
              <div className="px-3 py-1.5 bg-primary/10 text-primary rounded-xl font-black">
                {presentPct}% Attendance
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSetAll("present")}
                className="px-3 py-1.5 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs hover:bg-emerald-200"
              >
                Mark All Present
              </button>
              <button
                onClick={() => handleSetAll("absent")}
                className="px-3 py-1.5 bg-rose-100 text-rose-800 font-bold rounded-lg text-xs hover:bg-rose-200"
              >
                Mark All Absent
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-6">Roll No</th>
                  <th className="py-3 px-6">Student Name</th>
                  <th className="py-3 px-6 text-center">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {students.map((student) => {
                  const currentStatus = attendanceMap[student._id] || "present";
                  return (
                    <tr key={student._id} className="hover:bg-surface-container-low/40">
                      <td className="py-3.5 px-6 font-mono font-bold text-primary">{student.rollNo}</td>
                      <td className="py-3.5 px-6 font-bold text-on-surface">{student.userId?.name}</td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center justify-center gap-2">
                          {[
                            { key: "present", label: "Present", color: "emerald" },
                            { key: "absent", label: "Absent", color: "rose" },
                            { key: "leave", label: "Leave", color: "amber" },
                          ].map((btn) => (
                            <button
                              key={btn.key}
                              type="button"
                              onClick={() => handleStatusChange(student._id, btn.key)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                currentStatus === btn.key
                                  ? btn.key === "present"
                                    ? "bg-emerald-600 text-white shadow-sm"
                                    : btn.key === "absent"
                                    ? "bg-rose-600 text-white shadow-sm"
                                    : "bg-amber-600 text-white shadow-sm"
                                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                              }`}
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Submit Button */}
          <div className="p-6 border-t border-outline-variant/20 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-8 py-3 bg-primary text-on-primary font-bold rounded-xl text-xs shadow-lg hover:bg-primary-container transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">save</span>
              {saving ? "Saving Records..." : "Submit Class Attendance"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
