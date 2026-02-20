
import React, { useState, useMemo } from 'react';
import { Member, ChoreOverride } from '../types';
import { 
  getLaundryAssignment, 
  getCleaningAssignment, 
  getGrassAssignment, 
  getBinAssignment,
  END_DATE
} from '../services/dataService';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Sparkles, 
  Droplets, 
  Trash2, 
  Scissors, 
  LayoutGrid,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import PinModal from './PinModal';

interface ScheduleViewProps {
  roommates: Member[];
  overrides: ChoreOverride[];
  onAddOverride: (o: ChoreOverride) => void;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ roommates, overrides, onAddOverride }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'laundry' | 'cleaning' | 'grass' | 'bins'>('all');
  const [viewMode, setViewMode] = useState<'week' | 'fortnight'>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [pendingOverride, setPendingOverride] = useState<ChoreOverride | null>(null);

  const filters = [
    { id: 'all', label: 'All Chores', icon: LayoutGrid, color: 'text-slate-500' },
    { id: 'cleaning', label: 'Cleaning', icon: Sparkles, color: 'text-amber-500' },
    { id: 'laundry', label: 'Laundry', icon: Droplets, color: 'text-sky-500' },
    { id: 'grass', label: 'Grass', icon: Scissors, color: 'text-emerald-500' },
    { id: 'bins', label: 'Bins', icon: Trash2, color: 'text-rose-500' },
  ] as const;
  
  const daysToShow = viewMode === 'week' ? 7 : 14;

  const timeline = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startFrom = new Date(today);
    startFrom.setDate(today.getDate() + (weekOffset * 7));

    const endOfApp = new Date(END_DATE);
    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(startFrom);
      d.setDate(startFrom.getDate() + i);
      if (d > endOfApp) break;
      days.push(d);
    }
    return days;
  }, [daysToShow, weekOffset]);

  const dateRangeLabel = useMemo(() => {
    if (timeline.length === 0) return "";
    const start = timeline[0];
    const end = timeline[timeline.length - 1];
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(start)} — ${fmt(end)}`;
  }, [timeline]);

  const handleEdit = (date: Date, type: ChoreOverride['type'], currentMember: string) => {
    const overlay = document.createElement('div');
    overlay.className = "fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-6 animate-in fade-in duration-300";
    
    const container = document.createElement('div');
    container.className = "bg-white dark:bg-slate-900 p-10 rounded-[3rem] w-full max-w-sm border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-300";
    
    const title = document.createElement('h3');
    title.className = "text-xl font-black text-slate-800 dark:text-white uppercase mb-8 tracking-tighter text-center italic";
    title.innerText = `Reassign ${type}`;
    container.appendChild(title);

    const list = document.createElement('div');
    list.className = "grid grid-cols-2 gap-3";
    
    const options = [...roommates.map(r => r.name), 'N/A', 'Custom...'];
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = "py-4 px-3 rounded-2xl text-[10px] font-black uppercase transition-all active:scale-90 " + 
                      (opt === currentMember ? "bg-primary text-white shadow-xl" : "bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100");
      btn.innerText = opt;
      btn.onclick = () => {
        let finalName = opt;
        if (opt === 'Custom...') {
          const custom = prompt("Enter Name:");
          if (!custom) { document.body.removeChild(overlay); return; }
          finalName = custom;
        }
        setPendingOverride({
          date: format(date, 'yyyy-MM-dd'),
          type,
          member: finalName
        });
        document.body.removeChild(overlay);
      };
      list.appendChild(btn);
    });
    
    container.appendChild(list);
    
    const close = document.createElement('button');
    close.className = "w-full mt-10 py-4 text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em]";
    close.innerText = "Close";
    close.onclick = () => document.body.removeChild(overlay);
    container.appendChild(close);

    overlay.appendChild(container);
    document.body.appendChild(overlay);
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-5 duration-700">
      {pendingOverride && (
        <PinModal 
          onSuccess={() => { onAddOverride(pendingOverride); setPendingOverride(null); }}
          onCancel={() => setPendingOverride(null)}
        />
      )}
      <header className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><Clock size={24} /></div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">Rotation Roster</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Live House Schedule</p>
            </div>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-[1.5rem] shadow-sm">
            <button onClick={() => { setViewMode('week'); setWeekOffset(0); }} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all ${viewMode === 'week' ? 'bg-primary text-white' : 'text-slate-400'}`}>Weekly</button>
            <button onClick={() => { setViewMode('fortnight'); setWeekOffset(0); }} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all ${viewMode === 'fortnight' ? 'bg-primary text-white' : 'text-slate-400'}`}>Fortnightly</button>
          </div>
        </div>

        {/* CHORE FILTERS */}
        <div className="flex flex-wrap gap-2">
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                activeFilter === filter.id 
                  ? 'bg-white dark:bg-slate-900 border-primary text-primary shadow-lg' 
                  : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <filter.icon size={14} className={activeFilter === filter.id ? 'text-primary' : filter.color} />
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <button onClick={() => setWeekOffset(prev => prev - 1)} className="h-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl flex items-center justify-center text-slate-400 hover:text-primary transition-all"><ChevronLeft size={24} /></button>
        <div className="h-16 bg-gradient-to-br from-primary to-indigo-800 rounded-3xl text-white shadow-xl flex items-center justify-center gap-4 px-6 italic font-black text-xs uppercase tracking-widest">{dateRangeLabel}</div>
        <button onClick={() => setWeekOffset(prev => prev + 1)} className="h-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl flex items-center justify-center text-slate-400 hover:text-primary transition-all"><ChevronRight size={24} /></button>
      </div>

      <div className="space-y-12 relative border-l-4 border-slate-100 dark:border-slate-800 ml-6 pl-12 pt-6">
        {timeline.map((date, idx) => {
          const l = getLaundryAssignment(date, overrides);
          const c = getCleaningAssignment(date, overrides);
          const g = getGrassAssignment(date, overrides);
          const b = getBinAssignment(date, overrides);
          
          const isToday = new Date().toDateString() === date.toDateString();
          
          const showLaundry = activeFilter === 'all' || activeFilter === 'laundry';
          const showCleaning = (activeFilter === 'all' || activeFilter === 'cleaning') && c !== null;
          const showGrass = (activeFilter === 'all' || activeFilter === 'grass') && date.getDay() === 6; // Saturday
          const showBins = (activeFilter === 'all' || activeFilter === 'bins') && date.getDay() === 3; // Wednesday
          
          if (!showLaundry && !showCleaning && !showGrass && !showBins) return null;

          return (
            <div key={idx} className="relative group animate-in slide-in-from-left duration-500">
              <div className={`absolute -left-[54px] top-2 w-6 h-6 rounded-full border-4 border-white dark:border-slate-950 transition-all ${isToday ? 'bg-primary ring-8 ring-primary/10 scale-125' : 'bg-slate-200 dark:bg-slate-800'}`} />
              <div className="mb-6 flex items-center gap-6"><span className={`text-2xl font-black uppercase tracking-tighter italic ${isToday ? 'text-primary' : 'text-slate-800 dark:text-slate-100'}`}>{date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {showLaundry && (
                  <div onClick={() => handleEdit(date, 'Laundry', l)} className="group/card bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border-2 flex justify-between items-center cursor-pointer transition-all hover:shadow-2xl border-slate-50 dark:border-slate-800 hover:border-primary/20">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500 flex items-center gap-2"><Droplets size={14} /> Laundry Duty</span>
                      <span className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">{l}</span>
                    </div>
                    <div className="w-14 h-14 rounded-3xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-300 group-hover/card:bg-primary group-hover/card:text-white"><User size={24} strokeWidth={3} /></div>
                  </div>
                )}
                {showCleaning && (
                  <div onClick={() => handleEdit(date, 'Cleaning', c)} className="group/card bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border-2 flex justify-between items-center cursor-pointer transition-all hover:shadow-2xl border-slate-50 dark:border-slate-800 hover:border-primary/20">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 flex items-center gap-2"><Sparkles size={14} /> Deep Clean</span>
                      <span className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">{c}</span>
                    </div>
                    <div className="w-14 h-14 rounded-3xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-300 group-hover/card:bg-primary group-hover/card:text-white"><User size={24} strokeWidth={3} /></div>
                  </div>
                )}
                {showGrass && (
                  <div onClick={() => handleEdit(date, 'Grass', g)} className="group/card bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border-2 flex justify-between items-center cursor-pointer transition-all hover:shadow-2xl border-slate-50 dark:border-slate-800 hover:border-primary/20">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2"><Scissors size={14} /> Grass Cutting</span>
                      <span className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">{g}</span>
                    </div>
                    <div className="w-14 h-14 rounded-3xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-300 group-hover/card:bg-primary group-hover/card:text-white"><User size={24} strokeWidth={3} /></div>
                  </div>
                )}
                {showBins && (
                  <div onClick={() => handleEdit(date, 'Bins', b)} className="group/card bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border-2 flex justify-between items-center cursor-pointer transition-all hover:shadow-2xl border-slate-50 dark:border-slate-800 hover:border-primary/20">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 flex items-center gap-2"><Trash2 size={14} /> Bin Reminder</span>
                      <span className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">{b}</span>
                    </div>
                    <div className="w-14 h-14 rounded-3xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-300 group-hover/card:bg-primary group-hover/card:text-white"><User size={24} strokeWidth={3} /></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScheduleView;
