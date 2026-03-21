/**
 * Shared types, interfaces, and constants for Map, DeckGLMap, and MapContainer.
 *
 * Previously these were duplicated across Map.ts, DeckGLMap.ts, and MapContainer.ts.
 * Now they live here as the single source of truth.
 */
import type { MapLayers, Hotspot } from '@/types';

// ── Time range ──────────────────────────────────────────────────────
export type TimeRange = '1h' | '6h' | '24h' | '48h' | '7d' | 'all';

const VALID_TIME_RANGES = new Set<string>(['1h', '6h', '24h', '48h', '7d', 'all']);
export function isValidTimeRange(value: string): value is TimeRange {
  return VALID_TIME_RANGES.has(value);
}

// ── Map view presets ────────────────────────────────────────────────
export type MapView = 'global' | 'america' | 'mena' | 'eu' | 'asia' | 'latam' | 'africa' | 'oceania';

/**
 * @deprecated Use MapView instead. DeckMapView is kept as an alias for
 * backwards-compatibility during the migration period.
 */
export type DeckMapView = MapView;

export const VIEW_PRESETS: Record<MapView, { longitude: number; latitude: number; zoom: number }> = {
  global: { longitude: 0, latitude: 20, zoom: 1.5 },
  america: { longitude: -95, latitude: 38, zoom: 3 },
  mena: { longitude: 45, latitude: 28, zoom: 3.5 },
  eu: { longitude: 15, latitude: 50, zoom: 3.5 },
  asia: { longitude: 105, latitude: 35, zoom: 3 },
  latam: { longitude: -60, latitude: -15, zoom: 3 },
  africa: { longitude: 20, latitude: 5, zoom: 3 },
  oceania: { longitude: 135, latitude: -25, zoom: 3.5 },
};

// ── Shared state shape ──────────────────────────────────────────────
export interface MapState {
  zoom: number;
  pan: { x: number; y: number };
  view: MapView;
  layers: MapLayers;
  timeRange: TimeRange;
}

/**
 * @deprecated Use MapState instead. DeckMapState is kept as an alias for
 * backwards-compatibility during the migration period.
 */
export type DeckMapState = MapState;

/**
 * @deprecated Use MapState instead. MapContainerState is kept as an alias for
 * backwards-compatibility during the migration period.
 */
export type MapContainerState = MapState;

// ── Hotspot with breaking flag ──────────────────────────────────────
export interface HotspotWithBreaking extends Hotspot {
  hasBreaking?: boolean;
}

// ── Tech event marker ───────────────────────────────────────────────
export interface TechEventMarker {
  id: string;
  title: string;
  location: string;
  lat: number;
  lng: number;
  country: string;
  startDate: string;
  endDate: string;
  url: string | null;
  daysUntil: number;
}

// ── Country click payload (DeckGLMap / MapContainer) ────────────────
export interface CountryClickPayload {
  lat: number;
  lon: number;
  code?: string;
  name?: string;
}

// ── Layer zoom thresholds ───────────────────────────────────────────
export const LAYER_ZOOM_THRESHOLDS: Partial<
  Record<keyof MapLayers, { minZoom: number; showLabels?: number }>
> = {
  bases: { minZoom: 3, showLabels: 5 },
  nuclear: { minZoom: 3 },
  conflicts: { minZoom: 1, showLabels: 3 },
  economic: { minZoom: 3 },
  natural: { minZoom: 1, showLabels: 2 },
  datacenters: { minZoom: 5 },
  irradiators: { minZoom: 4 },
  spaceports: { minZoom: 3 },
  gulfInvestments: { minZoom: 2, showLabels: 5 },
};
