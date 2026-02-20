
import { MEMBERS } from '../constants';
import { ChoreOverride } from '../types';
import { format, differenceInCalendarWeeks, differenceInCalendarDays } from 'date-fns';

export const END_DATE = '2026-12-31';

const getMemberByIndex = (index: number) => {
  // Use a modulo that accounts for current resident list length
  // We prioritize the core MEMBERS list for consistent cycling
  return MEMBERS[index % MEMBERS.length]?.name || "N/A";
};

/**
 * Stable assignment based on the week of the year.
 * This ensures Monday and Wednesday of the same week show the same person for weekly chores.
 */
const getWeekIndex = (date: Date) => {
  const startOfApp = new Date('2026-01-01');
  return differenceInCalendarWeeks(date, startOfApp);
};

const getDayIndex = (date: Date) => {
  const startOfApp = new Date('2026-01-01');
  return differenceInCalendarDays(date, startOfApp);
};

const getDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

const SPECIAL_CLEANING_ROSTER: Record<string, string> = {
  '2026-02-23': 'Sudip',
  '2026-02-26': 'Dipanker',
  '2026-03-01': 'Fayaz',
  '2026-03-04': 'Joya',
  '2026-03-07': 'Akash',
  '2026-03-10': 'Mamun',
  '2026-03-13': 'Farid',
  '2026-03-16': 'Aara',
  '2026-03-19': 'Sudip',
  '2026-03-22': 'Fayaz',
  '2026-03-25': 'Joya',
  '2026-03-28': 'Farid',
  '2026-03-31': 'Dipanker',
  '2026-04-03': 'Akash',
  '2026-04-06': 'Mamun',
  '2026-04-09': 'Aara',
  '2026-04-12': 'Sudip',
  '2026-04-15': 'Joya',
  '2026-04-18': 'Fayaz',
  '2026-04-21': 'Farid',
  '2026-04-24': 'Dipanker',
};

export const getLaundryAssignment = (date: Date, overrides: ChoreOverride[]) => {
  const dStr = getDateKey(date);
  const override = overrides.find(o => o.date === dStr && o.type === 'Laundry');
  if (override) return override.member;

  const diff = getDayIndex(date);
  return getMemberByIndex(diff);
};

export const getCleaningAssignment = (date: Date, overrides: ChoreOverride[]) => {
  const dStr = getDateKey(date);
  
  // Check special roster first
  if (SPECIAL_CLEANING_ROSTER[dStr]) {
    return SPECIAL_CLEANING_ROSTER[dStr];
  }

  const override = overrides.find(o => o.date === dStr && o.type === 'Cleaning');
  if (override) return override.member;

  // If we are within the special roster range but not on a specific date, return null
  // This ensures the "roster" only shows the specific dates requested
  const startRoster = new Date('2026-02-23');
  const endRoster = new Date('2026-04-24');
  if (date >= startRoster && date <= endRoster) {
    return null;
  }

  const diff = getDayIndex(date);
  const cycle = Math.floor(diff / 3);
  return getMemberByIndex(cycle);
};

export const getGrassAssignment = (date: Date, overrides: ChoreOverride[]) => {
  const dStr = getDateKey(date);
  const override = overrides.find(o => o.date === dStr && o.type === 'Grass');
  if (override) return override.member;

  const weekIdx = getWeekIndex(date);
  return getMemberByIndex(weekIdx);
};

export const getBinAssignment = (date: Date, overrides: ChoreOverride[]) => {
  const dStr = getDateKey(date);
  const override = overrides.find(o => o.date === dStr && o.type === 'Bins');
  if (override) return override.member;

  const weekIdx = getWeekIndex(date);
  return getMemberByIndex(weekIdx);
};

export const getRentSchedule = (count: number) => {
  const schedule: Date[] = [];
  let current = new Date(2026, 1, 15); 
  while (current.getDay() !== 0) {
    current.setDate(current.getDate() + 1);
  }
  for (let i = 0; i < count; i++) {
    schedule.push(new Date(current));
    current.setDate(current.getDate() + 14);
  }
  return schedule;
};
