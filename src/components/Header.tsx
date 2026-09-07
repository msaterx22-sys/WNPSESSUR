import React from 'react';
import { useSchool } from '../context/SchoolContext';
import { 
  Phone, 
  MessageSquare, 
  QrCode, 
  ShieldCheck, 
  UserCheck, 
  LayoutDashboard, 
  Users, 
  Receipt, 
  CreditCard, 
  FileSpreadsheet, 
  Settings, 
  Download, 
  RotateCcw,
  Wallet,
  Printer,
  Calendar,
  GraduationCap,
  BookOpen,
  Package,
  DollarSign
  ,LogOut
} from 'lucide-react';
import { ActiveTab } from '../types';

interface HeaderProps {
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const { 
    schoolInfo, 
    userRole, 
    setUserRole, 
    activeTab, 
    setActiveTab, 
    exportDatabaseJson, 
    resetToDefaults,
    activeStudentPortal,
    setActiveStudentPortal
  } = useSchool();

  const coreNavItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'students', label: 'Student Records', icon: <Users className="w-4 h-4" /> },
    { id: 'payments', label: 'Fee Slips & Receipts', icon: <Receipt className="w-4 h-4" /> },
    { id: 'feecards', label: 'Fee & Van Cards', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'expenses', label: 'School Expenses', icon: <Wallet className="w-4 h-4" /> },
    { id: 'bulk', label: 'Bulk PDF & Print', icon: <Printer className="w-4 h-4" /> },
    { id: 'whatsapp', label: 'WhatsApp Alerts', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const reportNavItems: { id: ActiveTab; label: string; badge?: string; icon: React.ReactNode }[] = [
    { id: 'fee-conveyance', label: 'Fee & Conveyance', icon: <Wallet className="w-3.5 h-3.5" /> },
    { id: 'attendance', label: 'Attendance', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'exam', label: 'Exam', icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { id: 'staff', label: 'Staff', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'library', label: 'Library', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'inventory', label: 'Inventory', icon: <Package className="w-3.5 h-3.5" /> },
    { id: 'payroll', label: 'Salary & Payroll', icon: <DollarSign className="w-3.5 h-3.5" /> },
    { id: 'cash-audit', label: 'Cash & Audit Register (Daily)', badge: 'Daily', icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="no-print bg-[#FDFDFB] border-b border-[#E2E8E2] sticky top-0 z-30 shadow-xs">
      {/* Top emergency contact & admin bar */}
      <div className="bg-[#2D312E] text-white text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium text-[#D68A6E]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D68A6E]" />
            Admin: {schoolInfo.adminName}
          </span>
          <span className="text-[#6B7280]">|</span>
          <a 
            href={`tel:${schoolInfo.phone}`} 
            className="flex items-center gap-1 hover:text-[#89A894] transition-colors"
            title="Click to call Admin Office"
          >
            <Phone className="w-3 h-3 text-[#89A894]" />
            {schoolInfo.phone}
          </a>
          <span className="text-[#6B7280] hidden sm:inline">|</span>
          <span className="hidden sm:inline text-neutral-300">
            {schoolInfo.email}
          </span>
          <span className="text-[#6B7280] hidden md:inline">|</span>
          <span className="hidden md:flex items-center gap-1 text-neutral-300">
            <QrCode className="w-3 h-3 text-[#89A894]" />
            UPI / GPay: <span className="font-mono text-[#D68A6E] font-semibold">{schoolInfo.upiId}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportDatabaseJson}
            className="flex items-center gap-1 bg-[#3A3F3B] hover:bg-[#474D48] text-neutral-200 px-2 py-0.5 rounded text-xs transition-colors border border-[#4F6D7A]/30"
            title="Download JSON data backup"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Backup</span>
          </button>
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-1 bg-[#3A3F3B] hover:bg-[#D68A6E]/30 text-neutral-300 hover:text-[#D68A6E] px-2 py-0.5 rounded text-xs transition-colors border border-[#4F6D7A]/30"
            title="Reset to default demo data"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1 bg-[#3A3F3B] hover:bg-[#D68A6E]/30 text-neutral-300 hover:text-[#D68A6E] px-2 py-0.5 rounded text-xs transition-colors border border-[#4F6D7A]/30"
            title="Sign out of the school office"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden sm:inline">Logout</span>
          </button>

          {/* Portal Switcher */}
          <div className="flex bg-[#1E2220] p-0.5 rounded-md border border-[#3A3F3B]">
            <button
              onClick={() => {
                setUserRole('admin');
                setActiveStudentPortal(null);
              }}
              className={`px-2.5 py-0.5 rounded text-xs font-medium transition-all ${
                userRole === 'admin'
                  ? 'bg-[#4F6D7A] text-white shadow-xs'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              School Office
            </button>
            <button
              onClick={() => {
                setUserRole('parent');
              }}
              className={`px-2.5 py-0.5 rounded text-xs font-medium transition-all ${
                userRole === 'parent'
                  ? 'bg-[#89A894] text-white shadow-xs'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              Parent Portal
            </button>
          </div>
        </div>
      </div>

      {/* Main School Brand Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img 
                src={schoolInfo.logoUrl || '/school_logo.jpg'} 
                alt="Wisdom Nursery and Primary School Seal" 
                className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-[#89A894] shadow-xs object-cover bg-white"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-[#2D312E]">
                  {schoolInfo.name}
                </h1>
                <span className="bg-[#89A894]/15 text-[#4F6D7A] text-[11px] font-bold px-2 py-0.5 rounded-full border border-[#89A894]/30">
                  Essur - 603301
                </span>
              </div>
              <p className="text-xs text-[#6B7280] font-medium tracking-wide">
                {schoolInfo.address} • <span className="italic text-[#4F6D7A] font-semibold">{schoolInfo.tagline}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            <a
              href={`tel:${schoolInfo.phone}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F2F4F2] hover:bg-[#E2E8E2] text-[#2D312E] border border-[#E2E8E2] rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#4F6D7A]" />
              <span>Call Office</span>
            </a>
            <a
              href={`https://wa.me/919176593129?text=${encodeURIComponent('Hello Wisdom School Office Admin R. Saravanan, I have a fee enquiry.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#89A894] hover:bg-[#789683] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Admin</span>
            </a>
          </div>
        </div>

        {/* Navigation Tabs for Admin */}
        {userRole === 'admin' && (
          <div className="mt-3 pt-2 border-t border-[#E2E8E2] space-y-1.5">
            {/* Primary Operations Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B7280] pr-1 select-none hidden lg:inline">
                Operations:
              </span>
              {coreNavItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#4F6D7A] text-white shadow-xs'
                        : 'text-[#2D312E]/80 hover:bg-[#F2F4F2] hover:text-[#2D312E]'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Reports & Registers Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none bg-[#F2F4F2]/70 p-1 rounded-lg border border-[#E2E8E2]/70">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#4F6D7A] px-1.5 select-none whitespace-nowrap flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Reports:
              </span>
              {reportNavItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#4F6D7A] text-white shadow-xs'
                        : 'bg-white text-[#2D312E] hover:bg-white/80 border border-[#E2E8E2]/60'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-[#89A894]/20 text-[#4F6D7A]'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Parent Portal Info Header */}
        {userRole === 'parent' && (
          <div className="mt-2 pt-2 border-t border-[#E2E8E2] flex items-center justify-between text-xs text-[#6B7280]">
            <span className="flex items-center gap-1 font-semibold text-[#4F6D7A]">
              <UserCheck className="w-4 h-4 text-[#89A894]" />
              Student & Parent Self-Service Portal
            </span>
            <span>
              Search your child's record, download fee slips, or pay via Google Pay
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
