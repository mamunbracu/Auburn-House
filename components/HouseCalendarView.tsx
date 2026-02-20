
import React, { useState, useMemo } from 'react';
import { format, eachDayOfInterval, isSameMonth, isSameDay, addMonths, getDay } from 'date-fns';
import { AppState } from '../types';
import { getLaundryAssignment, getCleaningAssignment, getBinAssignment, getGrassAssignment } from '../services/dataService';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Sparkles, Droplets, Trash2, Scissors, DollarSign, Clock } from 'lucide-react';

interface HouseCalendarViewProps {
  state: AppState;
}

const HouseCalendarView: React.FC<HouseCalendarViewProps> = ({ state }) => {
  const [currentViewMonth, setCurrentViewMonth] = useState(new Date(2026, 1, 1)); // Starts in Feb 2026
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const startDateRange = new Date(2026, 1, 20);
  const endDateRange = new Date(2026, 3, 28);

  const calendarDays = useMemo(() => {
    // Manual replacements for startOfMonth, startOfWeek, endOfMonth, endOfWeek using native Date objects
    const monthStart = new Date(currentViewMonth.getFullYear(), currentViewMonth.getMonth(), 1);
    const monthEnd = new Date(currentViewMonth.getFullYear(), currentViewMonth.getMonth() + 1, 0);
    const start = new Date(monthStart.getFullYear(), monthStart.getMonth(), monthStart.getDate() - getDay(monthStart));
    const end = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate() + (6 - getDay(monthEnd)));
    return eachDayOfInterval({ start, end });
  }, [currentViewMonth]);

  const getDayTasks = (date: Date) => {
    const dStr = format(date, 'yyyy-MM-dd');
    const tasks = [];

    // Laundry
    tasks.push({ type: 'Laundry', assignee: getLaundryAssignment(date, state.choreOverrides), icon: <Droplets size={12} className="text-sky-500" /> });
    
    // Cleaning (Every 3 days based on dataService)
    // We check if it's a cleaning day based on index
    const startOfApp = new Date('2026-01-01');
    const diff = Math.floor((date.getTime() - startOfApp.getTime()) / (1000 * 60 * 60 * 24));
    if (diff % 3 === 0 || state.choreOverrides.some(o => o.date === dStr && o.type === 'Cleaning')) {
      tasks.push({ type: 'Cleaning', assignee: getCleaningAssignment(date, state.choreOverrides), icon: <Sparkles size={12} className="text-amber-500" /> });
    }

    // Grass (Saturdays)
    if (date.getDay() === 6 || state.choreOverrides.some(o => o.date === dStr && o.type === 'Grass')) {
      tasks.push({ type: 'Grass', assignee: getGrassAssignment(date, state.choreOverrides), icon: <Scissors size={12} className="text-emerald-500" /> });
    }

    // Bins (Wednesdays)
    if (date.getDay() === 3 || state.choreOverrides.some(o => o.date === dStr && o.type === 'Bins')) {
      tasks.push({ type: 'Bins', assignee: getBinAssignment(date, state.choreOverrides), icon: <Trash2 size={12} className="text-rose-500" /> });
    }

    // Rent
    const rentEvent = state.rentEvents.find(e => e.date === dStr);
    if (rentEvent) {
      tasks.push({ type: 'Rent', amount: rentEvent.amount, icon: <DollarSign size={12} className="text-indigo-600" /> });
    }

    return tasks;
  };

  const handlePrevMonth = () => {
    // Manual replacement for subMonths(currentViewMonth, 1) using addMonths with negative value
    const prev = addMonths(currentViewMonth, -1);
    if (prev >= new Date(2026, 1, 1)) {
      setCurrentViewMonth(prev);
    }
  };

  const handleNextMonth = () => {
    const next = addMonths(currentViewMonth, 1);
    if (next <= new Date(2026, 3, 1)) {
      setCurrentViewMonth(next);
    }
  };

  const isDayInRange = (date: Date) => date >= startDateRange && date <= endDateRange;

  return (
    <div className="space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 px-2">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">House Calendar</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Feb 20 — Apr 28, 2026</p>
        </div>
        <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800 items-center">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"><ChevronLeft size={20} /></button>
          <span className="px-6 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
            {format(currentViewMonth, 'MMMM yyyy')}
          </span>
          <button onClick={handleNextMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"><ChevronRight size={20} /></button>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden p-2 sm:p-6">
        <div className="grid grid-cols-7 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center py-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600">{day}</span>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 sm:gap-4">
          {calendarDays.map((date, i) => {
            const inMonth = isSameMonth(date, currentViewMonth);
            const inRange = isDayInRange(date);
            const tasks = getDayTasks(date);
            const isToday = isSameDay(date, new Date());

            return (
              <button
                key={i}
                onClick={() => inRange && setSelectedDay(date)}
                disabled={!inRange}
                className={`relative h-20 sm:h-32 rounded-3xl transition-all flex flex-col p-2 sm:p-4 text-left group ${
                  !inMonth ? 'opacity-20' : ''
                } ${
                  inRange 
                    ? 'bg-slate-50/50 dark:bg-slate-800/20 hover:bg-primary/5 dark:hover:bg-primary/10 border-2 border-transparent hover:border-primary/20' 
                    : 'bg-transparent border-none'
                } ${isToday ? 'ring-2 ring-primary ring-offset-4 dark:ring-offset-slate-900' : ''}`}
              >
                <span className={`text-xs sm:text-sm font-black italic tracking-tighter ${inRange ? 'text-slate-800 dark:text-slate-200' : 'text-slate-200 dark:text-slate-800'}`}>
                  {format(date, 'd')}
                </span>
                
                {inRange && (
                  <div className="mt-auto flex flex-wrap gap-1">
                    {tasks.map((t, tidx) => (
                      <div key={tidx} className="p-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                        {t.icon}
                      </div>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedDay && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[4rem] w-full max-w-sm border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <header className="bg-primary p-10 text-white relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-hover to-indigo-900 animate-gradient opacity-50" />
               <div className="relative z-10 flex justify-between items-start">
                 <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 text-white/70">Daily Dossier</p>
                   <h3 className="text-4xl font-black italic tracking-tighter leading-none">
                     {format(selectedDay, 'MMMM do')}
                   </h3>
                   <p className="text-xs font-bold text-white/60 mt-2 uppercase tracking-widest">{format(selectedDay, 'EEEE')}</p>
                 </div>
                 <button 
                  onClick={() => setSelectedDay(null)}
                  className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                 >
                   <X size={24} />
                 </button>
               </div>
            </header>

            <div className="p-10 space-y-6">
               <div className="space-y-4">
                 <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] px-2 mb-2">Protocol Assignments</h4>
                 {getDayTasks(selectedDay).map((t: any, idx) => (
                   <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 group hover:border-primary/20 transition-all">
                     <div className="flex items-center gap-5">
                       <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                         {t.icon}
                       </div>
                       <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.type}</p>
                         <p className="text-lg font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">
                           {t.type === 'Rent' ? `$${t.amount}` : t.assignee}
                         </p>
                       </div>
                     </div>
                   </div>
                 ))}
                 {getDayTasks(selectedDay).length === 0 && (
                   <div className="py-10 text-center opacity-30">
                     <Clock size={40} className="mx-auto mb-4" />
                     <p className="text-xs font-black uppercase tracking-widest">No rotations scheduled</p>
                   </div>
                 )}
               </div>
            </div>

            <footer className="p-8 border-t dark:border-slate-800">
               <button 
                onClick={() => setSelectedDay(null)}
                className="w-full py-5 bg-slate-900 dark:bg-slate-100 rounded-3xl text-[10px] font-black text-white dark:text-slate-900 uppercase tracking-[0.4em] shadow-xl active:scale-95 transition-all italic"
               >
                 Acknowledge & Close
               </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default HouseCalendarView;
