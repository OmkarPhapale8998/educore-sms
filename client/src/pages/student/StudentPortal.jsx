import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { studentAPI, attendanceAPI, feeAPI, examAPI, noticeAPI, marksAPI } from "../../api";
import { Badge, TableSkeleton } from "../../components/ui";

export const StudentPortal = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [fees, setFees] = useState([]);
  const [exams, setExams] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const stdRes = await studentAPI.getAll({ search: user?.email });
      if (stdRes.data.success && stdRes.data.data.length > 0) {
        const myStudent = stdRes.data.data[0];
        setStudent(myStudent);

        const [attRes, feeRes, exRes, notRes] = await Promise.all([
          attendanceAPI.getPercentage(myStudent._id),
          feeAPI.getAll({ search: myStudent.rollNo }),
          examAPI.getAll({ department: myStudent.department, semester: myStudent.semester }),
          noticeAPI.getAll({ targetAudience: "students" })
        ]);

        if (attRes.data.success) setAttendance(attRes.data.data);
        if (feeRes.data.success) setFees(feeRes.data.data);
        if (exRes.data.success) setExams(exRes.data.data);
        if (notRes.data.success) setNotices(notRes.data.data);
      }
    } catch (err) {
      console.error("Student portal load error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <TableSkeleton rows={4} cols={3} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Student Banner */}
      <div className="bg-primary text-on-primary p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white text-primary flex items-center justify-center font-black text-2xl uppercase shadow-md shrink-0">
            {user?.name ? user.name.slice(0, 2) : "ST"}
          </div>
          <div>
            <span className="px-3 py-1 bg-white/20 text-white rounded-full text-[11px] font-bold uppercase tracking-wider">
              Student Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">{user?.name}</h1>
            <p className="text-xs text-on-primary/80 mt-1">
              Roll No: <span className="font-mono font-bold text-white">{student?.rollNo || "CS2024001"}</span> • {student?.department || "Computer Science"} (Semester {student?.semester || 3})
            </p>
          </div>
        </div>
      </div>

      {/* Attendance & Fee Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Summary */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-on-surface">Subject Attendance</h2>
              <p className="text-xs text-on-surface-variant">Min. 75% required for examination eligibility</p>
            </div>
            <span className="material-symbols-outlined text-primary text-2xl">event_available</span>
          </div>

          <div className="space-y-3">
            {attendance.length === 0 ? (
              <p className="text-xs text-on-surface-variant py-4 text-center">No attendance recorded yet</p>
            ) : (
              attendance.map((item, idx) => (
                <div key={idx} className="p-3.5 bg-surface-container-low rounded-2xl border border-outline-variant/20 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-primary mr-2">{item.courseCode}</span>
                      <span className="font-bold text-on-surface">{item.courseName}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                      item.percentage >= 75 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    }`}>
                      {item.percentage}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.percentage >= 75 ? "bg-emerald-500" : "bg-rose-500"}`}
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Fee Dues */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-on-surface">Tuition Fee Status</h2>
              <p className="text-xs text-on-surface-variant">Semester fee breakdown & payment history</p>
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

                    {fee.paymentHistory && fee.paymentHistory.length > 0 && (
                      <div className="pt-2 border-t border-outline-variant/20">
                        <a
                          href={feeAPI.getReceiptUrl(fee._id, fee.paymentHistory[0].receiptNo)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                        >
                          <span className="material-symbols-outlined text-sm">receipt</span>
                          Download Fee Receipt PDF
                        </a>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Exams & Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exams */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-on-surface">Upcoming Exams & Timetable</h2>
          <div className="space-y-3">
            {exams.length === 0 ? (
              <p className="text-xs text-on-surface-variant py-4 text-center">No exams scheduled for your semester</p>
            ) : (
              exams.map((ex) => (
                <div key={ex._id} className="p-3.5 bg-surface-container-low rounded-2xl flex items-center justify-between border border-outline-variant/20">
                  <div>
                    <h4 className="text-xs font-bold text-on-surface">{ex.name}</h4>
                    <p className="text-[11px] text-on-surface-variant">
                      {ex.course?.code} • {new Date(ex.date).toLocaleDateString()} ({ex.startTime} - {ex.endTime}) • Room {ex.room}
                    </p>
                  </div>
                  <Badge status={ex.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notices */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-on-surface">Announcements for Students</h2>
          <div className="space-y-3">
            {notices.map((n) => (
              <div key={n._id} className="p-3.5 bg-surface-container-low rounded-2xl border border-outline-variant/20 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-on-surface">{n.title}</h4>
                  <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold rounded-full">
                    {n.category}
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant line-clamp-2">{n.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
