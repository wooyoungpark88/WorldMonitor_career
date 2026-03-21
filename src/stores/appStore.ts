import { create } from 'zustand';
import { persist, type StorageValue } from 'zustand/middleware';
import type { MapLayers, PanelConfig } from '@/types';
import {
  DEFAULT_MAP_LAYERS,
  MOBILE_DEFAULT_MAP_LAYERS,
  DEFAULT_PANELS,
} from '@/config';
import { isMobileDevice, isStorageQuotaExceeded, isQuotaError, markStorageQuotaExceeded } from '@/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TimeRange = '1h' | '6h' | '24h' | '48h' | '7d' | 'all';

interface AppState {
  // Map state
  mapLayers: MapLayers;
  setMapLayer: (layer: keyof MapLayers, enabled: boolean) => void;
  setMapLayers: (layers: MapLayers) => void;

  // Panel state
  panelSettings: Record<string, PanelConfig>;
  setPanelSetting: (key: string, config: PanelConfig) => void;
  setPanelSettings: (settings: Record<string, PanelConfig>) => void;

  // UI state
  currentTimeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;

  isMobile: boolean;
  isIdle: boolean;
  setIsIdle: (idle: boolean) => void;

  isPlaybackMode: boolean;
  setPlaybackMode: (mode: boolean) => void;

  // Data freshness
  initialLoadComplete: boolean;
  setInitialLoadComplete: (complete: boolean) => void;

  // Disabled sources
  disabledSources: Set<string>;
  toggleSource: (source: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers — only the fields that should survive across sessions
// ---------------------------------------------------------------------------

type PersistedSlice = Pick<
  AppState,
  'mapLayers' | 'panelSettings' | 'currentTimeRange' | 'disabledSources'
>;

// We need custom serialization because Set is not JSON-serializable and we
// want to respect the existing STORAGE_KEYS convention (multiple keys in
// localStorage).  Zustand's `persist` middleware stores everything under a
// single key, so we use one dedicated key and keep the shape flat.

const PERSIST_KEY = 'worldmonitor-app-store';

/**
 * Safe localStorage wrapper that respects the quota-exceeded flag used
 * elsewhere in the codebase (`utils/index.ts`).
 */
const safeStorage = {
  getItem(name: string): string | null {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },

  setItem(name: string, value: string): void {
    if (isStorageQuotaExceeded()) return;
    try {
      localStorage.setItem(name, value);
    } catch (e) {
      if (isQuotaError(e)) {
        markStorageQuotaExceeded();
      } else {
        console.warn(`[appStore] Failed to persist state:`, e);
      }
    }
  },

  removeItem(name: string): void {
    try {
      localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

const defaultMapLayers: MapLayers = isMobileDevice()
  ? { ...MOBILE_DEFAULT_MAP_LAYERS }
  : { ...DEFAULT_MAP_LAYERS };

const defaultPanelSettings: Record<string, PanelConfig> = { ...DEFAULT_PANELS };

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // -- Map state --------------------------------------------------------
      mapLayers: { ...defaultMapLayers },

      setMapLayer: (layer, enabled) => {
        const next = { ...get().mapLayers, [layer]: enabled };
        set({ mapLayers: next });
      },

      setMapLayers: (layers) => {
        set({ mapLayers: { ...layers } });
      },

      // -- Panel state ------------------------------------------------------
      panelSettings: { ...defaultPanelSettings },

      setPanelSetting: (key, config) => {
        const next = { ...get().panelSettings, [key]: config };
        set({ panelSettings: next });
      },

      setPanelSettings: (settings) => {
        set({ panelSettings: { ...settings } });
      },

      // -- UI state ---------------------------------------------------------
      currentTimeRange: '24h',

      setTimeRange: (range) => {
        set({ currentTimeRange: range });
      },

      isMobile: isMobileDevice(),

      isIdle: false,
      setIsIdle: (idle) => {
        set({ isIdle: idle });
      },

      isPlaybackMode: false,
      setPlaybackMode: (mode) => {
        set({ isPlaybackMode: mode });
      },

      // -- Data freshness ---------------------------------------------------
      initialLoadComplete: false,
      setInitialLoadComplete: (complete) => {
        set({ initialLoadComplete: complete });
      },

      // -- Disabled sources -------------------------------------------------
      disabledSources: new Set<string>(),

      toggleSource: (source) => {
        const prev = get().disabledSources;
        const next = new Set(prev);
        if (next.has(source)) {
          next.delete(source);
        } else {
          next.add(source);
        }
        set({ disabledSources: next });
      },
    }),

    // -- persist middleware options ----------------------------------------
    {
      name: PERSIST_KEY,

      // Only persist the fields that make sense across sessions.
      // Transient UI flags (isIdle, isPlaybackMode, initialLoadComplete)
      // should start fresh on every page load.
      partialize: (state): PersistedSlice => ({
        mapLayers: state.mapLayers,
        panelSettings: state.panelSettings,
        currentTimeRange: state.currentTimeRange,
        disabledSources: state.disabledSources,
      }),

      // Custom storage adapter that handles Set serialization and respects
      // the codebase's quota-exceeded guard.
      storage: {
        getItem: (name): StorageValue<PersistedSlice> | null => {
          const raw = safeStorage.getItem(name);
          if (!raw) return null;
          try {
            const parsed = JSON.parse(raw) as StorageValue<{
              mapLayers: MapLayers;
              panelSettings: Record<string, PanelConfig>;
              currentTimeRange: TimeRange;
              disabledSources: string[];
            }>;
            if (!parsed || !parsed.state) return null;

            // Merge stored values with current defaults so that newly-added
            // properties always have sensible values.
            return {
              ...parsed,
              state: {
                mapLayers: { ...defaultMapLayers, ...parsed.state.mapLayers },
                panelSettings: { ...defaultPanelSettings, ...parsed.state.panelSettings },
                currentTimeRange: parsed.state.currentTimeRange ?? '24h',
                disabledSources: new Set(parsed.state.disabledSources ?? []),
              },
            };
          } catch {
            return null;
          }
        },

        setItem: (name, value) => {
          // Convert Set → array for JSON serialization
          const serializable = {
            ...value,
            state: {
              ...value.state,
              disabledSources: Array.from(value.state.disabledSources),
            },
          };
          safeStorage.setItem(name, JSON.stringify(serializable));
        },

        removeItem: (name) => {
          safeStorage.removeItem(name);
        },
      },

      // Merge persisted slice back into the full state, keeping non-persisted
      // fields at their initial values.
      merge: (persisted, current) => {
        const p = persisted as Partial<PersistedSlice> | undefined;
        if (!p) return current;
        return {
          ...current,
          mapLayers: p.mapLayers ? { ...defaultMapLayers, ...p.mapLayers } : current.mapLayers,
          panelSettings: p.panelSettings
            ? { ...defaultPanelSettings, ...p.panelSettings }
            : current.panelSettings,
          currentTimeRange: p.currentTimeRange ?? current.currentTimeRange,
          disabledSources:
            p.disabledSources instanceof Set
              ? p.disabledSources
              : current.disabledSources,
        };
      },
    },
  ),
);

// ---------------------------------------------------------------------------
// Convenience selectors (avoid inline arrow fns in components to prevent
// unnecessary re-renders)
// ---------------------------------------------------------------------------

export const selectMapLayers = (s: AppState) => s.mapLayers;
export const selectPanelSettings = (s: AppState) => s.panelSettings;
export const selectTimeRange = (s: AppState) => s.currentTimeRange;
export const selectIsMobile = (s: AppState) => s.isMobile;
export const selectIsIdle = (s: AppState) => s.isIdle;
export const selectIsPlaybackMode = (s: AppState) => s.isPlaybackMode;
export const selectInitialLoadComplete = (s: AppState) => s.initialLoadComplete;
export const selectDisabledSources = (s: AppState) => s.disabledSources;
