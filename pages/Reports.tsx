
import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Printer, Loader2, Package, DollarSign, Banknote, CreditCard, FileText, X, Truck, ArrowLeft } from 'lucide-react';
import { storageService } from '../services/storageService';
import { generateDeliveryReportInsight } from '../services/geminiService';
import { Delivery, Store as StoreType } from '../types';

type Timeframe = 'daily' | 'monthly' | 'yearly';

const COMPANY_INFO = {
    name: "Family Injera & Catering Ltd.",
    address: ["8612 118 Avenue Northwest", "Edmonton, Alberta T5B 0S8", "Canada"],
    phone: "7807520907",
    mobile: "5879747592",
    email: "familyinjera118ave@gmail.com"
};

interface InvoiceData {
    store: StoreType;
    aggregatedItems: {name: string, quantity: number, price: number, total: number}[];
    totalAmount: number;
    month: string;
}

interface StatementData {
    store: StoreType;
    invoices: Delivery[];
}

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);

const formatDate = (dateStr: string) => 
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// --- PRINT STYLES ---
const PrintStyles = () => (
  <style>{`
    @media print {
      @page { size: letter portrait; margin: 0.5in; }
      body { background-color: white !important; -webkit-print-color-adjust: exact; }
      #root { height: auto !important; overflow: visible !important; }
      
      /* Hide Layout Elements */
      aside, header, .no-print { display: none !important; }
      
      /* Reset Main Container */
      main {
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
        height: auto !important;
        flex: none !important;
      }
      
      /* Report Container Overrides */
      .report-modal {
        position: static !important;
        background: white !important;
        padding: 0 !important;
        height: auto !important;
        overflow: visible !important;
        z-index: auto !important;
        display: block !important;
      }
      
      .report-paper {
        box-shadow: none !important;
        margin: 0 !important;
        width: 100% !important;
        min-height: 0 !important;
        padding: 0 !important;
        border: none !important;
      }
      
      /* Ensure text colors print correctly */
      * { color-adjust: exact; }
    }
  `}</style>
);

// --- INVOICE TEMPLATE (Letter Size) ---
const InvoiceTemplate = ({ data, onClose }: { data: InvoiceData, onClose: () => void }) => {
  const { store, aggregatedItems, month, totalAmount } = data;
  
  const isMonthly = month.length === 7;
  let dateObj = new Date();
  let monthName = '';
  let year = '';

  if (isMonthly) {
      const parts = month.split('-');
      year = parts[0];
      const monthNum = parseInt(parts[1]);
      dateObj = new Date(parseInt(year), monthNum - 1, 1);
      monthName = dateObj.toLocaleString('default', { month: 'long' });
  } else {
      year = month.substring(0, 4);
      monthName = month.length === 4 ? 'Annual' : new Date(month).toLocaleString('default', { month: 'long' });
  }

  const invoiceDate = isMonthly ? new Date(parseInt(year), dateObj.getMonth() + 1, 0) : new Date();
  const dueDate = new Date(invoiceDate.getTime() + 7 * 24 * 60 * 60 * 1000); // Net 7
  const invoiceNum = `${year}${isMonthly ? month.split('-')[1] : '00'}-${store.id.substring(0,3).toUpperCase()}`;

  return (
    <div className="report-modal fixed inset-0 z-50 bg-slate-200/80 backdrop-blur-sm overflow-auto flex justify-center py-8">
      <PrintStyles />
      
      {/* Letter Size Paper: 8.5in x 11in ~ 816px x 1056px at 96dpi */}
      <div className="report-paper bg-white w-[816px] min-h-[1056px] shadow-2xl p-12 relative flex flex-col justify-between mx-auto">
         
         {/* Controls */}
         <div className="fixed top-6 right-6 no-print flex gap-3 z-[60]">
            <button onClick={() => window.print()} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-emerald-700 hover:scale-105 transition-all flex items-center gap-2">
                <Printer size={20} /> Print Invoice
            </button>
            <button onClick={onClose} className="bg-white text-slate-700 px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-slate-50 transition-all flex items-center gap-2">
                <X size={20} /> Close
            </button>
         </div>

         <div className="flex-1">
             {/* Header */}
             <div className="flex justify-between items-start mb-8">
                <div className="w-32 h-32 relative">
                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-emerald-50 to-emerald-100 flex items-center justify-center border border-emerald-100/50 shadow-inner">
                       <div className="text-center">
                          <Truck className="mx-auto text-emerald-600 mb-1" size={32} />
                          <span className="text-[10px] font-bold text-emerald-800 leading-tight block">Family Injera<br/>& Catering</span>
                       </div>
                    </div>
                </div>
                
                <div className="text-right">
                    <h1 className="text-5xl font-normal text-slate-900 mb-6 tracking-wide">INVOICE</h1>
                    <div className="text-sm text-slate-800 space-y-1 font-medium">
                        <p className="font-bold text-base">{COMPANY_INFO.name}</p>
                        {COMPANY_INFO.address.map((line, i) => <p key={i}>{line}</p>)}
                        <p className="mt-2">Phone: {COMPANY_INFO.phone}</p>
                        <p>Mobile: {COMPANY_INFO.mobile}</p>
                        <p>{COMPANY_INFO.email}</p>
                    </div>
                </div>
             </div>

             <hr className="border-slate-300 mb-8" />

             {/* Bill To & Details */}
             <div className="flex justify-between items-start mb-12">
                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">BILL TO</h3>
                    <p className="text-lg font-bold text-slate-900">{store.name}</p>
                    <p className="text-sm text-slate-600 mt-1 max-w-[200px]">{store.address}</p>
                </div>
                
                <div className="w-1/2 max-w-sm space-y-2">
                    <div className="flex justify-between">
                        <span className="font-bold text-slate-900 text-sm">Invoice Number:</span>
                        <span className="text-slate-700 text-sm">{invoiceNum}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-bold text-slate-900 text-sm">Invoice Date:</span>
                        <span className="text-slate-700 text-sm">{formatDate(invoiceDate.toISOString())}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-bold text-slate-900 text-sm">Payment Due:</span>
                        <span className="text-slate-700 text-sm">{formatDate(dueDate.toISOString())}</span>
                    </div>
                    <div className="flex justify-between bg-slate-100 p-2 -mx-2 rounded">
                        <span className="font-bold text-slate-900 text-sm">Amount Due (CAD):</span>
                        <span className="font-bold text-slate-900 text-sm">{formatCurrency(totalAmount)}</span>
                    </div>
                </div>
             </div>

             {/* Items Table */}
             <div className="mb-12">
                 <div className="flex bg-[#10b981] text-white font-bold text-sm py-2 px-4 rounded-t-lg print:bg-[#10b981] print:text-white print:rounded-none">
                    <div className="flex-[3]">Products</div>
                    <div className="flex-1 text-center">Quantity</div>
                    <div className="flex-1 text-right">Price</div>
                    <div className="flex-1 text-right">Amount</div>
                 </div>
                 
                 <div className="divide-y divide-slate-200 border-x border-b border-slate-200 rounded-b-lg print:rounded-none print:border-x-0">
                    {aggregatedItems.map((item, idx) => (
                        <div key={idx} className="flex py-4 px-4 text-sm items-start">
                            <div className="flex-[3]">
                                <p className="font-bold text-slate-900">{item.name}</p>
                                <p className="text-slate-500 text-xs mt-0.5 uppercase">
                                    {isMonthly ? `FOR ${monthName.toUpperCase()} ${year}` : 'DELIVERED ITEM'}
                                </p>
                            </div>
                            <div className="flex-1 text-center text-slate-800">{item.quantity}</div>
                            <div className="flex-1 text-right text-slate-800">${item.price.toFixed(2)}</div>
                            <div className="flex-1 text-right text-slate-800 font-medium">${item.total.toFixed(2)}</div>
                        </div>
                    ))}
                 </div>

                 <div className="flex justify-end mt-4 px-4">
                     <div className="w-1/3 space-y-2">
                         <div className="flex justify-between py-2 border-b border-slate-200">
                             <span className="font-bold text-slate-800 text-sm">Total:</span>
                             <span className="text-slate-800 text-sm">{formatCurrency(totalAmount)}</span>
                         </div>
                         <div className="flex justify-between py-2">
                             <span className="font-bold text-slate-900">Amount Due (CAD):</span>
                             <span className="font-bold text-slate-900">{formatCurrency(totalAmount)}</span>
                         </div>
                     </div>
                 </div>
             </div>

             {/* Footer Notes */}
             <div className="text-sm text-slate-600 mb-8">
                 <h4 className="font-bold text-slate-900 mb-2">Notes / Terms</h4>
                 <ul className="list-none space-y-1">
                     <li>- Cash payment: Accepted</li>
                     <li>- Bank Name: {COMPANY_INFO.name}</li>
                     <li>- E-transfer: {COMPANY_INFO.email}</li>
                     <li>- Please reconcile with your record and clear the invoice within the payment due date.</li>
                 </ul>
             </div>
         </div>
         
         <div className="text-center pt-8 border-t border-slate-100">
             <p className="text-slate-500 text-sm mb-4">Family Injera - Freshly Baked Daily!</p>
             <div className="flex items-center justify-center gap-2 text-slate-800 font-bold text-lg opacity-75">
                <span className="text-slate-400 font-normal">Powered by</span> 
                <div className="flex items-center gap-1 text-indigo-600">
                    <Truck size={20} /> <span>DeliveryFlow</span>
                </div>
             </div>
         </div>
      </div>
    </div>
  );
};

// --- STATEMENT TEMPLATE (Letter Size) ---
const StatementTemplate = ({ data, onClose }: { data: StatementData, onClose: () => void }) => {
    const { store, invoices } = data;
    const now = new Date();
    
    // Sort invoices by date desc
    const sortedInvoices = [...invoices].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const totalOutstanding = sortedInvoices.reduce((acc, inv) => acc + inv.items.reduce((s, i) => s + (i.quantity * i.priceAtDelivery), 0), 0);
    
    const overdueAmount = sortedInvoices.reduce((acc, inv) => {
        const dueDate = new Date(new Date(inv.timestamp).getTime() + 7 * 24 * 60 * 60 * 1000);
        if (dueDate < now && inv.paymentStatus !== 'paid') {
            return acc + inv.items.reduce((s, i) => s + (i.quantity * i.priceAtDelivery), 0);
        }
        return acc;
    }, 0);

    const notYetDue = totalOutstanding - overdueAmount;

    return (
      <div className="report-modal fixed inset-0 z-50 bg-slate-200/80 backdrop-blur-sm overflow-auto flex justify-center py-8">
        <PrintStyles />
        
        {/* Letter Size Paper */}
        <div className="report-paper bg-white w-[816px] min-h-[1056px] shadow-2xl p-12 relative flex flex-col justify-between mx-auto">
            
            {/* Controls */}
            <div className="fixed top-6 right-6 no-print flex gap-3 z-[60]">
                <button onClick={() => window.print()} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-2">
                    <Printer size={20} /> Print Statement
                </button>
                <button onClick={onClose} className="bg-white text-slate-700 px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-slate-50 transition-all flex items-center gap-2">
                    <X size={20} /> Close
                </button>
            </div>

            <div className="flex-1">
                {/* Header */}
                <div className="flex justify-between mb-12">
                    <div className="flex gap-4">
                        <div className="w-24 h-24 relative rounded-full bg-gradient-to-tr from-emerald-50 to-emerald-100 flex items-center justify-center border border-emerald-100/50 shadow-inner">
                            <div className="text-center">
                                <Truck className="mx-auto text-emerald-600 mb-1" size={24} />
                                <span className="text-[8px] font-bold text-emerald-800 leading-tight block">Family Injera<br/>& Catering</span>
                            </div>
                        </div>
                        <div className="text-sm font-medium text-slate-800">
                            <p className="font-bold text-slate-900 text-base">{COMPANY_INFO.name}</p>
                            {COMPANY_INFO.address.map((line, i) => <p key={i}>{line}</p>)}
                        </div>
                    </div>
                    <div className="text-right">
                        <h1 className="text-4xl font-bold text-slate-900 mb-2">Statement of Account</h1>
                        <p className="text-lg text-slate-500">Outstanding invoices</p>
                    </div>
                </div>

                {/* Bill To & Summary */}
                <div className="flex justify-between items-start mb-16">
                    <div>
                        <h3 className="text-sm font-medium text-slate-500 mb-2">Bill to</h3>
                        <p className="font-bold text-slate-900 text-lg">{store.name}</p>
                        <p className="text-sm text-slate-600 mt-1 max-w-[200px]">{store.address}</p>
                    </div>
                    
                    <div className="w-96">
                        <div className="text-right mb-4">
                            <h3 className="font-bold text-slate-900 text-lg">Canadian dollar (CAD)</h3>
                            <p className="text-sm text-slate-500">As of {formatDate(now.toISOString())}</p>
                        </div>
                        
                        <div className="space-y-2">
                             <div className="flex justify-between text-sm">
                                 <span className="text-slate-600">Overdue</span>
                                 <span className="font-medium text-slate-900">{formatCurrency(overdueAmount)}</span>
                             </div>
                             <div className="flex justify-between text-sm">
                                 <span className="text-slate-600">Not yet due</span>
                                 <span className="font-medium text-slate-900">{formatCurrency(notYetDue)}</span>
                             </div>
                             <div className="flex justify-between bg-slate-100 p-3 rounded font-bold text-slate-900 mt-2">
                                 <span>Outstanding balance (CAD)</span>
                                 <span>{formatCurrency(totalOutstanding)}</span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="mb-16">
                     <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="py-3 text-left font-bold text-slate-900">Invoice #</th>
                                <th className="py-3 text-left font-bold text-slate-900">Invoice date</th>
                                <th className="py-3 text-left font-bold text-slate-900">Due date</th>
                                <th className="py-3 text-right font-bold text-slate-900">Total</th>
                                <th className="py-3 text-right font-bold text-slate-900">Paid</th>
                                <th className="py-3 text-right font-bold text-slate-900">Due</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sortedInvoices.map(inv => {
                                const total = inv.items.reduce((s,i) => s + (i.quantity * i.priceAtDelivery), 0);
                                const dueDate = new Date(new Date(inv.timestamp).getTime() + 7 * 24 * 60 * 60 * 1000);
                                const isOverdue = dueDate < now && inv.paymentStatus !== 'paid';
                                const shortId = inv.id.length > 6 ? inv.id.substring(inv.id.length - 6) : inv.id;

                                return (
                                    <tr key={inv.id}>
                                        <td className="py-4">
                                            <span className="font-bold text-blue-600">Invoice {shortId}</span>
                                        </td>
                                        <td className="py-4 text-slate-700">{formatDate(inv.timestamp)}</td>
                                        <td className="py-4 text-slate-700">
                                            <div>{formatDate(dueDate.toISOString())}</div>
                                            {isOverdue && <div className="text-red-600 font-bold text-xs mt-0.5">Overdue</div>}
                                        </td>
                                        <td className="py-4 text-right text-slate-700">{formatCurrency(total)}</td>
                                        <td className="py-4 text-right text-slate-700">$0.00</td>
                                        <td className="py-4 text-right text-slate-700 font-medium">{formatCurrency(total)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                     </table>
                     
                     <div className="flex justify-end mt-8">
                        <div className="bg-slate-100 px-6 py-3 rounded flex gap-12 font-bold text-slate-900">
                            <span>Outstanding balance (CAD)</span>
                            <span>{formatCurrency(totalOutstanding)}</span>
                        </div>
                     </div>
                </div>
            </div>

            <div className="text-center pt-8 border-t border-slate-100">
                <div className="flex items-center justify-center gap-2 text-slate-800 font-bold text-lg opacity-75">
                    <span className="text-slate-400 font-normal">Powered by</span> 
                    <div className="flex items-center gap-1 text-indigo-600">
                        <Truck size={20} /> <span>DeliveryFlow</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
};


export const Reports: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>('monthly');
  const [dateValue, setDateValue] = useState(new Date().toISOString().slice(0, 7)); 
  
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [statementData, setStatementData] = useState<StatementData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [del, str] = await Promise.all([
                storageService.getDeliveries(),
                storageService.getStores()
            ]);
            setDeliveries(del);
            setStores(str);
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const now = new Date();
    if (timeframe === 'daily') setDateValue(now.toISOString().slice(0, 10));
    else if (timeframe === 'monthly') setDateValue(now.toISOString().slice(0, 7));
    else if (timeframe === 'yearly') setDateValue(now.getFullYear().toString());
  }, [timeframe]);

  const filteredDeliveries = deliveries.filter(d => d.timestamp.startsWith(dateValue));
  
  const totalRevenue = filteredDeliveries.reduce((acc, d) => 
    acc + d.items.reduce((s, i) => s + (i.quantity * i.priceAtDelivery), 0), 0
  );

  const totalCashReceived = filteredDeliveries
    .filter(d => d.paymentMethod === 'cash' && d.paymentStatus !== 'pending')
    .reduce((acc, d) => acc + d.items.reduce((s, i) => s + (i.quantity * i.priceAtDelivery), 0), 0);
  
  const totalCashPending = filteredDeliveries
    .filter(d => d.paymentMethod === 'cash' && d.paymentStatus === 'pending')
    .reduce((acc, d) => acc + d.items.reduce((s, i) => s + (i.quantity * i.priceAtDelivery), 0), 0);

  const totalCredit = filteredDeliveries
    .filter(d => d.paymentMethod !== 'cash') 
    .reduce((acc, d) => acc + d.items.reduce((s, i) => s + (i.quantity * i.priceAtDelivery), 0), 0);

  const deliveriesByStore = stores.map(store => {
    const storeDeliveries = filteredDeliveries.filter(d => d.storeId === store.id);
    
    const cashReceived = storeDeliveries
        .filter(d => d.paymentMethod === 'cash' && d.paymentStatus !== 'pending')
        .reduce((acc, d) => acc + d.items.reduce((s, i) => s + (i.quantity * i.priceAtDelivery), 0), 0);
    
    const cashPending = storeDeliveries
        .filter(d => d.paymentMethod === 'cash' && d.paymentStatus === 'pending')
        .reduce((acc, d) => acc + d.items.reduce((s, i) => s + (i.quantity * i.priceAtDelivery), 0), 0);

    const creditGiven = storeDeliveries
        .filter(d => d.paymentMethod !== 'cash')
        .reduce((acc, d) => acc + d.items.reduce((s, i) => s + (i.quantity * i.priceAtDelivery), 0), 0);

    return { 
        ...store, 
        deliveryCount: storeDeliveries.length, 
        revenue: cashReceived + cashPending + creditGiven,
        cashReceived,
        cashPending,
        creditGiven
    };
  }).filter(s => s.deliveryCount > 0);

  const handleGenerateAiInsight = async () => {
    setIsLoadingAi(true);
    setAiInsight('');
    const insight = await generateDeliveryReportInsight(filteredDeliveries, stores, dateValue);
    setAiInsight(insight);
    setIsLoadingAi(false);
  };

  const handleOpenInvoice = (store: StoreType) => {
    const storeDeliveries = filteredDeliveries.filter(d => d.storeId === store.id);
    
    const itemMap = new Map<string, {name: string, quantity: number, price: number, total: number}>();
    
    storeDeliveries.forEach(d => {
        d.items.forEach(item => {
            const key = item.productId;
            const existing = itemMap.get(key);
            if (existing) {
                existing.quantity += item.quantity;
                existing.total += (item.quantity * item.priceAtDelivery);
            } else {
                itemMap.set(key, {
                    name: item.productName,
                    quantity: item.quantity,
                    price: item.priceAtDelivery, 
                    total: item.quantity * item.priceAtDelivery
                });
            }
        });
    });

    const aggregatedItems = Array.from(itemMap.values());
    const totalAmount = aggregatedItems.reduce((sum, i) => sum + i.total, 0);

    setInvoiceData({
        store,
        aggregatedItems,
        totalAmount,
        month: dateValue
    });
  };

  const handleOpenStatement = (store: StoreType) => {
      const statementDeliveries = deliveries.filter(d => {
          if (d.storeId !== store.id) return false;
          return d.paymentStatus === 'pending' || d.timestamp.startsWith(dateValue);
      });

      setStatementData({
          store,
          invoices: statementDeliveries
      });
  };

  const SummaryCard = ({ title, value, icon, colorClass, subText }: any) => (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between h-32 print:border print:border-slate-300 relative overflow-hidden group">
          <div className={`absolute -right-6 -top-6 w-20 h-20 rounded-full ${colorClass} opacity-5 group-hover:scale-125 transition-transform duration-500 ease-out`}></div>
          <div>
              <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
              <p className={`text-3xl font-bold tracking-tight ${colorClass.replace('bg-', 'text-').replace('-500', '-600').replace('-600', '-700')}`}>{value}</p>
              {subText && <p className="text-xs text-slate-400 mt-1">{subText}</p>}
          </div>
          <div className={`p-4 rounded-xl ${colorClass} bg-opacity-10 text-${colorClass.split('-')[1]}-600`}>
              {icon}
          </div>
      </div>
  );

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={32}/></div>;

  if (invoiceData) {
      return <InvoiceTemplate data={invoiceData} onClose={() => setInvoiceData(null)} />;
  }
  if (statementData) {
      return <StatementTemplate data={statementData} onClose={() => setStatementData(null)} />;
  }

  return (
    <div className="space-y-8 print:hidden animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
         <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
             <div>
                 <h2 className="hidden md:block text-slate-500 mb-1">Financial Report</h2>
                 <div className="flex items-center gap-2">
                    <div className="relative">
                        <select 
                            value={timeframe}
                            onChange={(e) => setTimeframe(e.target.value as Timeframe)}
                            className="bg-white border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-sm font-semibold text-slate-700 shadow-sm appearance-none focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                        >
                            <option value="daily">Daily</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                           <Calendar size={14} />
                        </div>
                    </div>

                    <div className="bg-white p-1 px-3 rounded-xl shadow-sm border border-slate-200">
                        {timeframe === 'daily' && <input type="date" value={dateValue} onChange={(e) => setDateValue(e.target.value)} className="bg-transparent border-none text-sm font-semibold text-slate-700 focus:ring-0 cursor-pointer outline-none"/>}
                        {timeframe === 'monthly' && <input type="month" value={dateValue} onChange={(e) => setDateValue(e.target.value)} className="bg-transparent border-none text-sm font-semibold text-slate-700 focus:ring-0 cursor-pointer outline-none"/>}
                        {timeframe === 'yearly' && <input type="number" min="2000" max="2099" step="1" value={dateValue} onChange={(e) => setDateValue(e.target.value)} className="bg-transparent border-none text-sm font-semibold text-slate-700 focus:ring-0 cursor-pointer w-20 outline-none"/>}
                    </div>
                 </div>
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
            title="Total Revenue" 
            value={`$${totalRevenue.toFixed(0)}`} 
            icon={<DollarSign size={28} />} 
            colorClass="bg-indigo-500" 
        />
        <SummaryCard 
            title="Cash Received" 
            value={`$${totalCashReceived.toFixed(0)}`} 
            subText={totalCashPending > 0 ? `$${totalCashPending.toFixed(0)} pending collection` : ''}
            icon={<Banknote size={28} />} 
            colorClass="bg-emerald-500" 
        />
        <SummaryCard 
            title="Credit Given" 
            value={`$${totalCredit.toFixed(0)}`} 
            icon={<CreditCard size={28} />} 
            colorClass="bg-blue-500" 
        />
        <SummaryCard 
            title="Total Deliveries" 
            value={filteredDeliveries.length} 
            icon={<Package size={28} />} 
            colorClass="bg-slate-500" 
        />
      </div>

      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-violet-600 rounded-2xl opacity-30 group-hover:opacity-50 blur transition duration-500"></div>
        <div className="relative bg-white rounded-2xl p-8">
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white shadow-lg shadow-indigo-200">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">AI Executive Summary</h3>
                        <p className="text-xs text-slate-500">Powered by Gemini models</p>
                    </div>
                </div>
                {!aiInsight && !isLoadingAi && (
                    <button onClick={handleGenerateAiInsight} className="text-xs font-bold bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full hover:bg-indigo-100 transition-colors">
                        Generate Analysis
                    </button>
                )}
            </div>
            <div className="min-h-[60px]">
                {isLoadingAi && <div className="flex items-center gap-3 text-slate-500 animate-pulse"><Loader2 className="animate-spin"/> Analyzing sales data...</div>}
                {aiInsight && <div className="prose prose-indigo prose-sm max-w-none text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-xl border border-slate-100">{aiInsight}</div>}
            </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
            <h3 className="font-bold text-lg text-slate-800">{timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Store Breakdown</h3>
        </div>
        <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold tracking-wider">
                <tr>
                    <th className="p-5 pl-6">Store Name</th>
                    <th className="p-5 text-center">Deliveries</th>
                    <th className="p-5 text-right text-emerald-600">Cash Received</th>
                    <th className="p-5 text-right text-amber-600">Cash Pending</th>
                    <th className="p-5 text-right text-blue-600">Credit Given</th>
                    <th className="p-5 text-center">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
                {deliveriesByStore.length === 0 ? (
                    <tr><td colSpan={6} className="p-12 text-center text-slate-400">No data for this period.</td></tr>
                ) : (
                    deliveriesByStore.map(store => (
                        <tr key={store.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="p-5 pl-6 font-semibold text-slate-700">{store.name}</td>
                            <td className="p-5 text-center"><span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full font-bold text-xs">{store.deliveryCount}</span></td>
                            <td className="p-5 text-right font-mono font-medium text-emerald-600">${store.cashReceived.toFixed(2)}</td>
                            <td className="p-5 text-right font-mono font-medium text-amber-600">${store.cashPending.toFixed(2)}</td>
                            <td className="p-5 text-right font-mono font-medium text-blue-600">${store.creditGiven.toFixed(2)}</td>
                            <td className="p-5 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <button 
                                        onClick={() => handleOpenInvoice(store)}
                                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 rounded-lg transition-all text-xs font-bold flex items-center gap-1 shadow-sm"
                                        title="View Monthly Invoice"
                                    >
                                        <FileText size={14} /> Invoice
                                    </button>
                                    <button 
                                        onClick={() => handleOpenStatement(store)}
                                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 rounded-lg transition-all text-xs font-bold flex items-center gap-1 shadow-sm"
                                        title="View Account Statement"
                                    >
                                        <CreditCard size={14} /> Statement
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
            <tfoot className="bg-slate-50 font-bold text-slate-700 border-t border-slate-200">
                 <tr>
                    <td className="p-5 pl-6">Totals</td>
                    <td className="p-5 text-center">{filteredDeliveries.length}</td>
                    <td className="p-5 text-right text-emerald-700">${totalCashReceived.toFixed(2)}</td>
                    <td className="p-5 text-right text-amber-700">${totalCashPending.toFixed(2)}</td>
                    <td className="p-5 text-right text-blue-700">${totalCredit.toFixed(2)}</td>
                    <td></td>
                 </tr>
            </tfoot>
        </table>
      </div>
    </div>
  );
};
