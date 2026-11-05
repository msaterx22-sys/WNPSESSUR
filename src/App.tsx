import React, { useState } from 'react';
import { SchoolProvider, useSchool } from './context/SchoolContext';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { StudentsView } from './components/StudentsView';
import { ReceiptsView } from './components/ReceiptsView';
import { ExpensesView } from './components/ExpensesView';
import { FeeCardsStudio } from './components/FeeCardsStudio';
import { BulkPdfAndWhatsAppView } from './components/BulkPdfAndWhatsAppView';
import { WhatsAppNotificationCenter } from './components/WhatsAppNotificationCenter';
import { MonthlyFinancialReports } from './components/MonthlyFinancialReports';
import { SettingsView } from './components/SettingsView';
import { ParentPortalView } from './components/ParentPortalView';
import { PaymentModal } from './components/PaymentModal';
import { FeePaidSlipModal } from './components/FeePaidSlipModal';
import { StudentModal } from './components/StudentModal';
import { OfficeLogin } from './components/OfficeLogin';
import { Student, PaymentReceipt } from './types';

interface MainContentProps {
  onLogout: () => void;
}

const MainContent: React.FC<MainContentProps> = ({ onLogout }) => {
  const { userRole, activeTab, setActiveTab } = useSchool();

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<Student | null>(null);

  const [activeReceiptForSlip, setActiveReceiptForSlip] = useState<PaymentReceipt | null>(null);

  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

  const handleOpenPayment = (student?: Student) => {
    setSelectedStudentForPayment(student || null);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (receipt: PaymentReceipt) => {
    setIsPaymentModalOpen(false);
    setSelectedStudentForPayment(null);
    setActiveReceiptForSlip(receipt);
  };

  const handleOpenAddNewStudent = () => {
    setStudentToEdit(null);
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (student: Student) => {
    setStudentToEdit(student);
    setIsStudentModalOpen(true);
  };

  const handleStudentSaved = () => {
    setIsStudentModalOpen(false);
    setStudentToEdit(null);
  };

  const handleViewFeeCard = (student: Student) => {
    setActiveTab('feecards');
  };

  return (
    <div className="flex min-h-screen flex-col bg-transparent font-sans text-[#2D312E] selection:bg-[#89A894]/30 selection:text-[#2D312E]">
      <Header onLogout={onLogout} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-5 sm:px-6 sm:py-7 lg:px-8">
        {userRole === 'parent' ? (
          <ParentPortalView 
            onViewReceipt={(receipt) => setActiveReceiptForSlip(receipt)}
            onViewFeeCard={handleViewFeeCard}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                onCollectPayment={handleOpenPayment}
                onViewReceipt={(receipt) => setActiveReceiptForSlip(receipt)}
                onAddNewStudent={handleOpenAddNewStudent}
                onViewFeeCard={handleViewFeeCard}
              />
            )}

            {activeTab === 'students' && (
              <StudentsView
                onAddNewStudent={handleOpenAddNewStudent}
                onEditStudent={handleOpenEditStudent}
                onCollectPayment={handleOpenPayment}
                onViewFeeCard={handleViewFeeCard}
              />
            )}

            {activeTab === 'payments' && (
              <ReceiptsView
                onViewReceipt={(receipt) => setActiveReceiptForSlip(receipt)}
                onNewPayment={() => handleOpenPayment()}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpensesView />
            )}

            {activeTab === 'feecards' && (
              <FeeCardsStudio />
            )}

            {activeTab === 'bulk' && (
              <BulkPdfAndWhatsAppView />
            )}

            {activeTab === 'whatsapp' && (
              <WhatsAppNotificationCenter />
            )}

            {(activeTab === 'reports' ||
              activeTab === 'fee-conveyance' ||
              activeTab === 'attendance' ||
              activeTab === 'exam' ||
              activeTab === 'staff' ||
              activeTab === 'library' ||
              activeTab === 'inventory' ||
              activeTab === 'payroll' ||
              activeTab === 'cash-audit') && (
              <MonthlyFinancialReports 
                initialDomain={activeTab === 'reports' ? 'fee-conveyance' : activeTab} 
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      {isPaymentModalOpen && (
        <PaymentModal
          initialStudent={selectedStudentForPayment}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedStudentForPayment(null);
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {activeReceiptForSlip && (
        <FeePaidSlipModal
          receipt={activeReceiptForSlip}
          onClose={() => setActiveReceiptForSlip(null)}
        />
      )}

      {isStudentModalOpen && (
        <StudentModal
          studentToEdit={studentToEdit}
          onClose={() => {
            setIsStudentModalOpen(false);
            setStudentToEdit(null);
          }}
          onSuccess={handleStudentSaved}
        />
      )}

      {/* Simple Footer (hidden on print) */}
      <footer className="no-print mt-8 border-t border-[#E2E8E2] bg-white/80 px-6 py-5 text-center text-xs text-[#6B7280] backdrop-blur">
        <p>
          <strong className="text-[#2D312E]">Wisdom Nursery and Primary School</strong> • Essur - 603301, Tamil Nadu • Office Admin: <strong className="text-[#2D312E]">R. SARAVANAN</strong> (+91 9176593129)
        </p>
        <p className="text-[11px] text-[#89A894] font-medium mt-0.5">
          UPI ID: rsaravanan102002-1@okhdfcbank • Learn Today, Lead Tomorrow
        </p>
      </footer>
    </div>
  );
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => (
    sessionStorage.getItem('wisdom_admin_authenticated') === 'true'
  ));

  const handleLogout = () => {
    sessionStorage.removeItem('wisdom_admin_authenticated');
    setIsAuthenticated(false);
  };

  return (
    <SchoolProvider>
      {isAuthenticated ? (
        <MainContent onLogout={handleLogout} />
      ) : (
        <OfficeLogin onLogin={() => setIsAuthenticated(true)} />
      )}
    </SchoolProvider>
  );
}
