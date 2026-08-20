import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { reportAPI, examAPI, noticeAPI } from "../../api";
import { StatsCard, Badge } from "../../components/ui";

const PIE_COLORS = ["#00236f", "#006591", "#39b8fd", "#ffb95f", "#3e2400", "#757682"];

export const DashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [enrollmentData, setEnrollmentData] = useState([]);
  const [deptData, setDeptData] = useState([]);
  const [attendanceTrend, setAttendanceTrend] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [recentNotices, setRecentNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [sumRes, enrollRes, deptRes, attRes, examRes, noticeRes] = await Promise.all([
        reportAPI.getDashboardSummary(),
        reportAPI.getEnrollmentTrend(),
        reportAPI.getDeptDistribution(),
        reportAPI.getAttendanceTrend(8),
        examAPI.getAll({ limit: 4 }),
        noticeAPI.getAll({ limit: 4 }),
      ]);

      if (sumRes.data.success) setSummary(sumRes.data.data);
      if (enrollRes.data.success) setEnrollmentData(enrollRes.data.data);
      if (deptRes.data.success) setDeptData(deptRes.data.data);
      if (attRes.data.success) setAttendanceTrend(attRes.data.data);
      if (examRes.data.success) setUpcomingExams(examRes.data.data.slice(0, 3));
      if (noticeRes.data.success) setRecentNotices(noticeRes.data.data.slice(0, 3));
    } catch (err) {
      console.error("Dashboard data error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
            Academic Overview
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Real-time analytics and institutional performance metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/students/add"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs shadow-sm hover:shadow-md hover:bg-primary-container transition-all"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            Add Student
          </Link>
          <Link
            to="/attendance"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-container text-on-surface font-bold rounded-xl text-xs hover:bg-surface-container-high transition-all"
          >
            <span className="material-symbols-outlined text-base">event_available</span>
            Mark Attendance
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Total Students"
          value={summary?.totalStudents || 0}
          icon="group"
          color="primary"
          change="+8.4%"
          subtitle="Enrolled active students"
        />
        <StatsCard
          title="Faculty Members"
          value={summary?.totalFaculty || 0}
          icon="badge"
          color="secondary"
          subtitle="Full-time & visiting"
        />
        <StatsCard
          title="Fee Collection"
          value={`₹${((summary?.totalRevenue || 0) / 1000).toFixed(1)}k`}
          icon="payments"
          color="success"
          change="+12.5%"
          subtitle={`₹${((summary?.pendingFees || 0) / 1000).toFixed(1)}k pending`}
        />
        <StatsCard
          title="Today's Attendance"
          value={`${summary?.todayAttendancePercent || 0}%`}
          icon="check_circle"
          color="tertiary"
          subtitle="Campus-wide average"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend Chart */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-on-surface">Attendance Performance Trend</h2>
              <p className="text-xs text-on-surface-variant">Weekly institutional attendance average (%)</p>
            </div>
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
              Last 8 Weeks
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrend.length > 0 ? attendanceTrend : [
                { week: "W1", percentage: 82 }, { week: "W2", percentage: 86 },
                { week: "W3", percentage: 79 }, { week: "W4", percentage: 91 },
                { week: "W5", percentage: 88 }, { week: "W6", percentage: 84 },
                { week: "W7", percentage: 92 }, { week: "W8", percentage: 89 },
              ]}>
                <defs>
                  <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00236f" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00236f" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceef0" />
                <XAxis dataKey="week" stroke="#757682" fontSize={11} />
                <YAxis domain={[50, 100]} stroke="#757682" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e0e3e5" }}
                  formatter={(val) => [`${val}%`, "Attendance"]}
                />
                <Area type="monotone" dataKey="percentage" stroke="#00236f" strokeWidth={3} fillOpacity={1} fill="url(#attGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution Chart */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-on-surface">Department Breakdown</h2>
            <p className="text-xs text-on-surface-variant">Student count per branch</p>
          </div>

          <div className="h-52 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deptData.length > 0 ? deptData : [
                    { department: "Computer Science", count: 45 },
                    { department: "Mechanical Engg", count: 32 },
                    { department: "Civil Engg", count: 28 },
                    { department: "Electrical Engg", count: 25 },
                  ]}
                  dataKey="count"
                  nameKey="department"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {(deptData.length > 0 ? deptData : [1,2,3,4]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-outline-variant/20 max-h-28 overflow-y-auto">
            {(deptData.length > 0 ? deptData : [
              { department: "Computer Science", count: 45 },
              { department: "Mechanical Engg", count: 32 },
              { department: "Civil Engg", count: 28 },
            ]).map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-on-surface-variant truncate max-w-[140px]">{d.department}</span>
                </div>
                <span className="font-bold text-on-surface">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Section: Upcoming Exams & Recent Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Exams */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-on-surface">Upcoming Examinations</h2>
            <Link to="/exams" className="text-xs font-bold text-primary hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingExams.length === 0 ? (
              <p className="text-xs text-on-surface-variant py-4 text-center">No exams scheduled currently</p>
            ) : (
              upcomingExams.map((exam) => (
                <div
                  key={exam._id}
                  className="p-3.5 bg-surface-container-low rounded-2xl flex items-center justify-between gap-3 border border-outline-variant/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      {new Date(exam.date).getDate()}
                      <br />
                      <span className="text-[9px] uppercase">{new Date(exam.date).toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-on-surface">{exam.name}</h4>
                      <p className="text-[11px] text-on-surface-variant">
                        {exam.course?.code} • {exam.startTime} - {exam.endTime} • Room {exam.room}
                      </p>
                    </div>
                  </div>
                  <Badge status={exam.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Notices */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-on-surface">Official Notices</h2>
            <Link to="/notices" className="text-xs font-bold text-primary hover:underline">
              View Bulletin
            </Link>
          </div>

          <div className="space-y-3">
            {recentNotices.length === 0 ? (
              <p className="text-xs text-on-surface-variant py-4 text-center">No active notices</p>
            ) : (
              recentNotices.map((notice) => (
                <div
                  key={notice._id}
                  className="p-3.5 bg-surface-container-low rounded-2xl flex items-start gap-3 border border-outline-variant/20"
                >
                  <span className="material-symbols-outlined text-primary text-xl mt-0.5">
                    {notice.isPinned ? "push_pin" : "campaign"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-on-surface truncate">{notice.title}</h4>
                      <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold rounded-full">
                        {notice.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-1">
                      {notice.description}
                    </p>
                    <p className="text-[10px] text-on-surface-variant/60 mt-1">
                      Posted by {notice.postedBy?.name || "Admin"} • {new Date(notice.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
