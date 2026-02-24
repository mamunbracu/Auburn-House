
import React, { useMemo } from 'react';
import { AppState, Member, ChoreOverride } from '../types';
import { format, addDays, isWednesday, isSaturday } from 'date-fns';
import { Sparkles, Droplets, Scissors, Trash2, Calendar } from 'lucide-react';
import { getCleaningAssignment, getBinAssignment, getLaundryAssignment, getGrassAssignment } from '../services/dataService';

interface MemberScheduleProps {
  member: Member;
  state: AppState;
}

const MemberSchedule: React.FC<MemberScheduleProps> = ({ member, state }) => {
  const today = useMemo(() => new Date(), []);

  const schedules = useMemo(() => {
    const cleaning: { date: Date; label: string }[] = [];
    const laundry: { date: Date; label: string }[] = [];
    const grass: { date: Date; label: string }[] = [];
    const bins: { date: Date; label: string }[] = [];

    // Look ahead 60 days
    for (let i = 0; i < 60; i++) {
      const date = addDays(today, i);
      
      // Cleaning
      if (getCleaningAssignment(date, state.choreOverrides) === member.name) {
        cleaning.push({ date, label: 'Deep Clean' });
      }

      // Laundry
      if (getLaundryAssignment(date, state.choreOverrides) === member.name) {
        laundry.push({ date, label: 'Laundry Day' });
      }

      // Grass (Saturdays)
      if (isSaturday(date) && getGrassAssignment(date, state.choreOverrides) === member.name) {
        grass.push({ date, label: 'Grass Cutting' });
      }

      // Bins (Wednesdays)
      if (isWednesday(date) && getBinAssignment(date, state.choreOverrides) === member.name) {
        bins.push({ date, label: 'Bin Duty' });
      }
    }

    return { cleaning, laundry, grass, bins };
  }, [member.name, state.choreOverrides, today]);

  const ScheduleCard = ({ title, items, icon, color }: { title: string, items: { date: Date, label: string }[], icon: any, color: string }) => (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-xl ${color} text-white flex items-center justify-center shadow-lg`}>
          {icon}
        </div>
        <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase italic tracking-tight">{title}</h4>
      </div>
      
      {items.length > 0 ? (
        <div className="space-y-3 flex-grow overflow-y-auto max-h-[200px] pr-2 no-scrollbar">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-800 dark:text-white uppercase italic">{format(item.date, 'EEEE')}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{format(item.date, 'MMM do, yyyy')}</span>
              </div>
              <div className="text-[8px] font-black bg-white dark:bg-slate-900 px-2 py-1 rounded-lg text-slate-400 uppercase tracking-widest border border-slate-100 dark:border-slate-800">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 opacity-30">
          <Calendar size={24} className="mb-2" />
          <p className="text-[9px] font-black uppercase tracking-widest">No upcoming tasks</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 px-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Calendar size={18} /></div>
        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase italic tracking-tight">Personal Duty Roster</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ScheduleCard title="Cleaning Schedule" items={schedules.cleaning} icon={<Sparkles size={18} />} color="bg-amber-500" />
        <ScheduleCard title="Laundry Rotation" items={schedules.laundry} icon={<Droplets size={18} />} color="bg-sky-500" />
        <ScheduleCard title="Grass Maintenance" items={schedules.grass} icon={<Scissors size={18} />} color="bg-emerald-500" />
        <ScheduleCard title="Bin Management" items={schedules.bins} icon={<Trash2 size={18} />} color="bg-rose-500" />
      </div>
    </div>
  );
};

export default MemberSchedule;
