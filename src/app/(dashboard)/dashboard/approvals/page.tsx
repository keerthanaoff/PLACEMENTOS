"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Clock, Check, Users, FileText } from "lucide-react";
import { MOCK_STUDENTS } from "@/lib/mock-data";
import { useJD } from "@/context/JDContext";

export default function ApprovalCenterPage() {
  const [activeTab, setActiveTab] = useState<"STUDENTS" | "JDS">("STUDENTS");

  // --- Students State ---
  const [pendingStudents, setPendingStudents] = useState(
    MOCK_STUDENTS.map(s => ({ ...s, status: "PENDING" }))
  );

  const handleStudentAction = (id: string, action: "APPROVED" | "REJECTED") => {
    setPendingStudents(prev => 
      prev.map(student => 
        student.id === id ? { ...student, status: action } : student
      )
    );
  };
  const pendingStudentCount = pendingStudents.filter(s => s.status === "PENDING").length;

  // --- JDs State ---
  const { jds, updateJDStatus } = useJD();
  const pendingJDs = jds.filter(jd => jd.approvalStatus === "PENDING");
  
  const handleJDAction = (id: string, action: "APPROVED" | "REJECTED") => {
    if (action === "REJECTED") {
      const reason = window.prompt("Enter reason for rejection:");
      if (reason === null) return; // cancelled
    }
    const newStatus = action === "APPROVED" ? "ACTIVE" : "REJECTED";
    updateJDStatus(id, newStatus, action);
  };
  const pendingJDCount = pendingJDs.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="text-indigo-600 dark:text-indigo-400" /> 
            Approval Center
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Review and approve placements data.</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-lg font-medium border border-amber-200 dark:border-amber-800/50">
          <Clock size={18} />
          {pendingStudentCount + pendingJDCount} Total Pending
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl w-fit border border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab("STUDENTS")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "STUDENTS" 
              ? "bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm" 
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <Users size={16} /> Students ({pendingStudentCount})
        </button>
        <button
          onClick={() => setActiveTab("JDS")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "JDS" 
              ? "bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm" 
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <FileText size={16} /> Job Descriptions ({pendingJDCount})
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
        {activeTab === "STUDENTS" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Roll Number</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4 text-center">Resume Score</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                {pendingStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400">
                          {student.name.charAt(0)}
                        </div>
                        {student.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">{student.rollNumber}</td>
                    <td className="px-6 py-4">{student.department}</td>
                    <td className="px-6 py-4 text-center font-bold text-indigo-600 dark:text-indigo-400">{student.resumeScore}%</td>
                    <td className="px-6 py-4 text-center">
                      {student.status === "PENDING" && <span className="px-2.5 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded-full text-xs font-bold uppercase tracking-wider dark:bg-amber-900/30 dark:border-amber-800/50 dark:text-amber-400">Pending</span>}
                      {student.status === "APPROVED" && <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider dark:bg-emerald-900/30 dark:border-emerald-800/50 dark:text-emerald-400">Approved</span>}
                      {student.status === "REJECTED" && <span className="px-2.5 py-1 bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-bold uppercase tracking-wider dark:bg-red-900/30 dark:border-red-800/50 dark:text-red-400">Rejected</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {student.status === "PENDING" ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleStudentAction(student.id, "REJECTED")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg transition-colors">
                            <XCircle size={14} /> Reject
                          </button>
                          <button onClick={() => handleStudentAction(student.id, "APPROVED")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm">
                            <Check size={14} /> Approve
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 italic">Action taken</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "JDS" && (
          <div className="overflow-x-auto">
            {pendingJDs.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center text-gray-500">
                <FileText size={48} className="mb-4 opacity-20" />
                <p>No JDs pending approval.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">Job Role</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4 text-right">CTC</th>
                    <th className="px-6 py-4">Uploaded By</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                  {pendingJDs.map((jd) => (
                    <tr key={jd.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{jd.companyName || jd.companyId}</td>
                      <td className="px-6 py-4 font-medium text-indigo-600 dark:text-indigo-400">{jd.jobTitle}</td>
                      <td className="px-6 py-4">{jd.location || "-"}</td>
                      <td className="px-6 py-4 text-right font-medium text-emerald-600 dark:text-emerald-400">{jd.salary || "-"}</td>
                      <td className="px-6 py-4 text-xs">
                        <p className="font-semibold">{jd.uploadedBy}</p>
                        <p className="text-gray-500">{new Date(jd.uploadedDate || "").toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleJDAction(jd.id, "REJECTED")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg transition-colors">
                            <XCircle size={14} /> Reject
                          </button>
                          <button onClick={() => handleJDAction(jd.id, "APPROVED")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm">
                            <Check size={14} /> Approve
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
