
import React, { useState, useRef, useEffect } from 'react';
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

  const getMamunResponse = (input: string): string => {
    const query = input.toLowerCase();
    const today = new Date();
    
    // 0. Profanity Filter
    const badWords = ['fuck', 'shit', 'asshole', 'bitch', 'cunt', 'dick', 'bastard'];
    if (badWords.some(word => query.includes(word))) {
      return "Control yourself! This is a respectable Auburn household, not a back alley in Sydney. Go wash your mouth with some of Sudip's cleaning supplies!";
    }

    // 1. WiFi & Tech
    if (query.includes('wifi') || query.includes('internet') || query.includes('password')) {
      return "Listen carefully, I'm only saying this once: The WiFi is 'NetComm 9232' and the password is 'Summer2024@'. Don't make me reset the router!";
    }

    // 2. Rent Tracking
    if (query.includes('rent') || query.includes('pay') || query.includes('money')) {
      const nextRent = state.rentEvents.find(e => new Date(e.date) >= today) || state.rentEvents[0];
      if (!nextRent) return "Rent? What rent? We're living in a simulation! (Actually, I don't see any rent data right now).";
      
      const pending = Object.entries(nextRent.memberStatuses)
        .filter(([_, paid]) => !paid)
        .map(([name]) => name);
      
      if (pending.length === 0) return `Everyone has paid for the ${format(new Date(nextRent.date), 'MMM do')} cycle. I'm impressed! Usually, I have to chase someone down the stairs.`;
      return `For the ${format(new Date(nextRent.date), 'MMM do')} cycle, we're still waiting on: ${pending.join(', ')}. Tick tock, people!`;
    }

    // 3. Cleaning & Chores
    if (query.includes('clean') || query.includes('chore') || query.includes('duty')) {
      const person = getCleaningAssignment(today, state.choreOverrides);
      return person 
        ? `Today's Deep Clean is assigned to ${person}. I'll be checking the corners with a white glove, so don't disappoint me!`
        : "No deep cleaning scheduled for today. But that doesn't mean you can leave your socks in the lounge!";
    }

    if (query.includes('laundry')) {
      const person = getLaundryAssignment(today, state.choreOverrides);
      return person 
        ? `It's ${person}'s turn for laundry today. If you have a mountain of clothes, now is the time!`
        : "No laundry rotation today. Wear your clothes inside out if you have to.";
    }

    if (query.includes('bin') || query.includes('trash') || query.includes('rubbish')) {
      const nextWed = addDays(today, (3 - today.getDay() + 7) % 7 || 7);
      const person = getBinAssignment(nextWed, state.choreOverrides);
      return `The bins go out this Wednesday (${format(nextWed, 'MMM do')}). ${person} is on duty. Make sure the red lid is closed!`;
    }

    if (query.includes('grass') || query.includes('mow') || query.includes('garden')) {
      const nextSat = addDays(today, (6 - today.getDay() + 7) % 7 || 7);
      const person = getGrassAssignment(nextSat, state.choreOverrides);
      return `Grass cutting is scheduled for Saturday (${format(nextSat, 'MMM do')}). ${person} is our gardener this week. Watch out for the snakes! (Just kidding... maybe).`;
    }

    // 4. Bills
    if (query.includes('bill') || query.includes('finance') || query.includes('expense')) {
      if (state.bills.length === 0) return "No bills recorded. Are we living by candlelight? Check the Finance tab.";
      const latest = state.bills[0];
      return `The latest bill I see is ${latest.category} for ${latest.month} ($${latest.totalAmount}), paid by ${latest.paidBy}. Check the Finance section for the full breakdown.`;
    }

    // 5. Member Profiles & Gossip
    const profileMatch = state.members.find(m => query.includes(m.name.toLowerCase()));
    if (profileMatch && !query.includes('mamun') && !query.includes('sudip') && !query.includes('aarati') && !query.includes('dipanker') && !query.includes('akash') && !query.includes('joya')) {
      const adv = state.advanceData.memberDetails[profileMatch.name]?.security || profileMatch.initialAdvance;
      return `${profileMatch.name}'s Profile: Rent Share: $${profileMatch.rentShare}, Security Bond: $${adv}, Phone: ${profileMatch.phone}, Email: ${profileMatch.email}. Born on ${format(new Date(profileMatch.dob), 'MMM do')}. Anything else you want to stalk?`;
    }

    if (query.includes('mamun')) {
      if (query.includes('email')) return "My email? It's mamun@househub.local. Don't spam me with cat videos unless they're really funny.";
      if (query.includes('like') || query.includes('feeling') || query.includes('aarati') || query.includes('aara')) {
        return "Look, Aarati is friendly, and yes, I have a 'soft corner' for her. I might be a bit too gentle when she forgets her chores, but can you blame me? She's the best! Just don't tell her boyfriend in Argentina.";
      }
      if (query.includes('single') || query.includes('gf') || query.includes('girlfriend')) {
        return "Yes, I'm single and looking for a girlfriend. But she has to be okay with me constantly checking if the AC is on when it's under 30 degrees!";
      }
      return `I'm Mamun. Rent Share: $${state.members.find(m => m.name === 'Mamun')?.rentShare}, Phone: 0444 333 444, Email: mamun@househub.local. I'm the house supervisor and the most well-behaved person in Auburn.`;
    }

    if (query.includes('hello') || query.includes('hi ') || query.includes('hey')) {
      return "Hello! I'm Mamun AI. I'm here to manage your life because clearly, you can't do it yourself. What do you want to know about the house?";
    }

    if (query.includes('sudip')) {
      if (query.includes('single') || query.includes('gf') || query.includes('girlfriend')) {
        return "Sudip is single and looking too! He's the Cleaning Manager, so if you want to date him, you better have a very tidy room.";
      }
      if (query.includes('akash')) {
        return "Sudip and Akash have a funny dynamic. One manages the cleaning, the other manages the internet. It's like a sitcom where nothing ever gets downloaded because the floor is being mopped!";
      }
      return "Sudip is our Cleaning Manager. He works at Luna Park. He's a good guy, just don't get him started on dust bunnies.";
    }

    if (query.includes('aarati') || query.includes('aara')) {
      return "Aarati is our resident ray of sunshine. She's in a long-distance relationship with her boyfriend in Argentina. I try to be gentle with her, much to the annoyance of everyone else!";
    }

    if (query.includes('dipanker')) {
      if (query.includes('joya')) {
        return "Dipanker and Joya? Now that's a house dynamic! He manages the bills, she manages... well, she's Joya! They keep things interesting around here.";
      }
      return "Dipanker is the Utility Bill Manager. He's a Luna Park veteran and the reason we have water and gas. Respect the man!";
    }

    if (query.includes('akash')) {
      return "Akash is the Internet Bill Manager. He's the only one of us who doesn't work at Luna Park. He's the gatekeeper of the 5G!";
    }

    if (query.includes('joya')) {
      return "Joya is one of our members. She's part of the Auburn crew and always has something to say about the house dynamics!";
    }

    // 6. Security Bonds & Financials
    if (query.includes('bond') || query.includes('security') || query.includes('advance')) {
      const details = state.members.map(m => {
        const adv = state.advanceData.memberDetails[m.name]?.security || m.initialAdvance;
        return `${m.name}: $${adv}`;
      }).join(', ');
      return `Here are the security bonds: ${details}. Don't even think about getting them back if you break the oven!`;
    }

    // 7. Jokes & Random
    if (query.includes('joke') || query.includes('funny')) {
      const jokes = [
        "Why did Mamun cross the road? To see if the AC was on in the house across the street!",
        "Sudip's dating profile: 'I'm a Cleaning Manager, so I'll sweep you off your feet... and then mop the floor.'",
        "What's the difference between Aarati and a bill? I'm much more 'gentle' when Aarati is overdue!",
        "Dipanker's favorite song? 'Money, Money, Money' by ABBA. He loves those utility spreadsheets.",
        "Akash's life motto: 'I don't work at Luna Park, but my life is still a roller coaster because of this house!'"
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }

    // 8. Default Sassy Response
    const defaults = [
      "I have no idea what you're talking about. Is that a question or are you just typing to feel something?",
      "Unless that's about the rent or the bins, I really don't care. Focus, people!",
      "My brain is currently as cluttered as the kitchen bench after Akash cooks. Ask something useful!",
      "I could answer that, but I'd rather spend my time making sure the AC isn't on for no reason.",
      "Go ask the agency. Or better yet, go clean your room!"
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
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

    // Simulate "thinking" for personality
    setTimeout(() => {
      const responseText = getMamunResponse(userMessage.text);
      
      const aiMessage: ChatMessage = {
        role: 'model',
        text: responseText,
        timestamp: new Date().toISOString()
      };

      onUpdateHistory([...updatedHistory, aiMessage]);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-1rem)] w-full bg-white dark:bg-slate-900 border-x border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in duration-300">
      {/* Header - Compact */}
      <header className="bg-primary p-4 sm:p-5 pt-[calc(env(safe-area-inset-top)+1rem)] sm:pt-5 text-white flex justify-between items-center relative overflow-hidden shrink-0">
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
