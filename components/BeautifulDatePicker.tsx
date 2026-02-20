
import React, { useState, useMemo } from 'react';
import { format, getDaysInMonth, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Check } from 'lucide-react';

interface BeautifulDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  onClose: () => void;
}

const BeautifulDatePicker: React.FC<BeautifulDatePickerProps> = ({ value, onChange, onClose }) => {
  const initialDate = useMemo(() => value ? new Date(value) : new Date(1995, 0, 1), [value]);
  const [viewDate, setViewDate] = useState(initialDate);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const daysInMonth = getDaysInMonth(viewDate);
  // Manual replacement for startOfMonth using native Date
  const firstDayOfMonth = getDay(new Date(viewDate.getFullYear(), viewDate.getMonth(), 1));
  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  const years = useMemo(() => {
    const arr = [];
    for (let i = 1950; i <= new Date().getFullYear(); i++) arr.push(i);
    return arr.reverse();
  }, []);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Manual replacement for setMonth navigation using native Date
  const handlePrevMonth = () => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    onChange(format(newDate, 'yyyy-MM-dd'));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-primary p-8 text-white relative">
          <button onClick={onClose} className="absolute top-6 right-6 opacity-60 hover:opacity-100 transition-opacity">
            <X size={24} />
          </button>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-80">Select Birthdate</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-black tracking-tighter italic">
              {format(viewDate, 'MMM dd')}
            </h3>
            <button 
              onClick={() => setShowYearPicker(!showYearPicker)}
              className="text-2xl font-black opacity-60 hover:opacity-100 transition-all flex items-center gap-1"
            >
              {currentYear}
            </button>
          </div>
        </div>

        <div className="p-6">
          {showYearPicker ? (
            <div className="h-72 overflow-y-auto no-scrollbar grid grid-cols-3 gap-2 p-2 animate-in slide-in-from-top-2">
              {years.map(y => (
                <button
                  key={y}
                  onClick={() => {
                    // Manual replacement for setYear using native Date
                    setViewDate(new Date(y, viewDate.getMonth(), 1));
                    setShowYearPicker(false);
                  }}
                  className={`py-3 rounded-2xl text-sm font-black transition-all ${y === currentYear ? 'bg-primary text-white scale-110 shadow-lg' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'}`}
                >
                  {y}
                </button>
              ))}
            </div>
          ) : (
            <div className="animate-in slide-in-from-bottom-2">
              <div className="flex justify-between items-center mb-6 px-2">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => setShowYearPicker(true)}
                  className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors"
                >
                  {months[currentMonth]} {currentYear}
                </button>
                <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="text-center text-[10px] font-black text-slate-300 dark:text-slate-600 py-2">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const isSelected = initialDate.getDate() === day && initialDate.getMonth() === currentMonth && initialDate.getFullYear() === currentYear;
                  return (
                    <button
                      key={day}
                      onClick={() => handleDateSelect(day)}
                      className={`h-10 w-10 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${isSelected ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' : 'hover:bg-primary/10 hover:text-primary text-slate-600 dark:text-slate-400'}`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BeautifulDatePicker;
