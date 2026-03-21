/**
 * DataLoader — extracted from App.ts
 *
 * Owns every load*, refresh-scheduling, time-range filtering, and
 * correlation-analysis method that was previously inlined in the App class.
 *
 * Communication back to App is via a lightweight EventEmitter pattern so that
 * the two layers remain decoupled.
 */

import type {
  NewsItem,
  MapLayers,
  MarketData,
  ClusteredEvent,
  InternetOutage,
  SocialUnrestEvent,
  MilitaryFlight,
  MilitaryVessel,
  MilitaryFlightCluster,
  MilitaryVesselCluster,
  CyberThreat,
} from '@/types';
import type { PredictionMarket } from '@/services/prediction';
import type { Earthquake } from '@/services/earthquakes';
import type { TheaterPostureSummary } from '@/services/military-surge';
import type { TimeRange } from '@/components';
import type { USNIFleetReport } from '@/types';

import {
  FEEDS,
  INTEL_SOURCES,
  SECTORS,
  COMMODITIES,
  MARKET_SYMBOLS,
  REFRESH_INTERVALS,
  SITE_VARIANT,
} from '@/config';
import { INTEL_HOTSPOTS, CONFLICT_ZONES } from '@/config/geo';
import {
  fetchCategoryFeeds,
  getFeedFailures,
  fetchMultipleStocks,
  fetchCrypto,
  fetchPredictions,
  fetchEarthquakes,
  fetchWeatherAlerts,
  fetchFredData,
  fetchInternetOutages,
  fetchAisSignals,
  getAisStatus,
  fetchCableActivity,
  fetchCableHealth,
  fetchProtestEvents,
  getProtestStatus,
  fetchFlightDelays,
  fetchMilitaryFlights,
  fetchMilitaryVessels,
  initMilitaryVesselStream,
  isMilitaryVesselTrackingConfigured,
  fetchUSNIFleetReport,
  updateBaseline,
  calculateDeviation,
  addToSignalHistory,
  analysisWorker,
  fetchPizzIntStatus,
  fetchGdeltTensions,
  fetchNaturalEvents,
  fetchRecentAwards,
  fetchOilAnalytics,
  fetchCyberThreats,
  drainTrendingSignals,
} from '@/services';
import { mlWorker } from '@/services/ml-worker';
import { clusterNewsHybrid } from '@/services/clustering';
import {
  ingestProtests,
  ingestFlights,
  ingestVessels,
  ingestEarthquakes,
  detectGeoConvergence,
  geoConvergenceToSignal,
} from '@/services/geo-convergence';
import { signalAggregator } from '@/services/signal-aggregator';
import { updateAndCheck } from '@/services/temporal-baseline';
import { fetchAllFires, flattenFires, computeRegionStats, toMapFires } from '@/services/wildfires';
import { SatelliteFiresPanel } from '@/components/SatelliteFiresPanel';
import {
  analyzeFlightsForSurge,
  surgeAlertToSignal,
  detectForeignMilitaryPresence,
  foreignPresenceToSignal,
} from '@/services/military-surge';
import { fetchCachedTheaterPosture } from '@/services/cached-theater-posture';
import {
  ingestProtestsForCII,
  ingestMilitaryForCII,
  ingestNewsForCII,
  ingestOutagesForCII,
  ingestConflictsForCII,
  ingestUcdpForCII,
  ingestHapiForCII,
  ingestDisplacementForCII,
  ingestClimateForCII,
  isInLearningMode,
} from '@/services/country-instability';
import { dataFreshness } from '@/services/data-freshness';
import {
  fetchConflictEvents,
  fetchUcdpClassifications,
  fetchHapiSummary,
  fetchUcdpEvents,
  deduplicateAgainstAcled,
} from '@/services/conflict';
import { fetchUnhcrPopulation } from '@/services/displacement';
import { fetchClimateAnomalies } from '@/services/climate';
import { enrichEventsWithExposure } from '@/services/population-exposure';
import { getCircuitBreakerCooldownInfo } from '@/utils';
import { isFeatureAvailable } from '@/services/runtime-config';
import {
  MAP_FLASH_COOLDOWN_MS,
  REFRESH_PIZZINT_MS,
  REFRESH_NATURAL_MS,
  REFRESH_WEATHER_MS,
  REFRESH_FRED_MS,
  REFRESH_OIL_MS,
  REFRESH_SPENDING_MS,
  REFRESH_INTELLIGENCE_MS,
  REFRESH_FIRMS_MS,
  REFRESH_CABLES_MS,
  REFRESH_CABLE_HEALTH_MS,
  REFRESH_FLIGHTS_MS,
  REFRESH_CYBER_THREATS_MS,
} from '@/config/constants';
import { t } from '@/services/i18n';
import { maybeShowDownloadBanner } from '@/components/DownloadBanner';
import { mountCommunityWidget } from '@/components/CommunityWidget';
import { ResearchServiceClient } from '@/generated/client/worldmonitor/research/v1/service_client';
import {
  type MapContainer,
  NewsPanel,
  MarketPanel,
  HeatmapPanel,
  CommoditiesPanel,
  CryptoPanel,
  PredictionPanel,
  MonitorPanel,
  Panel,
  SignalModal,
  StatusPanel,
  EconomicPanel,
  PizzIntIndicator,
  CIIPanel,
  StrategicPosturePanel,
  InsightsPanel,
  TechReadinessPanel,
  UcdpEventsPanel,
  DisplacementPanel,
  ClimateAnomalyPanel,
  PopulationExposurePanel,
  SearchModal,
} from '@/components';

// ---------------------------------------------------------------------------
// Simple typed EventEmitter
// ---------------------------------------------------------------------------

export type DataLoaderEvents = {
  newsLoaded: [NewsItem[]];
  clustersUpdated: [ClusteredEvent[]];
  marketsLoaded: [MarketData[]];
  predictionsLoaded: [PredictionMarket[]];
  searchIndexDirty: [];
  initialLoadComplete: [];
  criticalBanner: [TheaterPostureSummary[]];
};

type EventKey = keyof DataLoaderEvents;
type Listener<K extends EventKey> = (...args: DataLoaderEvents[K]) => void;

// ---------------------------------------------------------------------------
// Intelligence cache (shared between load methods)
// ---------------------------------------------------------------------------

export interface IntelligenceCache {
  outages?: InternetOutage[];
  protests?: { events: SocialUnrestEvent[]; sources: { acled: number; gdelt: number } };
  military?: {
    flights: MilitaryFlight[];
    flightClusters: MilitaryFlightCluster[];
    vessels: MilitaryVessel[];
    vesselClusters: MilitaryVesselCluster[];
  };
  earthquakes?: Earthquake[];
  usniFleet?: USNIFleetReport;
}

// ---------------------------------------------------------------------------
// Dependencies injected by App
// ---------------------------------------------------------------------------

export interface DataLoaderDeps {
  getMap: () => MapContainer | null;
  getPanels: () => Record<string, Panel>;
  getNewsPanels: () => Record<string, NewsPanel>;
  getStatusPanel: () => StatusPanel | null;
  getSignalModal: () => SignalModal | null;
  getPizzintIndicator: () => PizzIntIndicator | null;
  getSearchModal: () => SearchModal | null;
  getMapLayers: () => MapLayers;
  getDisabledSources: () => Set<string>;
  shouldShowIntelligenceNotifications: () => boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CYBER_LAYER_ENABLED = import.meta.env.VITE_ENABLE_CYBER_LAYER === 'true';

// ---------------------------------------------------------------------------
// DataLoader
// ---------------------------------------------------------------------------

export class DataLoader {
  // --- Public readable state ---------------------------------------------------
  allNews: NewsItem[] = [];
  newsByCategory: Record<string, NewsItem[]> = {};
  latestPredictions: PredictionMarket[] = [];
  latestMarkets: MarketData[] = [];
  latestClusters: ClusteredEvent[] = [];
  intelligenceCache: IntelligenceCache = {};
  cyberThreatsCache: CyberThreat[] | null = null;
  initialLoadComplete = false;
  currentTimeRange: TimeRange = '7d';

  // --- Internal bookkeeping ---------------------------------------------------
  private inFlight = new Set<string>();
  private refreshTimeoutIds = new Map<string, ReturnType<typeof setTimeout>>();
  private refreshRunners = new Map<string, { run: () => Promise<void>; intervalMs: number }>();
  private hiddenSince = 0;
  private isDestroyed = false;
  private seenGeoAlerts = new Set<string>();
  private mapFlashCache = new Map<string, number>();

  // --- Event emitter ----------------------------------------------------------
  private listeners = new Map<EventKey, Set<Listener<any>>>();

  // --- Dependencies -----------------------------------------------------------
  private deps: DataLoaderDeps;

  constructor(deps: DataLoaderDeps) {
    this.deps = deps;
  }

  // ---------------------------------------------------------------------------
  // EventEmitter
  // ---------------------------------------------------------------------------

  on<K extends EventKey>(event: K, listener: Listener<K>): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener);
  }

  off<K extends EventKey>(event: K, listener: Listener<K>): void {
    this.listeners.get(event)?.delete(listener);
  }

  private emit<K extends EventKey>(event: K, ...args: DataLoaderEvents[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const fn of set) {
      try { fn(...args); } catch (e) { console.error(`[DataLoader] listener error on "${event}":`, e); }
    }
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /** Set the timestamp when the document was hidden (for flush logic). */
  setHiddenSince(ts: number): void {
    this.hiddenSince = ts;
  }

  destroy(): void {
    this.isDestroyed = true;

    // Clear all refresh timeouts
    for (const timeoutId of this.refreshTimeoutIds.values()) {
      clearTimeout(timeoutId);
    }
    this.refreshTimeoutIds.clear();
    this.refreshRunners.clear();
    this.listeners.clear();
  }

  // ---------------------------------------------------------------------------
  // loadAllData
  // ---------------------------------------------------------------------------

  async loadAllData(): Promise<void> {
    const runGuarded = async (name: string, fn: () => Promise<void>): Promise<void> => {
      if (this.inFlight.has(name)) return;
      this.inFlight.add(name);
      try {
        await fn();
      } catch (e) {
        console.error(`[DataLoader] ${name} failed:`, e);
      } finally {
        this.inFlight.delete(name);
      }
    };

    const mapLayers = this.deps.getMapLayers();

    const tasks: Array<{ name: string; task: Promise<void> }> = [
      { name: 'news', task: runGuarded('news', () => this.loadNews()) },
      { name: 'markets', task: runGuarded('markets', () => this.loadMarkets()) },
      { name: 'predictions', task: runGuarded('predictions', () => this.loadPredictions()) },
      { name: 'pizzint', task: runGuarded('pizzint', () => this.loadPizzInt()) },
      { name: 'fred', task: runGuarded('fred', () => this.loadFredData()) },
      { name: 'oil', task: runGuarded('oil', () => this.loadOilAnalytics()) },
      { name: 'spending', task: runGuarded('spending', () => this.loadGovernmentSpending()) },
    ];

    if (SITE_VARIANT === 'full') {
      tasks.push({ name: 'intelligence', task: runGuarded('intelligence', () => this.loadIntelligenceSignals()) });
    }

    if (SITE_VARIANT === 'full') tasks.push({ name: 'firms', task: runGuarded('firms', () => this.loadFirmsData()) });
    if (mapLayers.natural) tasks.push({ name: 'natural', task: runGuarded('natural', () => this.loadNatural()) });
    if (mapLayers.weather) tasks.push({ name: 'weather', task: runGuarded('weather', () => this.loadWeatherAlerts()) });
    if (mapLayers.ais) tasks.push({ name: 'ais', task: runGuarded('ais', () => this.loadAisSignals()) });
    if (mapLayers.cables) tasks.push({ name: 'cables', task: runGuarded('cables', () => this.loadCableActivity()) });
    if (mapLayers.cables) tasks.push({ name: 'cableHealth', task: runGuarded('cableHealth', () => this.loadCableHealth()) });
    if (mapLayers.flights) tasks.push({ name: 'flights', task: runGuarded('flights', () => this.loadFlightDelays()) });
    if (CYBER_LAYER_ENABLED && mapLayers.cyberThreats) tasks.push({ name: 'cyberThreats', task: runGuarded('cyberThreats', () => this.loadCyberThreats()) });
    if (mapLayers.techEvents || SITE_VARIANT === 'tech') tasks.push({ name: 'techEvents', task: runGuarded('techEvents', () => this.loadTechEvents()) });

    if (SITE_VARIANT === 'tech') {
      tasks.push({
        name: 'techReadiness',
        task: runGuarded('techReadiness', () =>
          (this.deps.getPanels()['tech-readiness'] as TechReadinessPanel)?.refresh()),
      });
    }

    const results = await Promise.allSettled(tasks.map(t => t.task));

    results.forEach((result, idx) => {
      if (result.status === 'rejected') {
        console.error(`[DataLoader] ${tasks[idx]?.name} load failed:`, result.reason);
      }
    });

    this.emit('searchIndexDirty');
  }

  // ---------------------------------------------------------------------------
  // loadDataForLayer
  // ---------------------------------------------------------------------------

  async loadDataForLayer(layer: keyof MapLayers): Promise<void> {
    if (this.inFlight.has(layer)) return;
    this.inFlight.add(layer);
    const map = this.deps.getMap();
    map?.setLayerLoading(layer, true);
    try {
      switch (layer) {
        case 'natural':
          await this.loadNatural();
          break;
        case 'fires':
          await this.loadFirmsData();
          break;
        case 'weather':
          await this.loadWeatherAlerts();
          break;
        case 'outages':
          await this.loadOutages();
          break;
        case 'cyberThreats':
          await this.loadCyberThreats();
          break;
        case 'ais':
          await this.loadAisSignals();
          break;
        case 'cables':
          await Promise.allSettled([this.loadCableActivity(), this.loadCableHealth()]);
          break;
        case 'protests':
          await this.loadProtests();
          break;
        case 'flights':
          await this.loadFlightDelays();
          break;
        case 'military':
          await this.loadMilitary();
          break;
        case 'techEvents':
          console.log('[loadDataForLayer] Loading techEvents...');
          await this.loadTechEvents();
          console.log('[loadDataForLayer] techEvents loaded');
          break;
        case 'ucdpEvents':
        case 'displacement':
        case 'climate':
          await this.loadIntelligenceSignals();
          break;
      }
    } finally {
      this.inFlight.delete(layer);
      map?.setLayerLoading(layer, false);
    }
  }

  // ---------------------------------------------------------------------------
  // News
  // ---------------------------------------------------------------------------

  async loadNews(): Promise<void> {
    const categories = Object.entries(FEEDS)
      .filter((entry): entry is [string, typeof FEEDS[keyof typeof FEEDS]] => Array.isArray(entry[1]) && entry[1].length > 0)
      .map(([key, feeds]) => ({ key, feeds }));

    const maxCategoryConcurrency = SITE_VARIANT === 'tech' || SITE_VARIANT === 'care' ? 4 : 5;
    const categoryConcurrency = Math.max(1, Math.min(maxCategoryConcurrency, categories.length));
    const categoryResults: PromiseSettledResult<NewsItem[]>[] = [];
    for (let i = 0; i < categories.length; i += categoryConcurrency) {
      const chunk = categories.slice(i, i + categoryConcurrency);
      const chunkResults = await Promise.allSettled(
        chunk.map(({ key, feeds }) => this.loadNewsCategory(key, feeds))
      );
      categoryResults.push(...chunkResults);
    }

    const collectedNews: NewsItem[] = [];
    categoryResults.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        collectedNews.push(...result.value);
      } else {
        console.error(`[DataLoader] News category ${categories[idx]?.key} failed:`, result.reason);
      }
    });

    // Intel (uses different source) - full variant only
    if (SITE_VARIANT === 'full') {
      const disabledSources = this.deps.getDisabledSources();
      const enabledIntelSources = INTEL_SOURCES.filter(f => !disabledSources.has(f.name));
      const intelPanel = this.deps.getNewsPanels()['intel'];
      if (enabledIntelSources.length === 0) {
        delete this.newsByCategory['intel'];
        if (intelPanel) intelPanel.showError(t('common.allIntelSourcesDisabled'));
        this.deps.getStatusPanel()?.updateFeed('Intel', { status: 'ok', itemCount: 0 });
      } else {
        const intelResult = await Promise.allSettled([fetchCategoryFeeds(enabledIntelSources)]);
        if (intelResult[0]?.status === 'fulfilled') {
          const intel = intelResult[0].value;
          this.renderNewsForCategory('intel', intel);
          if (intelPanel) {
            try {
              const baseline = await updateBaseline('news:intel', intel.length);
              const deviation = calculateDeviation(intel.length, baseline);
              intelPanel.setDeviation(deviation.zScore, deviation.percentChange, deviation.level);
            } catch (e) { console.warn('[Baseline] news:intel write failed:', e); }
          }
          this.deps.getStatusPanel()?.updateFeed('Intel', { status: 'ok', itemCount: intel.length });
          collectedNews.push(...intel);
          this.flashMapForNews(intel);
        } else {
          delete this.newsByCategory['intel'];
          console.error('[DataLoader] Intel feed failed:', intelResult[0]?.reason);
        }
      }
    }

    this.allNews = collectedNews;
    this.initialLoadComplete = true;
    this.emit('initialLoadComplete');
    maybeShowDownloadBanner();
    mountCommunityWidget();

    // Temporal baseline: report news volume
    updateAndCheck([
      { type: 'news', region: 'global', count: collectedNews.length },
    ]).then(anomalies => {
      if (anomalies.length > 0) signalAggregator.ingestTemporalAnomalies(anomalies);
    }).catch(() => { });

    // Update map hotspots
    this.deps.getMap()?.updateHotspotActivity(this.allNews);

    // Update monitors
    this.updateMonitorResults();

    // Update clusters for correlation analysis
    try {
      this.latestClusters = mlWorker.isAvailable
        ? await clusterNewsHybrid(this.allNews)
        : await analysisWorker.clusterNews(this.allNews);

      if (this.latestClusters.length > 0) {
        const insightsPanel = this.deps.getPanels()['insights'] as InsightsPanel | undefined;
        insightsPanel?.updateInsights(this.latestClusters);
      }

      const geoLocated = this.latestClusters
        .filter((c): c is typeof c & { lat: number; lon: number } => c.lat != null && c.lon != null)
        .map(c => ({
          lat: c.lat,
          lon: c.lon,
          title: c.primaryTitle,
          threatLevel: c.threat?.level ?? 'info',
          timestamp: c.lastUpdated,
        }));
      if (geoLocated.length > 0) {
        this.deps.getMap()?.setNewsLocations(geoLocated);
      }

      this.emit('clustersUpdated', this.latestClusters);
    } catch (error) {
      console.error('[DataLoader] Clustering failed, clusters unchanged:', error);
    }

    this.emit('newsLoaded', this.allNews);
  }

  async loadNewsCategory(category: string, feeds: typeof FEEDS.politics): Promise<NewsItem[]> {
    try {
      const panel = this.deps.getNewsPanels()[category];
      const renderIntervalMs = 100;
      let lastRenderTime = 0;
      let renderTimeout: ReturnType<typeof setTimeout> | null = null;
      let pendingItems: NewsItem[] | null = null;

      const disabledSources = this.deps.getDisabledSources();
      const enabledFeeds = (feeds ?? []).filter(f => !disabledSources.has(f.name));
      if (enabledFeeds.length === 0) {
        delete this.newsByCategory[category];
        if (panel) panel.showError(t('common.allSourcesDisabled'));
        this.deps.getStatusPanel()?.updateFeed(category.charAt(0).toUpperCase() + category.slice(1), {
          status: 'ok',
          itemCount: 0,
        });
        return [];
      }

      const flushPendingRender = () => {
        if (!pendingItems) return;
        this.renderNewsForCategory(category, pendingItems);
        pendingItems = null;
        lastRenderTime = Date.now();
      };

      const scheduleRender = (partialItems: NewsItem[]) => {
        if (!panel) return;
        pendingItems = partialItems;
        const elapsed = Date.now() - lastRenderTime;
        if (elapsed >= renderIntervalMs) {
          if (renderTimeout) {
            clearTimeout(renderTimeout);
            renderTimeout = null;
          }
          flushPendingRender();
          return;
        }

        if (!renderTimeout) {
          renderTimeout = setTimeout(() => {
            renderTimeout = null;
            flushPendingRender();
          }, renderIntervalMs - elapsed);
        }
      };

      const items = await fetchCategoryFeeds(enabledFeeds, {
        onBatch: (partialItems) => {
          scheduleRender(partialItems);
          this.flashMapForNews(partialItems);
        },
      });

      this.renderNewsForCategory(category, items);
      if (panel) {
        if (renderTimeout) {
          clearTimeout(renderTimeout);
          renderTimeout = null;
          pendingItems = null;
        }

        if (items.length === 0) {
          const failures = getFeedFailures();
          const failedFeeds = enabledFeeds.filter(f => failures.has(f.name));
          if (failedFeeds.length > 0) {
            const names = failedFeeds.map(f => f.name).join(', ');
            panel.showError(`${t('common.noNewsAvailable')} (${names} failed)`);
          }
        }

        try {
          const baseline = await updateBaseline(`news:${category}`, items.length);
          const deviation = calculateDeviation(items.length, baseline);
          panel.setDeviation(deviation.zScore, deviation.percentChange, deviation.level);
        } catch (e) { console.warn(`[Baseline] news:${category} write failed:`, e); }
      }

      this.deps.getStatusPanel()?.updateFeed(category.charAt(0).toUpperCase() + category.slice(1), {
        status: 'ok',
        itemCount: items.length,
      });
      this.deps.getStatusPanel()?.updateApi('RSS2JSON', { status: 'ok' });

      return items;
    } catch (error) {
      this.deps.getStatusPanel()?.updateFeed(category.charAt(0).toUpperCase() + category.slice(1), {
        status: 'error',
        errorMessage: String(error),
      });
      this.deps.getStatusPanel()?.updateApi('RSS2JSON', { status: 'error' });
      delete this.newsByCategory[category];
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // Markets
  // ---------------------------------------------------------------------------

  async loadMarkets(): Promise<void> {
    const panels = this.deps.getPanels();
    const statusPanel = this.deps.getStatusPanel();

    try {
      const stocksResult = await fetchMultipleStocks(MARKET_SYMBOLS, {
        onBatch: (partialStocks) => {
          this.latestMarkets = partialStocks;
          (panels['markets'] as MarketPanel).renderMarkets(partialStocks);
        },
      });

      const finnhubConfigMsg = 'FINNHUB_API_KEY not configured — add in Settings';
      this.latestMarkets = stocksResult.data;
      (panels['markets'] as MarketPanel).renderMarkets(stocksResult.data);

      if (stocksResult.skipped) {
        statusPanel?.updateApi('Finnhub', { status: 'error' });
        if (stocksResult.data.length === 0) {
          panels['markets']?.showConfigError(finnhubConfigMsg);
        }
        panels['heatmap']?.showConfigError(finnhubConfigMsg);
      } else {
        statusPanel?.updateApi('Finnhub', { status: 'ok' });

        const sectorsResult = await fetchMultipleStocks(
          SECTORS.map((s) => ({ ...s, display: s.name })),
          {
            onBatch: (partialSectors) => {
              (panels['heatmap'] as HeatmapPanel).renderHeatmap(
                partialSectors.map((s) => ({ name: s.name, change: s.change }))
              );
            },
          }
        );
        (panels['heatmap'] as HeatmapPanel).renderHeatmap(
          sectorsResult.data.map((s) => ({ name: s.name, change: s.change }))
        );
      }

      const commoditiesPanel = panels['commodities'] as CommoditiesPanel;
      const mapCommodity = (c: MarketData) => ({ display: c.display, price: c.price, change: c.change, sparkline: c.sparkline });

      let commoditiesLoaded = false;
      for (let attempt = 0; attempt < 3 && !commoditiesLoaded; attempt++) {
        if (attempt > 0) {
          commoditiesPanel.showRetrying();
          await new Promise(r => setTimeout(r, 20_000));
        }
        const commoditiesResult = await fetchMultipleStocks(COMMODITIES, {
          onBatch: (partial) => commoditiesPanel.renderCommodities(partial.map(mapCommodity)),
        });
        const mapped = commoditiesResult.data.map(mapCommodity);
        if (mapped.some(d => d.price !== null)) {
          commoditiesPanel.renderCommodities(mapped);
          commoditiesLoaded = true;
        }
      }
      if (!commoditiesLoaded) {
        commoditiesPanel.renderCommodities([]);
      }
    } catch {
      statusPanel?.updateApi('Finnhub', { status: 'error' });
    }

    try {
      let crypto = await fetchCrypto();
      if (crypto.length === 0) {
        (panels['crypto'] as CryptoPanel).showRetrying();
        await new Promise(r => setTimeout(r, 20_000));
        crypto = await fetchCrypto();
      }
      (panels['crypto'] as CryptoPanel).renderCrypto(crypto);
      statusPanel?.updateApi('CoinGecko', { status: crypto.length > 0 ? 'ok' : 'error' });
    } catch {
      statusPanel?.updateApi('CoinGecko', { status: 'error' });
    }

    this.emit('marketsLoaded', this.latestMarkets);
  }

  // ---------------------------------------------------------------------------
  // Predictions
  // ---------------------------------------------------------------------------

  async loadPredictions(): Promise<void> {
    const panels = this.deps.getPanels();
    const statusPanel = this.deps.getStatusPanel();
    try {
      const predictions = await fetchPredictions();
      this.latestPredictions = predictions;
      (panels['polymarket'] as PredictionPanel).renderPredictions(predictions);

      statusPanel?.updateFeed('Polymarket', { status: 'ok', itemCount: predictions.length });
      statusPanel?.updateApi('Polymarket', { status: 'ok' });
      dataFreshness.recordUpdate('polymarket', predictions.length);
      dataFreshness.recordUpdate('predictions', predictions.length);

      void this.runCorrelationAnalysis();
      this.emit('predictionsLoaded', this.latestPredictions);
    } catch (error) {
      statusPanel?.updateFeed('Polymarket', { status: 'error', errorMessage: String(error) });
      statusPanel?.updateApi('Polymarket', { status: 'error' });
      dataFreshness.recordError('polymarket', String(error));
      dataFreshness.recordError('predictions', String(error));
    }
  }

  // ---------------------------------------------------------------------------
  // Natural events (earthquakes + EONET)
  // ---------------------------------------------------------------------------

  async loadNatural(): Promise<void> {
    const map = this.deps.getMap();
    const statusPanel = this.deps.getStatusPanel();

    const [earthquakeResult, eonetResult] = await Promise.allSettled([
      fetchEarthquakes(),
      fetchNaturalEvents(30),
    ]);

    if (earthquakeResult.status === 'fulfilled') {
      this.intelligenceCache.earthquakes = earthquakeResult.value;
      map?.setEarthquakes(earthquakeResult.value);
      ingestEarthquakes(earthquakeResult.value);
      statusPanel?.updateApi('USGS', { status: 'ok' });
      dataFreshness.recordUpdate('usgs', earthquakeResult.value.length);
    } else {
      this.intelligenceCache.earthquakes = [];
      map?.setEarthquakes([]);
      statusPanel?.updateApi('USGS', { status: 'error' });
      dataFreshness.recordError('usgs', String(earthquakeResult.reason));
    }

    if (eonetResult.status === 'fulfilled') {
      map?.setNaturalEvents(eonetResult.value);
      statusPanel?.updateFeed('EONET', { status: 'ok', itemCount: eonetResult.value.length });
      statusPanel?.updateApi('NASA EONET', { status: 'ok' });
    } else {
      map?.setNaturalEvents([]);
      statusPanel?.updateFeed('EONET', { status: 'error', errorMessage: String(eonetResult.reason) });
      statusPanel?.updateApi('NASA EONET', { status: 'error' });
    }

    const hasEarthquakes = earthquakeResult.status === 'fulfilled' && earthquakeResult.value.length > 0;
    const hasEonet = eonetResult.status === 'fulfilled' && eonetResult.value.length > 0;
    map?.setLayerReady('natural', hasEarthquakes || hasEonet);
  }

  // ---------------------------------------------------------------------------
  // Tech events
  // ---------------------------------------------------------------------------

  async loadTechEvents(): Promise<void> {
    const map = this.deps.getMap();
    const mapLayers = this.deps.getMapLayers();
    const statusPanel = this.deps.getStatusPanel();

    console.log('[loadTechEvents] Called. SITE_VARIANT:', SITE_VARIANT, 'techEvents layer:', mapLayers.techEvents);
    if (SITE_VARIANT !== 'tech' && !mapLayers.techEvents) {
      console.log('[loadTechEvents] Skipping - not tech variant and layer disabled');
      return;
    }

    try {
      const client = new ResearchServiceClient('', { fetch: (...args: Parameters<typeof globalThis.fetch>) => globalThis.fetch(...args) });
      const data = await client.listTechEvents({
        type: 'conference',
        mappable: true,
        days: 90,
        limit: 50,
      });
      if (!data.success) throw new Error(data.error || 'Unknown error');

      const now = new Date();
      const mapEvents = data.events.map((e: any) => ({
        id: e.id,
        title: e.title,
        location: e.location,
        lat: e.coords?.lat ?? 0,
        lng: e.coords?.lng ?? 0,
        country: e.coords?.country ?? '',
        startDate: e.startDate,
        endDate: e.endDate,
        url: e.url,
        daysUntil: Math.ceil((new Date(e.startDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      }));

      map?.setTechEvents(mapEvents);
      map?.setLayerReady('techEvents', mapEvents.length > 0);
      statusPanel?.updateFeed('Tech Events', { status: 'ok', itemCount: mapEvents.length });

      if (SITE_VARIANT === 'tech') {
        const searchModal = this.deps.getSearchModal();
        searchModal?.registerSource('techevent', mapEvents.map((e: { id: string; title: string; location: string; startDate: string }) => ({
          id: e.id,
          title: e.title,
          subtitle: `${e.location} • ${new Date(e.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
          data: e,
        })));
      }
    } catch (error) {
      console.error('[DataLoader] Failed to load tech events:', error);
      map?.setTechEvents([]);
      map?.setLayerReady('techEvents', false);
      statusPanel?.updateFeed('Tech Events', { status: 'error', errorMessage: String(error) });
    }
  }

  // ---------------------------------------------------------------------------
  // Weather alerts
  // ---------------------------------------------------------------------------

  async loadWeatherAlerts(): Promise<void> {
    const map = this.deps.getMap();
    const statusPanel = this.deps.getStatusPanel();
    try {
      const alerts = await fetchWeatherAlerts();
      map?.setWeatherAlerts(alerts);
      map?.setLayerReady('weather', alerts.length > 0);
      statusPanel?.updateFeed('Weather', { status: 'ok', itemCount: alerts.length });
      dataFreshness.recordUpdate('weather', alerts.length);
    } catch (error) {
      map?.setLayerReady('weather', false);
      statusPanel?.updateFeed('Weather', { status: 'error' });
      dataFreshness.recordError('weather', String(error));
    }
  }

  // ---------------------------------------------------------------------------
  // Intelligence signals (CII-critical)
  // ---------------------------------------------------------------------------

  async loadIntelligenceSignals(): Promise<void> {
    const map = this.deps.getMap();
    const mapLayers = this.deps.getMapLayers();
    const statusPanel = this.deps.getStatusPanel();
    const panels = this.deps.getPanels();
    const tasks: Promise<void>[] = [];

    // Outages
    tasks.push((async () => {
      try {
        const outages = await fetchInternetOutages();
        this.intelligenceCache.outages = outages;
        ingestOutagesForCII(outages);
        signalAggregator.ingestOutages(outages);
        dataFreshness.recordUpdate('outages', outages.length);
        if (mapLayers.outages) {
          map?.setOutages(outages);
          map?.setLayerReady('outages', outages.length > 0);
          statusPanel?.updateFeed('NetBlocks', { status: 'ok', itemCount: outages.length });
        }
      } catch (error) {
        console.error('[Intelligence] Outages fetch failed:', error);
        dataFreshness.recordError('outages', String(error));
      }
    })());

    // Protests (shared promise for UCDP dedup)
    const protestsTask = (async (): Promise<SocialUnrestEvent[]> => {
      try {
        const protestData = await fetchProtestEvents();
        this.intelligenceCache.protests = protestData;
        ingestProtests(protestData.events);
        ingestProtestsForCII(protestData.events);
        signalAggregator.ingestProtests(protestData.events);
        const protestCount = protestData.sources.acled + protestData.sources.gdelt;
        if (protestCount > 0) dataFreshness.recordUpdate('acled', protestCount);
        if (protestData.sources.gdelt > 0) dataFreshness.recordUpdate('gdelt', protestData.sources.gdelt);
        if (protestData.sources.gdelt > 0) dataFreshness.recordUpdate('gdelt_doc', protestData.sources.gdelt);
        if (mapLayers.protests) {
          map?.setProtests(protestData.events);
          map?.setLayerReady('protests', protestData.events.length > 0);
          const status = getProtestStatus();
          statusPanel?.updateFeed('Protests', {
            status: 'ok',
            itemCount: protestData.events.length,
            errorMessage: status.acledConfigured === false ? 'ACLED not configured - using GDELT only' : undefined,
          });
        }
        return protestData.events;
      } catch (error) {
        console.error('[Intelligence] Protests fetch failed:', error);
        dataFreshness.recordError('acled', String(error));
        return [];
      }
    })();
    tasks.push(protestsTask.then(() => undefined));

    // Armed conflict events
    tasks.push((async () => {
      try {
        const conflictData = await fetchConflictEvents();
        ingestConflictsForCII(conflictData.events);
        if (conflictData.count > 0) dataFreshness.recordUpdate('acled_conflict', conflictData.count);
      } catch (error) {
        console.error('[Intelligence] Conflict events fetch failed:', error);
        dataFreshness.recordError('acled_conflict', String(error));
      }
    })());

    // UCDP classifications
    tasks.push((async () => {
      try {
        const classifications = await fetchUcdpClassifications();
        ingestUcdpForCII(classifications);
        if (classifications.size > 0) dataFreshness.recordUpdate('ucdp', classifications.size);
      } catch (error) {
        console.error('[Intelligence] UCDP fetch failed:', error);
        dataFreshness.recordError('ucdp', String(error));
      }
    })());

    // HDX HAPI
    tasks.push((async () => {
      try {
        const summaries = await fetchHapiSummary();
        ingestHapiForCII(summaries);
        if (summaries.size > 0) dataFreshness.recordUpdate('hapi', summaries.size);
      } catch (error) {
        console.error('[Intelligence] HAPI fetch failed:', error);
        dataFreshness.recordError('hapi', String(error));
      }
    })());

    // Military
    tasks.push((async () => {
      try {
        if (isMilitaryVesselTrackingConfigured()) {
          initMilitaryVesselStream();
        }
        const [flightData, vesselData] = await Promise.allSettled([
          fetchMilitaryFlights(),
          fetchMilitaryVessels(),
        ]).then(results => {
          const flights = results[0].status === 'fulfilled' ? results[0].value : { flights: [] as MilitaryFlight[], clusters: [] as MilitaryFlightCluster[] };
          const vessels = results[1].status === 'fulfilled' ? results[1].value : { vessels: [] as MilitaryVessel[], clusters: [] as MilitaryVesselCluster[] };
          return [flights, vessels] as const;
        });
        this.intelligenceCache.military = {
          flights: flightData.flights,
          flightClusters: flightData.clusters,
          vessels: vesselData.vessels,
          vesselClusters: vesselData.clusters,
        };
        fetchUSNIFleetReport().then((report) => {
          if (report) this.intelligenceCache.usniFleet = report;
        }).catch(() => {});
        ingestFlights(flightData.flights);
        ingestVessels(vesselData.vessels);
        ingestMilitaryForCII(flightData.flights, vesselData.vessels);
        signalAggregator.ingestFlights(flightData.flights);
        signalAggregator.ingestVessels(vesselData.vessels);
        dataFreshness.recordUpdate('opensky', flightData.flights.length);
        updateAndCheck([
          { type: 'military_flights', region: 'global', count: flightData.flights.length },
          { type: 'vessels', region: 'global', count: vesselData.vessels.length },
        ]).then(anomalies => {
          if (anomalies.length > 0) signalAggregator.ingestTemporalAnomalies(anomalies);
        }).catch(() => { });
        if (mapLayers.military) {
          map?.setMilitaryFlights(flightData.flights, flightData.clusters);
          map?.setMilitaryVessels(vesselData.vessels, vesselData.clusters);
          map?.updateMilitaryForEscalation(flightData.flights, vesselData.vessels);
          const militaryCount = flightData.flights.length + vesselData.vessels.length;
          statusPanel?.updateFeed('Military', {
            status: militaryCount > 0 ? 'ok' : 'warning',
            itemCount: militaryCount,
          });
        }
        if (!isInLearningMode()) {
          const surgeAlerts = analyzeFlightsForSurge(flightData.flights);
          if (surgeAlerts.length > 0) {
            const surgeSignals = surgeAlerts.map(surgeAlertToSignal);
            addToSignalHistory(surgeSignals);
            if (this.deps.shouldShowIntelligenceNotifications()) this.deps.getSignalModal()?.show(surgeSignals);
          }
          const foreignAlerts = detectForeignMilitaryPresence(flightData.flights);
          if (foreignAlerts.length > 0) {
            const foreignSignals = foreignAlerts.map(foreignPresenceToSignal);
            addToSignalHistory(foreignSignals);
            if (this.deps.shouldShowIntelligenceNotifications()) this.deps.getSignalModal()?.show(foreignSignals);
          }
        }
      } catch (error) {
        console.error('[Intelligence] Military fetch failed:', error);
        dataFreshness.recordError('opensky', String(error));
      }
    })());

    // UCDP georeferenced events
    tasks.push((async () => {
      try {
        const protestEvents = await protestsTask;
        let result = await fetchUcdpEvents();
        for (let attempt = 1; attempt < 3 && !result.success; attempt++) {
          await new Promise(r => setTimeout(r, 15_000));
          result = await fetchUcdpEvents();
        }
        if (!result.success) {
          dataFreshness.recordError('ucdp_events', 'UCDP events unavailable (retaining prior event state)');
          return;
        }
        const acledEvents = protestEvents.map(e => ({
          latitude: e.lat, longitude: e.lon, event_date: e.time.toISOString(), fatalities: e.fatalities ?? 0,
        }));
        const events = deduplicateAgainstAcled(result.data, acledEvents);
        (panels['ucdp-events'] as UcdpEventsPanel)?.setEvents(events);
        if (mapLayers.ucdpEvents) {
          map?.setUcdpEvents(events);
        }
        if (events.length > 0) dataFreshness.recordUpdate('ucdp_events', events.length);
      } catch (error) {
        console.error('[Intelligence] UCDP events fetch failed:', error);
        dataFreshness.recordError('ucdp_events', String(error));
      }
    })());

    // UNHCR displacement
    tasks.push((async () => {
      try {
        const unhcrResult = await fetchUnhcrPopulation();
        if (!unhcrResult.ok) {
          dataFreshness.recordError('unhcr', 'UNHCR displacement unavailable (retaining prior displacement state)');
          return;
        }
        const data = unhcrResult.data;
        (panels['displacement'] as DisplacementPanel)?.setData(data);
        ingestDisplacementForCII(data.countries);
        if (mapLayers.displacement && data.topFlows) {
          map?.setDisplacementFlows(data.topFlows);
        }
        if (data.countries.length > 0) dataFreshness.recordUpdate('unhcr', data.countries.length);
      } catch (error) {
        console.error('[Intelligence] UNHCR displacement fetch failed:', error);
        dataFreshness.recordError('unhcr', String(error));
      }
    })());

    // Climate anomalies
    tasks.push((async () => {
      try {
        const climateResult = await fetchClimateAnomalies();
        if (!climateResult.ok) {
          dataFreshness.recordError('climate', 'Climate anomalies unavailable (retaining prior climate state)');
          return;
        }
        const anomalies = climateResult.anomalies;
        (panels['climate'] as ClimateAnomalyPanel)?.setAnomalies(anomalies);
        ingestClimateForCII(anomalies);
        if (mapLayers.climate) {
          map?.setClimateAnomalies(anomalies);
        }
        if (anomalies.length > 0) dataFreshness.recordUpdate('climate', anomalies.length);
      } catch (error) {
        console.error('[Intelligence] Climate anomalies fetch failed:', error);
        dataFreshness.recordError('climate', String(error));
      }
    })());

    await Promise.allSettled(tasks);

    // Population exposure (after upstream intelligence loads)
    try {
      const ucdpEvts = (panels['ucdp-events'] as UcdpEventsPanel)?.getEvents?.() || [];
      const events = [
        ...(this.intelligenceCache.protests?.events || []).slice(0, 10).map(e => ({
          id: e.id, lat: e.lat, lon: e.lon, type: 'conflict' as const, name: e.title || 'Protest',
        })),
        ...ucdpEvts.slice(0, 10).map(e => ({
          id: e.id, lat: e.latitude, lon: e.longitude, type: e.type_of_violence as string, name: `${e.side_a} vs ${e.side_b}`,
        })),
      ];
      if (events.length > 0) {
        const exposures = await enrichEventsWithExposure(events);
        (panels['population-exposure'] as PopulationExposurePanel)?.setExposures(exposures);
        if (exposures.length > 0) dataFreshness.recordUpdate('worldpop', exposures.length);
      } else {
        (panels['population-exposure'] as PopulationExposurePanel)?.setExposures([]);
      }
    } catch (error) {
      console.error('[Intelligence] Population exposure fetch failed:', error);
      dataFreshness.recordError('worldpop', String(error));
    }

    (panels['cii'] as CIIPanel)?.refresh();
    console.log('[Intelligence] All signals loaded for CII calculation');
  }

  // ---------------------------------------------------------------------------
  // Outages (standalone, uses cache)
  // ---------------------------------------------------------------------------

  async loadOutages(): Promise<void> {
    const map = this.deps.getMap();
    const statusPanel = this.deps.getStatusPanel();
    if (this.intelligenceCache.outages) {
      const outages = this.intelligenceCache.outages;
      map?.setOutages(outages);
      map?.setLayerReady('outages', outages.length > 0);
      statusPanel?.updateFeed('NetBlocks', { status: 'ok', itemCount: outages.length });
      return;
    }
    try {
      const outages = await fetchInternetOutages();
      this.intelligenceCache.outages = outages;
      map?.setOutages(outages);
      map?.setLayerReady('outages', outages.length > 0);
      ingestOutagesForCII(outages);
      signalAggregator.ingestOutages(outages);
      statusPanel?.updateFeed('NetBlocks', { status: 'ok', itemCount: outages.length });
      dataFreshness.recordUpdate('outages', outages.length);
    } catch (error) {
      map?.setLayerReady('outages', false);
      statusPanel?.updateFeed('NetBlocks', { status: 'error' });
      dataFreshness.recordError('outages', String(error));
    }
  }

  // ---------------------------------------------------------------------------
  // Cyber threats
  // ---------------------------------------------------------------------------

  async loadCyberThreats(): Promise<void> {
    const map = this.deps.getMap();
    const mapLayers = this.deps.getMapLayers();
    const statusPanel = this.deps.getStatusPanel();

    if (!CYBER_LAYER_ENABLED) {
      mapLayers.cyberThreats = false;
      map?.setLayerReady('cyberThreats', false);
      return;
    }

    if (this.cyberThreatsCache) {
      map?.setCyberThreats(this.cyberThreatsCache);
      map?.setLayerReady('cyberThreats', this.cyberThreatsCache.length > 0);
      statusPanel?.updateFeed('Cyber Threats', { status: 'ok', itemCount: this.cyberThreatsCache.length });
      return;
    }

    try {
      const threats = await fetchCyberThreats({ limit: 500, days: 14 });
      this.cyberThreatsCache = threats;
      map?.setCyberThreats(threats);
      map?.setLayerReady('cyberThreats', threats.length > 0);
      statusPanel?.updateFeed('Cyber Threats', { status: 'ok', itemCount: threats.length });
      statusPanel?.updateApi('Cyber Threats API', { status: 'ok' });
      dataFreshness.recordUpdate('cyber_threats', threats.length);
    } catch (error) {
      map?.setLayerReady('cyberThreats', false);
      statusPanel?.updateFeed('Cyber Threats', { status: 'error', errorMessage: String(error) });
      statusPanel?.updateApi('Cyber Threats API', { status: 'error' });
      dataFreshness.recordError('cyber_threats', String(error));
    }
  }

  // ---------------------------------------------------------------------------
  // AIS signals
  // ---------------------------------------------------------------------------

  async loadAisSignals(): Promise<void> {
    const map = this.deps.getMap();
    const statusPanel = this.deps.getStatusPanel();
    try {
      const { disruptions, density } = await fetchAisSignals();
      const aisStatus = getAisStatus();
      console.log('[Ships] Events:', { disruptions: disruptions.length, density: density.length, vessels: aisStatus.vessels });
      map?.setAisData(disruptions, density);
      signalAggregator.ingestAisDisruptions(disruptions);
      updateAndCheck([
        { type: 'ais_gaps', region: 'global', count: disruptions.length },
      ]).then(anomalies => {
        if (anomalies.length > 0) signalAggregator.ingestTemporalAnomalies(anomalies);
      }).catch(() => { });

      const hasData = disruptions.length > 0 || density.length > 0;
      map?.setLayerReady('ais', hasData);

      const shippingCount = disruptions.length + density.length;
      const shippingStatus = shippingCount > 0 ? 'ok' : (aisStatus.connected ? 'warning' : 'error');
      statusPanel?.updateFeed('Shipping', {
        status: shippingStatus,
        itemCount: shippingCount,
        errorMessage: !aisStatus.connected && shippingCount === 0 ? 'AIS snapshot unavailable' : undefined,
      });
      statusPanel?.updateApi('AISStream', {
        status: aisStatus.connected ? 'ok' : 'warning',
      });
      if (hasData) {
        dataFreshness.recordUpdate('ais', shippingCount);
      }
    } catch (error) {
      map?.setLayerReady('ais', false);
      statusPanel?.updateFeed('Shipping', { status: 'error', errorMessage: String(error) });
      statusPanel?.updateApi('AISStream', { status: 'error' });
      dataFreshness.recordError('ais', String(error));
    }
  }

  waitForAisData(): void {
    const maxAttempts = 30;
    let attempts = 0;
    const map = this.deps.getMap();
    const statusPanel = this.deps.getStatusPanel();

    const checkData = () => {
      attempts++;
      const status = getAisStatus();

      if (status.vessels > 0 || status.connected) {
        this.loadAisSignals();
        map?.setLayerLoading('ais', false);
        return;
      }

      if (attempts >= maxAttempts) {
        map?.setLayerLoading('ais', false);
        map?.setLayerReady('ais', false);
        statusPanel?.updateFeed('Shipping', {
          status: 'error',
          errorMessage: 'Connection timeout',
        });
        return;
      }

      setTimeout(checkData, 1000);
    };

    checkData();
  }

  // ---------------------------------------------------------------------------
  // Cables
  // ---------------------------------------------------------------------------

  async loadCableActivity(): Promise<void> {
    const map = this.deps.getMap();
    const statusPanel = this.deps.getStatusPanel();
    try {
      const activity = await fetchCableActivity();
      map?.setCableActivity(activity.advisories, activity.repairShips);
      const itemCount = activity.advisories.length + activity.repairShips.length;
      statusPanel?.updateFeed('CableOps', { status: 'ok', itemCount });
    } catch {
      statusPanel?.updateFeed('CableOps', { status: 'error' });
    }
  }

  async loadCableHealth(): Promise<void> {
    const map = this.deps.getMap();
    const statusPanel = this.deps.getStatusPanel();
    try {
      const healthData = await fetchCableHealth();
      map?.setCableHealth(healthData.cables);
      const cableIds = Object.keys(healthData.cables);
      const faultCount = cableIds.filter((id) => healthData.cables[id]?.status === 'fault').length;
      const degradedCount = cableIds.filter((id) => healthData.cables[id]?.status === 'degraded').length;
      statusPanel?.updateFeed('CableHealth', { status: 'ok', itemCount: faultCount + degradedCount });
    } catch {
      statusPanel?.updateFeed('CableHealth', { status: 'error' });
    }
  }

  // ---------------------------------------------------------------------------
  // Protests (standalone, uses cache)
  // ---------------------------------------------------------------------------

  async loadProtests(): Promise<void> {
    const map = this.deps.getMap();
    const statusPanel = this.deps.getStatusPanel();
    const panels = this.deps.getPanels();
    if (this.intelligenceCache.protests) {
      const protestData = this.intelligenceCache.protests;
      map?.setProtests(protestData.events);
      map?.setLayerReady('protests', protestData.events.length > 0);
      const status = getProtestStatus();
      statusPanel?.updateFeed('Protests', {
        status: 'ok',
        itemCount: protestData.events.length,
        errorMessage: status.acledConfigured === false ? 'ACLED not configured - using GDELT only' : undefined,
      });
      if (status.acledConfigured === true) {
        statusPanel?.updateApi('ACLED', { status: 'ok' });
      } else if (status.acledConfigured === null) {
        statusPanel?.updateApi('ACLED', { status: 'warning' });
      }
      statusPanel?.updateApi('GDELT Doc', { status: 'ok' });
      if (protestData.sources.gdelt > 0) dataFreshness.recordUpdate('gdelt_doc', protestData.sources.gdelt);
      return;
    }
    try {
      const protestData = await fetchProtestEvents();
      this.intelligenceCache.protests = protestData;
      map?.setProtests(protestData.events);
      map?.setLayerReady('protests', protestData.events.length > 0);
      ingestProtests(protestData.events);
      ingestProtestsForCII(protestData.events);
      signalAggregator.ingestProtests(protestData.events);
      const protestCount = protestData.sources.acled + protestData.sources.gdelt;
      if (protestCount > 0) dataFreshness.recordUpdate('acled', protestCount);
      if (protestData.sources.gdelt > 0) dataFreshness.recordUpdate('gdelt', protestData.sources.gdelt);
      if (protestData.sources.gdelt > 0) dataFreshness.recordUpdate('gdelt_doc', protestData.sources.gdelt);
      (panels['cii'] as CIIPanel)?.refresh();
      const status = getProtestStatus();
      statusPanel?.updateFeed('Protests', {
        status: 'ok',
        itemCount: protestData.events.length,
        errorMessage: status.acledConfigured === false ? 'ACLED not configured - using GDELT only' : undefined,
      });
      if (status.acledConfigured === true) {
        statusPanel?.updateApi('ACLED', { status: 'ok' });
      } else if (status.acledConfigured === null) {
        statusPanel?.updateApi('ACLED', { status: 'warning' });
      }
      statusPanel?.updateApi('GDELT Doc', { status: 'ok' });
    } catch (error) {
      map?.setLayerReady('protests', false);
      statusPanel?.updateFeed('Protests', { status: 'error', errorMessage: String(error) });
      statusPanel?.updateApi('ACLED', { status: 'error' });
      statusPanel?.updateApi('GDELT Doc', { status: 'error' });
      dataFreshness.recordError('gdelt_doc', String(error));
    }
  }

  // ---------------------------------------------------------------------------
  // Flight delays
  // ---------------------------------------------------------------------------

  async loadFlightDelays(): Promise<void> {
    const map = this.deps.getMap();
    const statusPanel = this.deps.getStatusPanel();
    try {
      const delays = await fetchFlightDelays();
      map?.setFlightDelays(delays);
      map?.setLayerReady('flights', delays.length > 0);
      statusPanel?.updateFeed('Flights', { status: 'ok', itemCount: delays.length });
      statusPanel?.updateApi('FAA', { status: 'ok' });
    } catch (error) {
      map?.setLayerReady('flights', false);
      statusPanel?.updateFeed('Flights', { status: 'error', errorMessage: String(error) });
      statusPanel?.updateApi('FAA', { status: 'error' });
    }
  }

  // ---------------------------------------------------------------------------
  // Military (standalone, uses cache)
  // ---------------------------------------------------------------------------

  async loadMilitary(): Promise<void> {
    const map = this.deps.getMap();
    const statusPanel = this.deps.getStatusPanel();
    const panels = this.deps.getPanels();

    if (this.intelligenceCache.military) {
      const { flights, flightClusters, vessels, vesselClusters } = this.intelligenceCache.military;
      map?.setMilitaryFlights(flights, flightClusters);
      map?.setMilitaryVessels(vessels, vesselClusters);
      map?.updateMilitaryForEscalation(flights, vessels);
      this.loadCachedPosturesForBanner();
      const insightsPanel = panels['insights'] as InsightsPanel | undefined;
      insightsPanel?.setMilitaryFlights(flights);
      const hasData = flights.length > 0 || vessels.length > 0;
      map?.setLayerReady('military', hasData);
      const militaryCount = flights.length + vessels.length;
      statusPanel?.updateFeed('Military', {
        status: militaryCount > 0 ? 'ok' : 'warning',
        itemCount: militaryCount,
        errorMessage: militaryCount === 0 ? 'No military activity in view' : undefined,
      });
      statusPanel?.updateApi('OpenSky', { status: 'ok' });
      return;
    }
    try {
      if (isMilitaryVesselTrackingConfigured()) {
        initMilitaryVesselStream();
      }
      const [flightResult, vesselResult] = await Promise.allSettled([
        fetchMilitaryFlights(),
        fetchMilitaryVessels(),
      ]);
      const flightData = flightResult.status === 'fulfilled'
        ? flightResult.value
        : { flights: [] as MilitaryFlight[], clusters: [] as MilitaryFlightCluster[] };
      const vesselData = vesselResult.status === 'fulfilled'
        ? vesselResult.value
        : { vessels: [] as MilitaryVessel[], clusters: [] as MilitaryVesselCluster[] };

      this.intelligenceCache.military = {
        flights: flightData.flights,
        flightClusters: flightData.clusters,
        vessels: vesselData.vessels,
        vesselClusters: vesselData.clusters,
      };
      fetchUSNIFleetReport().then((report) => {
        if (report) this.intelligenceCache.usniFleet = report;
      }).catch(() => {});
      map?.setMilitaryFlights(flightData.flights, flightData.clusters);
      map?.setMilitaryVessels(vesselData.vessels, vesselData.clusters);
      ingestFlights(flightData.flights);
      ingestVessels(vesselData.vessels);
      ingestMilitaryForCII(flightData.flights, vesselData.vessels);
      signalAggregator.ingestFlights(flightData.flights);
      signalAggregator.ingestVessels(vesselData.vessels);
      updateAndCheck([
        { type: 'military_flights', region: 'global', count: flightData.flights.length },
        { type: 'vessels', region: 'global', count: vesselData.vessels.length },
      ]).then(anomalies => {
        if (anomalies.length > 0) signalAggregator.ingestTemporalAnomalies(anomalies);
      }).catch(() => { });
      map?.updateMilitaryForEscalation(flightData.flights, vesselData.vessels);
      (panels['cii'] as CIIPanel)?.refresh();
      if (!isInLearningMode()) {
        const surgeAlerts = analyzeFlightsForSurge(flightData.flights);
        if (surgeAlerts.length > 0) {
          const surgeSignals = surgeAlerts.map(surgeAlertToSignal);
          addToSignalHistory(surgeSignals);
          if (this.deps.shouldShowIntelligenceNotifications()) this.deps.getSignalModal()?.show(surgeSignals);
        }
        const foreignAlerts = detectForeignMilitaryPresence(flightData.flights);
        if (foreignAlerts.length > 0) {
          const foreignSignals = foreignAlerts.map(foreignPresenceToSignal);
          addToSignalHistory(foreignSignals);
          if (this.deps.shouldShowIntelligenceNotifications()) this.deps.getSignalModal()?.show(foreignSignals);
        }
      }

      this.loadCachedPosturesForBanner();
      const insightsPanel = panels['insights'] as InsightsPanel | undefined;
      insightsPanel?.setMilitaryFlights(flightData.flights);

      const hasData = flightData.flights.length > 0 || vesselData.vessels.length > 0;
      map?.setLayerReady('military', hasData);
      const militaryCount = flightData.flights.length + vesselData.vessels.length;
      statusPanel?.updateFeed('Military', {
        status: militaryCount > 0 ? 'ok' : 'warning',
        itemCount: militaryCount,
        errorMessage: militaryCount === 0 ? 'No military activity in view' : undefined,
      });
      statusPanel?.updateApi('OpenSky', { status: 'ok' });
      dataFreshness.recordUpdate('opensky', flightData.flights.length);
    } catch (error) {
      map?.setLayerReady('military', false);
      statusPanel?.updateFeed('Military', { status: 'error', errorMessage: String(error) });
      statusPanel?.updateApi('OpenSky', { status: 'error' });
      dataFreshness.recordError('opensky', String(error));
    }
  }

  // ---------------------------------------------------------------------------
  // Cached postures for banner
  // ---------------------------------------------------------------------------

  async loadCachedPosturesForBanner(): Promise<void> {
    try {
      const data = await fetchCachedTheaterPosture();
      if (data && data.postures.length > 0) {
        this.emit('criticalBanner', data.postures);
        const posturePanel = this.deps.getPanels()['strategic-posture'] as StrategicPosturePanel | undefined;
        posturePanel?.updatePostures(data);
      }
    } catch (error) {
      console.warn('[DataLoader] Failed to load cached postures for banner:', error);
    }
  }

  // ---------------------------------------------------------------------------
  // FRED economic data
  // ---------------------------------------------------------------------------

  async loadFredData(): Promise<void> {
    const economicPanel = this.deps.getPanels()['economic'] as EconomicPanel;
    const statusPanel = this.deps.getStatusPanel();
    const cbInfo = getCircuitBreakerCooldownInfo('FRED Economic');
    if (cbInfo.onCooldown) {
      economicPanel?.setErrorState(true, `Temporarily unavailable (retry in ${cbInfo.remainingSeconds}s)`);
      statusPanel?.updateApi('FRED', { status: 'error' });
      return;
    }

    try {
      economicPanel?.setLoading(true);
      const data = await fetchFredData();

      const postInfo = getCircuitBreakerCooldownInfo('FRED Economic');
      if (postInfo.onCooldown) {
        economicPanel?.setErrorState(true, `Temporarily unavailable (retry in ${postInfo.remainingSeconds}s)`);
        statusPanel?.updateApi('FRED', { status: 'error' });
        return;
      }

      if (data.length === 0) {
        if (!isFeatureAvailable('economicFred')) {
          economicPanel?.setErrorState(true, 'FRED_API_KEY not configured — add in Settings');
          statusPanel?.updateApi('FRED', { status: 'error' });
          return;
        }
        economicPanel?.showRetrying();
        await new Promise(r => setTimeout(r, 20_000));
        const retryData = await fetchFredData();
        if (retryData.length === 0) {
          economicPanel?.setErrorState(true, 'FRED data temporarily unavailable — will retry');
          statusPanel?.updateApi('FRED', { status: 'error' });
          return;
        }
        economicPanel?.setErrorState(false);
        economicPanel?.update(retryData);
        statusPanel?.updateApi('FRED', { status: 'ok' });
        dataFreshness.recordUpdate('economic', retryData.length);
        return;
      }

      economicPanel?.setErrorState(false);
      economicPanel?.update(data);
      statusPanel?.updateApi('FRED', { status: 'ok' });
      dataFreshness.recordUpdate('economic', data.length);
    } catch {
      if (isFeatureAvailable('economicFred')) {
        economicPanel?.showRetrying();
        try {
          await new Promise(r => setTimeout(r, 20_000));
          const retryData = await fetchFredData();
          if (retryData.length > 0) {
            economicPanel?.setErrorState(false);
            economicPanel?.update(retryData);
            statusPanel?.updateApi('FRED', { status: 'ok' });
            dataFreshness.recordUpdate('economic', retryData.length);
            return;
          }
        } catch { /* fall through */ }
      }
      statusPanel?.updateApi('FRED', { status: 'error' });
      economicPanel?.setErrorState(true, 'FRED data temporarily unavailable — will retry');
      economicPanel?.setLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Oil analytics
  // ---------------------------------------------------------------------------

  async loadOilAnalytics(): Promise<void> {
    const economicPanel = this.deps.getPanels()['economic'] as EconomicPanel;
    const statusPanel = this.deps.getStatusPanel();
    try {
      const data = await fetchOilAnalytics();
      economicPanel?.updateOil(data);
      const hasData = !!(data.wtiPrice || data.brentPrice || data.usProduction || data.usInventory);
      statusPanel?.updateApi('EIA', { status: hasData ? 'ok' : 'error' });
      if (hasData) {
        const metricCount = [data.wtiPrice, data.brentPrice, data.usProduction, data.usInventory].filter(Boolean).length;
        dataFreshness.recordUpdate('oil', metricCount || 1);
      } else {
        dataFreshness.recordError('oil', 'Oil analytics returned no values');
      }
    } catch (e) {
      console.error('[DataLoader] Oil analytics failed:', e);
      statusPanel?.updateApi('EIA', { status: 'error' });
      dataFreshness.recordError('oil', String(e));
    }
  }

  // ---------------------------------------------------------------------------
  // Government spending
  // ---------------------------------------------------------------------------

  async loadGovernmentSpending(): Promise<void> {
    const economicPanel = this.deps.getPanels()['economic'] as EconomicPanel;
    const statusPanel = this.deps.getStatusPanel();
    try {
      const data = await fetchRecentAwards({ daysBack: 7, limit: 15 });
      economicPanel?.updateSpending(data);
      statusPanel?.updateApi('USASpending', { status: data.awards.length > 0 ? 'ok' : 'error' });
      if (data.awards.length > 0) {
        dataFreshness.recordUpdate('spending', data.awards.length);
      } else {
        dataFreshness.recordError('spending', 'No awards returned');
      }
    } catch (e) {
      console.error('[DataLoader] Government spending failed:', e);
      statusPanel?.updateApi('USASpending', { status: 'error' });
      dataFreshness.recordError('spending', String(e));
    }
  }

  // ---------------------------------------------------------------------------
  // FIRMS (satellite fire data)
  // ---------------------------------------------------------------------------

  async loadFirmsData(): Promise<void> {
    const panels = this.deps.getPanels();
    const statusPanel = this.deps.getStatusPanel();
    const map = this.deps.getMap();
    try {
      const fireResult = await fetchAllFires(1);
      if (fireResult.skipped) {
        panels['satellite-fires']?.showConfigError('NASA_FIRMS_API_KEY not configured — add in Settings');
        statusPanel?.updateApi('FIRMS', { status: 'error' });
        return;
      }
      const { regions, totalCount } = fireResult;
      if (totalCount > 0) {
        const flat = flattenFires(regions);
        const stats = computeRegionStats(regions);

        signalAggregator.ingestSatelliteFires(flat.map(f => ({
          lat: f.location?.latitude ?? 0,
          lon: f.location?.longitude ?? 0,
          brightness: f.brightness,
          frp: f.frp,
          region: f.region,
          acq_date: new Date(f.detectedAt).toISOString().slice(0, 10),
        })));

        map?.setFires(toMapFires(flat));
        (panels['satellite-fires'] as SatelliteFiresPanel)?.update(stats, totalCount);
        dataFreshness.recordUpdate('firms', totalCount);

        updateAndCheck([
          { type: 'satellite_fires', region: 'global', count: totalCount },
        ]).then(anomalies => {
          if (anomalies.length > 0) {
            signalAggregator.ingestTemporalAnomalies(anomalies);
          }
        }).catch(() => { });
      } else {
        (panels['satellite-fires'] as SatelliteFiresPanel)?.update([], 0);
      }
      statusPanel?.updateApi('FIRMS', { status: 'ok' });
    } catch (e) {
      console.warn('[DataLoader] FIRMS load failed:', e);
      (panels['satellite-fires'] as SatelliteFiresPanel)?.update([], 0);
      statusPanel?.updateApi('FIRMS', { status: 'error' });
      dataFreshness.recordError('firms', String(e));
    }
  }

  // ---------------------------------------------------------------------------
  // PizzINT
  // ---------------------------------------------------------------------------

  async loadPizzInt(): Promise<void> {
    const statusPanel = this.deps.getStatusPanel();
    const pizzintIndicator = this.deps.getPizzintIndicator();
    try {
      const [status, tensions] = await Promise.allSettled([
        fetchPizzIntStatus(),
        fetchGdeltTensions(),
      ]).then(results => {
        const s = results[0].status === 'fulfilled' ? results[0].value : null;
        const t = results[1].status === 'fulfilled' ? results[1].value : [];
        return [s, t] as const;
      });

      if (!status || status.locationsMonitored === 0) {
        pizzintIndicator?.hide();
        statusPanel?.updateApi('PizzINT', { status: 'error' });
        dataFreshness.recordError('pizzint', 'No monitored locations returned');
        return;
      }

      pizzintIndicator?.show();
      pizzintIndicator?.updateStatus(status);
      pizzintIndicator?.updateTensions(tensions);
      statusPanel?.updateApi('PizzINT', { status: 'ok' });
      dataFreshness.recordUpdate('pizzint', Math.max(status.locationsMonitored, tensions.length));
    } catch (error) {
      console.error('[DataLoader] PizzINT load failed:', error);
      pizzintIndicator?.hide();
      statusPanel?.updateApi('PizzINT', { status: 'error' });
      dataFreshness.recordError('pizzint', String(error));
    }
  }

  // ---------------------------------------------------------------------------
  // Helper: updateMonitorResults
  // ---------------------------------------------------------------------------

  updateMonitorResults(): void {
    const monitorPanel = this.deps.getPanels()['monitors'] as MonitorPanel;
    monitorPanel.renderResults(this.allNews);
  }

  // ---------------------------------------------------------------------------
  // Helper: runCorrelationAnalysis
  // ---------------------------------------------------------------------------

  async runCorrelationAnalysis(): Promise<void> {
    try {
      if (this.latestClusters.length === 0 && this.allNews.length > 0) {
        this.latestClusters = mlWorker.isAvailable
          ? await clusterNewsHybrid(this.allNews)
          : await analysisWorker.clusterNews(this.allNews);
      }

      if (this.latestClusters.length > 0) {
        ingestNewsForCII(this.latestClusters);
        dataFreshness.recordUpdate('gdelt', this.latestClusters.length);
        (this.deps.getPanels()['cii'] as CIIPanel)?.refresh();
      }

      const signals = await analysisWorker.analyzeCorrelations(
        this.latestClusters,
        this.latestPredictions,
        this.latestMarkets
      );

      let geoSignals: ReturnType<typeof geoConvergenceToSignal>[] = [];
      if (!isInLearningMode()) {
        const geoAlerts = detectGeoConvergence(this.seenGeoAlerts);
        geoSignals = geoAlerts.map(geoConvergenceToSignal);
      }

      const keywordSpikeSignals = drainTrendingSignals();
      const allSignals = [...signals, ...geoSignals, ...keywordSpikeSignals];
      if (allSignals.length > 0) {
        addToSignalHistory(allSignals);
        if (this.deps.shouldShowIntelligenceNotifications()) this.deps.getSignalModal()?.show(allSignals);
      }
    } catch (error) {
      console.error('[DataLoader] Correlation analysis failed:', error);
    }
  }

  // ---------------------------------------------------------------------------
  // Flash map for news
  // ---------------------------------------------------------------------------

  flashMapForNews(items: NewsItem[]): void {
    const map = this.deps.getMap();
    if (!map || !this.initialLoadComplete) return;
    const now = Date.now();

    for (const [key, timestamp] of this.mapFlashCache.entries()) {
      if (now - timestamp > MAP_FLASH_COOLDOWN_MS) {
        this.mapFlashCache.delete(key);
      }
    }

    for (const item of items) {
      const cacheKey = `${item.source}|${item.link || item.title}`;
      const lastSeen = this.mapFlashCache.get(cacheKey);
      if (lastSeen && now - lastSeen < MAP_FLASH_COOLDOWN_MS) {
        continue;
      }

      const location = this.findFlashLocation(item.title);
      if (!location) continue;

      map.flashLocation(location.lat, location.lon);
      this.mapFlashCache.set(cacheKey, now);
    }
  }

  findFlashLocation(title: string): { lat: number; lon: number } | null {
    const titleLower = title.toLowerCase();
    let bestMatch: { lat: number; lon: number; matches: number } | null = null;

    const countKeywordMatches = (keywords: string[] | undefined): number => {
      if (!keywords) return 0;
      let matches = 0;
      for (const keyword of keywords) {
        const cleaned = keyword.trim().toLowerCase();
        if (cleaned.length >= 3 && titleLower.includes(cleaned)) {
          matches++;
        }
      }
      return matches;
    };

    for (const hotspot of INTEL_HOTSPOTS) {
      const matches = countKeywordMatches(hotspot.keywords);
      if (matches > 0 && (!bestMatch || matches > bestMatch.matches)) {
        bestMatch = { lat: hotspot.lat, lon: hotspot.lon, matches };
      }
    }

    for (const conflict of CONFLICT_ZONES) {
      const matches = countKeywordMatches(conflict.keywords);
      if (matches > 0 && (!bestMatch || matches > bestMatch.matches)) {
        bestMatch = { lat: conflict.center[1], lon: conflict.center[0], matches };
      }
    }

    return bestMatch;
  }

  // ---------------------------------------------------------------------------
  // Time range filtering
  // ---------------------------------------------------------------------------

  getTimeRangeWindowMs(range: TimeRange): number {
    const ranges: Record<TimeRange, number> = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '48h': 48 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      'all': Infinity,
    };
    return ranges[range];
  }

  filterItemsByTimeRange(items: NewsItem[], range: TimeRange = this.currentTimeRange): NewsItem[] {
    if (range === 'all') return items;
    const cutoff = Date.now() - this.getTimeRangeWindowMs(range);
    return items.filter((item) => {
      const ts = item.pubDate instanceof Date ? item.pubDate.getTime() : new Date(item.pubDate).getTime();
      return Number.isFinite(ts) ? ts >= cutoff : true;
    });
  }

  getTimeRangeLabel(range: TimeRange = this.currentTimeRange): string {
    const labels: Record<TimeRange, string> = {
      '1h': 'the last hour',
      '6h': 'the last 6 hours',
      '24h': 'the last 24 hours',
      '48h': 'the last 48 hours',
      '7d': 'the last 7 days',
      'all': 'all time',
    };
    return labels[range];
  }

  renderNewsForCategory(category: string, items: NewsItem[]): void {
    this.newsByCategory[category] = items;
    const panel = this.deps.getNewsPanels()[category];
    if (!panel) return;
    const filteredItems = this.filterItemsByTimeRange(items);
    if (filteredItems.length === 0 && items.length > 0) {
      panel.renderFilteredEmpty(`No items in ${this.getTimeRangeLabel()}`);
      return;
    }
    panel.renderNews(filteredItems);
  }

  applyTimeRangeFilterToNewsPanels(): void {
    Object.entries(this.newsByCategory).forEach(([category, items]) => {
      this.renderNewsForCategory(category, items);
    });
  }

  // ---------------------------------------------------------------------------
  // Refresh scheduling
  // ---------------------------------------------------------------------------

  scheduleRefresh(
    name: string,
    fn: () => Promise<void>,
    intervalMs: number,
    condition?: () => boolean,
  ): void {
    const HIDDEN_REFRESH_MULTIPLIER = 4;
    const JITTER_FRACTION = 0.1;
    const MIN_REFRESH_MS = 1000;
    const computeDelay = (baseMs: number, isHidden: boolean) => {
      const adjusted = baseMs * (isHidden ? HIDDEN_REFRESH_MULTIPLIER : 1);
      const jitterRange = adjusted * JITTER_FRACTION;
      const jittered = adjusted + (Math.random() * 2 - 1) * jitterRange;
      return Math.max(MIN_REFRESH_MS, Math.round(jittered));
    };
    const scheduleNext = (delay: number) => {
      if (this.isDestroyed) return;
      const timeoutId = setTimeout(run, delay);
      this.refreshTimeoutIds.set(name, timeoutId);
    };
    const run = async () => {
      if (this.isDestroyed) return;
      const isHidden = document.visibilityState === 'hidden';
      if (isHidden) {
        scheduleNext(computeDelay(intervalMs, true));
        return;
      }
      if (condition && !condition()) {
        scheduleNext(computeDelay(intervalMs, false));
        return;
      }
      if (this.inFlight.has(name)) {
        scheduleNext(computeDelay(intervalMs, false));
        return;
      }
      this.inFlight.add(name);
      try {
        await fn();
      } catch (e) {
        console.error(`[DataLoader] Refresh ${name} failed:`, e);
      } finally {
        this.inFlight.delete(name);
        scheduleNext(computeDelay(intervalMs, false));
      }
    };
    this.refreshRunners.set(name, { run, intervalMs });
    scheduleNext(computeDelay(intervalMs, document.visibilityState === 'hidden'));
  }

  flushStaleRefreshes(): void {
    if (!this.hiddenSince) return;
    const hiddenMs = Date.now() - this.hiddenSince;
    this.hiddenSince = 0;

    let stagger = 0;
    for (const [name, { run, intervalMs }] of this.refreshRunners) {
      if (hiddenMs < intervalMs) continue;
      const pending = this.refreshTimeoutIds.get(name);
      if (pending) clearTimeout(pending);
      const delay = stagger;
      stagger += 150;
      this.refreshTimeoutIds.set(name, setTimeout(() => void run(), delay));
    }
  }

  setupRefreshIntervals(): void {
    this.scheduleRefresh('news', () => this.loadNews(), REFRESH_INTERVALS.feeds);
    this.scheduleRefresh('markets', () => this.loadMarkets(), REFRESH_INTERVALS.markets);
    this.scheduleRefresh('predictions', () => this.loadPredictions(), REFRESH_INTERVALS.predictions);
    this.scheduleRefresh('pizzint', () => this.loadPizzInt(), REFRESH_PIZZINT_MS);

    this.scheduleRefresh('natural', () => this.loadNatural(), REFRESH_NATURAL_MS, () => this.deps.getMapLayers().natural);
    this.scheduleRefresh('weather', () => this.loadWeatherAlerts(), REFRESH_WEATHER_MS, () => this.deps.getMapLayers().weather);
    this.scheduleRefresh('fred', () => this.loadFredData(), REFRESH_FRED_MS);
    this.scheduleRefresh('oil', () => this.loadOilAnalytics(), REFRESH_OIL_MS);
    this.scheduleRefresh('spending', () => this.loadGovernmentSpending(), REFRESH_SPENDING_MS);

    if (SITE_VARIANT === 'full') {
      this.scheduleRefresh('intelligence', () => {
        this.intelligenceCache = {};
        return this.loadIntelligenceSignals();
      }, REFRESH_INTELLIGENCE_MS);
    }

    this.scheduleRefresh('firms', () => this.loadFirmsData(), REFRESH_FIRMS_MS);
    this.scheduleRefresh('ais', () => this.loadAisSignals(), REFRESH_INTERVALS.ais, () => this.deps.getMapLayers().ais);
    this.scheduleRefresh('cables', () => this.loadCableActivity(), REFRESH_CABLES_MS, () => this.deps.getMapLayers().cables);
    this.scheduleRefresh('cableHealth', () => this.loadCableHealth(), REFRESH_CABLE_HEALTH_MS, () => this.deps.getMapLayers().cables);
    this.scheduleRefresh('flights', () => this.loadFlightDelays(), REFRESH_FLIGHTS_MS, () => this.deps.getMapLayers().flights);
    this.scheduleRefresh('cyberThreats', () => {
      this.cyberThreatsCache = null;
      return this.loadCyberThreats();
    }, REFRESH_CYBER_THREATS_MS, () => CYBER_LAYER_ENABLED && this.deps.getMapLayers().cyberThreats);
  }
}
