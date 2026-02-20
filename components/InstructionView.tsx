
import React, { useState } from 'react';
import { 
  Home,
  CheckCircle2, 
  Ban, 
  AlertTriangle,
  Thermometer,
  Utensils,
  Plus,
  Trash2,
  Edit2,
  X,
  Save
} from 'lucide-react';
import { AppState, InstructionSection, InstructionRule } from '../types';
import PinModal from './PinModal';

interface InstructionViewProps {
  state: AppState;
  onUpdateInstructions: (instructions: InstructionSection[]) => void;
}

const InstructionView: React.FC<InstructionViewProps> = ({ state, onUpdateInstructions }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<InstructionSection | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleEditClick = (section: InstructionSection) => {
    setEditForm(JSON.parse(JSON.stringify(section))); // deep copy
    setEditingId(section.id);
    setIsAdding(false);
  };

  const handleAddClick = () => {
    setEditForm({
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Section',
      emoji: '📄',
      color: 'indigo',
      rules: [{ text: 'First rule...' }]
    });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleSaveAttempt = () => {
    setShowPin(true);
  };

  const handleFinalSave = () => {
    if (!editForm) return;
    let newInstructions;
    if (isAdding) {
      newInstructions = [...state.instructions, editForm];
    } else {
      newInstructions = state.instructions.map(s => s.id === editForm.id ? editForm : s);
    }
    onUpdateInstructions(newInstructions);
    setEditingId(null);
    setEditForm(null);
    setIsAdding(false);
    setShowPin(false);
  };

  const handleDeleteRule = (idx: number) => {
    if (!editForm) return;
    const newRules = [...editForm.rules];
    newRules.splice(idx, 1);
    setEditForm({ ...editForm, rules: newRules });
  };

  const handleAddRule = () => {
    if (!editForm) return;
    setEditForm({ ...editForm, rules: [...editForm.rules, { text: '' }] });
  };

  const handleUpdateRule = (idx: number, updates: Partial<InstructionRule>) => {
    if (!editForm) return;
    const newRules = [...editForm.rules];
    newRules[idx] = { ...newRules[idx], ...updates };
    setEditForm({ ...editForm, rules: newRules });
  };

  return (
    <div className="space-y-10 pb-32 animate-in fade-in slide-in-from-bottom-5 duration-700">
      {showPin && <PinModal onSuccess={handleFinalSave} onCancel={() => setShowPin(false)} />}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary rounded-[2rem] flex items-center justify-center text-white shadow-2xl">
            <Home size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">House Standards</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Auburn Hub Operational Manual</p>
          </div>
        </div>
        <button 
          onClick={handleAddClick}
          className="bg-primary text-white px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 italic"
        >
          <Plus size={18} /> New Section
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {state.instructions.map((section, idx) => (
          <div 
            key={section.id} 
            className="group bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all duration-500"
          >
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                  {section.emoji}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">
                    {section.title}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => handleEditClick(section)}
                className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary transition-all flex items-center justify-center"
              >
                <Edit2 size={16} />
              </button>
            </div>
            
            <ul className="space-y-4">
              {section.rules.map((rule, ridx) => (
                <li key={ridx} className="flex gap-4 items-start">
                  <div className={`mt-1 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center ${rule.warning ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    {rule.warning ? <Ban size={12} strokeWidth={4} /> : <CheckCircle2 size={14} strokeWidth={3} />}
                  </div>
                  <p className={`text-sm leading-relaxed tracking-tight ${rule.highlight ? 'text-slate-900 dark:text-white font-black italic' : 'text-slate-500 dark:text-slate-400 font-bold'}`}>
                    {rule.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {(editingId || isAdding) && editForm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
          <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-[4rem] w-full max-w-2xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar">
            <header className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">
                {isAdding ? "Draft New Section" : "Configure Standards"}
              </h3>
              <button onClick={() => { setEditingId(null); setEditForm(null); }} className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center"><X size={20} /></button>
            </header>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Section Title</label>
                <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-6 py-4 text-sm font-black italic dark:text-white outline-none border-2 border-transparent focus:border-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Emoji Icon</label>
                <input type="text" value={editForm.emoji} onChange={e => setEditForm({ ...editForm, emoji: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-6 py-4 text-center text-xl font-black italic dark:text-white outline-none border-2 border-transparent focus:border-primary" />
              </div>
            </div>

            <div className="space-y-4 mb-10">
              <div className="flex justify-between items-center px-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rules & Regulations</label>
                <button onClick={handleAddRule} className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Plus size={14} /> Add Rule</button>
              </div>
              {editForm.rules.map((rule, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex gap-4">
                    <textarea value={rule.text} onChange={e => handleUpdateRule(idx, { text: e.target.value })} placeholder="Rule description..." className="flex-1 bg-white dark:bg-slate-900 rounded-xl p-4 text-xs font-bold italic outline-none dark:text-white shadow-inner resize-none h-20" />
                    <button onClick={() => handleDeleteRule(idx)} className="text-rose-300 hover:text-rose-500 transition-colors p-2"><Trash2 size={18} /></button>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => handleUpdateRule(idx, { highlight: !rule.highlight })} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all ${rule.highlight ? 'bg-primary text-white border-primary' : 'text-slate-400 border-slate-100 dark:border-slate-700'}`}>Highlight</button>
                    <button onClick={() => handleUpdateRule(idx, { warning: !rule.warning })} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all ${rule.warning ? 'bg-rose-500 text-white border-rose-500' : 'text-slate-400 border-slate-100 dark:border-slate-700'}`}>Warning Icon</button>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleSaveAttempt} className="w-full bg-primary text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.3em] shadow-xl italic flex items-center justify-center gap-3">
              <Save size={18} /> Commit Standard to Hub
            </button>
            {!isAdding && (
              <button 
                onClick={() => {
                  if(confirm("Permanently delete this entire section?")) {
                    onUpdateInstructions(state.instructions.filter(s => s.id !== editForm.id));
                    setEditingId(null);
                    setEditForm(null);
                  }
                }}
                className="w-full mt-4 py-3 text-rose-500 text-[10px] font-black uppercase tracking-widest italic"
              >
                Delete Section
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructionView;
