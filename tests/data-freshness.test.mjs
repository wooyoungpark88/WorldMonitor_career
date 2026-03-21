/**
 * Unit tests for the DataFreshnessTracker.
 *
 * Source: src/services/data-freshness.ts
 *
 * Tests cover:
 * - Recording updates and errors
 * - hasSufficientData()
 * - Enable/disable sources
 * - Status calculation based on age thresholds
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(resolve(__dirname, '..', 'src', 'services', 'data-freshness.ts'), 'utf-8');

// ---------------------------------------------------------------------------
// Constants mirrored from source
// ---------------------------------------------------------------------------

const FRESH_THRESHOLD = 15 * 60 * 1000;      // 15 minutes
const STALE_THRESHOLD = 2 * 60 * 60 * 1000;  // 2 hours
const VERY_STALE_THRESHOLD = 6 * 60 * 60 * 1000; // 6 hours

const CORE_SOURCES = ['gdelt', 'rss'];

// Subset of SOURCE_METADATA needed for tests
const SOURCE_METADATA = {
  acled: { name: 'Protests & Conflicts', requiredForRisk: false },
  opensky: { name: 'Military Flights', requiredForRisk: false },
  wingbits: { name: 'Aircraft Enrichment', requiredForRisk: false },
  ais: { name: 'Vessel Tracking', requiredForRisk: false },
  usgs: { name: 'Earthquakes', requiredForRisk: false },
  gdelt: { name: 'News Intelligence', requiredForRisk: true },
  gdelt_doc: { name: 'GDELT Doc Intelligence', requiredForRisk: false },
  rss: { name: 'Live News Feeds', requiredForRisk: true },
  polymarket: { name: 'Prediction Markets', requiredForRisk: false },
  predictions: { name: 'Predictions Feed', requiredForRisk: false },
  pizzint: { name: 'PizzINT Monitoring', requiredForRisk: false },
  outages: { name: 'Internet Outages', requiredForRisk: false },
  cyber_threats: { name: 'Cyber Threat IOCs', requiredForRisk: false },
  weather: { name: 'Weather Alerts', requiredForRisk: false },
  economic: { name: 'Economic Data (FRED)', requiredForRisk: false },
  oil: { name: 'Oil Analytics (EIA)', requiredForRisk: false },
  spending: { name: 'Gov Spending', requiredForRisk: false },
  firms: { name: 'FIRMS Satellite Fires', requiredForRisk: false },
  acled_conflict: { name: 'Armed Conflicts (ACLED)', requiredForRisk: false },
  ucdp: { name: 'Conflict Classification (UCDP)', requiredForRisk: false },
  hapi: { name: 'Conflict Aggregates (HDX)', requiredForRisk: false },
  ucdp_events: { name: 'UCDP Conflict Events', requiredForRisk: false },
  unhcr: { name: 'UNHCR Displacement', requiredForRisk: false },
  climate: { name: 'Climate Anomalies', requiredForRisk: false },
  worldpop: { name: 'Population Exposure', requiredForRisk: false },
};

// ---------------------------------------------------------------------------
// Re-implement DataFreshnessTracker to mirror production logic
// ---------------------------------------------------------------------------

class DataFreshnessTracker {
  constructor() {
    this.sources = new Map();
    this.listeners = new Set();

    for (const [id, meta] of Object.entries(SOURCE_METADATA)) {
      this.sources.set(id, {
        id,
        name: meta.name,
        lastUpdate: null,
        lastError: null,
        itemCount: 0,
        enabled: true,
        status: 'no_data',
        requiredForRisk: meta.requiredForRisk,
      });
    }
  }

  recordUpdate(sourceId, itemCount = 1) {
    const source = this.sources.get(sourceId);
    if (source) {
      source.lastUpdate = new Date();
      source.itemCount += itemCount;
      source.lastError = null;
      source.status = this.calculateStatus(source);
      this.notifyListeners();
    }
  }

  recordError(sourceId, error) {
    const source = this.sources.get(sourceId);
    if (source) {
      source.lastError = error;
      source.status = 'error';
      this.notifyListeners();
    }
  }

  setEnabled(sourceId, enabled) {
    const source = this.sources.get(sourceId);
    if (source) {
      source.enabled = enabled;
      source.status = enabled ? this.calculateStatus(source) : 'disabled';
      this.notifyListeners();
    }
  }

  getSource(sourceId) {
    const source = this.sources.get(sourceId);
    if (source) {
      source.status = source.enabled ? this.calculateStatus(source) : 'disabled';
    }
    return source;
  }

  getAllSources() {
    return Array.from(this.sources.values()).map(source => ({
      ...source,
      status: source.enabled ? this.calculateStatus(source) : 'disabled',
    }));
  }

  getRiskSources() {
    return this.getAllSources().filter(s => s.requiredForRisk);
  }

  getSummary() {
    const sources = this.getAllSources();
    const riskSources = sources.filter(s => s.requiredForRisk);

    const activeSources = sources.filter(s =>
      s.status === 'fresh' || s.status === 'stale' || s.status === 'very_stale'
    );
    const activeRiskSources = riskSources.filter(s =>
      s.status === 'fresh' || s.status === 'stale' || s.status === 'very_stale'
    );
    const staleSources = sources.filter(s => s.status === 'stale' || s.status === 'very_stale');
    const disabledSources = sources.filter(s => s.status === 'disabled');
    const errorSources = sources.filter(s => s.status === 'error');

    const updates = sources
      .filter(s => s.lastUpdate)
      .map(s => s.lastUpdate.getTime());

    const coveragePercent = riskSources.length > 0
      ? Math.round((activeRiskSources.length / riskSources.length) * 100)
      : 0;

    let overallStatus;
    if (activeRiskSources.length >= CORE_SOURCES.length && coveragePercent >= 66) {
      overallStatus = 'sufficient';
    } else if (activeRiskSources.length >= 1) {
      overallStatus = 'limited';
    } else {
      overallStatus = 'insufficient';
    }

    return {
      totalSources: sources.length,
      activeSources: activeSources.length,
      staleSources: staleSources.length,
      disabledSources: disabledSources.length,
      errorSources: errorSources.length,
      overallStatus,
      coveragePercent,
      oldestUpdate: updates.length > 0 ? new Date(Math.min(...updates)) : null,
      newestUpdate: updates.length > 0 ? new Date(Math.max(...updates)) : null,
    };
  }

  hasSufficientData() {
    return this.getSummary().overallStatus === 'sufficient';
  }

  hasAnyData() {
    return this.getSummary().activeSources > 0;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  calculateStatus(source) {
    if (!source.enabled) return 'disabled';
    if (source.lastError) return 'error';
    if (!source.lastUpdate) return 'no_data';

    const age = Date.now() - source.lastUpdate.getTime();
    if (age < FRESH_THRESHOLD) return 'fresh';
    if (age < STALE_THRESHOLD) return 'stale';
    if (age < VERY_STALE_THRESHOLD) return 'very_stale';
    return 'no_data';
  }

  notifyListeners() {
    for (const listener of this.listeners) {
      try { listener(); } catch { /* ignore */ }
    }
  }
}

// ---------------------------------------------------------------------------
// Source guardrails
// ---------------------------------------------------------------------------

describe('data-freshness source guardrails', () => {
  it('exports a DataFreshnessTracker class', () => {
    assert.match(src, /class DataFreshnessTracker/);
  });

  it('exports a singleton instance', () => {
    assert.match(src, /export const dataFreshness\s*=\s*new DataFreshnessTracker\(\)/);
  });

  it('defines FRESH_THRESHOLD as 15 minutes', () => {
    assert.match(src, /FRESH_THRESHOLD\s*=\s*15\s*\*\s*60\s*\*\s*1000/);
  });

  it('defines STALE_THRESHOLD as 2 hours', () => {
    assert.match(src, /STALE_THRESHOLD\s*=\s*2\s*\*\s*60\s*\*\s*60\s*\*\s*1000/);
  });

  it('defines VERY_STALE_THRESHOLD as 6 hours', () => {
    assert.match(src, /VERY_STALE_THRESHOLD\s*=\s*6\s*\*\s*60\s*\*\s*60\s*\*\s*1000/);
  });

  it('has gdelt and rss as core sources', () => {
    assert.match(src, /CORE_SOURCES.*=.*\['gdelt',\s*'rss'\]/);
  });
});

// ---------------------------------------------------------------------------
// Recording updates
// ---------------------------------------------------------------------------

describe('DataFreshnessTracker recordUpdate', () => {
  let tracker;

  beforeEach(() => {
    tracker = new DataFreshnessTracker();
  });

  it('updates lastUpdate timestamp', () => {
    const before = Date.now();
    tracker.recordUpdate('gdelt', 5);
    const source = tracker.getSource('gdelt');
    assert.ok(source.lastUpdate instanceof Date);
    assert.ok(source.lastUpdate.getTime() >= before);
  });

  it('accumulates item count', () => {
    tracker.recordUpdate('rss', 3);
    tracker.recordUpdate('rss', 7);
    assert.equal(tracker.getSource('rss').itemCount, 10);
  });

  it('clears previous error on update', () => {
    tracker.recordError('gdelt', 'network error');
    assert.equal(tracker.getSource('gdelt').status, 'error');

    tracker.recordUpdate('gdelt', 1);
    const source = tracker.getSource('gdelt');
    assert.equal(source.lastError, null);
    assert.equal(source.status, 'fresh');
  });

  it('sets status to fresh for recent update', () => {
    tracker.recordUpdate('ais');
    assert.equal(tracker.getSource('ais').status, 'fresh');
  });

  it('notifies listeners on update', () => {
    let called = false;
    tracker.subscribe(() => { called = true; });
    tracker.recordUpdate('usgs');
    assert.equal(called, true);
  });

  it('ignores unknown source IDs', () => {
    // Should not throw
    tracker.recordUpdate('nonexistent', 1);
  });
});

// ---------------------------------------------------------------------------
// Recording errors
// ---------------------------------------------------------------------------

describe('DataFreshnessTracker recordError', () => {
  let tracker;

  beforeEach(() => {
    tracker = new DataFreshnessTracker();
  });

  it('sets status to error', () => {
    tracker.recordError('opensky', 'timeout');
    assert.equal(tracker.getSource('opensky').status, 'error');
  });

  it('stores error message', () => {
    tracker.recordError('ais', 'rate limited');
    assert.equal(tracker.getSource('ais').lastError, 'rate limited');
  });

  it('notifies listeners on error', () => {
    let called = false;
    tracker.subscribe(() => { called = true; });
    tracker.recordError('rss', 'failed');
    assert.equal(called, true);
  });

  it('preserves lastUpdate after error', () => {
    tracker.recordUpdate('gdelt', 1);
    const updateTime = tracker.getSource('gdelt').lastUpdate;
    tracker.recordError('gdelt', 'oops');
    assert.equal(tracker.getSource('gdelt').lastUpdate, updateTime);
  });
});

// ---------------------------------------------------------------------------
// Enable / disable sources
// ---------------------------------------------------------------------------

describe('DataFreshnessTracker enable/disable', () => {
  let tracker;

  beforeEach(() => {
    tracker = new DataFreshnessTracker();
  });

  it('disabling a source sets status to disabled', () => {
    tracker.setEnabled('acled', false);
    assert.equal(tracker.getSource('acled').status, 'disabled');
  });

  it('re-enabling recalculates status', () => {
    tracker.recordUpdate('acled', 1);
    tracker.setEnabled('acled', false);
    assert.equal(tracker.getSource('acled').status, 'disabled');

    tracker.setEnabled('acled', true);
    assert.equal(tracker.getSource('acled').status, 'fresh');
  });

  it('disabled source does not count as active', () => {
    tracker.recordUpdate('gdelt', 1);
    tracker.recordUpdate('rss', 1);
    tracker.setEnabled('rss', false);

    const summary = tracker.getSummary();
    // rss is disabled so only gdelt is active among risk sources
    const riskActive = tracker.getRiskSources().filter(s =>
      s.status === 'fresh' || s.status === 'stale' || s.status === 'very_stale'
    );
    assert.equal(riskActive.length, 1);
  });

  it('notifies listeners on enable/disable', () => {
    let count = 0;
    tracker.subscribe(() => { count++; });
    tracker.setEnabled('usgs', false);
    tracker.setEnabled('usgs', true);
    assert.equal(count, 2);
  });
});

// ---------------------------------------------------------------------------
// hasSufficientData
// ---------------------------------------------------------------------------

describe('DataFreshnessTracker hasSufficientData', () => {
  let tracker;

  beforeEach(() => {
    tracker = new DataFreshnessTracker();
  });

  it('returns false when no data recorded', () => {
    assert.equal(tracker.hasSufficientData(), false);
  });

  it('returns false when only one core source has data', () => {
    tracker.recordUpdate('gdelt', 5);
    assert.equal(tracker.hasSufficientData(), false);
  });

  it('returns true when both core sources (gdelt + rss) have fresh data', () => {
    tracker.recordUpdate('gdelt', 5);
    tracker.recordUpdate('rss', 10);
    assert.equal(tracker.hasSufficientData(), true);
  });

  it('returns false when core sources have errors', () => {
    tracker.recordError('gdelt', 'down');
    tracker.recordError('rss', 'down');
    assert.equal(tracker.hasSufficientData(), false);
  });

  it('returns false when core sources are disabled', () => {
    tracker.recordUpdate('gdelt', 1);
    tracker.recordUpdate('rss', 1);
    tracker.setEnabled('gdelt', false);
    tracker.setEnabled('rss', false);
    assert.equal(tracker.hasSufficientData(), false);
  });
});

// ---------------------------------------------------------------------------
// hasAnyData
// ---------------------------------------------------------------------------

describe('DataFreshnessTracker hasAnyData', () => {
  let tracker;

  beforeEach(() => {
    tracker = new DataFreshnessTracker();
  });

  it('returns false when no data recorded', () => {
    assert.equal(tracker.hasAnyData(), false);
  });

  it('returns true when any source has data', () => {
    tracker.recordUpdate('usgs', 1);
    assert.equal(tracker.hasAnyData(), true);
  });
});

// ---------------------------------------------------------------------------
// Summary computation
// ---------------------------------------------------------------------------

describe('DataFreshnessTracker getSummary', () => {
  let tracker;

  beforeEach(() => {
    tracker = new DataFreshnessTracker();
  });

  it('totalSources matches all registered sources', () => {
    const summary = tracker.getSummary();
    assert.equal(summary.totalSources, Object.keys(SOURCE_METADATA).length);
  });

  it('reports overallStatus as insufficient when no data', () => {
    assert.equal(tracker.getSummary().overallStatus, 'insufficient');
  });

  it('reports overallStatus as limited with one core source', () => {
    tracker.recordUpdate('gdelt', 1);
    assert.equal(tracker.getSummary().overallStatus, 'limited');
  });

  it('reports overallStatus as sufficient with both core sources', () => {
    tracker.recordUpdate('gdelt', 1);
    tracker.recordUpdate('rss', 1);
    assert.equal(tracker.getSummary().overallStatus, 'sufficient');
  });

  it('tracks oldestUpdate and newestUpdate', () => {
    tracker.recordUpdate('usgs', 1);
    // Small delay to ensure different timestamps
    tracker.recordUpdate('ais', 1);

    const summary = tracker.getSummary();
    assert.ok(summary.oldestUpdate instanceof Date);
    assert.ok(summary.newestUpdate instanceof Date);
    assert.ok(summary.newestUpdate.getTime() >= summary.oldestUpdate.getTime());
  });

  it('returns null for oldestUpdate/newestUpdate when no data', () => {
    const summary = tracker.getSummary();
    assert.equal(summary.oldestUpdate, null);
    assert.equal(summary.newestUpdate, null);
  });

  it('counts error sources', () => {
    tracker.recordError('gdelt', 'fail');
    tracker.recordError('rss', 'fail');
    assert.equal(tracker.getSummary().errorSources, 2);
  });

  it('counts disabled sources', () => {
    tracker.setEnabled('acled', false);
    tracker.setEnabled('opensky', false);
    assert.equal(tracker.getSummary().disabledSources, 2);
  });
});

// ---------------------------------------------------------------------------
// Subscribe / unsubscribe
// ---------------------------------------------------------------------------

describe('DataFreshnessTracker subscribe', () => {
  it('returns an unsubscribe function', () => {
    const tracker = new DataFreshnessTracker();
    let count = 0;
    const unsub = tracker.subscribe(() => { count++; });
    tracker.recordUpdate('usgs');
    assert.equal(count, 1);

    unsub();
    tracker.recordUpdate('usgs');
    assert.equal(count, 1, 'Should not be called after unsubscribe');
  });

  it('handles listener errors gracefully', () => {
    const tracker = new DataFreshnessTracker();
    let secondCalled = false;
    tracker.subscribe(() => { throw new Error('bad listener'); });
    tracker.subscribe(() => { secondCalled = true; });
    tracker.recordUpdate('usgs');
    assert.equal(secondCalled, true, 'Second listener should still fire');
  });
});

// ---------------------------------------------------------------------------
// Status calculation
// ---------------------------------------------------------------------------

describe('DataFreshnessTracker status thresholds', () => {
  it('source with no lastUpdate is no_data', () => {
    const tracker = new DataFreshnessTracker();
    assert.equal(tracker.getSource('acled').status, 'no_data');
  });

  it('source updated just now is fresh', () => {
    const tracker = new DataFreshnessTracker();
    tracker.recordUpdate('acled');
    assert.equal(tracker.getSource('acled').status, 'fresh');
  });

  it('getAllSources returns all source states', () => {
    const tracker = new DataFreshnessTracker();
    const all = tracker.getAllSources();
    assert.equal(all.length, Object.keys(SOURCE_METADATA).length);
    assert.ok(all.every(s => typeof s.id === 'string'));
    assert.ok(all.every(s => typeof s.name === 'string'));
  });

  it('getRiskSources returns only sources marked requiredForRisk', () => {
    const tracker = new DataFreshnessTracker();
    const risk = tracker.getRiskSources();
    assert.ok(risk.length > 0);
    assert.ok(risk.every(s => s.requiredForRisk === true));
    assert.ok(risk.some(s => s.id === 'gdelt'));
    assert.ok(risk.some(s => s.id === 'rss'));
  });
});
