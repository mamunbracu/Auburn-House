
import React, { useState, useMemo } from 'react';
import { Member, RentEvent, MemberName } from '../types';
import { format } from 'date-fns';
import { DollarSign, Check, X, Calendar, ArrowRight, Clock } from 'lucide-react';
import PinModal from './PinModal';

interface RentViewProps {
  roommates: Member[];
  rentEvents: RentEvent[];
  onToggleStatus: (eventId: string, memberName: MemberName) => void;
}

const RentView: React.FC<RentViewProps> = ({ roommates, rentEvents, onToggleStatus }) => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ eventId: string, memberName: MemberName } | null>(null);

  const selectedEvent = useMemo(() => 
    rentEvents.find(e => e.id === selectedEventId), 
    [selectedEventId, rentEvents]
  );

  const filteredEvents = useMemo(() => {
    const startRange = new Date(2026, 1, 15);
    const endRange = new Date(2026, 3, 30);
    return rentEvents.filter(e => {
      const d = new Date(e.date);
      return d >= startRange && d <= endRange;
    });
  }, [rentEvents]);

  const handleToggleAttempt = (eventId: string, memberName: MemberName) => {
    setPendingAction({ eventId, memberName });
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-5 duration-700">
      {pendingAction && (
        <PinModal 
          onSuccess={() => {
            onToggleStatus(pendingAction.eventId, pendingAction.memberName);
            setPendingAction(null);
          }}
          onCancel={() => setPendingAction(null)}
        />
      )}
      <header className="flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
              <DollarSign size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">Rent Details</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Fortnightly Payment Cycles</p>
            </div>
          </div>
          <p className="text-xs font-bold text-slate-500 max-w-md italic px-1">
            Official rent tracking for 37 Normanby Road. Total fortnightly rent: <span className="text-emerald-600 font-black">$3,000</span>.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEvents.map((event, idx) => {
          const paidCount = Object.values(event.memberStatuses).filter(v => v).length;
          
          return (
            <button
              key={event.id}
              onClick={() => setSelectedEventId(event.id)}
              className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 flex flex-col gap-6 group transition-all hover:shadow-2xl hover:-translate-y-1 text-left animate-in slide-in-from-bottom duration-500"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 dark:text-white uppercase italic text-sm tracking-tight">
                      {format(new Date(event.date), 'MMMM do, yyyy')}
                    </h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Rent Cycle Artifact</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-primary italic tracking-tighter leading-none">$3,000</p>
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1 italic">Total Expected</p>
                </div>
              </div>

              <div className="h-px bg-slate-50 dark:bg-slate-800" />

              <div className="flex justify-between items-center">
                <div className="flex -space-x-3">
                  {roommates.slice(0, 5).map(r => (
                    <img 
                      key={r.id} 
                      src={r.avatar} 
                      className={`w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 object-cover ${event.memberStatuses[r.name] ? 'opacity-100 ring-2 ring-emerald-500/30' : 'opacity-30 grayscale'}`} 
                    />
                  ))}
                  {roommates.length > 5 && (
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-black text-slate-400">
                      +{roommates.length - 5}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end">
                   <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${paidCount === roommates.length ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {paidCount === roommates.length ? <Check size={12} strokeWidth={3} /> : <Clock size={12} strokeWidth={3} />}
                      {paidCount}/{roommates.length} Collected
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 italic flex items-center gap-2">
                     Details <ArrowRight size={10} />
                   </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[4rem] w-full max-w-lg border border-white/10 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
            <header className="p-8 sm:p-10 border-b dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Cycle Breakdown</h3>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">
                  {format(new Date(selectedEvent.date), 'MMMM do, yyyy')}
                </p>
              </div>
              <button 
                onClick={() => setSelectedEventId(null)}
                className="w-14 h-14 rounded-3xl bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-90"
              >
                <X size={24} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar p-8 sm:p-10 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2.5rem] flex items-center justify-between mb-6 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Cycle Goal</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">$3,000.00</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Collection Status</p>
                  <p className="text-lg font-black text-emerald-500 italic tracking-tighter">
                    {Object.values(selectedEvent.memberStatuses).filter(v => v).length} / {roommates.length} Residents
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {roommates.map((member) => {
                  const isPaid = selectedEvent.memberStatuses[member.name];
                  return (
                    <div 
                      key={member.id}
                      onClick={() => handleToggleAttempt(selectedEvent.id, member.name)}
                      className={`p-5 rounded-[2.5rem] border-2 flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] ${
                        isPaid 
                          ? 'bg-white dark:bg-slate-900 border-emerald-500/20 shadow-sm' 
                          : 'bg-slate-50 dark:bg-slate-800 border-transparent opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-5">
                        <img src={member.avatar} className={`w-14 h-14 rounded-[1.5rem] object-cover border-4 ${isPaid ? 'border-emerald-500/20 shadow-md' : 'border-slate-200 dark:border-slate-700 opacity-50'}`} />
                        <div>
                          <p className="font-black text-slate-800 dark:text-white uppercase text-base italic tracking-tighter">{member.name}</p>
                          <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${member.name === 'AARATI' ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {member.name === 'AARATI' ? 'Exempt' : (isPaid ? 'Payment Received' : 'Pending Transaction')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-5">
                        <div className="text-right">
                          <p className={`text-xl font-black italic tracking-tighter ${member.name === 'AARATI' ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-100'}`}>
                            ${member.rentShare}
                          </p>
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Resident Share</p>
                        </div>
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isPaid ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white dark:bg-slate-700 text-slate-300 shadow-sm'}`}>
                          {isPaid ? <Check size={20} strokeWidth={3} /> : <Clock size={18} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <footer className="p-8 sm:p-10 border-t dark:border-slate-800 flex justify-center">
              <button 
                onClick={() => setSelectedEventId(null)}
                className="w-full py-5 bg-slate-900 dark:bg-slate-100 rounded-3xl text-[10px] font-black text-white dark:text-slate-900 uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all italic"
              >
                Close Breakdown Artifact
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentView;
