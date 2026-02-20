
import React from 'react';
import { 
  ShieldCheck, 
  Users, 
  DollarSign, 
  CreditCard, 
  Calendar, 
  FileText, 
  Settings as SettingsIcon,
  Plus,
  ArrowRight,
  Database,
  Megaphone,
  ListChecks,
  Scissors
} from 'lucide-react';
import { ViewType } from '../types';

interface AdminViewProps {
  onNavigate: (view: ViewType) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ onNavigate }) => {
  const modules = [
    { id: 'rent', label: 'Rent Tracking', icon: DollarSign, color: 'bg-indigo-500', desc: 'Fortnightly collections' },
    { id: 'finance', label: 'Utility Entry', icon: CreditCard, color: 'bg-rose-500', desc: 'Bills & splits history' },
    { id: 'schedule', label: 'Rotation Roster', icon: Scissors, color: 'bg-amber-500', desc: 'Chore reassignments' },
    { id: 'notices', label: 'Notice Center', icon: Megaphone, color: 'bg-purple-500', desc: 'Global broadcasts' },
    { id: 'advance', label: 'Security Bond', icon: Database, color: 'bg-sky-500', desc: 'Bond pool management' },
    { id: 'instruction', label: 'House Standards', icon: ListChecks, color: 'bg-teal-500', desc: 'Edit rules & etiquette' },
    { id: 'members', label: 'Resident Registry', icon: Users, color: 'bg-emerald-500', desc: 'Member profiles & shares' },
    { id: 'data', label: 'Data Export', icon: Database, color: 'bg-slate-700', desc: 'CSV Archive downloads' },
    { id: 'settings', label: 'Preferences', icon: SettingsIcon, color: 'bg-slate-500', desc: 'Themes & data reset' },
  ];

  return (
    <div className="space-y-10 pb-32 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <header className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-2xl">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">Command Center</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">Authorized Administrative Access Only</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod, i) => (
          <button 
            key={mod.id}
            onClick={() => onNavigate(mod.id as ViewType)}
            className="group bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all text-left flex flex-col items-start"
          >
            <div className={`w-14 h-14 ${mod.color} rounded-2xl flex items-center justify-center text-white shadow-xl mb-6 group-hover:rotate-12 transition-transform`}>
              <mod.icon size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter mb-1">{mod.label}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">{mod.desc}</p>
            <div className="mt-auto w-full flex items-center justify-between text-primary font-black text-[10px] uppercase tracking-widest pt-5 border-t border-slate-50 dark:border-slate-800 group-hover:translate-x-1 transition-transform">
              <span>Open Module</span>
              <ArrowRight size={14} />
            </div>
          </button>
        ))}
      </div>

      <div className="bg-slate-900 text-white p-10 rounded-[4rem] flex flex-col sm:flex-row items-center justify-between gap-8 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-2 text-center sm:text-left">
          <h3 className="text-2xl font-black uppercase italic tracking-tighter">System Integrity Status</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Database Version: v1.42 • Auburn Hub Core</p>
        </div>
        <div className="relative z-10 flex items-center gap-4">
           <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">All Systems Operational</span>
        </div>
      </div>
    </div>
  );
};

export default AdminView;
