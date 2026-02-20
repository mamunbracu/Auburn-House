
import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';

interface PinModalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const PinModal: React.FC<PinModalProps> = ({ onSuccess, onCancel }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1535') {
      onSuccess();
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className={`bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] w-full max-w-sm border-2 shadow-2xl transition-all duration-300 ${error ? 'border-rose-500 scale-95' : 'border-white/10'}`}>
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary shadow-inner">
            <Lock size={40} />
          </div>
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter text-center mb-2">Security Verification</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-8 italic">Enter PIN to Authorize Action</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <input 
            type="password" 
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••"
            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-2xl px-6 py-4 text-center text-3xl font-black tracking-[1em] outline-none transition-all dark:text-white shadow-inner placeholder:tracking-normal placeholder:text-slate-200 dark:placeholder:text-slate-700"
          />
          {error && <p className="text-rose-500 text-[9px] font-black uppercase tracking-widest text-center animate-bounce">Access Denied</p>}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={onCancel} className="py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all">Cancel</button>
            <button type="submit" className="py-5 bg-primary text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 transition-all italic">Confirm</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PinModal;
