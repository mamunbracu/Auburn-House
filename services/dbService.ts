
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
    title: 'Kitchen Etiquette',
    emoji: '🍳',
    color: 'amber',
    rules: [
      { text: 'Do not place any cookware or cooking items on the kitchen bench.' },
      { text: 'After cooking, clean the oven and stove burners thoroughly.' },
      { text: 'Wash, dry, and return all utensils and items to the cabinet after use.' },
      { text: 'Keep the kitchen tidy at all times.', highlight: true }
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
    instructions: DEFAULT_INSTRUCTIONS,
    settings: { bgAnimation: true, cleaningStartDate: '2026-02-17', grassStartDate: '2026-02-15', theme: 'default' }
  };
};

export const database = {
  load: async (): Promise<AppState> => {
    try {
      const response = await fetch('/api/state');
      if (!response.ok) throw new Error('Failed to fetch state');
      const data = await response.json();
      if (data) {
        return data;
      }
      return getInitialState();
    } catch (error) {
      console.error('Database: Load failed', error);
      return getInitialState();
    }
  },
  save: async (state: AppState): Promise<void> => {
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
    try {
      await fetch('/api/clear', { method: 'POST' });
      window.location.reload();
    } catch (error) {
      console.error('Database: Clear failed', error);
    }
  }
};
