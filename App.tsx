
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
  format, 
  isWednesday,
  isSaturday,
  addDays
} from 'date-fns';
import { 
  Home, DollarSign, CreditCard, Scissors, Settings as SettingsIcon, Plus, X, MapPin, ArrowLeft, Sparkles, Droplets, Trash2, Save, Moon, Sun, Leaf, Flame, Menu, Edit2, ListChecks, Info, AlertCircle, Bot, Database, Bell, BellOff, Volume2, UserPlus, Mail, Phone, Cake, User, Trash, ArrowUpRight, Megaphone, Users, Calendar, Loader2, Cloud, Heart, ShieldCheck, Palette, Download
} from 'lucide-react';
import { AppState, ViewType, MemberName, BillItem, Member, BillPayment, MemberAdvanceDetails, AppTheme, ChoreOverride, ChatMessage, NotificationSettings, Notice, InstructionSection } from './types';
import { MEMBERS, generateInitialRent, INITIAL_BILLS } from './constants';
import Background from './components/Background';
import MemberStrip from './components/MemberStrip';
import MemberShowcase from './components/MemberShowcase';
import FinanceView from './components/FinanceView';
import RentView from './components/RentView';
import AdvanceView from './components/AdvanceView';
import ScheduleView from './components/ScheduleView';
import InstructionView from './components/InstructionView';
import ChatView from './components/ChatView';
import DataView from './components/DataView';
import NoticeView from './components/NoticeView';
import MembersView from './components/MembersView';
import HouseCalendarView from './components/HouseCalendarView';
import BeautifulDatePicker from './components/BeautifulDatePicker';
import PinModal from './components/PinModal';
import AdminView from './components/AdminView';
import { getCleaningAssignment, getBinAssignment, getLaundryAssignment, getGrassAssignment } from './services/dataService';
import { database, getInitialState } from './services/dbService';

const THEMES: { id: AppTheme, icon: any, label: string, color: string, desc: string }[] = [
  { id: 'default', icon: Sun, label: 'Indigo Fusion', color: 'bg-indigo-600', desc: 'Modern & balanced' },
  { id: 'dark', icon: Moon, label: 'Midnight Core', color: 'bg-slate-900', desc: 'Dark focus mode' },
  { id: 'nature', icon: Leaf, label: 'Nature Zen', color: 'bg-emerald-600', desc: 'Calm & organic' },
  { id: 'sunset', icon: Flame, label: 'Sunset Rise', color: 'bg-rose-600', desc: 'Vibrant energy' },
];

const DashboardSummary: React.FC<{ state: AppState; onNavigate: (view: ViewType) => void; onDismissNotice: (id: string) => void }> = ({ state, onNavigate, onDismissNotice }) => {
  const today = useMemo(() => new Date(), []);
  const [noticeToDismiss, setNoticeToDismiss] = useState<string | null>(null);
  
  const nextRent = useMemo(() => {
    return state.rentEvents.find(e => new Date(e.date) >= today) || state.rentEvents[state.rentEvents.length - 1];
  }, [state.rentEvents, today]);

  const activeNotices = useMemo(() => {
    return state.notices.filter(n => !state.dismissedNoticeIds.includes(n.id));
  }, [state.notices, state.dismissedNoticeIds]);

  const cleaningInfo = useMemo(() => {
    const todayAssignment = getCleaningAssignment(today, state.choreOverrides);
    if (todayAssignment) {
      return { value: todayAssignment, date: 'Today', label: 'Deep Clean' };
    }
    // Find next
    for (let i = 1; i <= 30; i++) {
      const nextDate = addDays(today, i);
      const assignment = getCleaningAssignment(nextDate, state.choreOverrides);
      if (assignment) {
        return { value: assignment, date: format(nextDate, 'EEEE, MMM do'), label: 'Next Deep Clean' };
      }
    }
    return { value: 'N/A', date: 'TBD', label: 'Deep Clean' };
  }, [today, state.choreOverrides]);

  const laundryPerson = useMemo(() => getLaundryAssignment(today, state.choreOverrides), [today, state.choreOverrides]);
  const binDate = useMemo(() => isWednesday(today) ? today : addDays(today, (3 - today.getDay() + 7) % 7 || 7), [today]);
  const binPerson = useMemo(() => getBinAssignment(binDate, state.choreOverrides), [binDate, state.choreOverrides]);
  const grassDate = useMemo(() => isSaturday(today) ? today : addDays(today, (6 - today.getDay() + 7) % 7 || 7), [today]);
  const grassPerson = useMemo(() => getGrassAssignment(grassDate, state.choreOverrides), [grassDate, state.choreOverrides]);

  const cards = [
    { label: 'Upcoming Rent', value: nextRent ? `$${nextRent.amount}` : 'N/A', date: nextRent ? format(new Date(nextRent.date), 'EEEE, MMM do') : 'TBD', icon: <DollarSign size={20} />, color: 'bg-emerald-500', text: 'text-emerald-500', target: 'rent' as ViewType },
    { label: cleaningInfo.label, value: cleaningInfo.value, date: cleaningInfo.date, icon: <Sparkles size={20} />, color: 'bg-amber-500', text: 'text-amber-500', target: 'schedule' as ViewType },
    { label: 'Laundry Share', value: laundryPerson, date: format(today, 'EEEE, MMM do'), icon: <Droplets size={20} />, color: 'bg-sky-500', text: 'text-sky-500', target: 'schedule' as ViewType },
    { label: 'Grass Cutting', value: grassPerson, date: format(grassDate, 'EEEE, MMM do'), icon: <Scissors size={20} />, color: 'bg-green-600', text: 'text-green-600', target: 'schedule' as ViewType },
    { label: 'Bin Reminder', value: binPerson, date: format(binDate, 'EEEE, MMM do'), icon: <Trash2 size={20} />, color: 'bg-rose-500', text: 'text-rose-500', target: 'schedule' as ViewType },
  ];

  return (
    <div className="space-y-6 pb-12">
      {noticeToDismiss && (
        <PinModal 
          onSuccess={() => { onDismissNotice(noticeToDismiss); setNoticeToDismiss(null); }}
          onCancel={() => setNoticeToDismiss(null)}
        />
      )}
      {activeNotices.length > 0 && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
          {activeNotices.map((notice) => (
            <div 
              key={notice.id} 
              className="bg-rose-600 text-white p-6 sm:p-8 rounded-[3rem] shadow-2xl shadow-rose-600/30 border-4 border-white/20 relative overflow-hidden group animate-pulse-slow"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-rose-700 via-rose-500 to-rose-700 animate-gradient opacity-50" />
              <div className="relative z-10 flex justify-between items-start gap-6">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 shrink-0">
                    <Megaphone size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase italic tracking-tighter leading-none mb-1 flex items-center gap-2">
                      Official Broadcast <span className="text-[10px] bg-white text-rose-600 px-2 py-0.5 rounded-full not-italic">URGENT</span>
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-100 mb-4 opacity-80">Posted {format(new Date(notice.date), 'MMM do')}</p>
                    <p className="text-base font-black italic tracking-tight leading-relaxed text-white drop-shadow-md pr-12">
                      {notice.content}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setNoticeToDismiss(notice.id)}
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all border border-white/20 group-hover:scale-110 active:scale-90"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <button 
            key={i} 
            onClick={() => onNavigate(card.target)}
            className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group text-left"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${card.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                <p className="text-lg font-black text-slate-800 dark:text-white uppercase italic tracking-tighter mt-0.5">{card.value}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-[9px] font-black uppercase tracking-tight ${card.text}`}>{card.date}</p>
            </div>
          </button>
        ))}
      </div>

      <div 
        onClick={() => onNavigate('rent')}
        className="bg-rose-600 rounded-[3rem] p-8 text-white shadow-[0_20px_50px_rgba(225,29,72,0.4)] relative overflow-hidden group cursor-pointer hover:shadow-rose-600/60 transition-all active:scale-[0.98] border-4 border-white/20"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-rose-700 to-rose-500 animate-gradient opacity-50" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="w-16 h-16 bg-white/20 rounded-[2rem] flex items-center justify-center animate-pulse border border-white/30 backdrop-blur-md shrink-0">
              <AlertCircle size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">ACTION REQUIRED</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-100 mt-2">Financial Hub Status: ACTIVE</p>
            </div>
          </div>
          <div className="flex flex-col items-center sm:items-end">
            <p className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase italic tracking-tighter text-white drop-shadow-2xl leading-none">
              SEND MONEY TO MAMUN
            </p>
            <p className="text-[10px] font-bold text-rose-100 uppercase tracking-[0.2em] mt-3 flex items-center gap-2">
              Next Due: {nextRent ? format(new Date(nextRent.date), 'MMMM do') : 'TBD'} <ArrowUpRight size={14} />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [popupImage, setPopupImage] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isDatabaseLoaded, setIsDatabaseLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [navigationPath, setNavigationPath] = useState<ViewType[]>([]);
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  
  const [state, setState] = useState<AppState>(getInitialState());
  const socketRef = useRef<any>(null);
  const isRemoteUpdateRef = useRef(false);

  useEffect(() => {
    socketRef.current = io();

    socketRef.current.on('state_updated', (newState: AppState) => {
      isRemoteUpdateRef.current = true;
      setState(newState);
      setTimeout(() => {
        isRemoteUpdateRef.current = false;
      }, 500);
    });

    socketRef.current.on('state_cleared', () => {
      window.location.reload();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const initApp = async () => {
      const savedState = await database.load();
      setState(savedState);
      const root = window.document.documentElement;
      const theme = savedState.settings.theme || 'default';
      root.setAttribute('data-theme', theme);
      if (theme === 'dark') root.classList.add('dark');
      else root.classList.remove('dark');
      setIsDatabaseLoaded(true);
    };
    initApp();
  }, []);

  useEffect(() => {
    if (!isDatabaseLoaded || isRemoteUpdateRef.current) return;
    const syncToDb = async () => {
      setIsSyncing(true);
      await database.save(state);
      setTimeout(() => setIsSyncing(false), 800);
    };
    const timer = setTimeout(syncToDb, 1000);
    return () => clearTimeout(timer);
  }, [state, isDatabaseLoaded]);

  const toggleTheme = (theme: AppTheme) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, theme } }));
    const root = window.document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  };

  const handleNavClick = (view: ViewType) => {
    if (view === 'admin' && !isAdminAuthenticated) {
      setShowAdminPin(true);
      return;
    }
    
    if (activeView === 'admin') {
        setNavigationPath(['admin']);
    } else if (view !== 'admin' && navigationPath.includes('admin')) {
        // Carry on
    } else {
        setNavigationPath([]);
    }

    setActiveView(view);
    setIsSidebarOpen(false);
  };

  const handleAdminAuthSuccess = () => {
    setIsAdminAuthenticated(true);
    setShowAdminPin(false);
    setActiveView('admin');
  };

  const handleBackToAdmin = () => {
      setActiveView('admin');
      setNavigationPath([]);
  };

  const handleAddNotice = (content: string) => {
    const newNotice: Notice = {
      id: Math.random().toString(36).substr(2, 9),
      content,
      date: new Date().toISOString(),
      author: 'Mamun',
      isActive: true
    };
    setState(prev => ({ ...prev, notices: [...prev.notices, newNotice] }));
    setActiveView('dashboard');
  };

  const handleDeleteNotice = (id: string) => {
    setState(prev => ({ ...prev, notices: prev.notices.filter(n => n.id !== id) }));
  };

  const handleDismissNotice = (id: string) => {
    setState(prev => ({ ...prev, dismissedNoticeIds: [...prev.dismissedNoticeIds, id] }));
  };

  const handleAddMember = (newMember: Member) => {
    const id = Math.random().toString(36).substr(2, 9);
    const memberWithId = { ...newMember, id };
    setState(prev => ({ 
      ...prev, 
      members: [...prev.members, memberWithId], 
      advanceData: { 
        ...prev.advanceData, 
        memberDetails: { 
          ...prev.advanceData.memberDetails, 
          [memberWithId.name]: { security: memberWithId.initialAdvance, topUp: 0, notes: 'Initial registration' } 
        } 
      } 
    }));
  };

  const handleUpdateMember = (updated: Member) => {
    setState(prev => ({
      ...prev,
      members: prev.members.map(m => m.id === updated.id ? updated : m)
    }));
  };

  const handleDeleteMember = (id: string) => {
    setState(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id !== id)
    }));
  };

  const navGroups: { title: string; items: { id: ViewType; label: string; icon: any; mobile?: boolean }[] }[] = [
    {
      title: 'Main Hub',
      items: [
        { id: 'dashboard', label: 'Home Hub', icon: Home, mobile: true },
        { id: 'chat', label: 'Ask Mamun', icon: Bot, mobile: true },
        { id: 'instruction', label: 'Instruction', icon: ListChecks },
        { id: 'notices', label: 'Notice Center', icon: Megaphone },
      ]
    },
    {
      title: 'Management',
      items: [
        { id: 'admin', label: 'Command Center', icon: ShieldCheck, mobile: true },
        { id: 'house-calendar', label: 'House Calendar', icon: Calendar, mobile: true },
        { id: 'rent', label: 'Rent Tracking', icon: DollarSign },
        { id: 'finance', label: 'Utility Entry', icon: CreditCard },
        { id: 'schedule', label: 'Rotation Roster', icon: Scissors },
        { id: 'advance', label: 'Security Bond', icon: Database },
        { id: 'members', label: 'Resident Registry', icon: Users },
      ]
    },
    {
      title: 'System',
      items: [
        { id: 'data', label: 'Data Export', icon: Download },
        { id: 'settings', label: 'App Settings', icon: SettingsIcon },
      ]
    }
  ];

  const allNavItems = navGroups.flatMap(g => g.items);

  if (!isDatabaseLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 space-y-8 animate-in fade-in duration-500">
        <Background />
        <div className="relative">
          <div className="w-24 h-24 rounded-[2rem] bg-primary/20 flex items-center justify-center animate-pulse"><Database size={48} className="text-primary" /></div>
          <div className="absolute -inset-4 border-2 border-primary/20 rounded-[3rem] animate-spin-slow"></div>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">Initializing Database</h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2 flex items-center justify-center gap-3"><Loader2 size={12} className="animate-spin" /> Verifying Records</p>
        </div>
      </div>
    );
  }

  const isFullScreenView = activeView === 'chat';
  const showBackButton = navigationPath.includes('admin') && activeView !== 'admin';

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 font-['Inter'] transition-colors duration-300">
      <Background />
      {showAdminPin && <PinModal onSuccess={handleAdminAuthSuccess} onCancel={() => setShowAdminPin(false)} />}
      
      {isThemeSelectorOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsThemeSelectorOpen(false)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter leading-none">Select Theme</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Visual Identity Protocol</p>
              </div>
              <button onClick={() => setIsThemeSelectorOpen(false)} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-rose-500 transition-colors"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {THEMES.map((t) => (
                <button 
                  key={t.id} 
                  onClick={() => { toggleTheme(t.id); setIsThemeSelectorOpen(false); }}
                  className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-4 group ${state.settings.theme === t.id ? 'bg-primary/5 border-primary shadow-sm' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700'}`}
                >
                  <div className={`w-10 h-10 rounded-xl ${t.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <t.icon size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-800 dark:text-white uppercase italic leading-none">{t.label}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t.desc}</p>
                  </div>
                  {state.settings.theme === t.id && (
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {popupImage && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-12 bg-slate-950/95 backdrop-blur-xl" onClick={() => setPopupImage(null)}>
          <button onClick={() => setPopupImage(null)} className="absolute top-6 right-6 text-white bg-white/10 w-14 h-14 rounded-full flex items-center justify-center z-[2010]"><X size={32} /></button>
          <img src={popupImage} className="max-w-full max-h-full rounded-[2rem] sm:rounded-[4rem] shadow-2xl object-contain border-4 border-white/10" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* SIDEBAR - LUXURIOUS REFINEMENT */}
      <nav className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 z-[100] transition-transform duration-300 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:flex shadow-2xl flex flex-col h-screen overflow-hidden`}>
        {/* Sidebar Header - High Brand Impact */}
        <div className="p-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] md:pt-6 border-b dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-primary/20 shrink-0 italic">A</div>
            <span className="text-2xl font-black tracking-tighter text-slate-800 dark:text-white uppercase italic leading-none">Auburn</span>
            <button 
              onClick={() => setIsThemeSelectorOpen(true)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-primary ml-1"
              title="Change Theme"
            >
              <Palette size={18} />
            </button>
            <button className="md:hidden text-slate-400 ml-auto" onClick={() => setIsSidebarOpen(false)}><X size={24} /></button>
          </div>
        </div>

        {/* Menu Container - Luxurious Scroll */}
        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar p-3 space-y-6 mt-2">
          {navGroups.map(group => (
            <div key={group.title} className="space-y-1">
              <h4 className="px-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-2">{group.title}</h4>
              {group.items.map(item => (
                <button 
                  key={item.id} 
                  onClick={() => handleNavClick(item.id)} 
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all relative group ${
                    activeView === item.id 
                      ? 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/30 scale-[1.02] border-l-4 border-white/20' 
                      : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  <item.icon size={16} className={`shrink-0 transition-transform ${activeView === item.id ? 'scale-110' : 'group-hover:scale-110'}`} /> 
                  <span className={`text-[10px] font-extrabold uppercase italic tracking-[0.1em] leading-none truncate transition-all ${
                    activeView === item.id ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                  }`}>
                    {item.label}
                  </span>
                  {activeView === item.id && (
                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Fixed Footer - Subtle & Elegant */}
        <div className="p-6 border-t dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 italic">Core Systems</span>
                <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600 mt-0.5">Auburn Hub v1.4.2</span>
             </div>
          </div>
        </div>
      </nav>

      <main className={`flex-grow md:ml-64 w-full relative transition-all ${isFullScreenView ? 'p-0 max-w-none' : 'p-4 sm:p-6 md:p-12 pt-[env(safe-area-inset-top)] sm:pt-6 md:pt-12 max-w-7xl mx-auto'}`}>
        {!isFullScreenView && (
          <div className="flex justify-between items-center mb-6 min-h-[64px] md:min-h-[48px]">
             <button 
               className="md:hidden p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 active:scale-90 transition-all z-[110] flex items-center justify-center" 
               onClick={(e) => {
                 e.stopPropagation();
                 setIsSidebarOpen(true);
               }}
               aria-label="Open Menu"
             >
               <Menu size={24} className="text-primary" />
             </button>
             
             {showBackButton && (
                 <button 
                    onClick={handleBackToAdmin}
                    className="flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 italic ml-auto animate-in slide-in-from-right duration-300"
                 >
                    <ArrowLeft size={16} /> Back to Command Center
                 </button>
             )}
          </div>
        )}

        <div className="animate-in fade-in zoom-in-95 duration-500 h-full flex flex-col">
          <div className="flex-grow">
            {activeView === 'dashboard' && (
              <div className="space-y-8 pb-32 md:pb-0">
                 <header className="relative h-44 sm:h-56 rounded-[2rem] sm:rounded-[3rem] overflow-hidden bg-primary flex items-center p-6 sm:p-10 text-white shadow-2xl">
                   <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-hover to-slate-900 animate-gradient" />
                   <div className="relative z-10 w-full flex justify-between items-end">
                     <div>
                       <div className="flex items-center gap-3 mb-3 opacity-80 uppercase text-[8px] sm:text-[10px] font-black tracking-[0.3em]"><MapPin size={14} /> 37 Normanby Rd, Auburn</div>
                       <h1 className="text-3xl sm:text-5xl font-black tracking-tighter mb-2 uppercase italic leading-tight text-white drop-shadow-lg">Auburn House</h1>
                       <p className="text-white/70 text-xs sm:text-sm font-bold opacity-80 italic">Management Hub • {format(new Date(), 'MMMM yyyy')}</p>
                     </div>
                   </div>
                 </header>
                 <MemberStrip onMemberClick={(n) => { setSelectedMember(state.members.find(m => m.name === n) || null); setActiveView('profile'); setIsEditingProfile(false); }} />
                 <MemberShowcase />
                 <DashboardSummary state={state} onNavigate={handleNavClick} onDismissNotice={handleDismissNotice} />
              </div>
            )}

            {activeView === 'admin' && <AdminView onNavigate={handleNavClick} />}
            {activeView === 'chat' && <ChatView state={state} onUpdateHistory={(h) => setState(p => ({ ...p, chatHistory: h }))} />}
            {activeView === 'notices' && <NoticeView state={state} onAddNotice={handleAddNotice} onDeleteNotice={handleDeleteNotice} />}
            {activeView === 'members' && <MembersView state={state} onAddMember={handleAddMember} onUpdateMember={handleUpdateMember} onDeleteMember={handleDeleteMember} />}
            {activeView === 'house-calendar' && <HouseCalendarView state={state} />}
            {activeView === 'rent' && <RentView roommates={state.members} rentEvents={state.rentEvents} onToggleStatus={(id, name) => setState(p => ({ ...p, rentEvents: p.rentEvents.map(e => e.id === id ? { ...e, memberStatuses: { ...e.memberStatuses, [name]: !e.memberStatuses[name] } } : e) }))} />}
            {activeView === 'finance' && <FinanceView roommates={state.members} bills={state.bills} payments={state.billPayments} onAddBill={(b) => setState(p => ({ ...p, bills: [b, ...p.bills] }))} onUpdateBill={(b) => setState(p => ({ ...p, bills: p.bills.map(item => item.id === b.id ? b : item) }))} onDeleteBill={(id) => setState(p => ({ ...p, bills: p.bills.filter(b => b.id !== id) }))} onAddPayment={(pay) => setState(p => ({ ...p, billPayments: [...p.billPayments, pay]}))} onUpdatePayments={(pays) => setState(p => ({ ...p, billPayments: pays }))} rentEvents={state.rentEvents} />}
            {activeView === 'schedule' && <ScheduleView roommates={state.members} overrides={state.choreOverrides} onAddOverride={(o) => setState(p => ({ ...p, choreOverrides: [o, ...p.choreOverrides.filter(x => !(x.date === o.date && x.type === o.type))] }))} />}
            {activeView === 'instruction' && <InstructionView state={state} onUpdateInstructions={(inst) => setState(p => ({ ...p, instructions: inst }))} />}
            {activeView === 'data' && <DataView state={state} />}
            {activeView === 'advance' && <AdvanceView roommates={state.members} advanceData={state.advanceData.memberDetails} onUpdateAdvance={(n, d) => setState(p => ({ ...p, advanceData: { ...p.advanceData, memberDetails: { ...p.advanceData.memberDetails, [n]: d } } }))} onImageClick={(src) => setPopupImage(src)} />}
            {activeView === 'settings' && <SettingsView state={state} onToggleTheme={toggleTheme} />}
            
            {activeView === 'profile' && selectedMember && (
              <div className="space-y-8 pb-32 animate-in slide-in-from-right-10 duration-500">
                 <div className="flex justify-between items-center px-2">
                   <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-primary font-black group"><div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all"><ArrowLeft size={20} /></div><span className="text-[10px] font-black uppercase tracking-widest italic">Back</span></button>
                 </div>
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div className="lg:col-span-1">
                     <div className="bg-white dark:bg-slate-900 p-10 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col items-center text-center transition-all hover:shadow-2xl">
                       <div className="relative group cursor-pointer transition-transform hover:scale-105" onClick={() => setPopupImage(selectedMember.avatar)}>
                         <img src={selectedMember.avatar} className="w-48 h-48 rounded-[3.5rem] object-cover border-8 border-primary-soft dark:border-slate-800 shadow-2xl mb-8" />
                         <div className="absolute inset-0 bg-black/30 rounded-[3.5rem] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><span className="text-white text-[10px] font-black uppercase tracking-widest">Enlarge</span></div>
                       </div>
                       <h2 className="text-4xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter mb-2 leading-none">{selectedMember.name}</h2>
                       {isEditingProfile && (
                         <div className="w-full space-y-2 text-left mt-6 animate-in slide-in-from-bottom-2">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Avatar Link</label>
                           <input type="text" value={selectedMember.avatar} onChange={(e) => setSelectedMember({...selectedMember, avatar: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3 text-xs font-bold outline-none dark:text-white shadow-inner" />
                         </div>
                       )}
                     </div>
                   </div>
                   <div className="lg:col-span-2">
                     <div className="bg-white dark:bg-slate-900 rounded-[4rem] p-10 shadow-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-10 px-2">
                          <div><h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter leading-none">Identity Profile</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Authorized Record</p></div>
                          <div className="flex gap-2">{isEditingProfile ? (<button onClick={() => { handleUpdateMember(selectedMember); setIsEditingProfile(false); }} className="flex items-center gap-2 bg-emerald-500 text-white px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 italic"><Save size={18} /> Save Identity</button>) : (<button onClick={() => setIsEditingProfile(true)} className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 italic"><Edit2 size={18} /> Edit Details</button>)}</div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                          <ProfileField label="Full Name" value={selectedMember.name} icon={<User size={18} />} isEditing={isEditingProfile} onChange={(v:any) => setSelectedMember({...selectedMember, name: v})} />
                          <ProfileField label="Birthdate" value={selectedMember.dob} icon={<Cake size={18} />} type="date" isEditing={isEditingProfile} onChange={(v:any) => setSelectedMember({...selectedMember, dob: v})} />
                          <ProfileField label="Phone" value={selectedMember.phone} icon={<Phone size={18} />} isEditing={isEditingProfile} onChange={(v:any) => setSelectedMember({...selectedMember, phone: v})} />
                          <ProfileField label="Email" value={selectedMember.email} icon={<Mail size={18} />} isEditing={isEditingProfile} onChange={(v:any) => setSelectedMember({...selectedMember, email: v})} />
                          <ProfileField label="Rent Share" value={selectedMember.rentShare.toString()} icon={<DollarSign size={18} />} type="number" isEditing={isEditingProfile} onChange={(v:any) => setSelectedMember({...selectedMember, rentShare: parseFloat(v) || 0})} />
                          <ProfileField label="Initial Advance" value={selectedMember.initialAdvance.toString()} icon={<Database size={18} />} type="number" isEditing={isEditingProfile} onChange={(v:any) => setSelectedMember({...selectedMember, initialAdvance: parseFloat(v) || 0})} />
                        </div>
                     </div>
                   </div>
                 </div>
              </div>
            )}
          </div>
          {!isFullScreenView && (
            <footer className="mt-20 py-12 flex flex-col items-center gap-4 opacity-40 hover:opacity-100 transition-opacity">
              <div className="w-12 h-0.5 bg-slate-300 dark:bg-slate-800 rounded-full" />
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400 italic"><span>Made with</span><Heart size={10} className="text-rose-500 fill-rose-500 animate-pulse" /><span>by Mamun</span></div>
            </footer>
          )}
        </div>
      </main>

      <div className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 flex items-center justify-around px-4 pb-safe z-50">
        {allNavItems.filter(i=>i.mobile).map(i => (<button key={i.id} onClick={() => handleNavClick(i.id)} className={`flex flex-col items-center gap-1 transition-all ${activeView === i.id || (i.id === 'admin' && ['members', 'rent', 'finance', 'schedule', 'advance', 'data', 'settings', 'notices', 'instruction'].includes(activeView)) ? 'text-primary scale-110' : 'text-slate-300'}`}><i.icon size={18} /><span className="text-[8px] font-black uppercase tracking-tighter">{i.label}</span></button>))}
      </div>
    </div>
  );
};

const ProfileField = ({ label, value, icon, isEditing, onChange, type = "text" }: any) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1"><div className="text-primary">{icon}</div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label></div>
      {isEditing ? (<div className="relative group">{type === 'date' ? (<><button type="button" onClick={() => setShowDatePicker(true)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-primary-soft dark:border-slate-700 hover:border-primary transition-all rounded-2xl px-6 py-4 text-sm font-black text-left dark:text-white italic flex justify-between items-center"><span>{value ? format(new Date(value), 'MMMM do, yyyy') : 'Select Date'}</span><Calendar size={18} className="opacity-40" /></button>{showDatePicker && (<BeautifulDatePicker value={value} onChange={onChange} onClose={() => setShowDatePicker(false)} />)}</>) : (<input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-primary-soft dark:border-slate-700 focus:border-primary transition-all rounded-2xl px-6 py-4 text-sm font-black outline-none dark:text-white italic" />)}</div>) : (<div className="bg-slate-50/50 dark:bg-slate-800/50 px-6 py-4 rounded-2xl font-black text-slate-800 dark:text-slate-100 italic border border-slate-100 dark:border-slate-800">{type === 'date' ? format(new Date(value || '1990-01-01'), 'MMMM do, yyyy') : value}</div>)}
    </div>
  );
};

const SettingsView = ({ state, onToggleTheme }: { state: AppState, onToggleTheme: (t: AppTheme) => void }) => {
  return (
    <div className="space-y-12 pb-32 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">App Preferences</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Personalize your Auburn Hub Experience</p>
      </header>

      {/* THEME SELECTION */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Palette size={18} /></div>
          <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase italic tracking-tight">Visual Identity</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {THEMES.map((t) => (
            <button 
              key={t.id} 
              onClick={() => onToggleTheme(t.id)}
              className={`p-6 rounded-[2.5rem] border-4 transition-all text-left flex flex-col items-start gap-4 relative overflow-hidden group ${state.settings.theme === t.id ? 'bg-white dark:bg-slate-900 border-primary shadow-xl' : 'bg-slate-50/50 dark:bg-slate-800/30 border-transparent hover:bg-white dark:hover:bg-slate-800'}`}
            >
              <div className={`w-12 h-12 rounded-2xl ${t.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                <t.icon size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800 dark:text-white uppercase italic leading-none">{t.label}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{t.desc}</p>
              </div>
              {state.settings.theme === t.id && (
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* DANGEROUS ZONE */}
      <section className="space-y-6 pt-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500"><AlertCircle size={18} /></div>
          <h3 className="text-lg font-black text-rose-500 uppercase italic tracking-tight">Management Protocols</h3>
        </div>
        <div className="bg-rose-50 dark:bg-rose-950/20 rounded-[3rem] border-2 border-rose-100 dark:border-rose-900/30 p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-black text-rose-800 dark:text-rose-400 uppercase italic tracking-tighter">System Factory Reset</h3>
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-1 italic">Wipe all rent, bills, and user data from device</p>
            </div>
            <button 
              onClick={() => { const p = prompt('Enter Admin PIN:'); if(p === '1535') database.clear(); else alert('Invalid Access'); }} 
              className="px-10 py-4 rounded-2xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-rose-700 active:scale-95 transition-all"
            >
              Execute Wipe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default App;
