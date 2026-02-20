
import React, { useState } from 'react';
import { Member, AppState } from '../types';
import { Users, Lock, ShieldCheck, Trash2, Edit2, UserPlus, X, Save, Phone, Mail, Cake, DollarSign, Database, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import BeautifulDatePicker from './BeautifulDatePicker';

interface MembersViewProps {
  state: AppState;
  onAddMember: (m: Member) => void;
  onUpdateMember: (m: Member) => void;
  onDeleteMember: (id: string) => void;
}

const MembersView: React.FC<MembersViewProps> = ({ state, onAddMember, onUpdateMember, onDeleteMember }) => {
  const [pin, setPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState<Member | null>(null);
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1535') {
      setIsUnlocked(true);
      setError('');
    } else {
      setError('Invalid Access Token');
      setPin('');
    }
  };

  const openAddForm = () => {
    const defaultMember: Member = {
      id: '',
      name: '',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + Math.random(),
      phone: '',
      email: '',
      dob: '1995-01-01',
      initialAdvance: 400,
      rentShare: 400,
      isHome: true
    };
    setEditForm(defaultMember);
    setIsAdding(true);
    setEditingId(null);
  };

  const startEditing = (m: Member) => {
    setEditForm({ ...m });
    setEditingId(m.id);
    setIsAdding(false);
  };

  const handleSave = () => {
    if (!editForm) return;
    if (!editForm.name.trim()) {
      alert("Please enter a name.");
      return;
    }

    if (isAdding) {
      onAddMember(editForm);
    } else {
      onUpdateMember(editForm);
    }
    
    setEditingId(null);
    setIsAdding(false);
    setEditForm(null);
  };

  const confirmDelete = (id: string) => {
    if (confirm("Permanently remove this resident from the index?")) {
      onDeleteMember(id);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-2xl w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center text-emerald-600 mx-auto mb-8">
            {/* Corrected: Changing size(40) to size={40} */}
            <Lock size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter mb-2">Authority Required</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Accessing Resident Registry</p>
          
          <form onSubmit={handleUnlock} className="space-y-4">
            <input 
              type="password" 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-6 py-4 text-center text-2xl font-black tracking-[1em] outline-none transition-all dark:text-white"
            />
            {error && <p className="text-rose-500 text-[9px] font-black uppercase tracking-widest animate-bounce">{error}</p>}
            <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all italic">
              Verify Identity
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      <header className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Resident Index</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Master Resident Database</p>
        </div>
        <button 
          onClick={openAddForm}
          className="bg-emerald-600 text-white px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-[1.05] active:scale-95 transition-all italic flex items-center gap-2"
        >
          <UserPlus size={18} /> New Resident
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {state.members.map((member) => (
          <div key={member.id} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-6 group hover:shadow-xl transition-all">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-5">
                <img src={member.avatar} className="w-16 h-16 rounded-[2rem] object-cover border-4 border-slate-50 dark:border-slate-800 shadow-md" />
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter leading-none">{member.name}</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Active Resident
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => startEditing(member)}
                  className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary transition-all flex items-center justify-center"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => confirmDelete(member.id)}
                  className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/10 text-rose-300 hover:text-rose-500 transition-all flex items-center justify-center"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="flex items-center gap-3 px-2">
                 <Phone size={14} className="text-slate-300" />
                 <p className="text-[10px] font-bold text-slate-500 truncate italic">{member.phone}</p>
               </div>
               <div className="flex items-center gap-3 px-2">
                 <Mail size={14} className="text-slate-300" />
                 <p className="text-[10px] font-bold text-slate-500 truncate italic">{member.email}</p>
               </div>
               <div className="flex items-center gap-3 px-2">
                 <DollarSign size={14} className="text-emerald-500" />
                 <p className="text-[10px] font-black text-slate-800 dark:text-slate-200">Share: ${member.rentShare}</p>
               </div>
               <div className="flex items-center gap-3 px-2">
                 <Database size={14} className="text-indigo-500" />
                 <p className="text-[10px] font-black text-slate-800 dark:text-slate-200">Bond: ${member.initialAdvance}</p>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* FORM MODAL (Add or Edit) */}
      {(editingId || isAdding) && editForm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-[4rem] w-full max-w-2xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-300">
            <header className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter leading-none">
                  {isAdding ? "Register Resident" : "Modify Identity"}
                </h3>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-2 italic">
                  {isAdding ? "Drafting New System Node" : `Resident Index: ${editForm.id}`}
                </p>
              </div>
              <button 
                onClick={() => { setEditingId(null); setIsAdding(false); setEditForm(null); }}
                className="w-14 h-14 rounded-3xl bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-90"
              >
                <X size={24} />
              </button>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Full Name</label>
                  <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="bg-slate-50 dark:bg-slate-800 rounded-2xl px-6 py-4 text-sm font-black italic outline-none dark:text-white border-2 border-transparent focus:border-primary transition-all" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Phone</label>
                  <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="bg-slate-50 dark:bg-slate-800 rounded-2xl px-6 py-4 text-sm font-black italic outline-none dark:text-white border-2 border-transparent focus:border-primary transition-all" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Rent Share ($)</label>
                  <input type="number" value={editForm.rentShare} onChange={e => setEditForm({...editForm, rentShare: parseFloat(e.target.value) || 0})} className="bg-slate-50 dark:bg-slate-800 rounded-2xl px-6 py-4 text-sm font-black italic outline-none dark:text-white border-2 border-transparent focus:border-primary transition-all" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Email</label>
                  <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="bg-slate-50 dark:bg-slate-800 rounded-2xl px-6 py-4 text-sm font-black italic outline-none dark:text-white border-2 border-transparent focus:border-primary transition-all" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Birthdate</label>
                  <div className="relative group">
                    <button 
                      type="button"
                      onClick={() => setShowDatePicker(true)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary transition-all rounded-2xl px-6 py-4 text-sm font-black text-left dark:text-white italic flex justify-between items-center"
                    >
                      <span>{editForm.dob ? format(new Date(editForm.dob), 'MMMM do, yyyy') : 'Select Date'}</span>
                      <Calendar size={18} className="opacity-40" />
                    </button>
                    {showDatePicker && (
                      <BeautifulDatePicker 
                        value={editForm.dob} 
                        onChange={(v) => setEditForm({...editForm, dob: v})} 
                        onClose={() => setShowDatePicker(false)} 
                      />
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Security Advance ($)</label>
                  <input type="number" value={editForm.initialAdvance} onChange={e => setEditForm({...editForm, initialAdvance: parseFloat(e.target.value) || 0})} className="bg-slate-50 dark:bg-slate-800 rounded-2xl px-6 py-4 text-sm font-black italic outline-none dark:text-white border-2 border-transparent focus:border-primary transition-all" />
                </div>
              </div>
              <div className="col-span-full flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Avatar URL</label>
                <input type="text" value={editForm.avatar} onChange={e => setEditForm({...editForm, avatar: e.target.value})} className="bg-slate-50 dark:bg-slate-800 rounded-2xl px-6 py-4 text-sm font-black italic outline-none dark:text-white border-2 border-transparent focus:border-primary transition-all" />
              </div>
            </div>

            <button 
              onClick={handleSave}
              className={`w-full py-6 rounded-3xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all italic ${isAdding ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-primary text-white shadow-primary/20'}`}
            >
              {isAdding ? "Create Resident Registry" : "Update Resident Registry"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersView;
