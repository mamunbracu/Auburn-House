
export type MemberName = string;

export type AppTheme = 'default' | 'dark' | 'nature' | 'sunset';

export interface Member {
  id: string;
  name: MemberName;
  avatar: string;
  phone: string;
  email: string;
  dob: string;
  initialAdvance: number;
  rentShare: number;
  isHome?: boolean;
}

export interface Notice {
  id: string;
  content: string;
  date: string;
  author: string;
  isActive: boolean;
}

export interface ChoreOverride {
  date: string;
  type: 'Laundry' | 'Cleaning' | 'Grass' | 'Bins';
  member: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface CleaningTask {
  id: string;
  date: string;
  assignee: MemberName;
  completed: boolean;
}

export interface RentEvent {
  id: string;
  date: string;
  amount: number;
  memberStatuses: Record<string, boolean>;
}

export interface BillMemberFinance {
  paid: boolean;
  given: number;
  due: number;
}

export interface BillPayment {
  id: string;
  billId: string;
  memberId: MemberName;
  amount: number;
  date: string;
}

export interface BillItem {
  id: string;
  category: 'Gas' | 'Electricity' | 'Water' | 'Internet' | 'Other';
  month: string;
  totalAmount: number;
  dueDate: string;
  memberFinances: Record<string, BillMemberFinance>;
  isFinalized: boolean; 
  paidBy: MemberName; 
  description?: string;
}

export interface CommonExpense {
  id: string;
  name: string;
  itemCount: number;
  price: number;
  date: string;
  payerId: MemberName;
}

export interface MemberAdvanceDetails {
  security: number;
  topUp: number;
  notes?: string;
}

export interface AdvanceState {
  memberDetails: Record<string, MemberAdvanceDetails>;
}

export interface GrassCuttingEvent {
  id: string;
  date: string;
  assignee: MemberName;
  completed: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  rentReminders: boolean;
  cleaningReminders: boolean;
  binReminders: boolean;
  lastCheckedDate: string | null;
}

export interface InstructionRule {
  text: string;
  highlight?: boolean;
  warning?: boolean;
}

export interface InstructionSection {
  id: string;
  title: string;
  emoji: string;
  color: string;
  rules: InstructionRule[];
}

export interface AppState {
  members: Member[];
  cleaningTasks: CleaningTask[];
  rentEvents: RentEvent[];
  bills: BillItem[];
  billPayments: BillPayment[];
  commonExpenses: CommonExpense[];
  choreOverrides: ChoreOverride[];
  advanceData: AdvanceState;
  grassCutting: GrassCuttingEvent[];
  chatHistory: ChatHistoryItem[];
  notices: Notice[];
  dismissedNoticeIds: string[];
  notificationSettings: NotificationSettings;
  instructions: InstructionSection[];
  settings: {
    bgAnimation: boolean;
    cleaningStartDate: string;
    grassStartDate: string;
    theme?: AppTheme;
  };
}

export interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export type ViewType = 'dashboard' | 'cleaning' | 'rent' | 'bills' | 'expenses' | 'advance' | 'grass' | 'settings' | 'profile' | 'finance' | 'plan' | 'schedule' | 'instruction' | 'chat' | 'data' | 'notices' | 'members' | 'house-calendar' | 'admin';
