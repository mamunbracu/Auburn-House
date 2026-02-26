
import { AppState, MemberAdvanceDetails, InstructionSection } from '../types';
import { MEMBERS, INITIAL_BILLS, generateInitialRent } from '../constants';

const DB_KEY = 'auburn_house_master_v1';

const DEFAULT_INSTRUCTIONS: InstructionSection[] = [
  {
    id: '1',
    title: 'Air Conditioning',
    emoji: '🌡️',
    color: 'sky',
    rules: [
      { text: 'If the temperature is 30°C or below, do NOT turn on the AC.', highlight: true, warning: true },
      { text: 'AC is allowed only above 30°C.', highlight: false }
    ]
  },
  {
    id: '2',
    title: 'Kitchen Care & Maintenance',
    emoji: '🧹',
    color: 'amber',
    description: 'Maintain the heart of the home! Please follow these guidelines to keep our kitchen pristine:',
    rules: [
      { text: 'Surfaces: Wipe down all kitchen benches and the sink until sparkling.' },
      { text: 'Cooking Area: Thoroughly clean the gas stove, burners, and oven.' },
      { text: 'Floors: Sweep away debris followed by a fresh mop.' },
      { text: 'Waste: Empty the bin and replace the liner.' },
      { text: 'Self-Initiative: If you spot something else that needs attention, feel free to take the lead! 😁' },
      { text: 'All cookware, utensils, and surfaces used must be thoroughly cleaned and stowed immediately after use—no exceptions.', highlight: true, warning: true }
    ]
  },
  {
    id: '3',
    title: 'Cleanliness',
    emoji: '🧼',
    color: 'indigo',
    rules: [
      { text: 'Always flush after using the toilet.' },
      { text: 'Keep the basin clean after use.' }
    ]
  },
  {
    id: '4',
    title: 'Footwear Rules',
    emoji: '🥿',
    color: 'rose',
    rules: [
      { text: 'No slippers are allowed on the top floor.', highlight: true, warning: true }
    ]
  },
  {
    id: '5',
    title: 'Shoe Storage',
    emoji: '👟',
    color: 'emerald',
    rules: [
      { text: 'Shoes must be organized in the cabinet.' },
      { text: 'You may keep only one pair outside the cabinet.', highlight: true }
    ]
  }
];

export const getInitialState = (): AppState => {
  const initialAdvanceDetails: Record<string, MemberAdvanceDetails> = {} as any;
  MEMBERS.forEach(m => {
    initialAdvanceDetails[m.name] = { security: m.initialAdvance, topUp: 0, notes: '' };
  });

  return {
    members: MEMBERS,
    cleaningTasks: [],
    rentEvents: generateInitialRent(),
    bills: INITIAL_BILLS,
    billPayments: [],
    commonExpenses: [],
    choreOverrides: [],
    chatHistory: [],
    notices: [],
    dismissedNoticeIds: [],
    advanceData: { memberDetails: initialAdvanceDetails },
    grassCutting: [],
    notificationSettings: { enabled: false, rentReminders: true, cleaningReminders: true, binReminders: true, lastCheckedDate: null },
    notifications: [],
    mamunKnowledge: [
      { id: 'k1', keywords: ['girlfriend', 'gf', 'dating'], response: "I'm currently accepting applications! Requirements: Must love Auburn, never touch the AC, and be able to tolerate my constant house inspections. 😉" },
      { id: 'k2', keywords: ['argentina', 'boyfriend'], response: "Don't mention the Argentina boyfriend! It's a sensitive topic for my soft heart. I'm just here being 'gentle' while he's thousands of miles away. 🇦🇷💔" },
      { id: 'k3', keywords: ['luna park'], response: "Luna Park is basically our second home. If we're not here, we're there. It's where the magic (and the paycheck) happens! 🎡" },
      { id: 'k4', keywords: ['ac', 'aircon', 'hot'], response: "Is it 30 degrees yet? No? Then put on a sweater! I'm saving the planet, one kilowatt at a time. 🌡️🚫" },
      { id: 'k5', keywords: ['marry', 'marriage'], response: "Marriage? In this economy? I can barely manage 7 roommates, let alone a wife! But if she's rich and owns a townhouse... call me. 💍😂" }
    ],
    instructions: DEFAULT_INSTRUCTIONS,
    settings: { bgAnimation: true, cleaningStartDate: '2026-02-17', grassStartDate: '2026-02-15', theme: 'default' }
  };
};

const sanitizeState = (data: any): AppState => {
  const initialState = getInitialState();
  if (!data) return initialState;
  
  return {
    ...initialState,
    ...data,
    settings: {
      ...initialState.settings,
      ...(data.settings || {})
    },
    advanceData: {
      ...initialState.advanceData,
      ...(data.advanceData || {})
    }
  };
};

import { supabaseService } from './supabaseService';

export const database = {
  load: async (): Promise<AppState> => {
    try {
      // Try Supabase first (for Vercel/Production)
      if (supabaseService.isEnabled()) {
        try {
          // Race Supabase load against a 3s timeout
          const supabasePromise = supabaseService.loadState();
          const timeoutPromise = new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('Supabase timeout')), 3000)
          );
          
          const cloudState = await Promise.race([supabasePromise, timeoutPromise]);
          if (cloudState) return sanitizeState(cloudState);
        } catch (err) {
          console.error('Supabase: Load failed or timed out, falling back to local API', err);
        }
      }

      // Fallback to local API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Reduced to 2s timeout

      const response = await fetch('/api/state', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Failed to fetch state');
      const data = await response.json();
      return sanitizeState(data);
    } catch (error) {
      console.error('Database: Load failed completely', error);
      return getInitialState();
    }
  },
  save: async (state: AppState): Promise<void> => {
    // Save to Supabase (Real-time)
    if (supabaseService.isEnabled()) {
      await supabaseService.saveState(state);
    }

    try {
      await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
    } catch (error) {
      console.error('Database: Save failed', error);
    }
  },
  clear: async (): Promise<void> => {
    if (supabaseService.isEnabled()) {
      await supabaseService.clearState();
    }

    try {
      await fetch('/api/clear', { method: 'POST' });
      window.location.reload();
    } catch (error) {
      console.error('Database: Clear failed', error);
    }
  }
};
