"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { Building2, Search, Plus, MapPin, ExternalLink, X, CheckCircle2, Upload, FileSpreadsheet, AlertTriangle, AlertCircle, Check, ArrowRight } from "lucide-react";
import { companyService } from "@/services/storageService";
import { parseCompanyExcelOrCsv, ImportAnalysisResult, ParsedRow } from "@/lib/excelImporter";

export default function CompaniesPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [companies, setCompanies] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Import Preview State
  const [importAnalysis, setImportAnalysis] = useState<ImportAnalysisResult<ParsedRow> | null>(null);
  const [duplicateAction, setDuplicateAction] = useState<"SKIP" | "OVERWRITE">("SKIP");
  const [previewTab, setPreviewTab] = useState<"ALL" | "VALID" | "DUPLICATE" | "INVALID">("ALL");

  // Form State
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("Software & Tech");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("MNC");
  const [status, setStatus] = useState("COLD");
  const [website, setWebsite] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const loadCompanies = () => {
    const loaded = companyService.getAll();
    setCompanies(loaded);
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCompany = {
      id: `C${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      industry: industry.trim() || "Technology",
      location: location.trim() || "Chennai",
      type: type || "MNC",
      status: status || "COLD",
      approvalStatus: "APPROVED",
      website: website.trim() || "",
      contactPerson: contactPerson.trim() || "",
      contactEmail: contactEmail.trim() || "",
      isArchived: false
    };

    companyService.save(newCompany);
    loadCompanies();

    setName("");
    setLocation("");
    setWebsite("");
    setContactPerson("");
    setContactEmail("");
    setIsModalOpen(false);

    setSuccessMessage(`Company "${newCompany.name}" added successfully!`);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // Excel/CSV File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result as string;
        const analysis = parseCompanyExcelOrCsv(bstr, file.name);

        if (analysis.totalRows === 0) {
          alert("Uploaded Excel/CSV file is empty.");
          return;
        }

        setImportAnalysis(analysis);
        setPreviewTab("ALL");
        setDuplicateAction("SKIP");
      } catch (err: any) {
        alert(err?.message || "Failed to parse company file.");
      }
    };

    reader.readAsBinaryString(file);
    if (e.target) e.target.value = "";
  };

  // Commit Company Import
  const executeImportCommit = () => {
    if (!importAnalysis) return;

    let rowsToImport = duplicateAction === "OVERWRITE" 
      ? [...importAnalysis.validRows, ...importAnalysis.duplicateRows]
      : importAnalysis.validRows;

    if (rowsToImport.length === 0) {
      alert("No valid records selected to import.");
      setImportAnalysis(null);
      return;
    }

    let inserted = 0;
    rowsToImport.forEach(row => {
      companyService.save({
        id: `C_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        ...row.data,
        type: "MNC",
        contactPerson: "",
        contactEmail: "",
        isArchived: false
      });
      inserted++;
    });

    loadCompanies();
    setImportAnalysis(null);

    setSuccessMessage(`${inserted} companies imported successfully.`);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const filteredCompanies = companies.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const previewDisplayRows = useMemo(() => {
    if (!importAnalysis) return [];
    if (previewTab === "VALID") return importAnalysis.validRows;
    if (previewTab === "DUPLICATE") return importAnalysis.duplicateRows;
    if (previewTab === "INVALID") return importAnalysis.invalidRows;
    return importAnalysis.allRows;
  }, [importAnalysis, previewTab]);

  const importTargetCount = useMemo(() => {
    if (!importAnalysis) return 0;
    return duplicateAction === "OVERWRITE" 
      ? importAnalysis.validRows.length + importAnalysis.duplicateRows.length
      : importAnalysis.validRows.length;
  }, [importAnalysis, duplicateAction]);

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".xlsx, .xls, .csv" 
        className="hidden" 
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="text-indigo-600 dark:text-indigo-400" />
            Company Intelligence
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Directory of recruiters, corporate partners, and Tier-1/2 companies.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Import Companies Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md"
          >
            <Upload size={16} />
            <span>Import Companies</span>
          </button>

          {/* Add Company Button */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>Add Company</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 animate-in fade-in duration-150">
          <CheckCircle2 size={18} />
          <span className="text-sm font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Search */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by company name, industry, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((company) => (
          <div key={company.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{company.name}</h3>
                  <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                    {company.industry || "Technology"}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                  company.status === 'HOT' ? 'bg-red-100 text-red-700 border border-red-200' :
                  company.status === 'WARM' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                  'bg-gray-100 text-gray-700 border border-gray-200'
                }`}>
                  {company.status || 'COLD'}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-xs text-gray-600 dark:text-gray-400">
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.location || 'Chennai, India')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <MapPin size={14} className="text-gray-400" />
                  <span>{company.location || 'Location Not Specified'}</span>
                </a>
                
                {company.website && (
                  <a 
                    href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <ExternalLink size={14} />
                    <span className="truncate">{company.website}</span>
                  </a>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">Type: {company.type || 'MNC'}</span>
              <Link 
                href={`/dashboard/companies/${company.id}`}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View Details →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredCompanies.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
          <Building2 size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">No Companies Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">Upload an Excel/CSV company list or click "Add Company" to populate your directory.</p>
        </div>
      )}

      {/* IMPORT PREVIEW MODAL */}
      {importAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl my-8 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-6 text-white flex justify-between items-center">
              <div>
                <p className="text-xs uppercase font-bold text-indigo-200 tracking-wider">Company Excel / CSV Import Analysis</p>
                <h2 className="text-xl font-bold flex items-center gap-2 mt-0.5">
                  <FileSpreadsheet size={22} />
                  {importAnalysis.fileName}
                </h2>
              </div>
              <button onClick={() => setImportAnalysis(null)} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                <X size={22} />
              </button>
            </div>

            {/* DETECTED COLUMNS */}
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 border-b border-gray-200 dark:border-gray-800">
              <p className="text-xs font-bold uppercase text-indigo-800 dark:text-indigo-300 tracking-wider mb-2">
                Detected Columns & Field Mapping
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {importAnalysis.detectedColumns.map((col, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm">
                    <span className="font-semibold text-gray-900 dark:text-white">{col.excelColumn}</span>
                    <ArrowRight size={12} className="text-indigo-500 shrink-0" />
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{col.appField}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* KPI Badges */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold">Total: {importAnalysis.totalRows}</div>
                <div className="px-3 py-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5"><CheckCircle2 size={14} /> Valid: {importAnalysis.validRows.length}</div>
                <div className="px-3 py-1.5 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5"><AlertTriangle size={14} /> Duplicates: {importAnalysis.duplicateRows.length}</div>
                <div className="px-3 py-1.5 bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 rounded-xl text-xs font-bold flex items-center gap-1.5"><AlertCircle size={14} /> Invalid: {importAnalysis.invalidRows.length}</div>
              </div>

              {importAnalysis.duplicateRows.length > 0 && (
                <div className="flex items-center gap-3 bg-white dark:bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold">
                  <span className="text-gray-500">Duplicates:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="cDupAction" checked={duplicateAction === "SKIP"} onChange={() => setDuplicateAction("SKIP")} />
                    <span>Skip</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="cDupAction" checked={duplicateAction === "OVERWRITE"} onChange={() => setDuplicateAction("OVERWRITE")} />
                    <span>Overwrite</span>
                  </label>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="p-6 space-y-4">
              <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
                {[
                  { id: "ALL", label: `All (${importAnalysis.totalRows})` },
                  { id: "VALID", label: `Valid (${importAnalysis.validRows.length})` },
                  { id: "DUPLICATE", label: `Duplicates (${importAnalysis.duplicateRows.length})` },
                  { id: "INVALID", label: `Invalid (${importAnalysis.invalidRows.length})` },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setPreviewTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      previewTab === tab.id ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="max-h-[300px] overflow-auto border border-gray-200 dark:border-gray-800 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Row #</th>
                      <th className="px-4 py-3">Company Name</th>
                      <th className="px-4 py-3">Industry</th>
                      <th className="px-4 py-3">Tier</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300 font-medium">
                    {previewDisplayRows.map(row => (
                      <tr key={row.rowNumber} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="px-4 py-2.5 font-bold text-gray-400">{row.rowNumber}</td>
                        <td className="px-4 py-2.5 font-semibold text-gray-900 dark:text-white">{row.data.name || "—"}</td>
                        <td className="px-4 py-2.5">{row.data.industry}</td>
                        <td className="px-4 py-2.5 font-bold">{row.data.tier}</td>
                        <td className="px-4 py-2.5">{row.data.location}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            row.status === "VALID" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" :
                            row.status === "DUPLICATE" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" :
                            "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Ready to import: <b className="text-indigo-600 dark:text-indigo-400">{importTargetCount}</b> companies</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setImportAnalysis(null)} className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400">Cancel</button>
                <button disabled={importTargetCount === 0} onClick={executeImportCommit} className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 flex items-center gap-2">
                  <Check size={16} />
                  <span>Import {importTargetCount} Companies</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Add Company Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 size={20} className="text-indigo-600" />
                Add New Company
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCompany} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Company Name *</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Google India" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Industry</label>
                  <input type="text" value={industry} onChange={e => setIndustry(e.target.value)} placeholder="Software / Tech" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Location</label>
                  <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Bengaluru, KA" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Type</label>
                  <select value={type} onChange={e => setType(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option value="MNC">MNC</option>
                    <option value="Product Startup">Product Startup</option>
                    <option value="Service Enterprise">Service Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option value="HOT">HOT (Active Hiring)</option>
                    <option value="WARM">WARM (In Discussion)</option>
                    <option value="COLD">COLD (Prospect)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Website URL</label>
                <input type="text" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://careers.google.com" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm">Save Company</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
