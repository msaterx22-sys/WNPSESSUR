import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { 
  INITIAL_INVENTORY_STOCK, 
  INITIAL_INVENTORY_PURCHASES, 
  INITIAL_INVENTORY_ISSUES,
  InventoryItem,
  InventoryPurchase,
  InventoryIssueLog
} from '../../data/reportsData';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { generateReportTablePdf } from '../../utils/pdfGenerator';
import { 
  Package, 
  ShoppingCart, 
  FileText, 
  AlertTriangle, 
  Download, 
  Printer, 
  Search, 
  CheckCircle2, 
  Layers, 
  Truck,
  Plus,
  PlusCircle,
  X,
  Check,
  Send,
  Edit2,
  Trash2,
  Save
} from 'lucide-react';

interface InventoryReportsProps {
  onExportCsv: (filename: string, headers: string[], rows: (string | number)[][]) => void;
}

export const InventoryReports: React.FC<InventoryReportsProps> = ({ onExportCsv }) => {
  const { schoolInfo } = useSchool();
  const [subTab, setSubTab] = useState<'current' | 'purchases' | 'issues' | 'reorder'>('current');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [stockList, setStockList] = useState<InventoryItem[]>(INITIAL_INVENTORY_STOCK);
  const [purchasesList, setPurchasesList] = useState<InventoryPurchase[]>(INITIAL_INVENTORY_PURCHASES);
  const [issuesList, setIssuesList] = useState<InventoryIssueLog[]>(INITIAL_INVENTORY_ISSUES);

  // Inward Purchase Modal State
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState<boolean>(false);
  const [purchaseInvoiceNo, setPurchaseInvoiceNo] = useState<string>('');
  const [purchaseVendor, setPurchaseVendor] = useState<string>('');
  const [purchaseItemCode, setPurchaseItemCode] = useState<string>(INITIAL_INVENTORY_STOCK[0]?.itemCode || '');
  const [purchaseQty, setPurchaseQty] = useState<number>(50);
  const [purchaseRate, setPurchaseRate] = useState<number>(45);
  const [purchaseMode, setPurchaseMode] = useState<string>('Bank Transfer / NEFT');

  // Issue Stock Modal State
  const [isIssueModalOpen, setIsIssueModalOpen] = useState<boolean>(false);
  const [issueItemCode, setIssueItemCode] = useState<string>(INITIAL_INVENTORY_STOCK[0]?.itemCode || '');
  const [issueQty, setIssueQty] = useState<number>(5);
  const [issuedToDept, setIssuedToDept] = useState<string>('Primary Classes (1–5 STD)');
  const [recipientPerson, setRecipientPerson] = useState<string>('Class Teacher');
  const [issuePurpose, setIssuePurpose] = useState<string>('Daily Classroom Instruction');

  // Edit / Add Item State
  const [editingStockItem, setEditingStockItem] = useState<InventoryItem | null>(null);
  const [isAddingStockItem, setIsAddingStockItem] = useState<boolean>(false);

  // Edit Purchase State
  const [editingPurchase, setEditingPurchase] = useState<InventoryPurchase | null>(null);

  // Edit Issue Log State
  const [editingIssueLog, setEditingIssueLog] = useState<InventoryIssueLog | null>(null);

  const handleDeleteStockItem = (itemId: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete inventory item "${name}" (${itemId})?`)) {
      setStockList(prev => prev.filter(i => i.itemId !== itemId));
    }
  };

  const handleSaveStockItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStockItem) return;
    const valuation = Number(editingStockItem.currentStock) * Number(editingStockItem.unitCost);
    const updated = { ...editingStockItem, totalValuation: valuation };
    if (isAddingStockItem) {
      setStockList(prev => [updated, ...prev]);
    } else {
      setStockList(prev => prev.map(i => i.itemId === updated.itemId ? updated : i));
    }
    setEditingStockItem(null);
    setIsAddingStockItem(false);
  };

  const handleDeletePurchase = (purchaseId: string, invoiceNo: string) => {
    if (window.confirm(`Are you sure you want to delete purchase record ${purchaseId} (${invoiceNo})?`)) {
      setPurchasesList(prev => prev.filter(p => p.purchaseId !== purchaseId));
    }
  };

  const handleSaveEditPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPurchase) return;
    setPurchasesList(prev => prev.map(p => p.purchaseId === editingPurchase.purchaseId ? editingPurchase : p));
    setEditingPurchase(null);
  };

  const handleDeleteIssueLog = (issueId: string, itemName: string) => {
    if (window.confirm(`Are you sure you want to delete issue record ${issueId} for "${itemName}"?`)) {
      setIssuesList(prev => prev.filter(l => l.issueId !== issueId));
    }
  };

  const handleSaveEditIssueLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIssueLog) return;
    setIssuesList(prev => prev.map(l => l.issueId === editingIssueLog.issueId ? editingIssueLog : l));
    setEditingIssueLog(null);
  };

  // PDF Export
  const handleExportPdf = () => {
    if (subTab === 'current') {
      const headers = ['Item Code', 'Item Name', 'Category', 'Current Stock', 'Unit', 'Safety Level', 'Unit Cost', 'Total Valuation', 'Location'];
      const rows = filteredStock.map(i => [
        i.itemCode,
        i.name,
        i.category,
        i.currentStock,
        i.unit,
        i.reorderLevel,
        formatCurrency(i.unitCost),
        formatCurrency(i.totalValuation),
        i.location,
      ]);
      rows.push(['Total Stock Valuation', '', '', '', '', '', '', formatCurrency(totalStockValuation), '']);
      const doc = generateReportTablePdf('Inventory Stock & Valuation Register', `Category: ${categoryFilter === 'all' ? 'All Categories' : categoryFilter}`, headers, rows, schoolInfo);
      doc.save('Inventory_Stock_Report.pdf');
    } else if (subTab === 'purchases') {
      const headers = ['PO #', 'Invoice #', 'Date', 'Vendor', 'Items Description', 'Qty', 'Total Cost', 'Payment Mode'];
      const rows = purchasesList.map(p => [
        p.purchaseId,
        p.invoiceNo,
        p.purchaseDate,
        p.vendorName,
        p.itemsDescription,
        p.totalQuantity,
        formatCurrency(p.totalCost),
        p.paymentMode,
      ]);
      rows.push(['Total Procurement Spend', '', '', '', '', '', formatCurrency(totalPurchasesAmount), '']);
      const doc = generateReportTablePdf('Inventory Procurement & Invoicing Register', `Total Invoices: ${purchasesList.length}`, headers, rows, schoolInfo);
      doc.save('Inventory_Purchases_Report.pdf');
    } else if (subTab === 'issues') {
      const headers = ['Issue #', 'Date', 'Item Description', 'Qty Issued', 'Issued To Dept', 'Recipient', 'Purpose'];
      const rows = issuesList.map(l => [
        l.issueId,
        l.date,
        l.itemName,
        l.quantity,
        l.issuedTo,
        l.recipientPerson,
        l.purpose,
      ]);
      const doc = generateReportTablePdf('Store Material Distribution Register', `Total Distributions: ${issuesList.length}`, headers, rows, schoolInfo);
      doc.save('Inventory_Distribution_Ledger.pdf');
    } else {
      const headers = ['Item Code', 'Item Name', 'Category', 'Current Stock', 'Safety Level', 'Reorder Qty', 'Unit Cost', 'Estimated Cost'];
      const rows = reorderItems.map(i => {
        const orderQty = Math.max(1, (i.reorderLevel * 2) - i.currentStock);
        const orderCost = orderQty * i.unitCost;
        return [
          i.itemCode,
          i.name,
          i.category,
          `${i.currentStock} ${i.unit}`,
          `${i.reorderLevel} ${i.unit}`,
          `+${orderQty} ${i.unit}`,
          formatCurrency(i.unitCost),
          formatCurrency(orderCost),
        ];
      });
      rows.push(['Total Budget Required', '', '', '', '', '', '', formatCurrency(reorderDeficitBudget)]);
      const doc = generateReportTablePdf('Low Stock & Reorder Advisory Schedule', `Total Urgent Items: ${reorderItems.length}`, headers, rows, schoolInfo);
      doc.save('Inventory_Reorder_Alerts.pdf');
    }
  };

  // Handle Record Purchase
  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const item = stockList.find(s => s.itemCode === purchaseItemCode);
    const dateStr = new Date().toISOString().split('T')[0];
    const totalCost = Number(purchaseQty) * Number(purchaseRate);

    const newPurchase: InventoryPurchase = {
      purchaseId: `PO-2024-${100 + purchasesList.length + 1}`,
      invoiceNo: purchaseInvoiceNo.trim() || `INV-${Date.now().toString().slice(-4)}`,
      purchaseDate: dateStr,
      vendorName: purchaseVendor.trim() || (item ? item.supplier : 'Standard Supplier'),
      itemsDescription: `${item ? item.name : 'School Supplies'} (${purchaseQty} units @ ₹${purchaseRate})`,
      totalQuantity: Number(purchaseQty),
      totalCost,
      paymentMode: purchaseMode,
      receivedBy: 'R. Saravanan (Admin)',
    };

    setPurchasesList(prev => [newPurchase, ...prev]);
    // Increase stock
    setStockList(prev => prev.map(s => {
      if (s.itemCode === purchaseItemCode) {
        const newCurrent = s.currentStock + Number(purchaseQty);
        return {
          ...s,
          currentStock: newCurrent,
          totalValuation: newCurrent * s.unitCost,
        };
      }
      return s;
    }));

    setIsPurchaseModalOpen(false);
    setPurchaseInvoiceNo('');
    setPurchaseVendor('');
  };

  // Handle Issue Material
  const handleSaveIssue = (e: React.FormEvent) => {
    e.preventDefault();
    const item = stockList.find(s => s.itemCode === issueItemCode);
    if (!item) return;

    if (item.currentStock < Number(issueQty)) {
      alert(`Cannot issue ${issueQty} units! Current stock is only ${item.currentStock} ${item.unit}.`);
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const newIssue: InventoryIssueLog = {
      issueId: `LOG-2024-${200 + issuesList.length + 1}`,
      date: dateStr,
      itemName: item.name,
      quantity: Number(issueQty),
      issuedTo: issuedToDept.trim(),
      recipientPerson: recipientPerson.trim(),
      purpose: issuePurpose.trim(),
    };

    setIssuesList(prev => [newIssue, ...prev]);
    // Decrease stock
    setStockList(prev => prev.map(s => {
      if (s.itemCode === issueItemCode) {
        const newCurrent = Math.max(0, s.currentStock - Number(issueQty));
        return {
          ...s,
          currentStock: newCurrent,
          totalValuation: newCurrent * s.unitCost,
        };
      }
      return s;
    }));

    setIsIssueModalOpen(false);
  };

  // Statistics
  const totalStockItems = stockList.length;
  const totalStockValuation = stockList.reduce((sum, item) => sum + item.totalValuation, 0);
  const totalPurchasesAmount = purchasesList.reduce((sum, p) => sum + p.totalCost, 0);
  const reorderItems = stockList.filter(i => i.currentStock <= i.reorderLevel);
  const reorderDeficitBudget = reorderItems.reduce((sum, i) => sum + ((i.reorderLevel * 2 - i.currentStock) * i.unitCost), 0);

  // Filtered Stock
  const filteredStock = stockList.filter(i => {
    const matchesCategory = categoryFilter === 'all' || i.category === categoryFilter;
    const matchesSearch = 
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.itemCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleExport = () => {
    if (subTab === 'current') {
      const headers = ['Item Code', 'Item Name', 'Category', 'Current Stock', 'Unit', 'Reorder Level', 'Unit Cost', 'Total Valuation', 'Location', 'Supplier'];
      const rows = filteredStock.map(i => [
        i.itemCode,
        `"${i.name}"`,
        `"${i.category}"`,
        i.currentStock,
        i.unit,
        i.reorderLevel,
        i.unitCost,
        i.totalValuation,
        `"${i.location}"`,
        `"${i.supplier}"`,
      ]);
      onExportCsv('Current_Inventory_Stock_Report', headers, rows);
    } else if (subTab === 'purchases') {
      const headers = ['Purchase ID', 'Invoice No', 'Date', 'Vendor Name', 'Items Description', 'Quantity', 'Total Amount', 'Payment Mode', 'Received By'];
      const rows = purchasesList.map(p => [
        p.purchaseId,
        p.invoiceNo,
        p.purchaseDate,
        `"${p.vendorName}"`,
        `"${p.itemsDescription}"`,
        p.totalQuantity,
        p.totalCost,
        p.paymentMode,
        `"${p.receivedBy}"`,
      ]);
      onExportCsv('Inventory_Purchases_and_Valuation_Report', headers, rows);
    } else if (subTab === 'issues') {
      const headers = ['Issue ID', 'Date', 'Item Name', 'Quantity', 'Issued To', 'Recipient', 'Purpose'];
      const rows = issuesList.map(l => [
        l.issueId,
        l.date,
        `"${l.itemName}"`,
        l.quantity,
        `"${l.issuedTo}"`,
        `"${l.recipientPerson}"`,
        `"${l.purpose}"`,
      ]);
      onExportCsv('Inventory_Issues_Distribution_Ledger', headers, rows);
    } else {
      const headers = ['Item Code', 'Item Name', 'Category', 'Current Stock', 'Reorder Level', 'Unit', 'Deficit', 'Unit Cost', 'Reorder Budget'];
      const rows = reorderItems.map(i => [
        i.itemCode,
        `"${i.name}"`,
        `"${i.category}"`,
        i.currentStock,
        i.reorderLevel,
        i.unit,
        Math.max(1, (i.reorderLevel * 2) - i.currentStock),
        i.unitCost,
        Math.max(1, (i.reorderLevel * 2) - i.currentStock) * i.unitCost,
      ]);
      onExportCsv('Inventory_Reorder_and_Low_Stock_Advisory', headers, rows);
    }
  };

  return (
    <div className="space-y-5">
      {/* Sub-Tabs Selector & Action Bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-[#F2F4F2] p-2 rounded-xl border border-[#E2E8E2]">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSubTab('current')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'current' ? 'bg-[#4F6D7A] text-white shadow-xs' : 'text-[#2D312E] hover:bg-white/80'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Current Stock ({stockList.length})</span>
          </button>
          <button
            onClick={() => setSubTab('purchases')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'purchases' ? 'bg-[#4F6D7A] text-white shadow-xs' : 'text-[#2D312E] hover:bg-white/80'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Valuation / Purchases ({purchasesList.length})</span>
          </button>
          <button
            onClick={() => setSubTab('issues')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'issues' ? 'bg-[#4F6D7A] text-white shadow-xs' : 'text-[#2D312E] hover:bg-white/80'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Issue History ({issuesList.length})</span>
          </button>
          <button
            onClick={() => setSubTab('reorder')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'reorder' ? 'bg-[#4F6D7A] text-white shadow-xs' : 'text-[#2D312E] hover:bg-white/80'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Reorder Alerts ({reorderItems.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* New Interactive Actions */}
          <button
            onClick={() => setIsPurchaseModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#89A894] hover:bg-[#789683] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Inward Stock</span>
          </button>

          <button
            onClick={() => setIsIssueModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4F6D7A] hover:bg-[#415A65] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Issue Supplies</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#89A894] hover:bg-[#789683] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2E8E2] hover:bg-gray-50 text-[#2D312E] text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#4F6D7A]" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2D312E] hover:bg-black text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] font-medium block">Total Stock Asset Valuation</span>
          <span className="text-base font-extrabold text-[#2D312E] font-mono mt-0.5 block">{formatCurrency(totalStockValuation)}</span>
          <span className="text-[10px] text-[#6B7280] mt-1 block">{totalStockItems} SKUs in Store Rooms</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] font-medium block">Year Procurement Spend</span>
          <span className="text-base font-extrabold text-[#4F6D7A] font-mono mt-0.5 block">{formatCurrency(totalPurchasesAmount)}</span>
          <span className="text-[10px] text-[#4F6D7A] font-semibold mt-1 block">{purchasesList.length} Verified Inward Invoices</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] font-medium block">Reorder Stock Alerts</span>
          <span className="text-base font-extrabold text-[#D68A6E] font-mono mt-0.5 block">{reorderItems.length} Low Stock</span>
          <span className="text-[10px] text-[#D68A6E] font-semibold mt-1 block">Budget Needed: {formatCurrency(reorderDeficitBudget)}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] font-medium block">Active Store Categories</span>
          <span className="text-base font-extrabold text-[#89A894] font-mono mt-0.5 block">5 Categories</span>
          <span className="text-[10px] text-[#89A894] font-bold mt-1 block">Books, Uniforms, Kits, Spares</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CURRENT STOCK TAB                                                      */}
      {/* ========================================================================= */}
      {subTab === 'current' && (
        <div className="space-y-4">
          <div className="no-print bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-[#6B7280] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search item code, description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg text-xs focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#6B7280] font-semibold">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-bold text-[#4F6D7A]"
              >
                <option value="all">All Categories</option>
                <option value="Textbooks & Workbooks">Textbooks & Workbooks</option>
                <option value="School Uniforms">School Uniforms</option>
                <option value="Office & Classroom Stationery">Office & Classroom Stationery</option>
                <option value="Sports & Athletic Equipment">Sports & Athletic Equipment</option>
                <option value="School Van Spares & Maintenance">School Van Spares & Maintenance</option>
              </select>

              <button
                onClick={() => {
                  setEditingStockItem({
                    itemId: `ITM-2024-${100 + stockList.length + 1}`,
                    itemCode: `SKU-${100 + stockList.length + 1}`,
                    name: '',
                    category: 'Office & Classroom Stationery',
                    currentStock: 10,
                    unit: 'units',
                    reorderLevel: 5,
                    unitCost: 50,
                    totalValuation: 500,
                    location: 'Store Room Rack A',
                    supplier: 'Standard Supplies',
                  });
                  setIsAddingStockItem(true);
                }}
                className="px-3 py-1.5 bg-[#4F6D7A] hover:bg-[#415A65] text-white font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1.5 ml-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#F2F4F2] text-[#2D312E] uppercase tracking-wider font-bold border-b border-[#E2E8E2]">
                    <th className="py-2.5 px-3">Item Code</th>
                    <th className="py-2.5 px-3">Item Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Current Stock</th>
                    <th className="py-2.5 px-3 text-center">Safety Level</th>
                    <th className="py-2.5 px-3 text-right">Unit Cost</th>
                    <th className="py-2.5 px-3 text-right font-black text-[#2D312E]">Total Valuation</th>
                    <th className="py-2.5 px-3">Storage Location</th>
                    <th className="py-2.5 px-3">Primary Supplier</th>
                    <th className="no-print py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E2]/60">
                  {filteredStock.map((i) => (
                    <tr key={i.itemId} className="hover:bg-[#F7F8F6]/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#4F6D7A]">{i.itemCode}</td>
                      <td className="py-2.5 px-3 font-bold text-[#2D312E]">{i.name}</td>
                      <td className="py-2.5 px-3 text-[#6B7280]">{i.category}</td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          i.currentStock <= i.reorderLevel
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {i.currentStock} {i.unit}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[#6B7280]">{i.reorderLevel} {i.unit}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#6B7280]">{formatCurrency(i.unitCost)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2D312E]">{formatCurrency(i.totalValuation)}</td>
                      <td className="py-2.5 px-3 font-mono text-[#4F6D7A]">{i.location}</td>
                      <td className="py-2.5 px-3 text-[#6B7280] text-[11px]">{i.supplier}</td>
                      <td className="no-print py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingStockItem({ ...i });
                              setIsAddingStockItem(false);
                            }}
                            className="p-1 text-[#4F6D7A] hover:bg-[#F2F4F2] rounded transition-colors cursor-pointer"
                            title="Edit Item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStockItem(i.itemId, i.name)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PURCHASES & INWARD STOCK TAB                                           */}
      {/* ========================================================================= */}
      {subTab === 'purchases' && (
        <div className="space-y-4">
          <div className="no-print bg-white p-3 rounded-xl border border-[#E2E8E2] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-[#2D312E]">
              Inward Procurement & Invoicing Register ({purchasesList.length} Invoices Recorded)
            </span>
            <button
              onClick={() => setIsPurchaseModalOpen(true)}
              className="px-3 py-1.5 bg-[#89A894] hover:bg-[#789683] text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Record Inward Stock</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#F2F4F2] text-[#2D312E] uppercase tracking-wider font-bold border-b border-[#E2E8E2]">
                    <th className="py-2.5 px-3">PO #</th>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Vendor / Supplier</th>
                    <th className="py-2.5 px-3">Items Purchased</th>
                    <th className="py-2.5 px-3 text-center">Total Qty</th>
                    <th className="py-2.5 px-3 text-right font-black text-[#2D312E]">Total Cost</th>
                    <th className="py-2.5 px-3">Payment Mode</th>
                    <th className="py-2.5 px-3">Received By</th>
                    <th className="no-print py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E2]/60">
                  {purchasesList.map((p) => (
                    <tr key={p.purchaseId} className="hover:bg-[#F7F8F6]/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#4F6D7A]">{p.purchaseId}</td>
                      <td className="py-2.5 px-3 font-mono text-[#6B7280]">{p.invoiceNo}</td>
                      <td className="py-2.5 px-3 font-mono text-[#6B7280]">{p.purchaseDate}</td>
                      <td className="py-2.5 px-3 font-bold text-[#2D312E]">{p.vendorName}</td>
                      <td className="py-2.5 px-3 font-medium text-[#4F6D7A]">{p.itemsDescription}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold">{p.totalQuantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-[#2D312E] text-sm">{formatCurrency(p.totalCost)}</td>
                      <td className="py-2.5 px-3 font-medium text-[#6B7280]">{p.paymentMode}</td>
                      <td className="py-2.5 px-3 font-medium text-[#89A894]">{p.receivedBy}</td>
                      <td className="no-print py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingPurchase({ ...p })}
                            className="p-1 text-[#4F6D7A] hover:bg-[#F2F4F2] rounded transition-colors cursor-pointer"
                            title="Edit Purchase"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePurchase(p.purchaseId, p.invoiceNo)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Delete Purchase"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ISSUE HISTORY TAB                                                      */}
      {/* ========================================================================= */}
      {subTab === 'issues' && (
        <div className="space-y-4">
          <div className="no-print bg-white p-3 rounded-xl border border-[#E2E8E2] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-[#2D312E]">
              Classroom & Department Material Distribution Register ({issuesList.length} Distributions)
            </span>
            <button
              onClick={() => setIsIssueModalOpen(true)}
              className="px-3 py-1.5 bg-[#4F6D7A] hover:bg-[#415A65] text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Issue Store Supplies</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#F2F4F2] text-[#2D312E] uppercase tracking-wider font-bold border-b border-[#E2E8E2]">
                    <th className="py-2.5 px-3">Issue #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-center">Qty Issued</th>
                    <th className="py-2.5 px-3">Issued To Department / Class</th>
                    <th className="py-2.5 px-3">Faculty Recipient</th>
                    <th className="py-2.5 px-3">Purpose / Activity</th>
                    <th className="no-print py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E2]/60">
                  {issuesList.map((log) => (
                    <tr key={log.issueId} className="hover:bg-[#F7F8F6]/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[#6B7280]">{log.issueId}</td>
                      <td className="py-2.5 px-3 font-mono text-[#6B7280]">{log.date}</td>
                      <td className="py-2.5 px-3 font-bold text-[#2D312E]">{log.itemName}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-[#4F6D7A]">{log.quantity}</td>
                      <td className="py-2.5 px-3 font-semibold text-[#2D312E]">{log.issuedTo}</td>
                      <td className="py-2.5 px-3 text-[#4F6D7A]">{log.recipientPerson}</td>
                      <td className="py-2.5 px-3 text-[#6B7280]">{log.purpose}</td>
                      <td className="no-print py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingIssueLog({ ...log })}
                            className="p-1 text-[#4F6D7A] hover:bg-[#F2F4F2] rounded transition-colors cursor-pointer"
                            title="Edit Distribution Log"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteIssueLog(log.issueId, log.itemName)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Delete Log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. REORDER & LOW STOCK ALERTS TAB                                         */}
      {/* ========================================================================= */}
      {subTab === 'reorder' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-[#F2F4F2] border-b border-[#E2E8E2] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#2D312E] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#D68A6E]" />
                  Low Stock & Reorder Advisory Schedule
                </h3>
                <p className="text-[11px] text-[#6B7280]">
                  Supplies touching safety thresholds requiring immediate replenishment POs
                </p>
              </div>
              <span className="text-xs font-bold text-[#D68A6E] bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                Reorder Budget Required: {formatCurrency(reorderDeficitBudget)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#F7F8F6] text-[#2D312E] uppercase tracking-wider font-bold border-b border-[#E2E8E2]">
                    <th className="py-2.5 px-3">Item Code</th>
                    <th className="py-2.5 px-3">Item Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center text-[#D68A6E] font-bold">Current Stock</th>
                    <th className="py-2.5 px-3 text-center">Safety Level</th>
                    <th className="py-2.5 px-3 text-center font-bold text-[#4F6D7A]">Recommended Order</th>
                    <th className="py-2.5 px-3 text-right">Unit Cost</th>
                    <th className="py-2.5 px-3 text-right font-black text-[#2D312E]">Estimated Cost</th>
                    <th className="py-2.5 px-3">Preferred Supplier</th>
                    <th className="no-print py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E2]/60">
                  {reorderItems.map((i) => {
                    const orderQty = Math.max(1, (i.reorderLevel * 2) - i.currentStock);
                    const orderCost = orderQty * i.unitCost;
                    return (
                      <tr key={i.itemId} className="hover:bg-red-50/30 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#4F6D7A]">{i.itemCode}</td>
                        <td className="py-2.5 px-3 font-bold text-[#2D312E]">{i.name}</td>
                        <td className="py-2.5 px-3 text-[#6B7280]">{i.category}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-black text-sm text-[#D68A6E]">{i.currentStock} {i.unit}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-[#6B7280]">{i.reorderLevel} {i.unit}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-[#4F6D7A] text-sm">+{orderQty} {i.unit}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#6B7280]">{formatCurrency(i.unitCost)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-[#2D312E] text-sm">{formatCurrency(orderCost)}</td>
                        <td className="py-2.5 px-3 text-[#4F6D7A] text-[11px]">{i.supplier}</td>
                        <td className="no-print py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              setEditingStockItem({ ...i });
                              setIsAddingStockItem(false);
                            }}
                            className="px-2.5 py-1 bg-[#4F6D7A] text-white hover:bg-[#415A65] rounded text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit Item</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RECORD INWARD STOCK MODAL                                                 */}
      {/* ========================================================================= */}
      {isPurchaseModalOpen && (
        <div className="no-print fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-[#E2E8E2] overflow-hidden">
            <div className="p-4 border-b border-[#E2E8E2] flex items-center justify-between bg-[#F2F4F2]">
              <div>
                <h3 className="font-bold text-sm text-[#2D312E] flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-[#89A894]" />
                  Record Inward Stock & Purchase
                </h3>
                <p className="text-xs text-[#6B7280]">Wisdom Primary School Store Management</p>
              </div>
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                className="p-1.5 hover:bg-gray-200 rounded-full text-[#6B7280] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#2D312E] mb-1">Select Item SKU:</label>
                <select
                  value={purchaseItemCode}
                  onChange={(e) => setPurchaseItemCode(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-bold text-[#4F6D7A]"
                >
                  {stockList.map(s => (
                    <option key={s.itemCode} value={s.itemCode}>
                      [{s.itemCode}] {s.name} ({s.currentStock} {s.unit} in stock)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Quantity Received:</label>
                  <input
                    type="number"
                    min="1"
                    value={purchaseQty}
                    onChange={(e) => setPurchaseQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-bold text-[#2D312E]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Unit Cost (₹):</label>
                  <input
                    type="number"
                    min="1"
                    value={purchaseRate}
                    onChange={(e) => setPurchaseRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-bold text-[#2D312E]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Vendor Name:</label>
                  <input
                    type="text"
                    placeholder="e.g. Tamil Nadu Textbooks Ltd"
                    value={purchaseVendor}
                    onChange={(e) => setPurchaseVendor(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Invoice / Bill #:</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2024-884"
                    value={purchaseInvoiceNo}
                    onChange={(e) => setPurchaseInvoiceNo(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2D312E] mb-1">Payment Instrument:</label>
                <select
                  value={purchaseMode}
                  onChange={(e) => setPurchaseMode(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg text-[#2D312E]"
                >
                  <option value="Bank Transfer / NEFT">Bank Transfer / NEFT</option>
                  <option value="Google Pay / UPI">Google Pay / UPI</option>
                  <option value="Cash Voucher">Cash Voucher</option>
                  <option value="Cheque">Bank Cheque</option>
                </select>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex justify-between items-center">
                <span className="font-bold text-emerald-900">Total Inward Valuation:</span>
                <span className="font-mono font-black text-emerald-800 text-sm">
                  {formatCurrency(purchaseQty * purchaseRate)}
                </span>
              </div>

              <div className="pt-2 border-t border-[#E2E8E2] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 border border-[#E2E8E2] bg-white hover:bg-gray-100 text-[#2D312E] rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-[#89A894] hover:bg-[#789683] text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Inward Entry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ISSUE MATERIAL MODAL                                                      */}
      {/* ========================================================================= */}
      {isIssueModalOpen && (
        <div className="no-print fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-[#E2E8E2] overflow-hidden">
            <div className="p-4 border-b border-[#E2E8E2] flex items-center justify-between bg-[#F2F4F2]">
              <div>
                <h3 className="font-bold text-sm text-[#2D312E] flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#4F6D7A]" />
                  Issue Supplies & Classroom Materials
                </h3>
                <p className="text-xs text-[#6B7280]">Store Room Distribution Register</p>
              </div>
              <button
                onClick={() => setIsIssueModalOpen(false)}
                className="p-1.5 hover:bg-gray-200 rounded-full text-[#6B7280] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveIssue} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#2D312E] mb-1">Item to Issue:</label>
                <select
                  value={issueItemCode}
                  onChange={(e) => setIssueItemCode(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-bold text-[#4F6D7A]"
                >
                  {stockList.map(s => (
                    <option key={s.itemCode} value={s.itemCode}>
                      [{s.itemCode}] {s.name} ({s.currentStock} {s.unit} available)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#2D312E] mb-1">Quantity to Issue:</label>
                <input
                  type="number"
                  min="1"
                  value={issueQty}
                  onChange={(e) => setIssueQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-bold text-[#2D312E]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Issued To Department:</label>
                  <input
                    type="text"
                    value={issuedToDept}
                    onChange={(e) => setIssuedToDept(e.target.value)}
                    placeholder="e.g. 2STD Classroom"
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Faculty Recipient:</label>
                  <input
                    type="text"
                    value={recipientPerson}
                    onChange={(e) => setRecipientPerson(e.target.value)}
                    placeholder="e.g. Mrs. K. Malathi"
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2D312E] mb-1">Purpose / Usage Details:</label>
                <input
                  type="text"
                  value={issuePurpose}
                  onChange={(e) => setIssuePurpose(e.target.value)}
                  placeholder="e.g. Term 1 Student Notebook Distribution"
                  className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg"
                  required
                />
              </div>

              <div className="pt-2 border-t border-[#E2E8E2] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2 border border-[#E2E8E2] bg-white hover:bg-gray-100 text-[#2D312E] rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4F6D7A] hover:bg-[#415A65] text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Issue from Store</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT / ADD STOCK ITEM MODAL                                              */}
      {/* ========================================================================= */}
      {editingStockItem && (
        <div className="no-print fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-[#E2E8E2] overflow-hidden">
            <div className="p-4 border-b border-[#E2E8E2] flex items-center justify-between bg-[#F2F4F2]">
              <div>
                <h3 className="font-bold text-sm text-[#2D312E] flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#4F6D7A]" />
                  {isAddingStockItem ? 'Add New Inventory Item' : 'Edit Inventory Item'}
                </h3>
                <p className="text-xs text-[#6B7280]">Item Code: {editingStockItem.itemCode}</p>
              </div>
              <button
                onClick={() => {
                  setEditingStockItem(null);
                  setIsAddingStockItem(false);
                }}
                className="p-1.5 hover:bg-gray-200 rounded-full text-[#6B7280] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStockItem} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Item Code:</label>
                  <input
                    type="text"
                    value={editingStockItem.itemCode}
                    onChange={(e) => setEditingStockItem({ ...editingStockItem, itemCode: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-mono font-bold text-[#4F6D7A]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Category:</label>
                  <select
                    value={editingStockItem.category}
                    onChange={(e) => setEditingStockItem({ ...editingStockItem, category: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg text-[#2D312E]"
                  >
                    <option value="Textbooks & Workbooks">Textbooks & Workbooks</option>
                    <option value="School Uniforms">School Uniforms</option>
                    <option value="Office & Classroom Stationery">Office & Classroom Stationery</option>
                    <option value="Sports & Athletic Equipment">Sports & Athletic Equipment</option>
                    <option value="School Van Spares & Maintenance">School Van Spares & Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2D312E] mb-1">Item Name & Description:</label>
                <input
                  type="text"
                  value={editingStockItem.name}
                  onChange={(e) => setEditingStockItem({ ...editingStockItem, name: e.target.value })}
                  placeholder="e.g. Grade 1 English Textbooks (Samacheer Kalvi)"
                  className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-bold text-[#2D312E]"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Current Stock:</label>
                  <input
                    type="number"
                    min="0"
                    value={editingStockItem.currentStock}
                    onChange={(e) => setEditingStockItem({ ...editingStockItem, currentStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-bold text-[#2D312E]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Unit:</label>
                  <input
                    type="text"
                    value={editingStockItem.unit}
                    onChange={(e) => setEditingStockItem({ ...editingStockItem, unit: e.target.value })}
                    placeholder="e.g. copies, sets, reams"
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Safety Level:</label>
                  <input
                    type="number"
                    min="0"
                    value={editingStockItem.reorderLevel}
                    onChange={(e) => setEditingStockItem({ ...editingStockItem, reorderLevel: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-bold text-[#2D312E]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Unit Cost (₹):</label>
                  <input
                    type="number"
                    min="0"
                    value={editingStockItem.unitCost}
                    onChange={(e) => setEditingStockItem({ ...editingStockItem, unitCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-bold text-[#2D312E]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Calculated Valuation:</label>
                  <div className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg font-mono font-bold text-emerald-800">
                    {formatCurrency(Number(editingStockItem.currentStock) * Number(editingStockItem.unitCost))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Storage Location:</label>
                  <input
                    type="text"
                    value={editingStockItem.location}
                    onChange={(e) => setEditingStockItem({ ...editingStockItem, location: e.target.value })}
                    placeholder="e.g. Store Room Rack B-2"
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Primary Supplier:</label>
                  <input
                    type="text"
                    value={editingStockItem.supplier}
                    onChange={(e) => setEditingStockItem({ ...editingStockItem, supplier: e.target.value })}
                    placeholder="e.g. TN Textbook Society"
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[#E2E8E2] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setEditingStockItem(null);
                    setIsAddingStockItem(false);
                  }}
                  className="px-4 py-2 border border-[#E2E8E2] bg-white hover:bg-gray-100 text-[#2D312E] rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4F6D7A] hover:bg-[#415A65] text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isAddingStockItem ? 'Add to Stock' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT INWARD PURCHASE RECORD MODAL                                         */}
      {/* ========================================================================= */}
      {editingPurchase && (
        <div className="no-print fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-[#E2E8E2] overflow-hidden">
            <div className="p-4 border-b border-[#E2E8E2] flex items-center justify-between bg-[#F2F4F2]">
              <div>
                <h3 className="font-bold text-sm text-[#2D312E] flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-[#4F6D7A]" />
                  Edit Inward Purchase Record
                </h3>
                <p className="text-xs text-[#6B7280]">PO: {editingPurchase.purchaseId}</p>
              </div>
              <button
                onClick={() => setEditingPurchase(null)}
                className="p-1.5 hover:bg-gray-200 rounded-full text-[#6B7280] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPurchase} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Invoice / Bill #:</label>
                  <input
                    type="text"
                    value={editingPurchase.invoiceNo}
                    onChange={(e) => setEditingPurchase({ ...editingPurchase, invoiceNo: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Purchase Date:</label>
                  <input
                    type="date"
                    value={editingPurchase.purchaseDate}
                    onChange={(e) => setEditingPurchase({ ...editingPurchase, purchaseDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2D312E] mb-1">Vendor Name:</label>
                <input
                  type="text"
                  value={editingPurchase.vendorName}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, vendorName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-bold text-[#2D312E]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#2D312E] mb-1">Items Description:</label>
                <input
                  type="text"
                  value={editingPurchase.itemsDescription}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, itemsDescription: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Total Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    value={editingPurchase.totalQuantity}
                    onChange={(e) => setEditingPurchase({ ...editingPurchase, totalQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Total Cost (₹):</label>
                  <input
                    type="number"
                    min="0"
                    value={editingPurchase.totalCost}
                    onChange={(e) => setEditingPurchase({ ...editingPurchase, totalCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-bold text-[#2D312E]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Payment Mode:</label>
                  <select
                    value={editingPurchase.paymentMode}
                    onChange={(e) => setEditingPurchase({ ...editingPurchase, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg text-[#2D312E]"
                  >
                    <option value="Bank Transfer / NEFT">Bank Transfer / NEFT</option>
                    <option value="Google Pay / UPI">Google Pay / UPI</option>
                    <option value="Cash Voucher">Cash Voucher</option>
                    <option value="Cheque">Bank Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Received By:</label>
                  <input
                    type="text"
                    value={editingPurchase.receivedBy}
                    onChange={(e) => setEditingPurchase({ ...editingPurchase, receivedBy: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[#E2E8E2] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setEditingPurchase(null)}
                  className="px-4 py-2 border border-[#E2E8E2] bg-white hover:bg-gray-100 text-[#2D312E] rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4F6D7A] hover:bg-[#415A65] text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Purchase Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT MATERIAL DISTRIBUTION LOG MODAL                                      */}
      {/* ========================================================================= */}
      {editingIssueLog && (
        <div className="no-print fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-[#E2E8E2] overflow-hidden">
            <div className="p-4 border-b border-[#E2E8E2] flex items-center justify-between bg-[#F2F4F2]">
              <div>
                <h3 className="font-bold text-sm text-[#2D312E] flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-[#4F6D7A]" />
                  Edit Material Issue Record
                </h3>
                <p className="text-xs text-[#6B7280]">Log: {editingIssueLog.issueId}</p>
              </div>
              <button
                onClick={() => setEditingIssueLog(null)}
                className="p-1.5 hover:bg-gray-200 rounded-full text-[#6B7280] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditIssueLog} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Date Issued:</label>
                  <input
                    type="date"
                    value={editingIssueLog.date}
                    onChange={(e) => setEditingIssueLog({ ...editingIssueLog, date: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    value={editingIssueLog.quantity}
                    onChange={(e) => setEditingIssueLog({ ...editingIssueLog, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2D312E] mb-1">Item Description:</label>
                <input
                  type="text"
                  value={editingIssueLog.itemName}
                  onChange={(e) => setEditingIssueLog({ ...editingIssueLog, itemName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-bold text-[#2D312E]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Issued To Dept:</label>
                  <input
                    type="text"
                    value={editingIssueLog.issuedTo}
                    onChange={(e) => setEditingIssueLog({ ...editingIssueLog, issuedTo: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Faculty Recipient:</label>
                  <input
                    type="text"
                    value={editingIssueLog.recipientPerson}
                    onChange={(e) => setEditingIssueLog({ ...editingIssueLog, recipientPerson: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2D312E] mb-1">Purpose / Details:</label>
                <input
                  type="text"
                  value={editingIssueLog.purpose}
                  onChange={(e) => setEditingIssueLog({ ...editingIssueLog, purpose: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg"
                  required
                />
              </div>

              <div className="pt-2 border-t border-[#E2E8E2] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setEditingIssueLog(null)}
                  className="px-4 py-2 border border-[#E2E8E2] bg-white hover:bg-gray-100 text-[#2D312E] rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4F6D7A] hover:bg-[#415A65] text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Issue Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
