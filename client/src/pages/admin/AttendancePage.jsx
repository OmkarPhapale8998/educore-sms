import React, { useState, useEffect } from "react";
import { studentAPI, courseAPI, attendanceAPI } from "../../api";
import { TableSkeleton, StatsCard } from "../../components/ui";
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
  const [activeTab, setActiveTab] = useState("mark"); // "mark" | "history"

  // Mark Daily Attendance State
  const [department, setDepartment] = useState("Computer Science");
  const [semester, setSemester] = useState("3");
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { studentId: "present" | "absent" | "leave" }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isExistingRecord, setIsExistingRecord] = useState(false);

  // History Tab State
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split("T")[0]);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");

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
      // 1. Fetch Students
      const stdRes = await studentAPI.getAll({ department, semester, limit: 100 });
      // 2. Check if records already exist for this course and date
      const attRes = await attendanceAPI.get({ courseId: selectedCourse, date });

      if (stdRes.data.success) {
        const studentList = stdRes.data.data;
        setStudents(studentList);

        const initialMap = {};
        let foundExisting = false;

        if (attRes.data?.success && attRes.data.data?.length > 0) {
          foundExisting = true;
          attRes.data.data.forEach((rec) => {
            const sId = rec.student?._id || rec.student;
            initialMap[sId] = rec.status;
          });
        }

        // Fill remaining students with "present" if not present in existing
        studentList.forEach((s) => {
          if (!initialMap[s._id]) {
            initialMap[s._id] = "present";
          }
        });

        setIsExistingRecord(foundExisting);
        setAttendanceMap(initialMap);

        if (foundExisting) {
          toast.success("Loaded existing attendance records for this date. You can modify and update.");
        }
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
        toast.success(res.data.message || "Daily attendance updated successfully!");
        setIsExistingRecord(true);
      }
    } catch (err) {
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  // Fetch History for selected date
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await attendanceAPI.get({ date: historyDate });
      if (res.data.success) {
        setHistoryRecords(res.data.data || []);
      }
    } catch (err) {
      toast.error("Failed to load date-wise history");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab, historyDate]);

  const filteredHistory = historyRecords.filter((rec) => {
    if (!historySearch) return true;
    const query = historySearch.toLowerCase();
    const name = rec.student?.userId?.name?.toLowerCase() || "";
    const roll = rec.student?.rollNo?.toLowerCase() || "";
    const course = rec.course?.name?.toLowerCase() || "";
    const code = rec.course?.code?.toLowerCase() || "";
    return name.includes(query) || roll.includes(query) || course.includes(query) || code.includes(query);
  });

  const presentCount = Object.values(attendanceMap).filter((v) => v === "present").length;
  const absentCount = Object.values(attendanceMap).filter((v) => v === "absent").length;
  const leaveCount = Object.values(attendanceMap).filter((v) => v === "leave").length;
  const totalCount = students.length;
  const presentPct = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">Attendance Manager</h1>
          <p className="text-sm text-on-surface-variant mt-1">Simple date-wise daily attendance marking & tracking</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/30 text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("mark")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "mark"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-base">edit_calendar</span>
            Mark Daily Attendance
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "history"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-base">history</span>
            Date-wise History
          </button>
        </div>
      </div>

      {/* TAB 1: MARK DAILY ATTENDANCE */}
      {activeTab === "mark" && (
        <div className="space-y-6">
          {/* Class & Date Filter Box */}
          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-bold text-on-surface-variant uppercase mb-1">Session Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl font-medium focus:ring-2 focus:ring-primary"
                />
              </div>

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
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
              <div className="text-xs text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">info</span>
                Selecting an existing date will load previously saved records for easy daily updates.
              </div>
              <button
                onClick={handleLoadStudents}
                disabled={loading}
                className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs shadow hover:bg-primary-container disabled:opacity-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">group</span>
                {loading ? "Loading..." : "Load Student Roster"}
              </button>
            </div>
          </div>

          {/* Roster & Marking Area */}
          {students.length > 0 && (
            <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden space-y-4">
              {/* Summary & Quick Actions Header */}
              <div className="p-6 border-b border-outline-variant/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl font-bold border border-emerald-200">
                    Present: {presentCount}
                  </div>
                  <div className="px-3.5 py-1.5 bg-rose-50 text-rose-800 rounded-xl font-bold border border-rose-200">
                    Absent: {absentCount}
                  </div>
                  <div className="px-3.5 py-1.5 bg-amber-50 text-amber-800 rounded-xl font-bold border border-amber-200">
                    Leave: {leaveCount}
                  </div>
                  <div className="px-3.5 py-1.5 bg-primary/10 text-primary rounded-xl font-black">
                    {presentPct}% Present ({presentCount}/{totalCount})
                  </div>
                  {isExistingRecord && (
                    <span className="px-3 py-1 bg-sky-100 text-sky-800 rounded-xl font-bold text-[11px] flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">edit_note</span>
                      Existing Entry
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSetAll("present")}
                    className="px-3 py-1.5 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs hover:bg-emerald-200 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">done_all</span>
                    All Present
                  </button>
                  <button
                    onClick={() => handleSetAll("absent")}
                    className="px-3 py-1.5 bg-rose-100 text-rose-800 font-bold rounded-lg text-xs hover:bg-rose-200 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                    All Absent
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low text-on-surface-variant uppercase font-bold text-[10px]">
                    <tr>
                      <th className="py-3.5 px-6">Roll No</th>
                      <th className="py-3.5 px-6">Student Name</th>
                      <th className="py-3.5 px-6 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {students.map((student) => {
                      const currentStatus = attendanceMap[student._id] || "present";
                      return (
                        <tr key={student._id} className="hover:bg-surface-container-low/40 transition-colors">
                          <td className="py-3.5 px-6 font-mono font-bold text-primary">{student.rollNo}</td>
                          <td className="py-3.5 px-6 font-bold text-on-surface">{student.userId?.name}</td>
                          <td className="py-3.5 px-6">
                            <div className="flex items-center justify-center gap-2">
                              {[
                                { key: "present", label: "Present", icon: "check" },
                                { key: "absent", label: "Absent", icon: "close" },
                                { key: "leave", label: "Leave", icon: "schedule" },
                              ].map((btn) => (
                                <button
                                  key={btn.key}
                                  type="button"
                                  onClick={() => handleStatusChange(student._id, btn.key)}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    currentStatus === btn.key
                                      ? btn.key === "present"
                                        ? "bg-emerald-600 text-white shadow-sm"
                                        : btn.key === "absent"
                                        ? "bg-rose-600 text-white shadow-sm"
                                        : "bg-amber-600 text-white shadow-sm"
                                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-xs">{btn.icon}</span>
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
              <div className="p-6 border-t border-outline-variant/20 flex items-center justify-between">
                <p className="text-xs text-on-surface-variant">
                  Date: <span className="font-bold text-on-surface">{date}</span> • Session: {courses.find(c => c._id === selectedCourse)?.code}
                </p>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-8 py-3 bg-primary text-on-primary font-bold rounded-xl text-xs shadow-lg hover:bg-primary-container transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">save</span>
                  {saving ? "Saving Records..." : isExistingRecord ? "Update Attendance Records" : "Save Daily Attendance"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DATE-WISE HISTORY */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {/* Date Selector & Search Box */}
          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-on-surface-variant uppercase mb-1">Select Date</label>
                <input
                  type="date"
                  value={historyDate}
                  onChange={(e) => setHistoryDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl font-medium focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface-variant uppercase mb-1">Search in Records</label>
                <input
                  type="text"
                  placeholder="Filter by student name, roll number, or course..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl font-medium focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between">
              <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">event_available</span>
                Attendance Log for {new Date(historyDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                <span className="text-xs text-on-surface-variant font-normal">
                  ({filteredHistory.length} records)
                </span>
              </h3>
            </div>

            {historyLoading ? (
              <div className="p-6">
                <TableSkeleton rows={4} cols={4} />
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/50">event_busy</span>
                <p className="text-xs text-on-surface-variant">No attendance records found for this date.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low text-on-surface-variant uppercase font-bold text-[10px]">
                    <tr>
                      <th className="py-3 px-6">Roll No</th>
                      <th className="py-3 px-6">Student Name</th>
                      <th className="py-3 px-6">Course</th>
                      <th className="py-3 px-6">Department & Sem</th>
                      <th className="py-3 px-6 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {filteredHistory.map((item) => (
                      <tr key={item._id} className="hover:bg-surface-container-low/40">
                        <td className="py-3.5 px-6 font-mono font-bold text-primary">{item.student?.rollNo || "—"}</td>
                        <td className="py-3.5 px-6 font-bold text-on-surface">{item.student?.userId?.name || "—"}</td>
                        <td className="py-3.5 px-6">
                          <span className="font-mono font-bold text-primary mr-1">{item.course?.code}</span>
                          <span className="text-on-surface">{item.course?.name}</span>
                        </td>
                        <td className="py-3.5 px-6 text-on-surface-variant">
                          {item.department} (Sem {item.semester})
                        </td>
                        <td className="py-3.5 px-6 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold text-[11px] capitalize ${
                              item.status === "present"
                                ? "bg-emerald-100 text-emerald-800"
                                : item.status === "absent"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
