"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Search, Plus, Filter, MoreVertical, Eye, Edit, Archive,
  GraduationCap, Download, SlidersHorizontal, X
} from "lucide-react";

import { studentService } from "@/services/storageService";
import { usePathname } from "next/navigation";

export default function StudentsPage() {
  const pathname = usePathname();
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT">("ADD");
  const [editingStudent, setEditingStudent] = useState<any>(null);

  useEffect(() => {
    setStudents(studentService.getAll().filter(s => !s.isArchived));
  }, []);

  const openAddModal = () => {
    setModalMode("ADD");
    setEditingStudent({
      name: "", rollNumber: "", department: "", gender: "Male", studentType: "Day Scholar",
      sslcPercentage: "", hscPercentage: "", ugPercentage: "", pgPercentage: "",
      email: "", mobile: "", yearOfGraduation: new Date().getFullYear(),
      github: "", linkedin: "", portfolio: "", resumeLink: "", selfIntroLink: "", photoUrl: "",
      placementStatus: "UNPLACED", resumeScore: Math.floor(Math.random() * (95 - 65 + 1)) + 65
    });
    setIsModalOpen(true);
  };

  const openEditModal = (student: any) => {
    setModalMode("EDIT");
    setEditingStudent({ ...student });
    setIsModalOpen(true);
  };

  const handleModalSave = (e: React.FormEvent) => {
    e.preventDefault();
    studentService.save(editingStudent);
    setStudents(studentService.getAll().filter(s => !s.isArchived));
    setIsModalOpen(false);
  };

  const handleArchive = (id: string) => {
    if (window.confirm("Are you sure you want to archive/delete this student?")) {
      const student = studentService.getById(id);
      if (student) {
        student.isArchived = true;
        studentService.save(student);
        setStudents(studentService.getAll().filter(s => !s.isArchived));
      }
    }
  };

  const departments = Array.from(new Set(students.map(s => s.department)));

  const filteredStudents = students
    .filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(student => departmentFilter === "All" || student.department === departmentFilter)
    .filter(student => statusFilter === "All" || student.placementStatus === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="text-indigo-600 dark:text-indigo-400" /> 
            Student Intelligence
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and track student placement journeys.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center justify-center gap-2 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 transition-colors shadow-sm">
            <Download size={16} />
            <span>Export</span>
          </button>
          <button 
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg leading-5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
            <SlidersHorizontal size={16} /> Filters:
          </div>
          <select 
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Departments</option>
            {departments.map(dept => (
              <option key={dept as string} value={dept as string}>{dept as string}</option>
            ))}
          </select>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="UNPLACED">Unplaced</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="PLACED">Placed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4 text-center">UG %</th>
                <th className="px-6 py-4 text-center">Grad Year</th>
                <th className="px-6 py-4 text-center">AI Match</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{student.name}</p>
                        <p className="text-xs text-gray-500">{student.rollNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{student.department}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-semibold">{student.ugPercentageNum || student.ugPercentage}%</span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400 font-medium">
                    {student.yearOfGraduation}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-bold ${
                      student.resumeScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                      student.resumeScore >= 70 ? 'text-indigo-600 dark:text-indigo-400' :
                      student.resumeScore >= 60 ? 'text-amber-600 dark:text-amber-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {student.resumeScore}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      student.placementStatus === 'PLACED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50' :
                      student.placementStatus === 'SHORTLISTED' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50' :
                      'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                    }`}>
                      {student.placementStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`${pathname}/${student.id}`} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors">
                        <Eye size={18} />
                      </Link>
                      <button 
                        onClick={() => openEditModal(student)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleArchive(student.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <Archive size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No students found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl w-full max-w-4xl my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {modalMode === "ADD" ? "Add New Student" : "Edit Student Profile"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleModalSave} className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Basic Details */}
                <div className="col-span-1 md:col-span-3 pb-2 border-b border-gray-100 dark:border-gray-800"><h3 className="font-semibold text-gray-900 dark:text-white">Basic Information</h3></div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                  <input required type="text" value={editingStudent?.name} onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Roll Number *</label>
                  <input required type="text" value={editingStudent?.rollNumber} onChange={e => setEditingStudent({...editingStudent, rollNumber: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department *</label>
                  <input required type="text" value={editingStudent?.department} onChange={e => setEditingStudent({...editingStudent, department: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                  <input required type="email" value={editingStudent?.email} onChange={e => setEditingStudent({...editingStudent, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile</label>
                  <input type="text" value={editingStudent?.mobile} onChange={e => setEditingStudent({...editingStudent, mobile: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Graduation Year</label>
                  <input type="number" value={editingStudent?.yearOfGraduation} onChange={e => setEditingStudent({...editingStudent, yearOfGraduation: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>

                {/* Academics */}
                <div className="col-span-1 md:col-span-3 pt-4 pb-2 border-b border-gray-100 dark:border-gray-800"><h3 className="font-semibold text-gray-900 dark:text-white">Academic Details</h3></div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UG %</label>
                  <input type="text" value={editingStudent?.ugPercentageNum || editingStudent?.ugPercentage} onChange={e => setEditingStudent({...editingStudent, ugPercentageNum: e.target.value, ugPercentage: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">HSC %</label>
                  <input type="text" value={editingStudent?.hscPercentage} onChange={e => setEditingStudent({...editingStudent, hscPercentage: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SSLC %</label>
                  <input type="text" value={editingStudent?.sslcPercentage} onChange={e => setEditingStudent({...editingStudent, sslcPercentage: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>

                {/* Links */}
                <div className="col-span-1 md:col-span-3 pt-4 pb-2 border-b border-gray-100 dark:border-gray-800"><h3 className="font-semibold text-gray-900 dark:text-white">Profiles & Status</h3></div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GitHub Username</label>
                  <input type="text" value={editingStudent?.github} onChange={e => setEditingStudent({...editingStudent, github: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">LinkedIn Profile</label>
                  <input type="text" value={editingStudent?.linkedin} onChange={e => setEditingStudent({...editingStudent, linkedin: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Portfolio Link</label>
                  <input type="text" value={editingStudent?.portfolio} onChange={e => setEditingStudent({...editingStudent, portfolio: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Placement Status</label>
                  <select value={editingStudent?.placementStatus} onChange={e => setEditingStudent({...editingStudent, placementStatus: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option value="UNPLACED">Unplaced</option>
                    <option value="SHORTLISTED">Shortlisted</option>
                    <option value="PLACED">Placed</option>
                  </select>
                </div>
                
              </div>
              
              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors">
                  {modalMode === "ADD" ? "Add Student" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
