import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { SchoolInfo } from '../types';
import { formatCurrency } from '../utils/formatters';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  Check, 
  IndianRupee, 
  Building2, 
  ShieldCheck, 
  QrCode,
  Plus,
  Trash2,
  GraduationCap,
  Users
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { 
    schoolInfo, 
    updateSchoolInfo, 
    feeStructure, 
    updateFeeStructure, 
    classList,
    addClass,
    deleteClass,
    students,
    exportDatabaseJson, 
    importDatabaseJson, 
    resetToDefaults 
  } = useSchool();

  const [formData, setFormData] = useState<SchoolInfo>(schoolInfo);
  const [fees, setFees] = useState<Record<string, number>>(feeStructure);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');

  // Add new class form state
  const [newClassName, setNewClassName] = useState('');
  const [newClassFee, setNewClassFee] = useState<number | ''>('');
  const [classMessage, setClassMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Sync fees state when feeStructure or classList changes
  useEffect(() => {
    setFees(feeStructure);
  }, [feeStructure]);

  const handleAddNewClass = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newClassName.trim().toUpperCase();
    if (!name) {
      setClassMessage({ text: 'Please enter a valid class name.', type: 'error' });
      return;
    }
    const baseFee = Number(newClassFee) || 0;
    const success = addClass(name, baseFee);
    if (success) {
      setFees(prev => ({ ...prev, [name]: baseFee }));
      setNewClassName('');
      setNewClassFee('');
      setClassMessage({ text: `Class ${name} added successfully!`, type: 'success' });
      setTimeout(() => setClassMessage(null), 3000);
    } else {
      setClassMessage({ text: `Class ${name} already exists.`, type: 'error' });
      setTimeout(() => setClassMessage(null), 3000);
    }
  };

  const handleDeleteClass = (className: string) => {
    const enrolledCount = students.filter(s => s.standard === className).length;
    if (enrolledCount > 0) {
      alert(`Cannot delete Class ${className}: There are ${enrolledCount} student(s) currently enrolled. Please reassign them first.`);
      return;
    }
    if (classList.length <= 1) {
      alert('The school must have at least one active class.');
      return;
    }
    if (window.confirm(`Are you sure you want to remove Class ${className}?`)) {
      const success = deleteClass(className);
      if (success) {
        setClassMessage({ text: `Class ${className} removed.`, type: 'success' });
        setTimeout(() => setClassMessage(null), 3000);
      }
    }
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolInfo(formData);
    classList.forEach(std => {
      updateFeeStructure(std, Number(fees[std]) || 0);
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDatabaseJson(content);
      if (success) {
        setImportStatus('Database successfully restored from JSON!');
        setTimeout(() => setImportStatus(''), 3000);
      } else {
        setImportStatus('Invalid JSON backup file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImportStatus('Please choose an image file for the school logo.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImportStatus('Logo image must be smaller than 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({ ...prev, logoUrl: event.target?.result as string }));
      setImportStatus('Logo ready. Save All Configurations to apply it.');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-[#E2E8E2] shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#2D312E] flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#4F6D7A]" />
            School Office Configuration & Fee Structure
          </h2>
          <p className="text-xs text-[#6B7280]">
            Configure standard tuition fees, official UPI GPay ID, and backup records
          </p>
        </div>

        {saveSuccess && (
          <span className="flex items-center gap-1 text-xs font-bold text-[#4F6D7A] bg-[#89A894]/20 px-3 py-1.5 rounded-lg border border-[#89A894]/30 animate-in fade-in">
            <Check className="w-4 h-4 text-[#89A894]" />
            Saved Changes!
          </span>
        )}
      </div>

      <form onSubmit={handleSaveInfo} className="space-y-6">
        
        {/* Standard-wise Base Fees & Class Management Configuration */}
        <div className="bg-white rounded-xl border border-[#E2E8E2] p-5 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E2E8E2]/70 pb-3 gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#2D312E] flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#4F6D7A]" />
                Classes & Standard Base Tuition Fees
              </h3>
              <p className="text-xs text-[#6B7280]">
                Add new classes, update annual fees, and manage school grade standards
              </p>
            </div>
            <span className="text-[11px] font-bold text-[#4F6D7A] bg-[#89A894]/15 px-2.5 py-1 rounded border border-[#89A894]/30 w-fit">
              {classList.length} Classes Configured
            </span>
          </div>

          {/* Inline Add New Class Bar */}
          <div className="bg-[#F2F4F2]/70 border border-[#E2E8E2] rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2D312E] flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[#4F6D7A]" />
                Add New Class to School
              </span>
              {classMessage && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                  classMessage.type === 'success' ? 'bg-[#89A894]/30 text-[#4F6D7A]' : 'bg-rose-100 text-rose-700'
                }`}>
                  {classMessage.text}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <input
                type="text"
                placeholder="Class Name (e.g. PRE-KG, 6STD, PLAYGROUP)"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className="flex-1 min-w-[160px] px-3 py-1.5 border border-[#E2E8E2] rounded-lg bg-white text-[#2D312E] font-bold outline-hidden focus:ring-1 focus:ring-[#89A894]"
              />
              <div className="relative w-36">
                <span className="absolute left-2.5 top-1.5 text-[#6B7280] font-semibold">₹</span>
                <input
                  type="number"
                  placeholder="Base Fee"
                  value={newClassFee}
                  onChange={(e) => setNewClassFee(e.target.value === '' ? '' : Number(e.target.value))}
                  min="0"
                  className="w-full pl-6 pr-2 py-1.5 border border-[#E2E8E2] rounded-lg bg-white font-mono font-bold text-[#4F6D7A] outline-hidden focus:ring-1 focus:ring-[#89A894]"
                />
              </div>
              <button
                type="button"
                onClick={handleAddNewClass}
                className="flex items-center gap-1 px-4 py-1.5 bg-[#4F6D7A] hover:bg-[#415A65] text-white font-bold rounded-lg text-xs transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Class</span>
              </button>
            </div>
          </div>

          {/* Grid of All Configured Classes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 text-xs">
            {classList.map((std) => {
              const enrolledCount = students.filter(s => s.standard === std).length;
              return (
                <div key={std} className="bg-[#F2F4F2] border border-[#E2E8E2] rounded-xl p-3 flex flex-col justify-between space-y-2 hover:border-[#89A894]/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-[#2D312E] uppercase">
                      Class {std}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] bg-white text-[#6B7280] font-bold px-1.5 py-0.5 rounded border border-[#E2E8E2] flex items-center gap-0.5">
                        <Users className="w-2.5 h-2.5" />
                        {enrolledCount}
                      </span>
                      {classList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteClass(std)}
                          className="p-1 text-[#6B7280] hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title={enrolledCount > 0 ? `Cannot delete: ${enrolledCount} students enrolled` : `Delete Class ${std}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#6B7280] uppercase mb-1">
                      Annual Tuition Fee
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-[#6B7280] font-semibold">₹</span>
                      <input
                        type="number"
                        value={fees[std] ?? 0}
                        onChange={(e) => setFees(prev => ({ ...prev, [std]: Number(e.target.value) || 0 }))}
                        className="w-full pl-6 pr-2 py-1.5 font-mono font-bold text-[#4F6D7A] border border-[#E2E8E2] rounded-lg bg-white focus:ring-2 focus:ring-[#89A894] outline-hidden text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#6B7280] pt-1 border-t border-[#E2E8E2]/60">
                    <span>Formatted:</span>
                    <strong className="text-[#2D312E] font-mono">{formatCurrency(fees[std] ?? 0)}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* School Details & Admin Credentials */}
        <div className="bg-white rounded-xl border border-[#E2E8E2] p-5 shadow-xs space-y-4">
          <div className="border-b border-[#E2E8E2]/70 pb-3">
            <h3 className="text-sm font-bold text-[#2D312E] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#4F6D7A]" />
              School Administration & Official Contacts
            </h3>
            <p className="text-xs text-[#6B7280]">Printed on official fee receipts, slips, and cards</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2 flex flex-wrap items-center gap-4 rounded-xl border border-[#E2E8E2] bg-[#F2F4F2]/70 p-3">
              <img
                src={formData.logoUrl || '/school_logo.jpg'}
                alt="School logo preview"
                className="h-16 w-16 rounded-full border-2 border-[#89A894] bg-white object-cover"
              />
              <div className="min-w-[180px] flex-1">
                <label className="block font-bold text-[#2D312E] mb-1">School Logo</label>
                <p className="text-[10px] text-[#6B7280] mb-2">Upload a JPG, PNG, or WebP image up to 2 MB.</p>
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E2E8E2] bg-white px-3 py-1.5 text-[11px] font-bold text-[#4F6D7A] shadow-2xs hover:bg-[#F7F8F6]">
                  <Upload className="h-3.5 w-3.5" />
                  Choose Logo
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#2D312E] mb-1">School Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] text-[#2D312E] font-semibold outline-hidden focus:bg-white focus:ring-2 focus:ring-[#89A894]"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-[#2D312E] mb-1">School Tagline / Motto</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                className="w-full border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] text-[#2D312E] font-semibold italic outline-hidden focus:bg-white focus:ring-2 focus:ring-[#89A894]"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-[#2D312E] mb-1">Academic Year</label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                placeholder="2026-2027"
                pattern="[0-9]{4}[-/][0-9]{4}"
                className="w-full border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] text-[#2D312E] font-bold outline-hidden focus:bg-white focus:ring-2 focus:ring-[#89A894]"
                required
              />
              <span className="text-[10px] text-[#6B7280] mt-1 block">Used in reports, fee records, and school branding.</span>
            </div>

            <div>
              <label className="block font-bold text-[#2D312E] mb-1">Office Admin Name</label>
              <input
                type="text"
                value={formData.adminName}
                onChange={(e) => setFormData(prev => ({ ...prev, adminName: e.target.value }))}
                className="w-full border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] font-bold text-[#4F6D7A] outline-hidden focus:bg-white focus:ring-2 focus:ring-[#89A894]"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-[#2D312E] mb-1">Official Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] text-[#2D312E] font-mono outline-hidden focus:bg-white focus:ring-2 focus:ring-[#89A894]"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-[#2D312E] mb-1">Official School Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] text-[#2D312E] outline-hidden focus:bg-white focus:ring-2 focus:ring-[#89A894]"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-[#2D312E] mb-1">School Location / Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] text-[#2D312E] font-medium outline-hidden focus:bg-white focus:ring-2 focus:ring-[#89A894]"
                required
              />
            </div>
          </div>
        </div>

        {/* UPI & GPay Payment Configuration */}
        <div className="bg-white rounded-xl border border-[#E2E8E2] p-5 shadow-xs space-y-4">
          <div className="border-b border-[#E2E8E2]/70 pb-3">
            <h3 className="text-sm font-bold text-[#2D312E] flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#89A894]" />
              Google Pay & UPI Payment Credentials
            </h3>
            <p className="text-xs text-[#6B7280]">Live dynamic QR codes generate using these details</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[#2D312E] mb-1">UPI VPA ID</label>
              <input
                type="text"
                value={formData.upiId}
                onChange={(e) => setFormData(prev => ({ ...prev, upiId: e.target.value }))}
                className="w-full border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] font-mono font-bold text-[#4F6D7A] outline-hidden focus:bg-white focus:ring-2 focus:ring-[#89A894]"
                required
              />
              <span className="text-[10px] text-[#6B7280] mt-1 block">Default: rsaravanan102002-1@okhdfcbank</span>
            </div>

            <div>
              <label className="block font-bold text-[#2D312E] mb-1">GPay Mobile Number</label>
              <input
                type="text"
                value={formData.gpayPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, gpayPhone: e.target.value }))}
                className="w-full border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] font-mono font-bold text-[#4F6D7A] outline-hidden focus:bg-white focus:ring-2 focus:ring-[#89A894]"
                required
              />
              <span className="text-[10px] text-[#6B7280] mt-1 block">Default: 9176593129</span>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-[#4F6D7A] hover:bg-[#415A65] text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save All Configurations</span>
          </button>
        </div>

      </form>

      {/* Database Backup & Disaster Recovery */}
      <div className="bg-[#F2F4F2] border border-[#E2E8E2] rounded-xl p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[#2D312E]">Database Backup & Recovery</h3>
          <p className="text-xs text-[#6B7280]">
            Export all student records, receipts, and configurations as JSON or restore anytime
          </p>
        </div>

        {importStatus && (
          <div className="text-xs p-2.5 bg-[#89A894]/20 border border-[#89A894]/40 text-[#4F6D7A] rounded-lg font-semibold">
            {importStatus}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={exportDatabaseJson}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#F7F8F6] text-[#2D312E] font-bold rounded-lg text-xs border border-[#E2E8E2] shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-[#4F6D7A]" />
            <span>Export Database JSON Backup</span>
          </button>

          <label className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#F7F8F6] text-[#2D312E] font-bold rounded-lg text-xs border border-[#E2E8E2] shadow-2xs transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-[#89A894]" />
            <span>Restore From JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={resetToDefaults}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#D68A6E]/10 hover:bg-[#D68A6E]/20 text-[#D68A6E] font-bold rounded-lg text-xs border border-[#D68A6E]/30 transition-colors ml-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Records</span>
          </button>
        </div>
      </div>

    </div>
  );
};
