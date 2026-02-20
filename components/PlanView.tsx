
import React, { useState, useMemo } from 'react';
import { Member, ChoreOverride } from '../types';
import { Calendar, User, Info } from 'lucide-react';
import { 
  getLaundryAssignment, 
  getCleaningAssignment, 
  getGrassAssignment, 
  getBinAssignment,
  END_DATE
} from '../services/dataService';

interface PlanViewProps {
  roommates: Member[];
  overrides: ChoreOverride[];
  onAddOverride: (o: ChoreOverride) => void;
}

const PlanView: React.FC<PlanViewProps> = ({ roommates, overrides, onAddOverride }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'laundry' | 'cleaning' | 'grass' | 'bins'>('all');
  const [viewMode, setViewMode] = useState<'week' | 'fortnight'>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  
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
    overlay.className = "fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 sm:p-6 animate-in fade-in";
    
    const container = document.createElement('div');
    container.className = "bg-white p-6 rounded-[2.5rem] w-full max-w-xs border border-slate-100 shadow-2xl animate-in zoom-in-95";
    
    const title = document.createElement('h3');
    title.className = "text-sm font-black text-slate-800 uppercase mb-4 tracking-widest text-center italic";
    title.innerText = `Reassign ${type}`;
    container.appendChild(title);

    const list = document.createElement('div');
    list.className = "grid grid-cols-2 gap-2";
    
    const options = [...roommates.map(r => r.name), 'N/A', 'Custom...'];
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = "py-4 px-2 rounded-2xl text-[11px] font-black uppercase transition-all active:scale-95 " + 
                      (opt === currentMember ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-50 text-slate-500 hover:bg-slate-100");
      btn.innerText = opt;
      btn.onclick = () => {
        let finalName = opt;
        if (opt === 'Custom...') {
          const custom = prompt("Enter Name:");
          if (!custom) {
            document.body.removeChild(overlay);
            return;
          }
          finalName = custom;
        }
        onAddOverride({
          date: date.toISOString().split('T')[0],
          type,
          member: finalName
        });
        document.body.removeChild(overlay);
      };
      list.appendChild(btn);
    });
    
    container.appendChild(list);
    
    const close = document.createElement('button');
    close.className = "w-full mt-6 py-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] active:text-slate-500";
    close.innerText = "Close";
    close.onclick = () => document.body.removeChild(overlay);
    container.appendChild(close);

    overlay.appendChild(container);
    document.body.appendChild(overlay);
  };

  return (
    <div className="space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 px-1 sm:px-0">
      <header className="flex flex-col gap-6">
        <div className="flex justify-between items-center gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-tighter italic truncate">Plan & Roster</h2>
            <p className="text-xs font-black text-indigo-500 uppercase tracking-widest truncate mt-1">Auburn 2144 Residence • 2026</p>
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner flex-shrink-0">
            <button 
              onClick={() => { setViewMode('week'); setWeekOffset(0); }}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'week' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}
            >
              Week
            </button>
            <button 
              onClick={() => { setViewMode('fortnight'); setWeekOffset(0); }}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'fortnight' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}
            >
              Fortnight
            </button>
          </div>
        </div>
        
        <div className="flex gap-3">
           <button 
            onClick={() => setWeekOffset(prev => prev - 1)}
            className="px-6 py-4 bg-white border-2 border-slate-100 rounded-[1.5rem] text-sm font-black text-slate-400 uppercase active:scale-95 transition-all shadow-sm flex items-center justify-center"
           >
            ←
           </button>
           <button className="flex-1 py-4 bg-white border-2 border-indigo-500/10 rounded-[1.5rem] text-xs sm:text-sm font-black text-slate-800 uppercase tracking-widest shadow-sm truncate flex items-center justify-center gap-2">
            <Calendar size={16} className="text-indigo-600" />
            {dateRangeLabel}
           </button>
           <button 
            onClick={() => setWeekOffset(prev => prev + 1)}
            className="px-6 py-4 bg-white border-2 border-slate-100 rounded-[1.5rem] text-sm font-black text-slate-400 uppercase active:scale-95 transition-all shadow-sm flex items-center justify-center"
           >
            →
           </button>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar shrink-0 px-1">
        {(['all', 'laundry', 'cleaning', 'grass', 'bins'] as const).map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-6 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase transition-all whitespace-nowrap shadow-sm active:scale-95 border-2 ${
              activeFilter === f ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-105' : 'bg-white border-slate-50 text-slate-500 hover:border-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-12 relative border-l-4 border-slate-100 ml-4 sm:ml-6 pl-8 sm:pl-10 pt-4">
        {timeline.map((date, idx) => {
          const l = getLaundryAssignment(date, overrides);
          const c = getCleaningAssignment(date, overrides);
          const g = getGrassAssignment(date, overrides);
          const b = getBinAssignment(date, overrides);
          const isToday = new Date().toDateString() === date.toDateString();
          const dStr = date.toISOString().split('T')[0];
          const isGrassDay = date.getDay() === 6; // Saturday
          const isBinDay = date.getDay() === 3; // Wednesday

          return (
            <section key={idx} className="relative group animate-in slide-in-from-left duration-500" style={{ animationDelay: `${idx * 40}ms` }}>
              <div className={`absolute -left-[46px] sm:-left-[54px] top-1.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-4 border-white transition-all duration-300 ring-4 ${isToday ? 'bg-indigo-600 ring-indigo-100 scale-125 shadow-2xl' : 'bg-slate-200 ring-transparent'}`} />
              
              <div className="mb-6 flex items-center gap-4">
                <span className={`text-base sm:text-xl font-black uppercase tracking-tight italic ${isToday ? 'text-indigo-600' : 'text-slate-800'}`}>
                  {date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
                {isToday && (
                  <span className="text-[10px] bg-indigo-600 px-3 py-1 rounded-full text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-200 animate-pulse">
                    Active Today
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(activeFilter === 'all' || activeFilter === 'laundry') && (
                  <div 
                    onClick={() => handleEdit(date, 'Laundry', l)} 
                    className={`bg-white p-6 rounded-[2rem] border-2 flex justify-between items-center cursor-pointer transition-all hover:shadow-2xl hover:border-indigo-600 active:scale-[0.97] group ${overrides.some(o => o.date === dStr && o.type === 'Laundry') ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-50 shadow-sm'}`}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         🧺 Laundry Duty
                      </span>
                      <span className="text-lg sm:text-xl font-black text-slate-800 uppercase italic tracking-tighter truncate max-w-[120px] sm:max-w-none">
                        {l}
                      </span>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${overrides.some(o => o.date === dStr && o.type === 'Laundry') ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                      <User size={20} strokeWidth={3} />
                    </div>
                  </div>
                )}
                
                {(activeFilter === 'all' || activeFilter === 'cleaning') && (idx % 3 === 0 || overrides.some(o => o.date === dStr && o.type === 'Cleaning')) && (
                  <div 
                    onClick={() => handleEdit(date, 'Cleaning', c)} 
                    className={`bg-white p-6 rounded-[2rem] border-2 flex justify-between items-center cursor-pointer transition-all hover:shadow-2xl hover:border-amber-600 active:scale-[0.97] group ${overrides.some(o => o.date === dStr && o.type === 'Cleaning') ? 'border-amber-600 bg-amber-50/50' : 'border-slate-50 shadow-sm'}`}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         🧹 Deep Clean
                      </span>
                      <span className="text-lg sm:text-xl font-black text-slate-800 uppercase italic tracking-tighter truncate max-w-[120px] sm:max-w-none">
                        {c}
                      </span>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${overrides.some(o => o.date === dStr && o.type === 'Cleaning') ? 'bg-amber-600 text-white' : 'bg-slate-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white'}`}>
                      <Info size={20} strokeWidth={3} />
                    </div>
                  </div>
                )}

                {(activeFilter === 'all' || activeFilter === 'grass') && (isGrassDay || overrides.some(o => o.date === dStr && o.type === 'Grass')) && (
                  <div 
                    onClick={() => handleEdit(date, 'Grass', g)} 
                    className={`bg-white p-6 rounded-[2rem] border-2 flex justify-between items-center cursor-pointer transition-all hover:shadow-2xl hover:border-emerald-600 active:scale-[0.97] group ${overrides.some(o => o.date === dStr && o.type === 'Grass') ? 'border-emerald-600 bg-emerald-50/50' : 'border-slate-50 shadow-sm'}`}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         🌱 Garden/Yard
                      </span>
                      <span className="text-lg sm:text-xl font-black text-slate-800 uppercase italic tracking-tighter truncate max-w-[120px] sm:max-w-none">
                        {g}
                      </span>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${overrides.some(o => o.date === dStr && o.type === 'Grass') ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'}`}>
                      <Calendar size={20} strokeWidth={3} />
                    </div>
                  </div>
                )}

                {(activeFilter === 'all' || activeFilter === 'bins') && (isBinDay || overrides.some(o => o.date === dStr && o.type === 'Bins')) && (
                  <div 
                    onClick={() => handleEdit(date, 'Bins', b)} 
                    className={`bg-white p-6 rounded-[2rem] border-2 flex justify-between items-center cursor-pointer transition-all hover:shadow-2xl hover:border-rose-600 active:scale-[0.97] group ${overrides.some(o => o.date === dStr && o.type === 'Bins') ? 'border-rose-600 bg-rose-50/50' : 'border-slate-50 shadow-sm'}`}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         ♻️ Waste & Bins
                      </span>
                      <span className="text-lg sm:text-xl font-black text-slate-800 uppercase italic tracking-tighter truncate max-w-[120px] sm:max-w-none">
                        {b !== "N/A" ? b : "Extra Cycle"}
                      </span>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${overrides.some(o => o.date === dStr && o.type === 'Bins') ? 'bg-rose-600 text-white' : 'bg-slate-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white'}`}>
                      <Calendar size={20} strokeWidth={3} />
                    </div>
                  </div>
                )}
              </div>
            </section>
          );
        })}
        {timeline.length === 0 && (
          <div className="text-center py-20 opacity-30">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6"><Calendar size={40} /></div>
            <p className="text-sm font-black uppercase tracking-[0.3em] italic text-slate-400">Roster Cycles End</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanView;
