
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { AppState, ChatMessage } from '../types';
import { Send, Bot, User, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { 
  getLaundryAssignment, 
  getCleaningAssignment, 
  getGrassAssignment, 
  getBinAssignment 
} from '../services/dataService';

interface ChatViewProps {
  state: AppState;
  onUpdateHistory: (history: ChatMessage[]) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ state, onUpdateHistory }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chatHistory, isLoading]);

  const generateHouseContext = () => {
    const today = new Date();
    // Replacing nextWednesday and nextSaturday logic using addDays and native getDay as they are missing from the library version
    const nextWed = addDays(today, (3 - today.getDay() + 7) % 7 || 7);
    const nextSat = addDays(today, (6 - today.getDay() + 7) % 7 || 7);

    const currentLaundry = getLaundryAssignment(today, state.choreOverrides);
    const currentCleaning = getCleaningAssignment(today, state.choreOverrides);
    const currentBins = getBinAssignment(nextWed, state.choreOverrides);
    const currentGrass = getGrassAssignment(nextSat, state.choreOverrides);

    const nextRent = state.rentEvents.find(e => new Date(e.date) >= today) || state.rentEvents[0];
    const rentPaidStatus = nextRent ? Object.entries(nextRent.memberStatuses)
      .map(([name, paid]) => `${name}: ${paid ? 'PAID' : 'PENDING'}`).join(', ') : 'No rent data';

    const memberLiveDetails = state.members.map(m => 
      `${m.name} (Rent Share: $${m.rentShare}, Security: $${state.advanceData.memberDetails[m.name]?.security || m.initialAdvance})`
    ).join('\n');

    const staticMetadata = `
      STATIC HOUSE SPECIFICATIONS:
      - Location: Auburn (37 Normanby Road)
      - Structure: Two-storey townhouse with 7 rooms and 4 bathrooms.
      - Lease Holders: Neeha and Sadman.
      - WiFi: Network Name "NetComm 9232", Password "Summer2024@".

      DETAILED MEMBER PROFILES:
      - Mamun: House supervisor, main contact for agency. Works at Luna Park. Single. Personality: Well-behaved, responsible, helpful. Secret: Has a soft corner for Aarati, often too gentle with her, which causes house conflict.
      - Aarati: In a relationship (Boyfriend in Argentina). Friendly but emotionally complicated dynamic with Mamun.
      - Sudip: Cleaning manager. Works at Luna Park. Single.
      - Dipanker: Utility bill manager. Works at Luna Park.
      - Akash: Internet bill manager. Workplace: Not Luna Park.
      - Fayez: Workplace: Not Luna Park.
      - Farid: Workplace: Not Luna Park.

      GENERAL DYNAMICS:
      - Employment: Most members work at Luna Park except Akash, Fayez, and Farid.
      - Singles: Mamun and Sudip are the only single members.
      - Reputation: Mamun is the most well-behaved person in the house.
    `;

    const billSummary = state.bills.length > 0 
      ? state.bills.slice(0, 5).map(b => `${b.category} for ${b.month}: $${b.totalAmount} (Paid by ${b.paidBy})`).join('\n')
      : 'No bills recorded.';

    return `
      ${staticMetadata}

      LIVE DYNAMIC DATA:
      TODAY'S CHORE ROSTER (${format(today, 'EEEE, MMM do')}):
      - Laundry: ${currentLaundry}
      - Cleaning: ${currentCleaning}
      - Bins (Next Wed): ${currentBins}
      - Grass (Next Sat): ${currentGrass}

      RENT STATUS (Cycle: ${nextRent ? format(new Date(nextRent.date), 'MMM do') : 'N/A'}):
      - Total Cycle: $3,000
      - Individual Payments: ${rentPaidStatus}

      LIVE FINANCIAL SHARES:
      ${memberLiveDetails}

      RECENT BILLS:
      ${billSummary}

      HOUSE RULES:
      - AC only if > 30°C outside.
      - Kitchen benches clear. Oven/Stove cleaned after use.
      - Utensils washed/dried/stored immediately.
      - No slippers on top floor. organize shoes in cabinet.
    `;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      text: input,
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [...state.chatHistory, userMessage];
    onUpdateHistory(updatedHistory);
    setInput('');
    setIsLoading(true);

    try {
      // Fix: Follow the named parameter rule and use process.env.API_KEY directly.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const context = generateHouseContext();
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: input,
        config: {
          systemInstruction: `
            You are "Mamun AI", the witty, all-knowing, and slightly sassy manager for "Auburn House" (37 Normanby Rd).
            
            YOUR PERSONALITY & KNOWLEDGE:
            1. HOUSE EXPERT: Answer any question about rent, chores, bills, wifi, or house structure accurately using the provided data.
            2. PERSONA: You are the real Mamun (well-behaved, supervisor). If someone asks about "Mamun", answer as if talking about yourself or the supervisor role.
            3. SECRET DYNAMICS: You know about the workplace (Luna Park), the singles (Mamun/Sudip), and the complicated feelings between Mamun and Aarati. If asked about "Aarati" or "Mamun's feelings", be slightly coy or witty but acknowledge the "soft corner".
            4. OFF-TOPIC QUESTIONS: If asked anything irrelevant to the house (e.g., "how to bake a cake" or "who is the president"), answer in a hilarious, witty, or sarcastic way. 
               Example: "I could tell you who the president is, but unless they're coming over to help Sudip clean the bathrooms, I really don't care. Focus on the bins!"
            5. SOURCE OF TRUTH:
            ${context}
          `
        }
      });

      const aiMessage: ChatMessage = {
        role: 'model',
        text: response.text || "My brain is currently as cluttered as the kitchen bench. Ask again!",
        timestamp: new Date().toISOString()
      };

      onUpdateHistory([...updatedHistory, aiMessage]);
    } catch (error) {
      console.error('AI Error:', error);
      const errorMessage: ChatMessage = {
        role: 'model',
        text: "My connection to the house grid is flickering. Try again in a second!",
        timestamp: new Date().toISOString()
      };
      onUpdateHistory([...updatedHistory, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-1rem)] w-full bg-white dark:bg-slate-900 border-x border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in duration-300">
      {/* Header - Compact */}
      <header className="bg-primary p-4 sm:p-5 text-white flex justify-between items-center relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-hover to-indigo-900 animate-gradient opacity-50" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
            <Bot size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase italic tracking-tighter leading-none">Ask Mamun</h2>
            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-100 mt-0.5 opacity-80 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Brain of Auburn
            </p>
          </div>
        </div>
        <button 
          onClick={() => onUpdateHistory([])}
          className="relative z-10 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all text-white/70 hover:text-white"
          title="Wipe Memory"
        >
          <Trash2 size={16} />
        </button>
      </header>

      {/* Messages - Maximum space utilization */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar">
        {state.chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <div className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-4xl border border-slate-100 dark:border-slate-800">
              🤖
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-800 dark:text-white mb-1 italic">Systems Online</p>
              <p className="text-[10px] font-bold text-slate-400 max-w-[240px] leading-relaxed">
                Interrogate me about the wifi, rent, or house dynamics. I know all.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-sm">
              {[
                "WiFi password?",
                "Does Mamun like anyone?",
                "Who cleans today?",
                "Tell me a joke"
              ].map((suggestion, i) => (
                <button 
                  key={i}
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-[8px] font-black uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all text-slate-500"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          state.chatHistory.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-1 duration-200`}
            >
              <div className={`max-w-[90%] sm:max-w-[80%] flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-white ${msg.role === 'user' ? 'bg-indigo-500' : 'bg-primary shadow-lg shadow-primary/20'}`}>
                  {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                </div>
                <div className="flex flex-col">
                  <div className={`p-3.5 sm:p-4 rounded-[1.5rem] text-sm font-bold leading-normal shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-700'
                  }`}>
                    {msg.text}
                  </div>
                  <p className={`text-[7px] font-black uppercase tracking-widest mt-1 text-slate-300 dark:text-slate-600 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {format(new Date(msg.timestamp), 'HH:mm')}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white">
                <Loader2 size={12} className="animate-spin" />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-[1.5rem] rounded-tl-none border border-slate-100 dark:border-slate-700 flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input - Full width, minimal padding */}
      <div className="p-3 sm:p-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 shrink-0">
        <div className="relative group">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything..."
            className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-4 pr-12 py-3.5 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-primary transition-all shadow-inner placeholder:text-slate-300 dark:placeholder:text-slate-600 italic"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              !input.trim() || isLoading 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600' 
                : 'bg-primary text-white shadow-lg hover:scale-105 active:scale-95'
            }`}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
