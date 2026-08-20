import React, { useState, useEffect } from "react";
import { feeAPI } from "../../api";
import { Badge, TableSkeleton, Modal, StatsCard } from "../../components/ui";
import toast from "react-hot-toast";

export const FeesPage = () => {
  const [fees, setFees] = useState([]);
  const [stats, setStats] = useState({});
  const [status, setStatus] = useState("");
  const [semester, setSemester] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Payment Collection Modal
  const [selectedFee, setSelectedFee] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [collecting, setCollecting] = useState(false);

  useEffect(() => {
    fetchFees();
  }, [status, semester]);

  const fetchFees = async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (semester) params.semester = semester;
      if (search) params.search = search;

      const res = await feeAPI.getAll(params);
      if (res.data.success) {
        setFees(res.data.data);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      toast.error("Failed to load fee records");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayment = (fee) => {
    setSelectedFee(fee);
    const balance = fee.totalAmount - fee.paidAmount;
    setPaymentAmount(balance > 0 ? balance.toString() : "0");
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setCollecting(true);
    try {
      const res = await feeAPI.collect(selectedFee._id, {
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        notes: paymentNotes
      });

      if (res.data.success) {
        toast.success(`Payment recorded! Receipt: ${res.data.receiptNo}`);
        setSelectedFee(null);
        fetchFees();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record payment");
    } finally {
      setCollecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">Fee Management</h1>
          <p className="text-sm text-on-surface-variant mt-1">Track tuition dues, collect payments & generate official receipts</p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatsCard
          title="Total Invoiced"
          value={`₹${((stats.totalDue || 0) / 1000).toFixed(1)}k`}
          icon="account_balance"
          color="primary"
          subtitle="All academic sessions"
        />
        <StatsCard
          title="Total Collected"
          value={`₹${((stats.totalCollected || 0) / 1000).toFixed(1)}k`}
          icon="verified"
          color="success"
          subtitle="Verified payments"
        />
        <StatsCard
          title="Outstanding Dues"
          value={`₹${((stats.pending || 0) / 1000).toFixed(1)}k`}
          icon="warning"
          color="danger"
          subtitle="Pending & overdue"
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
            search
          </span>
          <input
            type="text"
            placeholder="Search by student roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchFees()}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface font-medium focus:ring-2 focus:ring-primary"
        >
          <option value="">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="overdue">Overdue</option>
        </select>

        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          className="px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface font-medium focus:ring-2 focus:ring-primary"
        >
          <option value="">All Semesters</option>
          {[1,2,3,4,5,6,7,8].map((s) => (
            <option key={s} value={s}>Semester {s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={6} />
          </div>
        ) : fees.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-2 text-on-surface-variant/40">payments</span>
            <p className="text-base font-bold text-on-surface">No fee records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-4 px-6">Student</th>
                  <th className="py-4 px-4">Roll No</th>
                  <th className="py-4 px-4">Semester</th>
                  <th className="py-4 px-4">Total Amount</th>
                  <th className="py-4 px-4">Paid Amount</th>
                  <th className="py-4 px-4">Balance</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {fees.map((fee) => {
                  const balance = fee.totalAmount - fee.paidAmount;
                  return (
                    <tr key={fee._id} className="hover:bg-surface-container-low/50">
                      <td className="py-3.5 px-6 font-bold text-on-surface">
                        {fee.student?.userId?.name || "Student"}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-primary">{fee.student?.rollNo}</td>
                      <td className="py-3.5 px-4 font-medium">Sem {fee.semester}</td>
                      <td className="py-3.5 px-4 font-semibold">₹{fee.totalAmount.toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">₹{fee.paidAmount.toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-bold text-rose-600">₹{balance.toLocaleString()}</td>
                      <td className="py-3.5 px-4">
                        <Badge status={fee.status} />
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          {balance > 0 && (
                            <button
                              onClick={() => handleOpenPayment(fee)}
                              className="px-3 py-1.5 bg-primary text-on-primary font-bold rounded-lg text-xs hover:bg-primary-container shadow-sm"
                            >
                              Collect
                            </button>
                          )}
                          {fee.paymentHistory && fee.paymentHistory.length > 0 && (
                            <a
                              href={feeAPI.getReceiptUrl(fee._id, fee.paymentHistory[fee.paymentHistory.length - 1].receiptNo)}
                              target="_blank"
                              rel="noreferrer"
                              title="Download Latest Receipt PDF"
                              className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            >
                              <span className="material-symbols-outlined text-lg">receipt_long</span>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Collect Payment Modal */}
      <Modal
        isOpen={!!selectedFee}
        onClose={() => setSelectedFee(null)}
        title="Record Fee Payment"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div className="p-4 bg-surface-container-low rounded-2xl space-y-1">
            <p className="text-on-surface-variant">Student: <strong className="text-on-surface">{selectedFee?.student?.userId?.name}</strong></p>
            <p className="text-on-surface-variant">Roll No: <strong className="font-mono text-primary">{selectedFee?.student?.rollNo}</strong></p>
            <p className="text-on-surface-variant">
              Remaining Balance: <strong className="text-rose-600 font-bold">₹{((selectedFee?.totalAmount || 0) - (selectedFee?.paidAmount || 0)).toLocaleString()}</strong>
            </p>
          </div>

          <div>
            <label className="block font-bold text-on-surface-variant uppercase mb-1">Payment Amount (₹) *</label>
            <input
              type="number"
              required
              min="1"
              max={(selectedFee?.totalAmount || 0) - (selectedFee?.paidAmount || 0)}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block font-bold text-on-surface-variant uppercase mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl font-medium focus:ring-2 focus:ring-primary"
            >
              <option value="cash">Cash Counter</option>
              <option value="online">Online / UPI Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="DD">Demand Draft (DD)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-on-surface-variant uppercase mb-1">Payment Remarks / Notes</label>
            <input
              type="text"
              placeholder="e.g. UPI Ref #98762"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={() => setSelectedFee(null)}
              className="px-4 py-2 bg-surface-container text-on-surface font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={collecting}
              className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs shadow hover:bg-primary-container disabled:opacity-50"
            >
              {collecting ? "Processing..." : "Confirm & Generate Receipt"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
