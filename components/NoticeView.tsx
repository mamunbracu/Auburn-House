
import React, { useState } from 'react';
import { Notice, AppState } from '../types';
import { Megaphone, Lock, ShieldCheck, Trash2, Send, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface NoticeViewProps {
  state: AppState;
  onAddNotice: (content: string) => void;
  onDeleteNotice: (id: string) => void;
}

const NoticeView: React.FC<NoticeViewProps> = ({ state, onAddNotice, onDeleteNotice }) => {
  const [pin, setPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [newNotice, setNewNotice] = useState('');
  const [error, setError] = useState('');

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

  const handlePublish = () => {
    if (!newNotice.trim()) return;
    onAddNotice(newNotice);
    setNewNotice('');
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-2xl w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary mx-auto mb-8">
            <Lock size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter mb-2">Authority Required</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Enter Mamun's Security PIN</p>
          
          <form onSubmit={handleUnlock} className="space-y-4">
            <input 
              type="password" 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-2xl px-6 py-4 text-center text-2xl font-black tracking-[1em] outline-none transition-all dark:text-white"
            />
            {error && <p className="text-rose-500 text-[9px] font-black uppercase tracking-widest animate-bounce">{error}</p>}
            <button type="submit" className="w-full py-5 bg-primary text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-primary/20 active:scale-95 transition-all italic">
              Verify Identity
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Notice Control</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Public Hub Broadcasts</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-4 py-2 rounded-2xl border border-emerald-500/20">
          <ShieldCheck size={16} />
          <span className="text-[9px] font-black uppercase tracking-widest italic">Authorized: Mamun</span>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
            <Megaphone size={20} />
          </div>
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Draft New Broadcast</h3>
        </div>
        <textarea 
          value={newNotice}
          onChange={(e) => setNewNotice(e.target.value)}
          placeholder="Write important updates for the house..."
          className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[2rem] p-6 text-sm font-bold outline-none h-40 shadow-inner dark:text-white italic"
        />
        <button 
          onClick={handlePublish}
          disabled={!newNotice.trim()}
          className="w-full py-5 bg-primary text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all italic disabled:opacity-50 disabled:scale-100"
        >
          Publish to Home Hub
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Broadcast Database</h3>
        {state.notices.length === 0 ? (
          <div className="py-20 text-center opacity-20">
            <Clock size={48} className="mx-auto mb-4" />
            <p className="text-xs font-black uppercase tracking-[0.4em]">No Past Broadcasts</p>
          </div>
        ) : (
          state.notices.slice().reverse().map((notice) => (
            <div key={notice.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none italic">
                      {format(new Date(notice.date), 'MMMM do, yyyy')}
                    </p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Status: {notice.isActive ? 'Active' : 'Archived'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onDeleteNotice(notice.id)}
                  className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 italic leading-relaxed pl-11">
                {notice.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NoticeView;
