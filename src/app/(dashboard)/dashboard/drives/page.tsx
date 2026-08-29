"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { CalendarDays, Plus, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, AlertCircle, Check, ArrowRight, X } from "lucide-react";
import { driveService } from "@/services/storageService";
import { parseDriveExcelOrCsv, ImportAnalysisResult, ParsedRow } from "@/lib/excelImporter";

export default function DrivesPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [drives, setDrives] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Import Preview State
  const [importAnalysis, setImportAnalysis] = useState<ImportAnalysisResult<ParsedRow> | null>(null);
  const [duplicateAction, setDuplicateAction] = useState<"SKIP" | "OVERWRITE">("SKIP");
  const [previewTab, setPreviewTab] = useState<"ALL" | "VALID" | "DUPLICATE" | "INVALID">("ALL");

  // Form State
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("Main Campus Auditorium");
  const [driveType, setDriveType] = useState("On-Campus");
  const [status, setStatus] = useState("UPCOMING");

  const loadDrives = () => {
    const loaded = driveService.getAll();
    setDrives(loaded);
  };

  useEffect(() => {
    loadDrives();
  }, []);

  const handleAddDrive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !company.trim()) return;

    const newDrive = {
      id: `D${Date.now().toString().slice(-4)}`,
      title: title.trim(),
      companyId: company.trim(),
      company: company.trim(),
      driveType,
      driveDate: date || new Date().toISOString(),
      venue,
      status
    };

    driveService.save(newDrive);
    loadDrives();

    setTitle("");
    setCompany("");
    setDate("");
    setIsModalOpen(false);

    setSuccessMessage(`Drive "${newDrive.title}" scheduled successfully!`);
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
        const analysis = parseDriveExcelOrCsv(bstr, file.name);

        if (analysis.totalRows === 0) {
          alert("Uploaded Excel/CSV file is empty.");
          return;
        }

        setImportAnalysis(analysis);
        setPreviewTab("ALL");
        setDuplicateAction("SKIP");
      } catch (err: any) {
        alert(err?.message || "Failed to parse drive file.");
      }
    };

    reader.readAsBinaryString(file);
    if (e.target) e.target.value = "";
  };

  // Commit Drive Import
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
      driveService.save({
        id: `D_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        companyId: row.data.company,
        driveType: "On-Campus",
        driveDate: row.data.date,
        venue: "Campus Placement Center",
        ...row.data
      });
      inserted++;
    });

    loadDrives();
    setImportAnalysis(null);

    setSuccessMessage(`${inserted} placement drives imported successfully.`);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

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
            <CalendarDays className="text-indigo-600 dark:text-indigo-400" /> 
            Placement Drives
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Schedule and manage campus and pool drives.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Import Drives Button */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md"
          >
            <Upload size={16} />
            <span>Import Drives</span>
          </button>

          {/* New Drive Button */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>New Drive</span>
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

      {/* Main Drives Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Drive ID</th>
                <th className="px-6 py-4">Drive Title / Role</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Venue</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
              {drives.map((drive, idx) => (
                <tr key={`drive-${drive.id || drive.title || idx}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-400">{drive.id}</td>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{drive.title || "Software Engineer Drive"}</td>
                  <td className="px-6 py-4 font-semibold text-indigo-600 dark:text-indigo-400">{drive.company || drive.companyId}</td>
                  <td className="px-6 py-4">{drive.driveType || "On-Campus"}</td>
                  <td className="px-6 py-4 font-medium">{new Date(drive.driveDate || drive.date || Date.now()).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{drive.venue || "Campus Center"}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase border ${
                      drive.status === 'Active' || drive.status === 'ONGOING' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                      drive.status === 'Upcoming' || drive.status === 'UPCOMING' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                      'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {drive.status || "UPCOMING"}
                    </span>
                  </td>
                </tr>
              ))}

              {drives.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-gray-500 dark:text-gray-400">
                    <CalendarDays size={44} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-base font-bold text-gray-800 dark:text-gray-200">No Placement Drives Found</p>
                    <p className="text-xs text-gray-500 mt-1">Upload an Excel drive schedule or click "New Drive" to create one.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* IMPORT PREVIEW MODAL */}
      {importAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl my-8 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-6 text-white flex justify-between items-center">
              <div>
                <p className="text-xs uppercase font-bold text-indigo-200 tracking-wider">Placement Drive Excel / CSV Import Analysis</p>
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
                    <input type="radio" name="dDupAction" checked={duplicateAction === "SKIP"} onChange={() => setDuplicateAction("SKIP")} />
                    <span>Skip</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="dDupAction" checked={duplicateAction === "OVERWRITE"} onChange={() => setDuplicateAction("OVERWRITE")} />
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
                      <th className="px-4 py-3">Drive Title</th>
                      <th className="px-4 py-3">Company</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Eligibility Cutoff</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300 font-medium">
                    {previewDisplayRows.map(row => (
                      <tr key={row.rowNumber} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="px-4 py-2.5 font-bold text-gray-400">{row.rowNumber}</td>
                        <td className="px-4 py-2.5 font-semibold text-gray-900 dark:text-white">{row.data.title || "—"}</td>
                        <td className="px-4 py-2.5 font-semibold text-indigo-600">{row.data.company}</td>
                        <td className="px-4 py-2.5">{row.data.date}</td>
                        <td className="px-4 py-2.5 font-bold">{row.data.cgpaCutoff} CGPA</td>
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
              <span className="text-xs font-semibold text-gray-500">Ready to import: <b className="text-indigo-600 dark:text-indigo-400">{importTargetCount}</b> placement drives</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setImportAnalysis(null)} className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400">Cancel</button>
                <button disabled={importTargetCount === 0} onClick={executeImportCommit} className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 flex items-center gap-2">
                  <Check size={16} />
                  <span>Import {importTargetCount} Drives</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* New Drive Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarDays size={20} className="text-indigo-600" />
                Schedule New Drive
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddDrive} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Drive Title / Job Role *</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Software Engineer 2026 Drive" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Company Name *</label>
                <input required type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. TCS / Amazon" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Drive Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Drive Type</label>
                  <select value={driveType} onChange={e => setDriveType(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option value="On-Campus">On-Campus</option>
                    <option value="Pool Drive">Pool Drive</option>
                    <option value="Off-Campus">Off-Campus</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Venue</label>
                <input type="text" value={venue} onChange={e => setVenue(e.target.value)} placeholder="Auditorium Hall B" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm">Schedule Drive</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
