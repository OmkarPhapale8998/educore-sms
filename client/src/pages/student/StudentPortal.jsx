import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { studentAPI, attendanceAPI, feeAPI, examAPI, noticeAPI } from "../../api";
import { Badge, TableSkeleton } from "../../components/ui";

export const StudentPortal = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [student, setStudent] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [dailyAttendance, setDailyAttendance] = useState([]);
  const [fees, setFees] = useState([]);
  const [exams, setExams] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab State
  const getInitialTab = () => {
    if (location.pathname.includes("/attendance")) return "attendance";
    if (location.pathname.includes("/fees")) return "fees";
    if (location.pathname.includes("/results")) return "exams";
    return "overview";
  };
  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Date-wise attendance filters
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [quickDateFilter, setQuickDateFilter] = useState("all"); // "all", "today", "week", "month"

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.pathname]);

  useEffect(() => {
    fetchStudentData();
  }, [user]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const stdRes = await studentAPI.getAll({ search: user?.email });
      if (stdRes.data.success && stdRes.data.data.length > 0) {
        const myStudent = stdRes.data.data[0];
        setStudent(myStudent);

        const [attSummaryRes, dailyAttRes, feeRes, exRes, notRes] = await Promise.all([
          attendanceAPI.getPercentage(myStudent._id),
          attendanceAPI.get({ studentId: myStudent._id }),
          feeAPI.getAll({ search: myStudent.rollNo }),
          examAPI.getAll({ department: myStudent.department, semester: myStudent.semester }),
          noticeAPI.getAll({ targetAudience: "students" })
        ]);

        if (attSummaryRes.data?.success) setAttendanceSummary(attSummaryRes.data.data);
        if (dailyAttRes.data?.success) setDailyAttendance(dailyAttRes.data.data);
        if (feeRes.data?.success) setFees(feeRes.data.data);
        if (exRes.data?.success) setExams(exRes.data.data);
        if (notRes.data?.success) setNotices(notRes.data.data);
      }
    } catch (err) {
      console.error("Student portal load error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Group daily attendance date-wise
  const filteredDailyAttendance = useMemo(() => {
    return dailyAttendance.filter((record) => {
      const recDate = new Date(record.date);
      const recDateStr = recDate.toISOString().split("T")[0];
      const todayStr = new Date().toISOString().split("T")[0];

      // Quick filter
      if (quickDateFilter === "today" && recDateStr !== todayStr) return false;
      if (quickDateFilter === "week") {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        if (recDate < oneWeekAgo) return false;
      }
      if (quickDateFilter === "month") {
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
        if (recDate < oneMonthAgo) return false;
      }

      // Explicit Date filter
      if (selectedDate && recDateStr !== selectedDate) return false;

      // Course filter
      if (selectedCourseFilter !== "all" && record.course?._id !== selectedCourseFilter && record.course !== selectedCourseFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && record.status !== statusFilter) return false;

      return true;
    });
  }, [dailyAttendance, quickDateFilter, selectedDate, selectedCourseFilter, statusFilter]);

  // Group by Date key (YYYY-MM-DD)
  const groupedByDate = useMemo(() => {
    const map = {};
    filteredDailyAttendance.forEach((item) => {
      const dateKey = new Date(item.date).toISOString().split("T")[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(item);
    });
    // Sort dates descending
    return Object.keys(map)
      .sort((a, b) => new Date(b) - new Date(a))
      .map((dateKey) => ({
        dateKey,
        records: map[dateKey]
      }));
  }, [filteredDailyAttendance]);

  // Calculate Overall Metrics
  const totalClasses = dailyAttendance.length;
  const totalPresent = dailyAttendance.filter((a) => a.status === "present").length;
  const totalAbsent = dailyAttendance.filter((a) => a.status === "absent").length;
  const totalLeave = dailyAttendance.filter((a) => a.status === "leave").length;
  const overallPercentage = totalClasses > 0 ? ((totalPresent / totalClasses) * 100).toFixed(1) : "0.0";
  const isEligible = parseFloat(overallPercentage) >= 75;

  // Distinct courses for filter dropdown
  const uniqueCourses = useMemo(() => {
    const list = [];
    const seen = new Set();
    dailyAttendance.forEach((item) => {
      if (item.course && !seen.has(item.course._id || item.course)) {
        seen.add(item.course._id || item.course);
        list.push({
          id: item.course._id || item.course,
          name: item.course.name || "Subject",
          code: item.course.code || "SUB"
        });
      }
    });
    return list;
  }, [dailyAttendance]);

  const formatDateTitle = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const formatted = d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric"
    });

    if (isToday) return `Today — ${formatted}`;
    if (isYesterday) return `Yesterday — ${formatted}`;
    return formatted;
  };

  if (loading) {
    return (
      <div className="p-6">
        <TableSkeleton rows={4} cols={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Student Banner */}
      <div className="bg-primary text-on-primary p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white text-primary flex items-center justify-center font-black text-2xl uppercase shadow-md shrink-0">
            {user?.name ? user.name.slice(0, 2) : "ST"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white/20 text-white rounded-full text-[11px] font-bold uppercase tracking-wider">
                Student Portal
              </span>
              <span className="text-xs text-white/80 font-medium">
                • {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">{user?.name}</h1>
            <p className="text-xs text-on-primary/80 mt-1">
              Roll No: <span className="font-mono font-bold text-white">{student?.rollNo || "CS2024001"}</span> • {student?.department || "Computer Science"} (Semester {student?.semester || 3})
            </p>
          </div>
        </div>

        {/* Quick Overall Attendance Badge */}
        <div className="relative z-10 flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm self-start md:self-auto">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-bold text-white/70">Overall Attendance</p>
            <p className="text-2xl font-black text-white">{overallPercentage}%</p>
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${isEligible ? "text-emerald-300" : "text-rose-300"}`}>
              <span className="material-symbols-outlined text-xs">
                {isEligible ? "check_circle" : "warning"}
              </span>
              {isEligible ? "Exam Eligible (≥75%)" : "Low Attendance Alert"}
            </span>
          </div>
        </div>
      </div>

      {/* Simple Clean Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-outline-variant/30 text-xs font-bold custom-scrollbar">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "overview"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-base">dashboard</span>
          Overview
        </button>

        <button
          onClick={() => setActiveTab("attendance")}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "attendance"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-base">calendar_month</span>
          Date-wise Daily Attendance
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20">
            {dailyAttendance.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("fees")}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "fees"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-base">payments</span>
          Fee Status
        </button>

        <button
          onClick={() => setActiveTab("exams")}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "exams"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-base">quiz</span>
          Exams & Timetable
        </button>

        <button
          onClick={() => setActiveTab("notices")}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "notices"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-base">campaign</span>
          Announcements
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">Overall Attendance</span>
              <p className={`text-2xl font-black mt-1 ${isEligible ? "text-emerald-600" : "text-rose-600"}`}>
                {overallPercentage}%
              </p>
              <p className="text-[10px] text-on-surface-variant mt-0.5">Min. 75% required</p>
            </div>
            <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">Days Present</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{totalPresent}</p>
              <p className="text-[10px] text-on-surface-variant mt-0.5">Out of {totalClasses} classes</p>
            </div>
            <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">Days Absent</span>
              <p className="text-2xl font-black text-rose-600 mt-1">{totalAbsent}</p>
              <p className="text-[10px] text-on-surface-variant mt-0.5">Missed sessions</p>
            </div>
            <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">Approved Leaves</span>
              <p className="text-2xl font-black text-amber-600 mt-1">{totalLeave}</p>
              <p className="text-[10px] text-on-surface-variant mt-0.5">Recorded leaves</p>
            </div>
          </div>

          {/* Subject Attendance Summary & Recent Daily Updates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subject Breakdown Card */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-on-surface">Subject-wise Attendance</h2>
                  <p className="text-xs text-on-surface-variant">Continuous tracking across enrolled courses</p>
                </div>
                <button
                  onClick={() => setActiveTab("attendance")}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  View Daily Log
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>

              <div className="space-y-3">
                {attendanceSummary.length === 0 ? (
                  <p className="text-xs text-on-surface-variant py-6 text-center">No attendance recorded yet</p>
                ) : (
                  attendanceSummary.map((item, idx) => (
                    <div key={idx} className="p-3.5 bg-surface-container-low rounded-2xl border border-outline-variant/20 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono font-bold text-primary mr-2">{item.courseCode}</span>
                          <span className="font-bold text-on-surface">{item.courseName}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          item.percentage >= 75 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {item.percentage}% ({item.present}/{item.total})
                        </span>
                      </div>
                      <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.percentage >= 75 ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${Math.min(100, item.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Daily Updates Feed */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-on-surface">Recent Daily Attendance Updates</h2>
                  <p className="text-xs text-on-surface-variant">Day-by-day status logged by faculty</p>
                </div>
                <button
                  onClick={() => setActiveTab("attendance")}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  All Dates
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {dailyAttendance.slice(0, 5).length === 0 ? (
                  <p className="text-xs text-on-surface-variant py-6 text-center">No daily logs found</p>
                ) : (
                  dailyAttendance.slice(0, 5).map((att) => (
                    <div
                      key={att._id}
                      className="p-3 bg-surface-container-low rounded-2xl flex items-center justify-between border border-outline-variant/20"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base ${
                            att.status === "present"
                              ? "bg-emerald-100 text-emerald-700"
                              : att.status === "absent"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          <span className="material-symbols-outlined text-lg">
                            {att.status === "present"
                              ? "check"
                              : att.status === "absent"
                              ? "close"
                              : "schedule"}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-on-surface">
                            {att.course?.code} — {att.course?.name || "Lecture"}
                          </p>
                          <p className="text-[11px] text-on-surface-variant">
                            {new Date(att.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wide ${
                          att.status === "present"
                            ? "bg-emerald-100 text-emerald-800"
                            : att.status === "absent"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {att.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Fee & Exam Overview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fee Card */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-on-surface">Tuition Fee Status</h2>
                  <p className="text-xs text-on-surface-variant">Current semester fees</p>
                </div>
                <span className="material-symbols-outlined text-primary text-2xl">payments</span>
              </div>

              <div className="space-y-3">
                {fees.length === 0 ? (
                  <p className="text-xs text-on-surface-variant py-4 text-center">No fee dues on record</p>
                ) : (
                  fees.map((fee) => {
                    const balance = fee.totalAmount - fee.paidAmount;
                    return (
                      <div key={fee._id} className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-on-surface">Semester {fee.semester} Fee</span>
                          <Badge status={fee.status} />
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-on-surface-variant font-medium">Total</p>
                            <p className="font-bold text-on-surface">₹{fee.totalAmount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-on-surface-variant font-medium">Paid</p>
                            <p className="font-bold text-emerald-600">₹{fee.paidAmount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-on-surface-variant font-medium">Balance</p>
                            <p className="font-bold text-rose-600">₹{balance.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Announcements */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-on-surface">Announcements</h2>
                <span className="material-symbols-outlined text-primary text-2xl">campaign</span>
              </div>
              <div className="space-y-3">
                {notices.length === 0 ? (
                  <p className="text-xs text-on-surface-variant py-4 text-center">No active announcements</p>
                ) : (
                  notices.slice(0, 3).map((n) => (
                    <div key={n._id} className="p-3 bg-surface-container-low rounded-2xl border border-outline-variant/20 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-on-surface">{n.title}</h4>
                        <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold rounded-full">
                          {n.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant line-clamp-2">{n.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DATE-WISE DAILY ATTENDANCE */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          {/* Daily Attendance Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">Overall Attendance</span>
              <p className={`text-2xl font-black mt-1 ${isEligible ? "text-emerald-600" : "text-rose-600"}`}>
                {overallPercentage}%
              </p>
              <span className="text-[10px] text-on-surface-variant">Min. 75% required</span>
            </div>
            <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">Total Sessions</span>
              <p className="text-2xl font-black text-primary mt-1">{totalClasses}</p>
              <span className="text-[10px] text-on-surface-variant">Recorded lectures</span>
            </div>
            <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">Present</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{totalPresent}</p>
              <span className="text-[10px] text-on-surface-variant">
                {totalClasses > 0 ? ((totalPresent / totalClasses) * 100).toFixed(0) : 0}% attended
              </span>
            </div>
            <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">Absent / Leave</span>
              <p className="text-2xl font-black text-rose-600 mt-1">{totalAbsent + totalLeave}</p>
              <span className="text-[10px] text-on-surface-variant">{totalAbsent} Absent, {totalLeave} Leave</span>
            </div>
          </div>

          {/* Simple Filter & Date Selection Bar */}
          <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Quick Date Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-xs font-bold text-on-surface-variant mr-1">Filter Date:</span>
                {[
                  { id: "all", label: "All Dates" },
                  { id: "today", label: "Today" },
                  { id: "week", label: "Past 7 Days" },
                  { id: "month", label: "Past 30 Days" }
                ].map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => {
                      setQuickDateFilter(pill.id);
                      setSelectedDate("");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      quickDateFilter === pill.id && !selectedDate
                        ? "bg-primary text-on-primary shadow-sm"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-on-surface-variant">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-surface-container-low border border-outline-variant/40 rounded-xl font-medium text-xs focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Status</option>
                  <option value="present">Present Only</option>
                  <option value="absent">Absent Only</option>
                  <option value="leave">Leave Only</option>
                </select>
              </div>
            </div>

            {/* Custom Date Picker & Subject Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-outline-variant/20 text-xs">
              <div>
                <label className="block font-bold text-on-surface-variant mb-1">Select Specific Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setQuickDateFilter("");
                  }}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl font-medium text-xs focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface-variant mb-1">Filter by Course / Subject</label>
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => setSelectedCourseFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl font-medium text-xs focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Subjects</option>
                  {uniqueCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                {(selectedDate || selectedCourseFilter !== "all" || statusFilter !== "all" || quickDateFilter !== "all") && (
                  <button
                    onClick={() => {
                      setSelectedDate("");
                      setSelectedCourseFilter("all");
                      setStatusFilter("all");
                      setQuickDateFilter("all");
                    }}
                    className="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">clear_all</span>
                    Reset Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Date-wise Daily Logs Timeline / Grouped Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-on-surface uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">history</span>
                Daily Attendance Log
                <span className="text-xs font-normal text-on-surface-variant">
                  ({filteredDailyAttendance.length} records found)
                </span>
              </h3>
            </div>

            {groupedByDate.length === 0 ? (
              <div className="bg-surface-container-lowest p-12 rounded-3xl border border-outline-variant/30 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">event_busy</span>
                </div>
                <h4 className="font-bold text-on-surface text-sm">No Attendance Records Found</h4>
                <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                  There are no attendance entries matching the selected date or filter criteria.
                </p>
              </div>
            ) : (
              groupedByDate.map(({ dateKey, records }) => {
                const dayPresent = records.filter((r) => r.status === "present").length;
                const dayTotal = records.length;
                const dayPct = dayTotal > 0 ? ((dayPresent / dayTotal) * 100).toFixed(0) : 0;

                return (
                  <div
                    key={dateKey}
                    className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden"
                  >
                    {/* Date Header */}
                    <div className="px-6 py-3.5 bg-surface-container-low/70 border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-lg">calendar_today</span>
                        <h4 className="font-bold text-xs sm:text-sm text-on-surface">
                          {formatDateTitle(dateKey)}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[11px] text-on-surface-variant font-medium">Daily Score:</span>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          dayPct >= 75 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {dayPresent} / {dayTotal} Present ({dayPct}%)
                        </span>
                      </div>
                    </div>

                    {/* Classes on that Date */}
                    <div className="p-4 divide-y divide-outline-variant/15">
                      {records.map((item) => (
                        <div
                          key={item._id}
                          className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-container-low/30 rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-3.5">
                            {/* Status Icon */}
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${
                                item.status === "present"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : item.status === "absent"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              <span className="material-symbols-outlined text-lg">
                                {item.status === "present"
                                  ? "check_circle"
                                  : item.status === "absent"
                                  ? "cancel"
                                  : "pending"}
                              </span>
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-primary">
                                  {item.course?.code || "COURSE"}
                                </span>
                                <span className="font-bold text-xs text-on-surface">
                                  {item.course?.name || "Subject Lecture"}
                                </span>
                              </div>
                              <p className="text-[11px] text-on-surface-variant mt-0.5">
                                Semester {item.semester || student?.semester || 3} • {item.department || student?.department || "Diploma Engineering"}
                                {item.remarks && <span className="text-primary font-medium ml-2">— Note: {item.remarks}</span>}
                              </p>
                            </div>
                          </div>

                          {/* Status Pill Badge */}
                          <div className="flex items-center gap-2 self-start sm:self-auto pl-12 sm:pl-0">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs capitalize ${
                                item.status === "present"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : item.status === "absent"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  item.status === "present"
                                    ? "bg-emerald-500"
                                    : item.status === "absent"
                                    ? "bg-rose-500"
                                    : "bg-amber-500"
                                }`}
                              />
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: FEES */}
      {activeTab === "fees" && (
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-on-surface">Tuition Fee Details</h2>
              <p className="text-xs text-on-surface-variant">Fee invoices, dues and official receipt downloads</p>
            </div>
            <span className="material-symbols-outlined text-primary text-2xl">payments</span>
          </div>

          <div className="space-y-4">
            {fees.length === 0 ? (
              <p className="text-xs text-on-surface-variant py-8 text-center">No fee dues recorded</p>
            ) : (
              fees.map((fee) => {
                const balance = fee.totalAmount - fee.paidAmount;
                return (
                  <div key={fee._id} className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-on-surface">Semester {fee.semester} Tuition Fee</h4>
                        <p className="text-xs text-on-surface-variant">Due Date: {new Date(fee.dueDate).toLocaleDateString()}</p>
                      </div>
                      <Badge status={fee.status} />
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-xs bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20">
                      <div>
                        <p className="text-on-surface-variant font-medium">Total Payable</p>
                        <p className="text-base font-black text-on-surface">₹{fee.totalAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-on-surface-variant font-medium">Paid So Far</p>
                        <p className="text-base font-black text-emerald-600">₹{fee.paidAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-on-surface-variant font-medium">Pending Balance</p>
                        <p className="text-base font-black text-rose-600">₹{balance.toLocaleString()}</p>
                      </div>
                    </div>

                    {fee.paymentHistory && fee.paymentHistory.length > 0 && (
                      <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                        <span className="text-xs text-on-surface-variant">
                          Last Payment: {fee.paymentHistory[fee.paymentHistory.length - 1].receiptNo} (₹{fee.paymentHistory[fee.paymentHistory.length - 1].amount.toLocaleString()})
                        </span>
                        <a
                          href={feeAPI.getReceiptUrl(fee._id, fee.paymentHistory[0].receiptNo)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary rounded-xl text-xs font-bold shadow hover:bg-primary-container"
                        >
                          <span className="material-symbols-outlined text-sm">receipt</span>
                          Download Receipt
                        </a>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: EXAMS */}
      {activeTab === "exams" && (
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-on-surface">Upcoming Exams & Timetable</h2>
          <div className="space-y-3">
            {exams.length === 0 ? (
              <p className="text-xs text-on-surface-variant py-8 text-center">No exams scheduled for your semester</p>
            ) : (
              exams.map((ex) => (
                <div key={ex._id} className="p-4 bg-surface-container-low rounded-2xl flex items-center justify-between border border-outline-variant/20">
                  <div>
                    <h4 className="text-xs font-bold text-on-surface">{ex.name}</h4>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      {ex.course?.code} • {new Date(ex.date).toLocaleDateString()} ({ex.startTime} - {ex.endTime}) • Room {ex.room}
                    </p>
                  </div>
                  <Badge status={ex.status} />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: NOTICES */}
      {activeTab === "notices" && (
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-on-surface">Announcements & Campus Circulars</h2>
          <div className="space-y-3">
            {notices.length === 0 ? (
              <p className="text-xs text-on-surface-variant py-8 text-center">No notices published</p>
            ) : (
              notices.map((n) => (
                <div key={n._id} className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-on-surface">{n.title}</h4>
                    <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold rounded-full">
                      {n.category}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{n.description}</p>
                  <p className="text-[10px] text-on-surface-variant/70">
                    Posted on {new Date(n.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
