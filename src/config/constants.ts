// ---------------------------------------------------------------------------
// Timing constants
// ---------------------------------------------------------------------------

export const IDLE_PAUSE_MS = 2 * 60 * 1000; // 2 minutes
export const MAP_FLASH_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes
export const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
export const SNAPSHOT_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
export const TOAST_DURATION_MS = 3000;
export const DEEP_LINK_RETRY_INTERVAL_MS = 500;
export const DEEP_LINK_MAX_RETRIES = 60;
export const DEEP_LINK_INITIAL_DELAY_MS = 2000;

// ---------------------------------------------------------------------------
// Cache TTLs
// ---------------------------------------------------------------------------

export const CIRCUIT_BREAKER_DEFAULT_COOLDOWN_MS = 5 * 60 * 1000;
export const CIRCUIT_BREAKER_DEFAULT_CACHE_TTL_MS = 10 * 60 * 1000;
export const PERSISTENT_STALE_CEILING_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Fetch timeouts
// ---------------------------------------------------------------------------

export const DEFAULT_FETCH_TIMEOUT_MS = 15000;

// ---------------------------------------------------------------------------
// Rate limits
// ---------------------------------------------------------------------------

export const YAHOO_MIN_GAP_MS = 600;

// ---------------------------------------------------------------------------
// Refresh intervals (used in DataLoader.setupRefreshIntervals)
// ---------------------------------------------------------------------------

export const REFRESH_PIZZINT_MS = 10 * 60 * 1000; // 10 minutes
export const REFRESH_NATURAL_MS = 5 * 60 * 1000; // 5 minutes
export const REFRESH_WEATHER_MS = 10 * 60 * 1000; // 10 minutes
export const REFRESH_FRED_MS = 30 * 60 * 1000; // 30 minutes
export const REFRESH_OIL_MS = 30 * 60 * 1000; // 30 minutes
export const REFRESH_SPENDING_MS = 60 * 60 * 1000; // 1 hour
export const REFRESH_INTELLIGENCE_MS = 5 * 60 * 1000; // 5 minutes
export const REFRESH_FIRMS_MS = 30 * 60 * 1000; // 30 minutes
export const REFRESH_CABLES_MS = 30 * 60 * 1000; // 30 minutes
export const REFRESH_CABLE_HEALTH_MS = 5 * 60 * 1000; // 5 minutes
export const REFRESH_FLIGHTS_MS = 10 * 60 * 1000; // 10 minutes
export const REFRESH_CYBER_THREATS_MS = 10 * 60 * 1000; // 10 minutes

// ---------------------------------------------------------------------------
// Banner dismiss duration
// ---------------------------------------------------------------------------

export const BANNER_DISMISS_DURATION_MS = 30 * 60 * 1000; // 30 minutes
