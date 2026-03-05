
import React, { useState, useMemo, useEffect } from 'react';
import { format, differenceInDays, parseISO, addMonths, startOfMonth } from 'date-fns';
import { 
  Calculator, 
  Calendar, 
  Users, 
  Plus, 
  Trash2, 
  Info, 
  ChevronDown, 
  Search,
  Check,
  X,
  DollarSign,
  Clock
} from 'lucide-react';
import { Member, BillItem } from '../types';

interface BillCalculatorProps {
  roommates: Member[];
  onAddBill: (bill: BillItem) => void;
}

interface CalculationMember {
  id: string;
  name: string;
  stayStart: string;
  stayEnd: string;
  isTemporary?: boolean;
}

const BillCalculator: React.FC<BillCalculatorProps> = ({ roommates, onAddBill }) => {
  const [billType, setBillType] = useState('Electricity');
  const [customBillType, setCustomBillType] = useState('');
  const [billingStart, setBillingStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [billingEnd, setBillingEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMonths, setSelectedMonths] = useState<string[]>([format(new Date(), 'MMMM')]);
  const [totalAmount, setTotalAmount] = useState('');
  const [description, setDescription] = useState('');
  
  const [calcMembers, setCalcMembers] = useState<CalculationMember[]>([]);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [prevBillingStart, setPrevBillingStart] = useState(billingStart);
  const [prevBillingEnd, setPrevBillingEnd] = useState(billingEnd);

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberData, setNewMemberData] = useState({ name: '', start: billingStart, end: billingEnd });

  // Initialize members only once or when roommates change
  useEffect(() => {
    if (calcMembers.length === 0) {
      setCalcMembers(roommates.map(r => ({
        id: r.id,
        name: r.name,
        stayStart: billingStart,
        stayEnd: billingEnd
      })));
    }
  }, [roommates]);

  // Update dates for members when billing dates change, but only if they matched the previous billing dates
  useEffect(() => {
    setCalcMembers(prev => prev.map(m => ({
      ...m,
      stayStart: m.stayStart === prevBillingStart ? billingStart : m.stayStart,
      stayEnd: m.stayEnd === prevBillingEnd ? billingEnd : m.stayEnd
    })));
    setPrevBillingStart(billingStart);
    setPrevBillingEnd(billingEnd);
    setNewMemberData(prev => ({ ...prev, start: billingStart, end: billingEnd }));
  }, [billingStart, billingEnd]);

  const billTypes = ['Gas', 'Electricity', 'Water', 'Internet', 'Grass Cutting', 'Other'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleAddMember = () => {
    if (!newMemberData.name.trim()) return;
    
    const newMember: CalculationMember = {
      id: `temp-${Math.random().toString(36).substr(2, 9)}`,
      name: newMemberData.name,
      stayStart: newMemberData.start,
      stayEnd: newMemberData.end,
      isTemporary: true
    };
    
    setCalcMembers(prev => [...prev, newMember]);
    setNewMemberData({ name: '', start: billingStart, end: billingEnd });
    setShowAddMemberModal(false);
  };

  const handleSaveBill = () => {
    if (!results || !totalAmount) return;

    const memberFinances: Record<string, any> = {};
    const stayPeriods: Record<string, { start: string, end: string }> = {};

    results.breakdown.forEach(m => {
      memberFinances[m.name] = {
        paid: false,
        given: 0,
        due: m.share
      };
      stayPeriods[m.name] = {
        start: m.stayStart,
        end: m.stayEnd
      };
    });

    const newBill: BillItem = {
      id: Math.random().toString(36).substr(2, 9),
      category: billType,
      month: selectedMonths.join(', '),
      totalAmount: parseFloat(totalAmount),
      dueDate: new Date().toISOString(),
      memberFinances,
      isFinalized: false,
      paidBy: 'Not Paid Yet',
      description,
      billingPeriodStart: billingStart,
      billingPeriodEnd: billingEnd,
      memberStayPeriods: stayPeriods
    };

    onAddBill(newBill);
    alert('Bill added successfully!');
  };

  const handleRemoveMember = (id: string) => {
    setCalcMembers(calcMembers.filter(m => m.id !== id));
  };

  const updateMemberStay = (id: string, field: 'stayStart' | 'stayEnd', value: string) => {
    setCalcMembers(calcMembers.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const toggleMonth = (month: string) => {
    if (selectedMonths.includes(month)) {
      setSelectedMonths(selectedMonths.filter(m => m !== month));
    } else {
      setSelectedMonths([...selectedMonths, month]);
    }
  };

  const results = useMemo(() => {
    const amount = parseFloat(totalAmount) || 0;
    if (amount <= 0 || calcMembers.length === 0) return null;

    let totalHouseDays = 0;
    const memberStats = calcMembers.map(m => {
      // Inclusive calculation: difference + 1
      const start = parseISO(m.stayStart);
      const end = parseISO(m.stayEnd);
      const days = Math.max(0, differenceInDays(end, start) + 1);
      totalHouseDays += days;
      return { ...m, days };
    });

    if (totalHouseDays === 0) return null;

    const dailyRate = amount / totalHouseDays;
    const breakdown = memberStats.map(m => ({
      ...m,
      share: Math.floor(m.days * dailyRate * 100) / 100 // Use floor to avoid over-collecting
    }));

    // Adjust the last member's share slightly to match the total exactly due to rounding
    const currentTotal = breakdown.reduce((sum, m) => sum + m.share, 0);
    const diff = amount - currentTotal;
    if (diff !== 0 && breakdown.length > 0) {
      breakdown[breakdown.length - 1].share = Math.round((breakdown[breakdown.length - 1].share + diff) * 100) / 100;
    }

    return {
      totalHouseDays,
      dailyRate: dailyRate.toFixed(4),
      breakdown
    };
  }, [totalAmount, calcMembers]);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white italic uppercase tracking-tighter leading-none">Bill Calculator</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Pro-Rata Precision Engine</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-xl p-2 rounded-2xl border border-white/5">
          <Calculator size={16} className="text-primary animate-pulse" />
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Glassmorphism Mode</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/5 backdrop-blur-xl dark:bg-slate-900/40 p-6 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-5">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
              <Info size={12} /> Bill Details
            </h3>

            {/* Bill Type */}
            <div className="space-y-2 relative">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Bill Type</label>
              <div className="relative">
                <input 
                  type="text"
                  value={isTypeDropdownOpen ? customBillType : billType}
                  onChange={(e) => {
                    setCustomBillType(e.target.value);
                    setBillType(e.target.value);
                  }}
                  onFocus={() => setIsTypeDropdownOpen(true)}
                  className="w-full bg-slate-100 dark:bg-slate-950/50 border-2 border-slate-200 dark:border-white/5 focus:border-primary/30 rounded-2xl pl-4 pr-10 py-4 text-xs font-bold outline-none text-slate-900 dark:text-white italic transition-all"
                  placeholder="Select or type type..."
                />
                <button 
                  type="button"
                  onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  <ChevronDown size={16} />
                </button>
                
                {isTypeDropdownOpen && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    {billTypes.map(type => (
                      <button
                        key={type}
                        onClick={() => {
                          setBillType(type);
                          setIsTypeDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left text-xs font-bold text-slate-300 hover:bg-primary hover:text-white transition-colors border-b border-white/5 last:border-0"
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Billing Start</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={billingStart} 
                    onChange={(e) => setBillingStart(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-950/50 border-2 border-slate-200 dark:border-white/5 focus:border-primary/30 rounded-2xl px-4 py-4 text-[10px] font-bold outline-none text-slate-900 dark:text-white italic transition-all"
                  />
                  <Calendar size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Billing End</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={billingEnd} 
                    onChange={(e) => setBillingEnd(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-950/50 border-2 border-slate-200 dark:border-white/5 focus:border-primary/30 rounded-2xl px-4 py-4 text-[10px] font-bold outline-none text-slate-900 dark:text-white italic transition-all"
                  />
                  <Calendar size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Month Multi-select */}
            <div className="space-y-2 relative">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Months Covered</label>
              <div 
                onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                className="w-full bg-slate-100 dark:bg-slate-950/50 border-2 border-slate-200 dark:border-white/5 rounded-2xl px-4 py-4 text-xs font-bold text-slate-900 dark:text-white italic cursor-pointer flex justify-between items-center"
              >
                <span className="truncate">
                  {selectedMonths.length === 0 ? 'Select months...' : selectedMonths.join(', ')}
                </span>
                <ChevronDown size={16} className="text-slate-400" />
              </div>
              
              {isMonthDropdownOpen && (
                <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-2 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto no-scrollbar">
                    {months.map(month => (
                      <button
                        key={month}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMonth(month);
                        }}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all flex items-center justify-between ${
                          selectedMonths.includes(month) 
                            ? 'bg-primary text-white' 
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {month}
                        {selectedMonths.includes(month) && <Check size={10} />}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setIsMonthDropdownOpen(false)}
                    className="w-full mt-2 py-2 bg-slate-800 text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-widest"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            {/* Total Amount */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Total Amount ($)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={totalAmount} 
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-100 dark:bg-slate-950/50 border-2 border-slate-200 dark:border-white/5 focus:border-primary/30 rounded-2xl pl-10 pr-4 py-4 text-xl font-black outline-none text-primary italic transition-all"
                />
                <DollarSign size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50" />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Notes</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional notes..."
                rows={3}
                className="w-full bg-slate-100 dark:bg-slate-950/50 border-2 border-slate-200 dark:border-white/5 focus:border-primary/30 rounded-2xl px-4 py-4 text-xs font-bold outline-none text-slate-900 dark:text-white italic transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Member Stay Logic & Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 backdrop-blur-xl dark:bg-slate-900/40 p-6 rounded-[2.5rem] border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                <Users size={12} /> Resident Stay Periods
              </h3>
              <button 
                onClick={() => setShowAddMemberModal(true)}
                className="flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all active:scale-95"
              >
                <Plus size={14} /> Add Member
              </button>
            </div>

            {/* Member List */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
              {calcMembers.map(member => (
                <div key={member.id} className="bg-slate-100 dark:bg-slate-950/30 border border-slate-200 dark:border-white/5 p-4 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-3 min-w-[120px]">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black italic">
                      {member.name.charAt(0)}
                    </div>
                    <span className="text-xs font-black text-slate-800 dark:text-white uppercase italic truncate">{member.name}</span>
                  </div>
                  
                  <div className="flex flex-1 gap-2 w-full sm:w-auto">
                    <div className="flex-1 relative">
                      <input 
                        type="date" 
                        value={member.stayStart} 
                        onChange={(e) => updateMemberStay(member.id, 'stayStart', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-xl px-3 py-2 text-[9px] font-bold text-slate-600 dark:text-slate-300 outline-none focus:border-primary/30"
                      />
                    </div>
                    <div className="flex-1 relative">
                      <input 
                        type="date" 
                        value={member.stayEnd} 
                        onChange={(e) => updateMemberStay(member.id, 'stayEnd', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-xl px-3 py-2 text-[9px] font-bold text-slate-600 dark:text-slate-300 outline-none focus:border-primary/30"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-2 text-slate-500 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Results Summary */}
          {results && (
            <div className="bg-slate-100 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-[2.5rem] border border-primary/20 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                    <Calculator size={12} /> Calculation Summary
                  </h3>
                  <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">Daily Rate: ${results.dailyRate} / Total House-Days: {results.totalHouseDays}</p>
                </div>
                <div className="bg-primary text-white px-6 py-3 rounded-2xl text-xl font-black italic tracking-tighter shadow-xl">
                  ${parseFloat(totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-primary/20">
                      <th className="pb-3 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Resident</th>
                      <th className="pb-3 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Days</th>
                      <th className="pb-3 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/10">
                    {results.breakdown.map(m => (
                      <tr key={m.id} className="group">
                        <td className="py-3">
                          <span className="text-xs font-black text-slate-800 dark:text-white uppercase italic">{m.name}</span>
                        </td>
                        <td className="py-3 text-center">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{m.days}</span>
                        </td>
                        <td className="py-3 text-right">
                          <span className="text-sm font-black text-primary italic">${m.share.toFixed(2)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 pt-6 border-t border-primary/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Clock size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Calculated {format(new Date(), 'HH:mm')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Split:</span>
                    <span className="text-sm font-black text-slate-800 dark:text-white italic">${results.breakdown.reduce((s, m) => s + m.share, 0).toFixed(2)}</span>
                  </div>
                </div>
                <button 
                  onClick={handleSaveBill}
                  className="w-full sm:w-auto bg-emerald-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={14} /> Add the Bill
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] w-full max-w-sm border border-white/10 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">New Member</h3>
              <button onClick={() => setShowAddMemberModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Member Name</label>
                <input 
                  type="text" 
                  value={newMemberData.name}
                  onChange={(e) => setNewMemberData({ ...newMemberData, name: e.target.value })}
                  placeholder="Enter name..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/30 rounded-2xl px-4 py-4 text-xs font-bold outline-none dark:text-white italic transition-all"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Stay Start</label>
                  <input 
                    type="date" 
                    value={newMemberData.start}
                    onChange={(e) => setNewMemberData({ ...newMemberData, start: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/30 rounded-2xl px-4 py-4 text-[10px] font-bold outline-none dark:text-white italic transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Stay End</label>
                  <input 
                    type="date" 
                    value={newMemberData.end}
                    onChange={(e) => setNewMemberData({ ...newMemberData, end: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/30 rounded-2xl px-4 py-4 text-[10px] font-bold outline-none dark:text-white italic transition-all"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleAddMember}
              className="w-full py-5 bg-primary rounded-3xl font-black text-xs text-white uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              Add Member
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillCalculator;
