"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { UserSquare2, Plus, Mail, Phone, MapPin, Search, CheckCircle2, X } from "lucide-react";
import { recruiterService } from "@/services/storageService";
import { companyService } from "@/services/companyService";

export default function RecruitersPage() {
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [designation, setDesignation] = useState("Talent Acquisition Manager");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const loadData = () => {
    const loadedRecruiters = recruiterService.getAll();
    setRecruiters(loadedRecruiters);

    const loadedCompanies = companyService.getCompanies();
    setCompanies(loadedCompanies);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Pre-fill company ID dropdown
  useEffect(() => {
    if (companies.length > 0 && !companyId) {
      setCompanyId(companies[0].id);
    }
  }, [companies, companyId]);

  const handleAddRecruiter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !companyId) return;

    const newRecruiter = {
      id: `RCR${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      companyId,
      designation: designation.trim(),
      email: email.trim() || "N/A",
      mobile: mobile.trim() || "N/A",
      location: location.trim() || "N/A",
      activeDrives: 0,
      lastActivity: new Date().toISOString().split("T")[0],
      status
    };

    recruiterService.save(newRecruiter);
    loadData();

    setName("");
    setEmail("");
    setMobile("");
    setLocation("");
    setIsModalOpen(false);

    setSuccessMessage(`Recruiter contact "${newRecruiter.name}" saved successfully.`);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // Search filter
  const filteredRecruiters = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return recruiters;

    return recruiters.filter(r => {
      const comp = companies.find(c => c.id === r.companyId) || { name: "" };
      return (
        r.name?.toLowerCase().includes(q) ||
        r.designation?.toLowerCase().includes(q) ||
        comp.name?.toLowerCase().includes(q)
      );
    });
  }, [recruiters, companies, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserSquare2 className="text-indigo-600 dark:text-indigo-400" /> 
            Corporate Recruiters
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage external contacts and hiring managers.</p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Recruiter</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 shadow-sm max-w-md">
        <Search size={18} className="text-gray-400 mr-2 shrink-0" />
        <input 
          type="text" 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          placeholder="Search by recruiter name, designation, company..." 
          className="w-full text-xs font-semibold bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
        />
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 animate-in fade-in duration-150">
          <CheckCircle2 size={18} />
          <span className="text-sm font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Main Recruiters Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Recruiter</th>
                <th className="px-6 py-4">Company Partner (ID)</th>
                <th className="px-6 py-4">Designation</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4 text-center">Active Drives</th>
                <th className="px-6 py-4">Last Activity</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300 font-medium">
              {filteredRecruiters.map((recruiter) => {
                const comp = companies.find(c => c.id === recruiter.companyId);
                return (
                  <tr key={recruiter.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shadow-inner">
                          {recruiter.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{recruiter.name}</p>
                          <p className="text-[10px] text-gray-450 font-mono mt-0.5">{recruiter.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {comp ? (
                        <Link href={`/dashboard/companies/${comp.id}`} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                          {comp.name} <span className="text-[10px] text-gray-400 font-mono">({comp.id})</span>
                        </Link>
                      ) : (
                        <span className="font-bold text-gray-500">Unassigned ({recruiter.companyId})</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-200">{recruiter.designation}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={13} className="text-red-500" />
                        <span>{recruiter.location || comp?.location || "N/A"}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><Mail size={12}/> {recruiter.email}</span>
                        <span className="flex items-center gap-1"><Phone size={12}/> {recruiter.mobile || recruiter.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-indigo-600 dark:text-indigo-450">{recruiter.activeDrives || 0}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono">{recruiter.lastActivity || "—"}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                        recruiter.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300" :
                        "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                      }`}>
                        {recruiter.status || "ACTIVE"}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredRecruiters.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-gray-500 dark:text-gray-400">
                    <UserSquare2 size={44} className="mx-auto text-gray-300 dark:text-gray-650 mb-3" />
                    <p className="text-base font-bold text-gray-850 dark:text-gray-200">No Recruiter Records Found</p>
                    <p className="text-xs text-gray-500 mt-1">Configure your corporate contacts database by clicking "Add Recruiter".</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Recruiter Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserSquare2 size={20} className="text-indigo-600" />
                Add Corporate Recruiter
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddRecruiter} className="p-5 space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Recruiter Full Name *</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sandra Bullock" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-950 dark:text-white focus:outline-none" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Affiliated Company *</label>
                <select value={companyId} onChange={e => setCompanyId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-950 dark:text-white">
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                  ))}
                  {companies.length === 0 && (
                    <option value="">No corporate records available</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Designation</label>
                <input type="text" value={designation} onChange={e => setDesignation(e.target.value)} placeholder="e.g. Lead Talent Acquisition" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-955 dark:text-white focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="sandra@company.com" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-950 dark:text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Mobile Number</label>
                  <input type="text" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="+91 XXXXX XXXXX" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-955 dark:text-white focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Location / Office City</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Chennai Office" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-950 dark:text-white focus:outline-none" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-gray-650 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm">Add Recruiter</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
