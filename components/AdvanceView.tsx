
import React, { useState } from 'react';
import { Member, MemberName, MemberAdvanceDetails } from '../types';
import { ShieldCheck, TrendingUp, Info, User, Check, X, ImageIcon } from 'lucide-react';
import PinModal from './PinModal';

interface AdvanceViewProps {
  roommates: Member[];
  advanceData: Record<MemberName, MemberAdvanceDetails>;
  onUpdateAdvance: (name: MemberName, details: MemberAdvanceDetails) => void;
  onImageClick?: (src: string) => void;
}

const AdvanceView: React.FC<AdvanceViewProps> = ({ roommates, advanceData, onUpdateAdvance, onImageClick }) => {
  const [editingMember, setEditingMember] = useState<MemberName | null>(null);
  const [editForm, setEditForm] = useState<MemberAdvanceDetails>({ security: 0, topUp: 0, notes: '' });
  const [showPin, setShowPin] = useState(false);

  const totalHousePool = roommates.reduce((sum, m) => {
    const data = advanceData[m.name as MemberName];
    return sum + (data?.security || 0) + (data?.topUp || 0);
  }, 0);

  const startEditing = (m: Member) => {
    const data = advanceData[m.name as MemberName];
    setEditForm({
      security: data?.security || m.initialAdvance,
      topUp: data?.topUp || 0,
      notes: data?.notes || ''
    });
    setEditingMember(m.name as MemberName);
  };

  const handleSaveAttempt = () => {
    setShowPin(true);
  };

  const handleFinalSave = () => {
    if (editingMember) {
      onUpdateAdvance(editingMember, editForm);
      setEditingMember(null);
      setShowPin(false);
    }
  };

  return (
    <div className="space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 px-1 sm:px-0">
      {showPin && (
        <PinModal onSuccess={handleFinalSave} onCancel={() => setShowPin(false)} />
      )}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-tighter italic truncate">Security Advance</h2>
          <p className="text-xs font-black text-indigo-500 uppercase tracking-widest truncate mt-1">Bond Ledger & House Funds Pool</p>
        </div>
        <div className="bg-slate-900 px-8 py-5 rounded-[2rem] text-white shadow-2xl flex flex-col items-center sm:items-end">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Total Pooled Balance</p>
          <p className="text-3xl font-black tracking-tighter italic text-indigo-400">${totalHousePool.toLocaleString()}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {roommates.map((member) => {
          const data = advanceData[member.name as MemberName] || { security: member.initialAdvance, topUp: 0 };
          const netTotal = data.security + data.topUp;
          return (
            <div key={member.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-50 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all p-6 sm:p-8">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <img src={member.avatar} className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl object-cover border-4 border-slate-50 dark:border-slate-800 shadow-md" />
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">{member.name}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resident Contributor</p>
                  </div>
                </div>
                <button onClick={() => startEditing(member)} className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">Manage</button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-indigo-50/30 dark:bg-indigo-900/10 p-5 rounded-[2rem] border border-indigo-50 dark:border-indigo-900/20">
                  <div className="flex items-center gap-2 mb-2"><ShieldCheck size={14} className="text-indigo-400" /><p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Base Security</p></div>
                  <p className="text-2xl font-black text-indigo-600 tracking-tighter">${data.security}</p>
                </div>
                <div className="bg-emerald-50/30 dark:bg-emerald-900/10 p-5 rounded-[2rem] border border-emerald-50 dark:border-emerald-900/20">
                  <div className="flex items-center gap-2 mb-2"><TrendingUp size={14} className="text-emerald-400" /><p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Extra Top-Up</p></div>
                  <p className="text-2xl font-black text-emerald-600 tracking-tighter">${data.topUp}</p>
                </div>
              </div>
              <div className="flex items-center justify-between px-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Net Personal Fund</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">${netTotal}</p>
              </div>
            </div>
          );
        })}
      </div>

      {editingMember && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setEditingMember(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-md border border-white/10 shadow-2xl p-8 sm:p-10">
            <header className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Adjust Advance</h3>
              <button onClick={() => setEditingMember(null)} className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center"><X size={20} /></button>
            </header>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1"><ShieldCheck size={14} className="text-indigo-600" /> Original Security Deposit ($)</label>
                <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 text-lg font-black dark:text-white outline-none" value={editForm.security} onChange={e => setEditForm({ ...editForm, security: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1"><TrendingUp size={14} className="text-emerald-600" /> Additional Top-Up Funds ($)</label>
                <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-6 py-4 text-lg font-black dark:text-white outline-none" value={editForm.topUp} onChange={e => setEditForm({ ...editForm, topUp: parseFloat(e.target.value) || 0 })} />
              </div>
              <button onClick={handleSaveAttempt} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 italic">Save Adjustments</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvanceView;
