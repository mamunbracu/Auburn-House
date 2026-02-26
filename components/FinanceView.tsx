
import React, { useState, useMemo } from 'react';
import { Member, BillItem, MemberName, BillPayment } from '../types';
import { getRentSchedule } from '../services/dataService';
import { format, differenceInDays } from 'date-fns';
import { 
  Receipt, 
  PieChart, 
  Calendar, 
  Calculator, 
  Edit2, 
  Trash2, 
  Check, 
  History, 
  Trash, 
  X, 
  AlertCircle, 
  ChevronRight, 
  Download,
  Clock,
  ArrowUpRight,
  ChevronDown
} from 'lucide-react';
import PinModal from './PinModal';

interface FinanceViewProps {
  roommates: Member[];
  bills: BillItem[];
  payments: BillPayment[];
  onAddBill: (bill: BillItem) => void;
  onUpdateBill: (bill: BillItem) => void;
  onDeleteBill: (id: string) => void;
  onAddPayment: (payment: BillPayment) => void;
  onUpdatePayments: (payments: BillPayment[]) => void;
  rentEvents: any[];
}

const FinanceView: React.FC<FinanceViewProps> = ({ 
  roommates, 
  bills, 
  payments, 
  onAddBill, 
  onUpdateBill,
  onDeleteBill,
  onAddPayment,
  onUpdatePayments 
}) => {
  const [view, setView] = useState<'ledger' | 'expenses' | 'rent' | 'calc' | 'history'>('ledger');
  const [showHistoryLimit, setHistoryLimit] = useState(5);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [pinAction, setPinAction] = useState<{ type: string, payload: any } | null>(null);
  
  // Calculator States
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcExpression, setCalcExpression] = useState('');
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [resetDisplay, setResetDisplay] = useState(false);
  const [calcHistory, setCalcHistory] = useState<{amount: string, split: string, timestamp: string}[]>([]);
  
  const [showAdd, setShowAdd] = useState(false);
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    category: 'Electricity' as BillItem['category'],
    amount: '',
    description: '',
    month: format(new Date(), 'MMMM'),
    paidBy: (roommates[0]?.name || 'Not Paid Yet') as MemberName | 'Not Paid Yet',
    billingPeriodStart: format(new Date(), 'yyyy-MM-dd'),
    billingPeriodEnd: format(new Date(), 'yyyy-MM-dd'),
    memberStayPeriods: roommates.reduce((acc, r) => ({ ...acc, [r.name]: { start: format(new Date(), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') } }), {} as Record<string, { start: string, end: string }>)
  });

  const rentDates = useMemo(() => getRentSchedule(12), []);

  const handleAddEditAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount) return;
    setPinAction({ type: 'save_bill', payload: null });
  };

  const executeAddEdit = () => {
    if (editingBillId) {
      const existing = bills.find(b => b.id === editingBillId);
      if (existing) {
        onUpdateBill({
          ...existing,
          category: formData.category,
          totalAmount: parseFloat(formData.amount),
          description: formData.description,
          paidBy: formData.paidBy as MemberName | 'Not Paid Yet',
          month: formData.month,
          billingPeriodStart: formData.billingPeriodStart,
          billingPeriodEnd: formData.billingPeriodEnd,
          memberStayPeriods: formData.memberStayPeriods
        });
      }
    } else {
      onAddBill({
        id: Math.random().toString(36).substr(2, 9),
        category: formData.category,
        totalAmount: parseFloat(formData.amount),
        dueDate: new Date().toISOString(),
        month: formData.month,
        memberFinances: {} as any,
        isFinalized: false,
        description: formData.description,
        paidBy: formData.paidBy as MemberName | 'Not Paid Yet',
        billingPeriodStart: formData.billingPeriodStart,
        billingPeriodEnd: formData.billingPeriodEnd,
        memberStayPeriods: formData.memberStayPeriods
      });
    }
    setShowAdd(false);
    setEditingBillId(null);
    setFormData({ ...formData, amount: '', description: '' });
  };

  const handleEditBill = (bill: BillItem) => {
    setFormData({
      category: bill.category,
      amount: bill.totalAmount.toString(),
      description: bill.description || '',
      month: bill.month,
      paidBy: bill.paidBy,
      billingPeriodStart: bill.billingPeriodStart || format(new Date(), 'yyyy-MM-dd'),
      billingPeriodEnd: bill.billingPeriodEnd || format(new Date(), 'yyyy-MM-dd'),
      memberStayPeriods: bill.memberStayPeriods || roommates.reduce((acc, r) => ({ ...acc, [r.name]: { start: format(new Date(), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') } }), {} as Record<string, { start: string, end: string }>)
    });
    setEditingBillId(bill.id);
    setShowAdd(true);
    setView('ledger');
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      setPinAction({ type: 'delete_bill', payload: deleteConfirmId });
    }
  };

  const handleTogglePaymentAttempt = (billId: string, memberId: MemberName, splitAmount: number) => {
    setPinAction({ type: 'toggle_payment', payload: { billId, memberId, splitAmount } });
  };

  const executeTogglePayment = (payload: any) => {
    const { billId, memberId, splitAmount } = payload;
    const existingPayment = payments.find(p => p.billId === billId && p.memberId === memberId);
    if (existingPayment) {
      onUpdatePayments(payments.filter(p => p.id !== existingPayment.id));
    } else {
      onAddPayment({
        id: Math.random().toString(36).substr(2, 9),
        billId,
        memberId,
        amount: splitAmount,
        date: new Date().toISOString()
      });
    }
  };

  const handleCalcButton = (val: string) => {
    if (val === 'AC') { setCalcDisplay('0'); setCalcExpression(''); setResetDisplay(false); setLastResult(null); }
    else if (val === 'DEL') { if (!resetDisplay) setCalcDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0'); }
    else if (['+', '-', '×', '÷'].includes(val)) {
      if (calcExpression && !resetDisplay) {
        try {
          const res = new Function(`return ${(calcExpression + calcDisplay).replace(/×/g, '*').replace(/÷/g, '/')}`)();
          setCalcExpression(res + ' ' + val + ' ');
          setCalcDisplay(res.toString());
        } catch { setCalcDisplay('Error'); }
      } else { setCalcExpression(calcDisplay + ' ' + val + ' '); }
      setResetDisplay(true);
    } else if (val === '=') {
      try {
        const fullExpr = calcExpression + calcDisplay;
        const result = new Function(`return ${fullExpr.replace(/×/g, '*').replace(/÷/g, '/')}`)();
        setLastResult(fullExpr + ' =');
        setCalcDisplay(result.toString());
        setCalcExpression('');
        setResetDisplay(true);
      } catch { setCalcDisplay('Error'); }
    } else if (val === 'Split') {
      const amt = parseFloat(calcDisplay);
      if (!isNaN(amt) && amt > 0) {
        const split = (amt / roommates.length).toFixed(2);
        setCalcHistory(prev => [{ amount: amt.toString(), split, timestamp: format(new Date(), 'HH:mm') }, ...prev.slice(0, 4)]);
        setCalcDisplay(split);
        setResetDisplay(true);
      }
    } else {
      if (resetDisplay) { setCalcDisplay(val === '.' ? '0.' : val); setResetDisplay(false); }
      else { if (val === '.' && calcDisplay.includes('.')) return; setCalcDisplay(prev => (prev === '0' && val !== '.' ? val : prev + val)); }
    }
  };

  const calculateMemberShare = (bill: BillItem, memberName: string) => {
    if (!bill.billingPeriodStart || !bill.billingPeriodEnd || !bill.memberStayPeriods) {
      return bill.totalAmount / roommates.length;
    }
    
    let totalStayDays = 0;
    let memberStayDays = 0;
    
    for (const [name, period] of Object.entries(bill.memberStayPeriods)) {
      const days = Math.max(0, differenceInDays(new Date(period.end), new Date(period.start)) + 1);
      totalStayDays += days;
      if (name === memberName) {
        memberStayDays = days;
      }
    }
    
    if (totalStayDays === 0) return bill.totalAmount / roommates.length;
    
    return (memberStayDays / totalStayDays) * bill.totalAmount;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
      {pinAction && (
        <PinModal 
          onSuccess={() => {
            if (pinAction.type === 'save_bill') executeAddEdit();
            if (pinAction.type === 'delete_bill') { onDeleteBill(pinAction.payload); setDeleteConfirmId(null); }
            if (pinAction.type === 'toggle_payment') executeTogglePayment(pinAction.payload);
            setPinAction(null);
          }}
          onCancel={() => setPinAction(null)}
        />
      )}

      <div className="flex p-1 bg-slate-900/90 rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 shadow-2xl flex-wrap gap-1">
        {(['ledger', 'expenses', 'rent', 'calc', 'history'] as const).map((t) => (
          <button key={t} onClick={() => setView(t)} className={`flex-1 basis-[30%] sm:basis-auto min-w-[70px] sm:min-w-[100px] py-3 px-1 sm:px-6 text-[9px] sm:text-[10px] font-black uppercase rounded-[1rem] sm:rounded-[2rem] transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 whitespace-nowrap shrink-0 ${view === t ? 'bg-primary text-white shadow-xl scale-[1.02]' : 'text-slate-500 hover:text-slate-400'}`}>
            {t === 'ledger' ? <Receipt size={14} /> : t === 'expenses' ? <PieChart size={14} /> : t === 'rent' ? <Calendar size={14} /> : t === 'calc' ? <Calculator size={14} /> : <History size={14} />}
            <span className="italic">{t === 'ledger' ? 'Current' : t === 'expenses' ? 'Tracker' : t === 'rent' ? 'Rent' : t === 'calc' ? 'Calc' : 'History'}</span>
          </button>
        ))}
      </div>

      {view === 'ledger' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-1 gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white italic uppercase tracking-tighter leading-none">Utility Entry</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Live House Bills</p>
            </div>
            <button onClick={() => { setShowAdd(!showAdd); setEditingBillId(null); }} className="w-full sm:w-auto bg-primary text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
              {showAdd ? 'Cancel' : '+ New Invoice'}
            </button>
          </header>

          {showAdd && (
            <form onSubmit={handleAddEditAttempt} className="bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-primary/10 shadow-2xl space-y-4 sm:space-y-5 animate-in zoom-in-95">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="relative group">
                  <input 
                    list="categories" 
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/30 rounded-2xl px-4 py-4 text-xs font-bold outline-none dark:text-white italic placeholder:text-slate-400 transition-all"
                    placeholder="Select or type category..."
                  />
                  <datalist id="categories">
                    {['Electricity', 'Water', 'Gas', 'Internet', 'Other'].map(cat => <option key={cat} value={cat} />)}
                  </datalist>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                    <ChevronDown size={14} strokeWidth={3} />
                  </div>
                </div>

                <div className="relative group">
                  <select value={formData.month} onChange={(e) => setFormData({...formData, month: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/30 rounded-2xl px-4 py-4 text-xs font-bold outline-none dark:text-white italic appearance-none cursor-pointer transition-all">
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                    <ChevronDown size={14} strokeWidth={3} />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1 group">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 group-focus-within:text-primary transition-colors">Billing Start</label>
                  <div className="relative">
                    <input type="date" value={formData.billingPeriodStart} onChange={(e) => setFormData({...formData, billingPeriodStart: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/30 rounded-2xl pl-4 pr-10 py-4 text-xs font-bold outline-none dark:text-white italic transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-700" />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                      <Calendar size={14} strokeWidth={3} />
                    </div>
                  </div>
                </div>
                <div className="space-y-1 group">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 group-focus-within:text-primary transition-colors">Billing End</label>
                  <div className="relative">
                    <input type="date" value={formData.billingPeriodEnd} onChange={(e) => setFormData({...formData, billingPeriodEnd: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/30 rounded-2xl pl-4 pr-10 py-4 text-xs font-bold outline-none dark:text-white italic transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-700" />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                      <Calendar size={14} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              </div>

              <input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} placeholder="Total Amount ($)" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-lg font-black text-primary shadow-inner outline-none italic" />
              
              <div className="relative group">
                <select value={formData.paidBy} onChange={(e) => setFormData({...formData, paidBy: e.target.value as any})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/30 rounded-2xl px-4 py-4 text-xs font-bold outline-none dark:text-white italic appearance-none cursor-pointer transition-all">
                  <option value="Not Paid Yet">Not Paid Yet</option>
                  {roommates.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                  <ChevronDown size={14} strokeWidth={3} />
                </div>
              </div>
              
              <input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Optional description" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-xs font-bold outline-none dark:text-white shadow-inner italic" />
              
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Resident Stay Periods</h4>
                <div className="space-y-3">
                  {roommates.map(r => (
                    <div key={r.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                      <div className="font-black text-xs uppercase italic text-slate-700 dark:text-slate-300 pl-2">{r.name}</div>
                      <div className="flex gap-2 sm:col-span-2">
                        <input type="date" value={formData.memberStayPeriods[r.name]?.start || formData.billingPeriodStart} onChange={(e) => setFormData({...formData, memberStayPeriods: {...formData.memberStayPeriods, [r.name]: {...formData.memberStayPeriods[r.name], start: e.target.value}}})} className="w-full bg-white dark:bg-slate-900 border-2 border-transparent focus:border-primary/30 rounded-xl px-2 py-2 text-[10px] font-bold outline-none dark:text-white italic transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800" />
                        <input type="date" value={formData.memberStayPeriods[r.name]?.end || formData.billingPeriodEnd} onChange={(e) => setFormData({...formData, memberStayPeriods: {...formData.memberStayPeriods, [r.name]: {...formData.memberStayPeriods[r.name], end: e.target.value}}})} className="w-full bg-white dark:bg-slate-900 border-2 border-transparent focus:border-primary/30 rounded-xl px-2 py-2 text-[10px] font-bold outline-none dark:text-white italic transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full py-5 bg-primary rounded-3xl font-black text-xs text-white uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-4">
                {editingBillId ? 'Update Utility Record' : 'Commit & Split Bill'}
              </button>
            </form>
          )}

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Most Recent Activity</h3>
            {bills.slice(0, 3).map(bill => (
              <div key={bill.id} className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group transition-all hover:shadow-xl hover:border-primary/20">
                <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl sm:text-2xl shadow-inner italic shrink-0">⚡</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-slate-800 dark:text-slate-200 text-sm uppercase tracking-tight italic truncate">{bill.category}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1 truncate">{bill.month} • Payor: {bill.paidBy}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0">
                  <div className="text-left sm:text-right"><p className="text-primary font-black text-xl sm:text-2xl tracking-tighter italic">${bill.totalAmount}</p></div>
                  <button onClick={() => setView('history')} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center hover:text-primary transition-all shrink-0"><ChevronRight size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'history' && (
        <div className="space-y-6 animate-in slide-in-from-right duration-300 pb-20">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-1 gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white italic uppercase tracking-tighter leading-none">Bill History</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Full House Archive</p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl self-end sm:self-auto"><History size={20} className="text-slate-400" /></div>
          </header>

          <div className="space-y-3">
            {bills.slice(0, showHistoryLimit).map((bill, idx) => (
              <div key={bill.id} className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col gap-4 group transition-all hover:shadow-2xl animate-in slide-in-from-bottom duration-500" style={{animationDelay: `${idx * 50}ms`}}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-xl shadow-inner italic shrink-0">📄</div>
                    <div className="min-w-0">
                      <h4 className="font-black text-slate-800 dark:text-white uppercase italic text-sm tracking-tight truncate">{bill.category} — {bill.month}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">Disbursed by {bill.paidBy}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0">
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tighter italic leading-none">${bill.totalAmount}</p>
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Total Due</p>
                  </div>
                </div>
                <div className="h-px bg-slate-50 dark:bg-slate-800" />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {roommates.slice(0, 4).map(r => <img key={r.id} src={r.avatar} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 -ml-2 first:ml-0" />)}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEditBill(bill)} className="p-3 text-slate-400 hover:text-primary transition-all"><Edit2 size={16} /></button>
                    <button onClick={() => setDeleteConfirmId(bill.id)} className="p-3 text-rose-300 hover:text-rose-500 transition-all"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[4rem] w-full max-w-sm border border-rose-500/20 shadow-2xl">
             <div className="flex justify-center mb-8"><div className="w-20 h-20 rounded-[2.5rem] bg-rose-500 text-white flex items-center justify-center shadow-2xl shadow-rose-500/30"><AlertCircle size={40} /></div></div>
             <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter text-center mb-4">Purge Record?</h3>
             <div className="grid grid-cols-2 gap-4">
               <button onClick={() => setDeleteConfirmId(null)} className="py-5 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-black text-[10px] uppercase tracking-widest">Abort</button>
               <button onClick={confirmDelete} className="py-5 rounded-3xl bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest">Confirm</button>
             </div>
          </div>
        </div>
      )}

      {view === 'expenses' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <header><h2 className="text-2xl font-black text-slate-800 dark:text-white italic uppercase tracking-tighter">Net Debt Summary</h2></header>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {roommates.map(member => {
              const remaining = bills.reduce((sum, b) => {
                if (b.paidBy === member.name) return sum;
                if (b.paidBy === 'Not Paid Yet') return sum + calculateMemberShare(b, member.name);
                return sum + calculateMemberShare(b, member.name);
              }, 0) - payments.filter(p => p.memberId === member.name).reduce((sum, p) => sum + p.amount, 0);
              
              // If the member paid for bills, we should subtract the amount others owe them from their debt
              // Wait, the current logic is:
              // Debt = (sum of their share in bills they didn't pay) - (payments they made)
              // But if they paid a bill, others owe them. So their debt should be reduced by what others owe them.
              // Let's refine the net debt calculation:
              // Net Debt = (Total of their shares across ALL bills) - (Total they paid for bills) - (Total payments they made to others) + (Total payments others made to them)
              // Actually, simpler:
              // Total Owed By Member = sum of their shares in all bills
              // Total Paid By Member = sum of (bill.totalAmount if they paid it) + sum of (payments they made)
              // Net Debt = Total Owed By Member - Total Paid By Member
              
              const totalOwed = bills.reduce((sum, b) => sum + calculateMemberShare(b, member.name), 0);
              const totalPaid = bills.reduce((sum, b) => b.paidBy === member.name ? sum + b.totalAmount : sum, 0) + payments.filter(p => p.memberId === member.name).reduce((sum, p) => sum + p.amount, 0);
              const netDebt = totalOwed - totalPaid;

              return (
                <button key={member.id} onClick={() => setActiveMemberId(member.id)} className="bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:shadow-2xl text-left">
                  <div className="flex items-center gap-4 sm:gap-5"><img src={member.avatar} className="w-12 h-12 sm:w-16 sm:h-16 rounded-[1.5rem] sm:rounded-[2rem] object-cover border-4 border-slate-50 dark:border-slate-800 shadow-md shrink-0" /><div><p className="font-black text-slate-800 dark:text-white uppercase text-sm sm:text-base italic tracking-tighter">{member.name}</p></div></div>
                  <div className={`w-full sm:w-auto text-right px-5 sm:px-6 py-3 sm:py-4 rounded-2xl sm:rounded-3xl flex items-center justify-between sm:justify-end gap-3 ${netDebt <= 0.1 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {netDebt <= 0.1 ? <Check size={18} strokeWidth={3} /> : <ArrowUpRight size={18} strokeWidth={3} />}
                    <span className="font-black tracking-tighter text-xl sm:text-2xl italic">${Math.abs(netDebt).toFixed(1)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {view === 'rent' && (
        <div className="space-y-6 animate-in slide-in-from-right duration-300 pb-20">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-1 gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white italic uppercase tracking-tighter leading-none">Rent Schedule</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Upcoming Payments</p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl self-end sm:self-auto"><Calendar size={20} className="text-slate-400" /></div>
          </header>

          <div className="space-y-3">
            {rentDates.map((rent, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col gap-4 group transition-all hover:shadow-2xl animate-in slide-in-from-bottom duration-500" style={{animationDelay: `${idx * 50}ms`}}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                      <Calendar size={20} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-slate-800 dark:text-white uppercase italic text-sm tracking-tight truncate">{format(new Date(rent.date), 'MMMM do, yyyy')}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">Rent Payment</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0">
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tighter italic leading-none">${rent.amount}</p>
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Total Due</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeMemberId && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] w-full max-w-lg border border-white/10 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-10"><h3 className="font-black text-slate-800 dark:text-white uppercase text-lg italic tracking-tighter">Resident Ledger</h3><button onClick={() => setActiveMemberId(null)} className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center"><X size={24} /></button></div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {bills.map(bill => {
                const activeMemberName = roommates.find(r => r.id === activeMemberId)?.name || '';
                const isPayer = bill.paidBy === activeMemberName;
                const split = calculateMemberShare(bill, activeMemberName);
                
                if (split <= 0 && !isPayer) return null; // Skip if they don't owe anything and didn't pay
                
                const paid = payments.some(p => p.billId === bill.id && p.memberId === activeMemberName);
                
                return (
                  <div key={bill.id} className="bg-slate-50 dark:bg-slate-800/50 p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div className="w-full sm:w-auto">
                      <p className="font-black text-slate-800 dark:text-white uppercase italic text-sm tracking-tight truncate">{bill.category}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{bill.month} • {bill.billingPeriodStart && bill.billingPeriodEnd ? `${format(new Date(bill.billingPeriodStart), 'MMM d')} - ${format(new Date(bill.billingPeriodEnd), 'MMM d')}` : 'No Period'}</p>
                      {isPayer && <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mt-1">Paid by them</p>}
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-slate-200 dark:border-slate-700 pt-3 sm:pt-0">
                      <span className="text-xl font-black text-slate-800 dark:text-slate-100 italic tracking-tighter">${isPayer ? bill.totalAmount.toFixed(1) : split.toFixed(1)}</span>
                      {!isPayer && (
                        <button onClick={() => handleTogglePaymentAttempt(bill.id, activeMemberName, split)} className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shrink-0 ${paid ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white dark:bg-slate-700 text-slate-300 shadow-sm hover:bg-slate-200 dark:hover:bg-slate-600'}`}><Check size={18} strokeWidth={3} /></button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {view === 'calc' && (
        <div className="space-y-6 animate-in zoom-in-95 duration-300 max-w-4xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 items-start">
            <div className="bg-white dark:bg-slate-900 p-3 sm:p-8 rounded-[2rem] sm:rounded-[4rem] border-2 border-slate-50 dark:border-slate-800 shadow-2xl space-y-4 sm:space-y-8">
              <header className="flex justify-between items-center px-2 sm:px-4"><div className="flex items-center gap-3"><div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><Calculator size={18} className="sm:w-5 sm:h-5" /></div><h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white italic uppercase tracking-tighter">Math Engine</h2></div></header>
              <div className="bg-slate-950 p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] text-right min-h-[100px] sm:min-h-[160px] flex flex-col justify-end shadow-2xl border-4 border-slate-900 relative group overflow-hidden">
                {lastResult && <div className="text-[9px] sm:text-[10px] font-black text-slate-600 tracking-widest h-4 mb-1 truncate">{lastResult}</div>}
                <div className="text-[10px] sm:text-xs font-black text-slate-500 tracking-widest h-6 mb-1 truncate">{calcExpression}</div>
                <div className="text-3xl sm:text-6xl font-black text-white tracking-tighter italic truncate">{calcDisplay}</div>
              </div>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-4">
                {['AC', 'DEL', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '=', 'Split'].map(btn => (
                  <button key={btn} onClick={() => handleCalcButton(btn)} className={`h-12 sm:h-20 rounded-xl sm:rounded-3xl font-black text-base sm:text-xl flex items-center justify-center transition-all active:scale-90 shadow-sm border-2 ${btn === 'AC' || btn === 'DEL' ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700' : ['+', '-', '×', '÷', '%', '=', 'Split'].includes(btn) ? 'bg-primary text-white border-primary-hover shadow-primary/20' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-700'}`}>{btn === 'Split' ? '÷8' : btn}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceView;
