
import React from 'react';
import { AppState } from '../types';
import { Download, FileText, Database, Table, Users, DollarSign, Sparkles } from 'lucide-react';

interface DataViewProps {
  state: AppState;
}

const DataView: React.FC<DataViewProps> = ({ state }) => {
  const downloadCSV = (csvContent: string, fileName: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportRentData = () => {
    const headers = ['Date', 'Amount', ...state.members.map(m => m.name)].join(',');
    const rows = state.rentEvents.map(event => {
      const statuses = state.members.map(m => event.memberStatuses[m.name] ? 'Paid' : 'Pending');
      return [event.date, event.amount, ...statuses].join(',');
    });
    downloadCSV([headers, ...rows].join('\n'), 'auburn_rent_data.csv');
  };

  const exportChoreOverrides = () => {
    const headers = ['Date', 'Type', 'Assigned To'].join(',');
    const rows = state.choreOverrides.map(o => [o.date, o.type, o.member].join(','));
    downloadCSV([headers, ...rows].join('\n'), 'auburn_chore_overrides.csv');
  };

  const exportBillsData = () => {
    const headers = ['Month', 'Category', 'Total Amount', 'Paid By', 'Description'].join(',');
    const rows = state.bills.map(b => [b.month, b.category, b.totalAmount, b.paidBy, `"${b.description || ''}"`].join(','));
    downloadCSV([headers, ...rows].join('\n'), 'auburn_bills_data.csv');
  };

  const exportAdvanceData = () => {
    const headers = ['Member', 'Security Deposit', 'Top-up', 'Notes'].join(',');
    const rows = state.members.map(m => {
      const details = state.advanceData.memberDetails[m.name];
      return [m.name, details?.security || 0, details?.topUp || 0, `"${details?.notes || ''}"`].join(',');
    });
    downloadCSV([headers, ...rows].join('\n'), 'auburn_advance_ledger.csv');
  };

  const exportMembersData = () => {
    const headers = ['Name', 'Phone', 'Email', 'DOB', 'Rent Share'].join(',');
    const rows = state.members.map(m => [m.name, m.phone, m.email, m.dob, m.rentShare].join(','));
    downloadCSV([headers, ...rows].join('\n'), 'auburn_residents.csv');
  };

  const exportOptions = [
    { title: 'Rent & Payments', desc: 'Full fortnightly rent ledger', icon: <DollarSign />, action: exportRentData, color: 'bg-emerald-500' },
    { title: 'Chore Schedule', desc: 'Manual assignments & overrides', icon: <Sparkles />, action: exportChoreOverrides, color: 'bg-amber-500' },
    { title: 'Utility Bills', desc: 'Invoices for electricity, gas, etc.', icon: <FileText />, action: exportBillsData, color: 'bg-indigo-500' },
    { title: 'Advance Funds', desc: 'Security deposits and top-ups', icon: <Database />, action: exportAdvanceData, color: 'bg-rose-500' },
    { title: 'Resident Profiles', desc: 'Basic contact and share info', icon: <Users />, action: exportMembersData, color: 'bg-slate-700' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <header>
        <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">Export Data Center</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Download house records as CSV</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {exportOptions.map((opt, i) => (
          <button 
            key={i} 
            onClick={opt.action}
            className="group bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all text-left flex flex-col items-start"
          >
            <div className={`w-14 h-14 ${opt.color} rounded-2xl flex items-center justify-center text-white shadow-xl mb-6 group-hover:scale-110 transition-transform`}>
              {React.cloneElement(opt.icon as React.ReactElement, { size: 24 })}
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter mb-1">{opt.title}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">{opt.desc}</p>
            <div className="mt-auto w-full flex items-center justify-between text-primary font-black text-[10px] uppercase tracking-widest pt-4 border-t border-slate-50 dark:border-slate-800 group-hover:text-primary-hover">
              <span>Export as CSV</span>
              <Download size={14} />
            </div>
          </button>
        ))}
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 p-8 rounded-[3rem] border border-amber-100 dark:border-amber-900/30">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
             <Table size={20} />
          </div>
          <h4 className="text-sm font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest">CSV Format Notice</h4>
        </div>
        <p className="text-xs font-bold text-amber-700/70 dark:text-amber-500/50 leading-relaxed uppercase tracking-wider">
          All exported files are compatible with Excel, Google Sheets, and Numbers. 
          Data is pulled directly from the current state of your Auburn House hub.
        </p>
      </div>
    </div>
  );
};

export default DataView;
