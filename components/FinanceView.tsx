
import React, { useState, useMemo } from 'react';
import { Member, BillItem, MemberName, BillPayment } from '../types';
import { getRentSchedule } from '../services/dataService';
import { format } from 'date-fns';
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
  ArrowUpRight
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
    paidBy: roommates[0]?.name || '' as MemberName
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
          paidBy: formData.paidBy as MemberName,
          month: formData.month
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
        paidBy: formData.paidBy as MemberName
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
      paidBy: bill.paidBy
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
        const result = new Function(`return ${(calcExpression + calcDisplay).replace(/×/g, '*').replace(/÷/g, '/')}`)();
        setCalcDisplay(result.toString());
        setCalcExpression('');
        setResetDisplay(true);
      } catch { setCalcDisplay('Error'); }
    } else if (val === 'Split') {
      const amt = parseFloat(calcDisplay);
      if (!isNaN(amt) && amt > 0) {
        const split = (amt / 8).toFixed(2);
        setCalcHistory(prev => [{ amount: amt.toString(), split, timestamp: format(new Date(), 'HH:mm') }, ...prev.slice(0, 4)]);
        setCalcDisplay(split);
        setResetDisplay(true);
      }
    } else {
      if (resetDisplay) { setCalcDisplay(val === '.' ? '0.' : val); setResetDisplay(false); }
      else { if (val === '.' && calcDisplay.includes('.')) return; setCalcDisplay(prev => (prev === '0' && val !== '.' ? val : prev + val)); }
    }
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

      <div className="flex p-1 bg-slate-900/90 rounded-[2.5rem] border border-white/5 shadow-2xl overflow-x-auto no-scrollbar">
        {(['ledger', 'expenses', 'rent', 'calc', 'history'] as const).map((t) => (
          <button key={t} onClick={() => setView(t)} className={`flex-1 py-3.5 px-6 text-[10px] font-black uppercase rounded-[2rem] transition-all flex items-center justify-center gap-2 whitespace-nowrap ${view === t ? 'bg-primary text-white shadow-xl scale-[1.02]' : 'text-slate-500 hover:text-slate-400'}`}>
            {t === 'ledger' ? <Receipt size={14} /> : t === 'expenses' ? <PieChart size={14} /> : t === 'rent' ? <Calendar size={14} /> : t === 'calc' ? <Calculator size={14} /> : <History size={14} />}
            <span className="italic">{t === 'ledger' ? 'Current' : t === 'expenses' ? 'Tracker' : t === 'rent' ? 'Rent' : t === 'calc' ? 'Calc' : 'History'}</span>
          </button>
        ))}
      </div>

      {view === 'ledger' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <header className="flex justify-between items-center px-1">
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white italic uppercase tracking-tighter leading-none">Utility Entry</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Live House Bills</p>
            </div>
            <button onClick={() => { setShowAdd(!showAdd); setEditingBillId(null); }} className="bg-primary text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
              {showAdd ? 'Cancel' : '+ New Invoice'}
            </button>
          </header>

          {showAdd && (
            <form onSubmit={handleAddEditAttempt} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-primary/10 shadow-2xl space-y-5 animate-in zoom-in-95">
              <div className="grid grid-cols-2 gap-4">
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value as any})} className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-4 text-xs font-bold outline-none dark:text-white italic appearance-none">
                  {['Electricity', 'Water', 'Gas', 'Internet', 'Other'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <select value={formData.month} onChange={(e) => setFormData({...formData, month: e.target.value})} className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-4 text-xs font-bold outline-none dark:text-white italic appearance-none">
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} placeholder="Total Amount ($)" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-lg font-black text-primary shadow-inner outline-none italic" />
              <select value={formData.paidBy} onChange={(e) => setFormData({...formData, paidBy: e.target.value as MemberName})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-4 text-xs font-bold outline-none dark:text-white italic appearance-none">
                {roommates.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
              <input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Optional description" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-xs font-bold outline-none dark:text-white shadow-inner italic" />
              <button type="submit" className="w-full py-5 bg-primary rounded-3xl font-black text-xs text-white uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                {editingBillId ? 'Update Utility Record' : 'Commit & Split Bill'}
              </button>
            </form>
          )}

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Most Recent Activity</h3>
            {bills.slice(0, 3).map(bill => (
              <div key={bill.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex justify-between items-center group transition-all hover:shadow-xl hover:border-primary/20">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl shadow-inner italic">⚡</div>
                  <div>
                    <p className="font-black text-slate-800 dark:text-slate-200 text-sm uppercase tracking-tight italic">{bill.category}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">{bill.month} • Payor: {bill.paidBy}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right"><p className="text-primary font-black text-2xl tracking-tighter italic">${bill.totalAmount}</p></div>
                  <button onClick={() => setView('history')} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center hover:text-primary transition-all"><ChevronRight size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'history' && (
        <div className="space-y-6 animate-in slide-in-from-right duration-300 pb-20">
          <header className="flex justify-between items-center px-1">
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white italic uppercase tracking-tighter leading-none">Bill History</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Full House Archive</p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl"><History size={20} className="text-slate-400" /></div>
          </header>

          <div className="space-y-3">
            {bills.slice(0, showHistoryLimit).map((bill, idx) => (
              <div key={bill.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col gap-4 group transition-all hover:shadow-2xl animate-in slide-in-from-bottom duration-500" style={{animationDelay: `${idx * 50}ms`}}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-xl shadow-inner italic">📄</div>
                    <div>
                      <h4 className="font-black text-slate-800 dark:text-white uppercase italic text-sm tracking-tight">{bill.category} — {bill.month}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Disbursed by {bill.paidBy}</p>
                    </div>
                  </div>
                  <div className="text-right">
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
              const remaining = bills.reduce((sum, b) => b.paidBy === member.name ? sum : sum + (b.totalAmount / roommates.length), 0) - payments.filter(p => p.memberId === member.name).reduce((sum, p) => sum + p.amount, 0);
              return (
                <button key={member.id} onClick={() => setActiveMemberId(member.id)} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 flex items-center justify-between transition-all hover:shadow-2xl">
                  <div className="flex items-center gap-5"><img src={member.avatar} className="w-16 h-16 rounded-[2rem] object-cover border-4 border-slate-50 dark:border-slate-800 shadow-md" /><div><p className="font-black text-slate-800 dark:text-white uppercase text-base italic tracking-tighter">{member.name}</p></div></div>
                  <div className={`text-right px-6 py-4 rounded-3xl flex items-center gap-3 ${remaining <= 0.1 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {remaining <= 0.1 ? <Check size={18} strokeWidth={3} /> : <ArrowUpRight size={18} strokeWidth={3} />}
                    <span className="font-black tracking-tighter text-2xl italic">${Math.abs(remaining).toFixed(1)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeMemberId && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] w-full max-w-lg border border-white/10 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-10"><h3 className="font-black text-slate-800 dark:text-white uppercase text-lg italic tracking-tighter">Resident Ledger</h3><button onClick={() => setActiveMemberId(null)} className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center"><X size={24} /></button></div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {bills.map(bill => {
                if (bill.paidBy === roommates.find(r => r.id === activeMemberId)?.name) return null;
                const split = bill.totalAmount / roommates.length;
                const paid = payments.some(p => p.billId === bill.id && p.memberId === roommates.find(r => r.id === activeMemberId)?.name);
                return (
                  <div key={bill.id} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex justify-between items-center mb-4">
                    <div><p className="font-black text-slate-800 dark:text-white uppercase italic text-sm tracking-tight">{bill.category}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{bill.month}</p></div>
                    <div className="flex items-center gap-6"><span className="text-xl font-black text-slate-800 dark:text-slate-100 italic tracking-tighter">${split.toFixed(1)}</span>
                      <button onClick={() => handleTogglePaymentAttempt(bill.id, roommates.find(r => r.id === activeMemberId)!.name, split)} className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${paid ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white dark:bg-slate-700 text-slate-300 shadow-sm'}`}><Check size={18} strokeWidth={3} /></button>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[4rem] border-2 border-slate-50 dark:border-slate-800 shadow-2xl space-y-8">
              <header className="flex justify-between items-center px-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><Calculator size={20} /></div><h2 className="text-xl font-black text-slate-800 dark:text-white italic uppercase tracking-tighter">Math Engine</h2></div></header>
              <div className="bg-slate-950 p-8 rounded-[2.5rem] text-right min-h-[160px] flex flex-col justify-end shadow-2xl border-4 border-slate-900 relative group">
                <div className="text-xs font-black text-slate-500 tracking-widest h-6 mb-1">{calcExpression}</div>
                <div className="text-6xl font-black text-white tracking-tighter italic">{calcDisplay}</div>
              </div>
              <div className="grid grid-cols-4 gap-3 sm:gap-4">
                {['AC', 'DEL', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '=', 'Split'].map(btn => (
                  <button key={btn} onClick={() => handleCalcButton(btn)} className={`h-16 sm:h-20 rounded-3xl font-black text-xl flex items-center justify-center transition-all active:scale-90 shadow-sm border-2 ${btn === 'AC' || btn === 'DEL' ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700' : ['+', '-', '×', '÷', '%', '=', 'Split'].includes(btn) ? 'bg-primary text-white border-primary-hover shadow-primary/20' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-700'}`}>{btn === 'Split' ? '÷8' : btn}</button>
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
