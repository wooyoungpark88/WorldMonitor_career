import { create } from 'zustand';

export interface UserSettings {
  customKeywords: string[];
  alertThreshold: number;
  weeklyGoalMinutes: number;
  focusAreas: string[];
  telegramEnabled: boolean;
}

interface SettingsState extends UserSettings {
  setCustomKeywords: (kw: string[]) => void;
  setAlertThreshold: (v: number) => void;
  setWeeklyGoalMinutes: (v: number) => void;
  setFocusAreas: (areas: string[]) => void;
  setTelegramEnabled: (v: boolean) => void;
}

const STORAGE_KEY = 'careradar_settings';

function load(): UserSettings {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      customKeywords: raw.customKeywords ?? [],
      alertThreshold: raw.alertThreshold ?? 70,
      weeklyGoalMinutes: raw.weeklyGoalMinutes ?? 300,
      focusAreas: raw.focusAreas ?? ['financial', 'pricing', 'sroi', 'pitch'],
      telegramEnabled: raw.telegramEnabled ?? true,
    };
  } catch {
    return {
      customKeywords: [],
      alertThreshold: 70,
      weeklyGoalMinutes: 300,
      focusAreas: ['financial', 'pricing', 'sroi', 'pitch'],
      telegramEnabled: true,
    };
  }
}

function persist(s: UserSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function snapshot(state: SettingsState): UserSettings {
  return {
    customKeywords: state.customKeywords,
    alertThreshold: state.alertThreshold,
    weeklyGoalMinutes: state.weeklyGoalMinutes,
    focusAreas: state.focusAreas,
    telegramEnabled: state.telegramEnabled,
  };
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  const initial = load();
  return {
    ...initial,
    setCustomKeywords: (kw) => { set({ customKeywords: kw }); persist(snapshot({ ...get(), customKeywords: kw })); },
    setAlertThreshold: (v) => { set({ alertThreshold: v }); persist(snapshot({ ...get(), alertThreshold: v })); },
    setWeeklyGoalMinutes: (v) => { set({ weeklyGoalMinutes: v }); persist(snapshot({ ...get(), weeklyGoalMinutes: v })); },
    setFocusAreas: (areas) => { set({ focusAreas: areas }); persist(snapshot({ ...get(), focusAreas: areas })); },
    setTelegramEnabled: (v) => { set({ telegramEnabled: v }); persist(snapshot({ ...get(), telegramEnabled: v })); },
  };
});
