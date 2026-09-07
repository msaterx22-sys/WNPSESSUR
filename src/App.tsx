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
import { Student, PaymentReceipt } from './types';

const MainContent: React.FC = () => {
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
    <div className="min-h-screen bg-[#F7F8F6] text-[#2D312E] flex flex-col font-sans selection:bg-[#89A894]/30 selection:text-[#2D312E]">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
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
      <footer className="no-print border-t border-[#E2E8E2] bg-[#FDFDFB] py-4 px-6 text-center text-xs text-[#6B7280]">
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
  return (
    <SchoolProvider>
      <MainContent />
    </SchoolProvider>
  );
}
