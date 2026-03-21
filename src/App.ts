import type { NewsItem, Monitor, PanelConfig, MapLayers, RelatedAsset } from '@/types';
import { EventManager } from '@/services/event-manager';
import { UpdateChecker } from '@/services/update-checker';
import {
  DEFAULT_PANELS,
  DEFAULT_MAP_LAYERS,
  MOBILE_DEFAULT_MAP_LAYERS,
  STORAGE_KEYS,
  SITE_VARIANT,
  LAYER_TO_SOURCE,
} from '@/config';
import { BETA_MODE } from '@/config/beta';
import {
  DEEP_LINK_MAX_RETRIES,
  DEEP_LINK_RETRY_INTERVAL_MS,
  DEEP_LINK_INITIAL_DELAY_MS,
  TOAST_DURATION_MS,
  SNAPSHOT_INTERVAL_MS,
  BANNER_DISMISS_DURATION_MS,
} from '@/config/constants';
import { isOutagesConfigured, initAisStream, disconnectAisStream, isAisConfigured, initDB, saveSnapshot, cleanOldSnapshots } from '@/services';
import { fetchCountryMarkets } from '@/services/prediction';
import { mlWorker } from '@/services/ml-worker';
import { signalAggregator } from '@/services/signal-aggregator';
import type { TheaterPostureSummary } from '@/services/military-surge';
import { startLearning, calculateCII, getCountryData, TIER1_COUNTRIES } from '@/services/country-instability';
import { dataFreshness, type DataSourceId } from '@/services/data-freshness';
import { debounce, loadFromStorage, parseMapUrlState, saveToStorage, ExportPanel, isMobileDevice, getCurrentTheme, storage } from '@/utils';
import { reverseGeocode } from '@/utils/reverse-geocode';
import { CountryBriefPage } from '@/components/CountryBriefPage';
import { CountryTimeline, type TimelineEvent } from '@/components/CountryTimeline';
import { escapeHtml } from '@/utils/sanitize';
import type { ParsedMapUrlState } from '@/utils';
import {
  MapContainer,
  NewsPanel,
  PredictionPanel,
  Panel,
  SignalModal,
  PlaybackControl,
  StatusPanel,
  SearchModal,
  MobileWarningModal,
  PizzIntIndicator,
  CIIPanel,
  StrategicPosturePanel,
  IntelligenceGapBadge,
  LanguageSelector,
} from '@/components';
import type { SearchResult } from '@/components/SearchModal';
import { PanelManager } from '@/services/panel-manager';
import { DataLoader } from '@/services/data-loader';
import { collectStoryData } from '@/services/story-data';
import { renderStoryToCanvas } from '@/services/story-renderer';
import { openStoryModal } from '@/components/StoryModal';
import { INTEL_HOTSPOTS, CONFLICT_ZONES, MILITARY_BASES, UNDERSEA_CABLES, NUCLEAR_FACILITIES } from '@/config/geo';
import { MarketServiceClient } from '@/generated/client/worldmonitor/market/v1/service_client';
import { PIPELINES } from '@/config/pipelines';
import { AI_DATA_CENTERS } from '@/config/ai-datacenters';
import { GAMMA_IRRADIATORS } from '@/config/irradiators';
import { TECH_COMPANIES } from '@/config/tech-companies';
import { AI_RESEARCH_LABS } from '@/config/ai-research-labs';
import { STARTUP_ECOSYSTEMS } from '@/config/startup-ecosystems';
import { TECH_HQS, ACCELERATORS } from '@/config/tech-geo';
import { STOCK_EXCHANGES, FINANCIAL_CENTERS, CENTRAL_BANKS, COMMODITY_HUBS } from '@/config/finance-geo';
import { CARE_FACILITIES, ROBOTICS_LABS, CARE_STARTUPS } from '@/config/care-geo';
import { isDesktopRuntime } from '@/services/runtime';
import { IntelligenceServiceClient } from '@/generated/client/worldmonitor/intelligence/v1/service_client';
import { trackEvent, trackMapLayerToggle, trackCountrySelected, trackCountryBriefOpened, trackSearchResultSelected, trackCriticalBannerAction, trackDeeplinkOpened } from '@/services/analytics';
import { getCountryAtCoordinates, hasCountryGeometry, isCoordinateInCountry, preloadCountryGeometry } from '@/services/country-geometry';
import { initI18n, t } from '@/services/i18n';

import type { ClusteredEvent } from '@/types';

type IntlDisplayNamesCtor = new (
  locales: string | string[],
  options: { type: 'region' }
) => { of: (code: string) => string | undefined };

const CYBER_LAYER_ENABLED = import.meta.env.VITE_ENABLE_CYBER_LAYER === 'true';

export interface CountryBriefSignals {
  protests: number;
  militaryFlights: number;
  militaryVessels: number;
  outages: number;
  earthquakes: number;
  displacementOutflow: number;
  climateStress: number;
  conflictEvents: number;
  isTier1: boolean;
}

export class App {
  private container: HTMLElement;
  private readonly PANEL_ORDER_KEY = 'panel-order';
  private readonly PANEL_SPANS_KEY = 'worldmonitor-panel-spans';
  private map: MapContainer | null = null;
  private panels: Record<string, Panel> = {};
  private panelManager: PanelManager | null = null;
  private newsPanels: Record<string, NewsPanel> = {};
  // allNews and newsByCategory are now managed by DataLoader
  // currentTimeRange is now managed by DataLoader
  private monitors: Monitor[];
  private panelSettings: Record<string, PanelConfig>;
  private mapLayers: MapLayers;
  private signalModal: SignalModal | null = null;
  private playbackControl: PlaybackControl | null = null;
  private statusPanel: StatusPanel | null = null;
  private exportPanel: ExportPanel | null = null;
  private languageSelector: LanguageSelector | null = null;
  private searchModal: SearchModal | null = null;
  private mobileWarningModal: MobileWarningModal | null = null;
  private pizzintIndicator: PizzIntIndicator | null = null;
  // latestPredictions, latestMarkets, latestClusters are now managed by DataLoader
  private readonly applyTimeRangeFilterToNewsPanelsDebounced = debounce(() => {
    this.dataLoader?.applyTimeRangeFilterToNewsPanels();
  }, 120);
  private isPlaybackMode = false;
  private initialUrlState: ParsedMapUrlState | null = null;
  // inFlight is now managed by DataLoader
  private isMobile: boolean;
  // seenGeoAlerts is now managed by DataLoader
  private snapshotIntervalId: ReturnType<typeof setInterval> | null = null;
  // refreshTimeoutIds, refreshRunners, hiddenSince are now managed by DataLoader
  private isDestroyed = false;
  private boundKeydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private eventManager: EventManager | null = null;
  private updateChecker: UpdateChecker | null = null;
  private disabledSources: Set<string> = new Set();
  // mapFlashCache is now managed by DataLoader
  // initialLoadComplete is now managed by DataLoader
  private criticalBannerEl: HTMLElement | null = null;
  private countryBriefPage: CountryBriefPage | null = null;
  private countryTimeline: CountryTimeline | null = null;
  private findingsBadge: IntelligenceGapBadge | null = null;
  private pendingDeepLinkCountry: string | null = null;
  private briefRequestToken = 0;
  private readonly isDesktopApp = isDesktopRuntime();
  private clockIntervalId: ReturnType<typeof setInterval> | null = null;
  private dataLoader!: DataLoader;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Container ${containerId} not found`);
    this.container = el;

    this.isMobile = isMobileDevice();
    this.monitors = loadFromStorage<Monitor[]>(STORAGE_KEYS.monitors, []);

    // Use mobile-specific defaults on first load (no saved layers)
    const defaultLayers = this.isMobile ? MOBILE_DEFAULT_MAP_LAYERS : DEFAULT_MAP_LAYERS;

    // Check if variant changed - reset all settings to variant defaults
    const storedVariant = storage.getRaw('worldmonitor-variant');
    const currentVariant = SITE_VARIANT;
    console.log(`[App] Variant check: stored="${storedVariant}", current="${currentVariant}"`);
    if (storedVariant !== currentVariant) {
      // Variant changed - use defaults for new variant, clear old settings
      console.log('[App] Variant changed - resetting to defaults');
      storage.setRaw('worldmonitor-variant', currentVariant);
      storage.removeRaw(STORAGE_KEYS.mapLayers);
      storage.removeRaw(STORAGE_KEYS.panels);
      storage.removeRaw(this.PANEL_ORDER_KEY);
      storage.removeRaw(this.PANEL_SPANS_KEY);
      this.mapLayers = { ...defaultLayers };
      this.panelSettings = { ...DEFAULT_PANELS };
    } else {
      this.mapLayers = loadFromStorage<MapLayers>(STORAGE_KEYS.mapLayers, defaultLayers);
      this.panelSettings = loadFromStorage<Record<string, PanelConfig>>(
        STORAGE_KEYS.panels,
        DEFAULT_PANELS
      );
      console.log('[App] Loaded panel settings from storage:', Object.entries(this.panelSettings).filter(([_, v]) => !v.enabled).map(([k]) => k));

      // One-time migration: reorder panels for existing users (v1.9 panel layout)
      // Puts live-news, insights, strategic-posture, cii, strategic-risk at the top
      const PANEL_ORDER_MIGRATION_KEY = 'worldmonitor-panel-order-v1.9';
      if (!storage.getRaw(PANEL_ORDER_MIGRATION_KEY)) {
        const savedOrder = storage.getRaw(this.PANEL_ORDER_KEY);
        if (savedOrder) {
          try {
            const order: string[] = JSON.parse(savedOrder);
            // Priority panels that should be at the top (after live-news which is handled separately)
            const priorityPanels = ['insights', 'strategic-posture', 'cii', 'strategic-risk'];
            // Remove priority panels from their current positions
            const filtered = order.filter(k => !priorityPanels.includes(k) && k !== 'live-news');
            // Find live-news position (should be first, but just in case)
            const liveNewsIdx = order.indexOf('live-news');
            // Build new order: live-news first, then priority panels, then rest
            const newOrder = liveNewsIdx !== -1 ? ['live-news'] : [];
            newOrder.push(...priorityPanels.filter(p => order.includes(p)));
            newOrder.push(...filtered);
            storage.setRaw(this.PANEL_ORDER_KEY, JSON.stringify(newOrder));
            console.log('[App] Migrated panel order to v1.8 layout');
          } catch {
            // Invalid saved order, will use defaults
          }
        }
        storage.setRaw(PANEL_ORDER_MIGRATION_KEY, 'done');
      }

      // Tech variant migration: move insights to top (after live-news)
      if (currentVariant === 'tech') {
        const TECH_INSIGHTS_MIGRATION_KEY = 'worldmonitor-tech-insights-top-v1';
        if (!storage.getRaw(TECH_INSIGHTS_MIGRATION_KEY)) {
          const savedOrder = storage.getRaw(this.PANEL_ORDER_KEY);
          if (savedOrder) {
            try {
              const order: string[] = JSON.parse(savedOrder);
              // Remove insights from current position
              const filtered = order.filter(k => k !== 'insights' && k !== 'live-news');
              // Build new order: live-news, insights, then rest
              const newOrder: string[] = [];
              if (order.includes('live-news')) newOrder.push('live-news');
              if (order.includes('insights')) newOrder.push('insights');
              newOrder.push(...filtered);
              storage.setRaw(this.PANEL_ORDER_KEY, JSON.stringify(newOrder));
              console.log('[App] Tech variant: Migrated insights panel to top');
            } catch {
              // Invalid saved order, will use defaults
            }
          }
          storage.setRaw(TECH_INSIGHTS_MIGRATION_KEY, 'done');
        }
      }
    }

    // One-time migration: clear stale panel ordering and sizing state that can
    // leave non-draggable gaps in mixed-size layouts on wide screens.
    const LAYOUT_RESET_MIGRATION_KEY = 'worldmonitor-layout-reset-v2.5';
    if (!storage.getRaw(LAYOUT_RESET_MIGRATION_KEY)) {
      const hadSavedOrder = !!storage.getRaw(this.PANEL_ORDER_KEY);
      const hadSavedSpans = !!storage.getRaw(this.PANEL_SPANS_KEY);
      if (hadSavedOrder || hadSavedSpans) {
        storage.removeRaw(this.PANEL_ORDER_KEY);
        storage.removeRaw(this.PANEL_SPANS_KEY);
        console.log('[App] Applied layout reset migration (v2.5): cleared panel order/spans');
      }
      storage.setRaw(LAYOUT_RESET_MIGRATION_KEY, 'done');
    }

    // Desktop key management panel must always remain accessible in Tauri.
    if (this.isDesktopApp) {
      const runtimePanel = this.panelSettings['runtime-config'] ?? {
        name: 'Desktop Configuration',
        enabled: true,
        priority: 2,
      };
      runtimePanel.enabled = true;
      this.panelSettings['runtime-config'] = runtimePanel;
      saveToStorage(STORAGE_KEYS.panels, this.panelSettings);
    }

    this.initialUrlState = parseMapUrlState(window.location.search, this.mapLayers);
    if (this.initialUrlState.layers) {
      // For tech variant, filter out geopolitical layers from URL
      if (currentVariant === 'tech') {
        const geoLayers: (keyof MapLayers)[] = ['conflicts', 'bases', 'hotspots', 'nuclear', 'irradiators', 'sanctions', 'military', 'protests', 'pipelines', 'waterways', 'ais', 'flights', 'spaceports', 'minerals'];
        const urlLayers = this.initialUrlState.layers;
        geoLayers.forEach(layer => {
          urlLayers[layer] = false;
        });
      }
      this.mapLayers = this.initialUrlState.layers;
    }
    if (!CYBER_LAYER_ENABLED) {
      this.mapLayers.cyberThreats = false;
    }
    this.disabledSources = new Set(loadFromStorage<string[]>(STORAGE_KEYS.disabledFeeds, []));
  }

  public async init(): Promise<void> {
    const initStart = performance.now();
    await initDB();
    await initI18n();

    // Initialize ML worker (desktop only - automatically disabled on mobile)
    await mlWorker.init();

    // Check AIS configuration before init
    if (!isAisConfigured()) {
      this.mapLayers.ais = false;
    } else if (this.mapLayers.ais) {
      initAisStream();
    }

    this.renderLayout();
    this.startHeaderClock();
    this.signalModal = new SignalModal();
    this.signalModal.setLocationClickHandler((lat, lon) => {
      this.map?.setCenter(lat, lon, 4);
    });
    if (!this.isMobile) {
      this.findingsBadge = new IntelligenceGapBadge();
      this.findingsBadge.setOnSignalClick((signal) => {
        if (this.countryBriefPage?.isVisible()) return;
        if (storage.getRaw('wm-settings-open') === '1') return;
        this.signalModal?.showSignal(signal);
      });
      this.findingsBadge.setOnAlertClick((alert) => {
        if (this.countryBriefPage?.isVisible()) return;
        if (storage.getRaw('wm-settings-open') === '1') return;
        this.signalModal?.showAlert(alert);
      });
    }
    this.setupMobileWarning();
    this.setupPlaybackControl();
    this.setupStatusPanel();
    this.setupPizzIntIndicator();
    this.setupExportPanel();
    this.setupLanguageSelector();
    this.setupSearchModal();
    this.setupMapLayerHandlers();
    this.setupCountryIntel();
    // Create EventManager for global event listeners, idle detection, URL sync, etc.
    this.eventManager = new EventManager({
      container: this.container,
      map: this.map,
      isDesktopApp: this.isDesktopApp,
      isMobile: this.isMobile,
      callbacks: {
        onSearchRequested: () => { this.updateSearchIndex(); this.searchModal?.open(); },
        onSettingsOpen: () => { /* handled inline by EventManager */ },
        onSettingsClose: () => { /* handled inline by EventManager */ },
        onStoragePanelsChanged: (panels) => { this.panelSettings = panels; this.panelManager!.applyPanelSettings(); this.panelManager!.renderPanelToggles(); },
        onStorageFindingsChanged: (val) => { if (this.findingsBadge) this.findingsBadge.setEnabled(val !== 'hidden'); },
        onStorageLiveChannelsChanged: () => {
          const panel = this.panels['live-news'];
          if (panel && typeof (panel as unknown as { refreshChannelsFromStorage?: () => void }).refreshChannelsFromStorage === 'function') {
            (panel as unknown as { refreshChannelsFromStorage: () => void }).refreshChannelsFromStorage();
          }
        },
        onSourcesModalOpen: () => { this.panelManager!.setupSourcesModal(); },
        onVariantSwitch: () => { /* handled inline by EventManager */ },
        onVisibilityReturn: () => { this.dataLoader?.flushStaleRefreshes(); },
        onFocalPointsReady: () => { (this.panels['cii'] as CIIPanel)?.refresh(true); },
        onThemeChanged: () => { /* extra theme handling if needed */ },
        getShareUrl: () => this.eventManager?.getShareUrl() ?? null,
        getMapState: () => (this.map?.getState() ?? { view: 'global', zoom: 1, layers: {}, timeRange: '7d' }) as { view: string; zoom: number; layers: Record<string, boolean>; timeRange: string },
        getMapCenter: () => (this.map?.getCenter() ?? { lat: 0, lon: 0 }) as unknown as { lat: number; lng: number },
        getCountryBriefInfo: () => ({
          visible: this.countryBriefPage?.isVisible() ?? false,
          code: this.countryBriefPage?.getCode() ?? null,
        }),
        renderMap: () => { this.map?.render(); },
      },
    });
    this.eventManager.setupEventListeners();
    // Capture ?country= BEFORE URL sync overwrites it
    const initState = parseMapUrlState(window.location.search, this.mapLayers);
    this.pendingDeepLinkCountry = initState.country ?? null;
    this.eventManager.setupUrlStateSync();
    this.syncDataFreshnessWithLayers();

    // Create DataLoader with dependency injection
    this.dataLoader = new DataLoader({
      getMap: () => this.map,
      getPanels: () => this.panels,
      getNewsPanels: () => this.newsPanels,
      getStatusPanel: () => this.statusPanel,
      getSignalModal: () => this.signalModal,
      getPizzintIndicator: () => this.pizzintIndicator,
      getSearchModal: () => this.searchModal,
      getMapLayers: () => this.mapLayers,
      getDisabledSources: () => this.disabledSources,
      shouldShowIntelligenceNotifications: () => this.shouldShowIntelligenceNotifications(),
    });

    // Wire DataLoader events
    this.dataLoader.on('searchIndexDirty', () => this.updateSearchIndex());
    this.dataLoader.on('criticalBanner', (postures) => this.renderCriticalBanner(postures));

    await preloadCountryGeometry();
    await this.dataLoader.loadAllData();

    // Start CII learning mode after first data load
    startLearning();

    // Hide unconfigured layers after first data load
    if (!isAisConfigured()) {
      this.map?.hideLayerToggle('ais');
    }
    if (isOutagesConfigured() === false) {
      this.map?.hideLayerToggle('outages');
    }
    if (!CYBER_LAYER_ENABLED) {
      this.map?.hideLayerToggle('cyberThreats');
    }

    this.dataLoader.setupRefreshIntervals();
    this.setupSnapshotSaving();
    cleanOldSnapshots().catch((e) => console.warn('[Storage] Snapshot cleanup failed:', e));

    // Handle deep links for story sharing
    this.handleDeepLinks();

    // Create UpdateChecker for desktop update detection
    this.updateChecker = new UpdateChecker({
      container: this.container,
      isDesktopApp: this.isDesktopApp,
    });
    this.updateChecker.setupUpdateChecks();

    // Track app load timing and panel count
    trackEvent('wm_app_loaded', {
      load_time_ms: Math.round(performance.now() - initStart),
      panel_count: Object.keys(this.panels).length,
    });

    // Observe panel visibility for usage analytics
    this.panelManager?.setupPanelViewTracking();
  }

  private handleDeepLinks(): void {
    const url = new URL(window.location.href);
    // Deep link constants imported from @/config/constants

    // Check for story deep link: /story?c=UA&t=ciianalysis
    if (url.pathname === '/story' || url.searchParams.has('c')) {
      const countryCode = url.searchParams.get('c');
      if (countryCode) {
        trackDeeplinkOpened('story', countryCode);
        const countryNames: Record<string, string> = {
          UA: 'Ukraine', RU: 'Russia', CN: 'China', US: 'United States',
          IR: 'Iran', IL: 'Israel', TW: 'Taiwan', KP: 'North Korea',
          SA: 'Saudi Arabia', TR: 'Turkey', PL: 'Poland', DE: 'Germany',
          FR: 'France', GB: 'United Kingdom', IN: 'India', PK: 'Pakistan',
          SY: 'Syria', YE: 'Yemen', MM: 'Myanmar', VE: 'Venezuela',
        };
        const countryName = countryNames[countryCode.toUpperCase()] || countryCode;

        // Wait for data to load, then open story
        let attempts = 0;
        const checkAndOpen = () => {
          if (dataFreshness.hasSufficientData() && this.dataLoader.latestClusters.length > 0) {
            this.openCountryStory(countryCode.toUpperCase(), countryName);
            return;
          }
          attempts += 1;
          if (attempts >= DEEP_LINK_MAX_RETRIES) {
            this.showToast('Data not available');
            return;
          } else {
            setTimeout(checkAndOpen, DEEP_LINK_RETRY_INTERVAL_MS);
          }
        };
        setTimeout(checkAndOpen, DEEP_LINK_INITIAL_DELAY_MS);

        // Update URL without reload
        history.replaceState(null, '', '/');
        return;
      }
    }

    // Check for country brief deep link: ?country=UA (captured before URL sync)
    const deepLinkCountry = this.pendingDeepLinkCountry;
    this.pendingDeepLinkCountry = null;
    if (deepLinkCountry) {
      trackDeeplinkOpened('country', deepLinkCountry);
      const cName = App.resolveCountryName(deepLinkCountry);
      let attempts = 0;
      const checkAndOpenBrief = () => {
        if (dataFreshness.hasSufficientData()) {
          this.openCountryBriefByCode(deepLinkCountry, cName);
          return;
        }
        attempts += 1;
        if (attempts >= DEEP_LINK_MAX_RETRIES) {
          this.showToast('Data not available');
          return;
        } else {
          setTimeout(checkAndOpenBrief, DEEP_LINK_RETRY_INTERVAL_MS);
        }
      };
      setTimeout(checkAndOpenBrief, DEEP_LINK_INITIAL_DELAY_MS);
    }
  }

  private startHeaderClock(): void {
    const el = document.getElementById('headerClock');
    if (!el) return;
    const tick = () => {
      el.textContent = new Date().toUTCString().replace('GMT', 'UTC');
    };
    tick();
    this.clockIntervalId = setInterval(tick, 1000);
  }

  private setupMobileWarning(): void {
    if (MobileWarningModal.shouldShow()) {
      this.mobileWarningModal = new MobileWarningModal();
      this.mobileWarningModal.show();
    }
  }

  private setupStatusPanel(): void {
    this.statusPanel = new StatusPanel();
    const headerLeft = this.container.querySelector('.header-left');
    if (headerLeft) {
      headerLeft.appendChild(this.statusPanel.getElement());
    }
  }

  private setupPizzIntIndicator(): void {
    // Skip DEFCON indicator for tech/startup and finance variants
    if (SITE_VARIANT === 'tech' || SITE_VARIANT === 'finance' || SITE_VARIANT === 'care') return;

    this.pizzintIndicator = new PizzIntIndicator();
    const headerLeft = this.container.querySelector('.header-left');
    if (headerLeft) {
      headerLeft.appendChild(this.pizzintIndicator.getElement());
    }
  }

  // loadPizzInt moved to DataLoader

  private setupExportPanel(): void {
    this.exportPanel = new ExportPanel(() => ({
      news: this.dataLoader.latestClusters.length > 0 ? this.dataLoader.latestClusters : this.dataLoader.allNews,
      markets: this.dataLoader.latestMarkets,
      predictions: this.dataLoader.latestPredictions,
      timestamp: Date.now(),
    }));

    const headerRight = this.container.querySelector('.header-right');
    if (headerRight) {
      headerRight.insertBefore(this.exportPanel.getElement(), headerRight.firstChild);
    }
  }

  private setupLanguageSelector(): void {
    this.languageSelector = new LanguageSelector();
    const headerRight = this.container.querySelector('.header-right');
    const searchBtn = this.container.querySelector('#searchBtn');

    if (headerRight && searchBtn) {
      // Insert before search button or at the beginning if search button not found
      headerRight.insertBefore(this.languageSelector.getElement(), searchBtn);
    } else if (headerRight) {
      headerRight.insertBefore(this.languageSelector.getElement(), headerRight.firstChild);
    }
  }

  private syncDataFreshnessWithLayers(): void {
    for (const [layer, sourceIds] of Object.entries(LAYER_TO_SOURCE)) {
      const enabled = this.mapLayers[layer as keyof MapLayers] ?? false;
      for (const sourceId of sourceIds) {
        dataFreshness.setEnabled(sourceId as DataSourceId, enabled);
      }
    }

    // Mark sources as disabled if not configured
    if (!isAisConfigured()) {
      dataFreshness.setEnabled('ais', false);
    }
    if (isOutagesConfigured() === false) {
      dataFreshness.setEnabled('outages', false);
    }
  }

  private setupMapLayerHandlers(): void {
    this.map?.setOnLayerChange((layer, enabled, source) => {
      console.log(`[App.onLayerChange] ${layer}: ${enabled} (${source})`);
      trackMapLayerToggle(layer, enabled, source);
      // Save layer settings
      this.mapLayers[layer] = enabled;
      saveToStorage(STORAGE_KEYS.mapLayers, this.mapLayers);

      // Sync data freshness tracker
      const sourceIds = LAYER_TO_SOURCE[layer];
      if (sourceIds) {
        for (const sourceId of sourceIds) {
          dataFreshness.setEnabled(sourceId, enabled);
        }
      }

      // Handle AIS WebSocket connection
      if (layer === 'ais') {
        if (enabled) {
          this.map?.setLayerLoading('ais', true);
          initAisStream();
          this.dataLoader.waitForAisData();
        } else {
          disconnectAisStream();
        }
        return;
      }

      // Load data when layer is enabled (if not already loaded)
      if (enabled) {
        this.dataLoader.loadDataForLayer(layer);
      }
    });
  }

  private setupCountryIntel(): void {
    if (!this.map) return;
    this.countryBriefPage = new CountryBriefPage();
    this.countryBriefPage.setShareStoryHandler((code, name) => {
      this.countryBriefPage?.hide();
      this.openCountryStory(code, name);
    });
    this.countryBriefPage.setExportImageHandler(async (code, name) => {
      try {
        const signals = this.getCountrySignals(code, name);
        const cluster = signalAggregator.getCountryClusters().find(c => c.country === code);
        const regional = signalAggregator.getRegionalConvergence().filter(r => r.countries.includes(code));
        const convergence = cluster ? {
          score: cluster.convergenceScore,
          signalTypes: [...cluster.signalTypes],
          regionalDescriptions: regional.map(r => r.description),
        } : null;
        const posturePanel = this.panels['strategic-posture'] as import('@/components/StrategicPosturePanel').StrategicPosturePanel | undefined;
        const postures = posturePanel?.getPostures() || [];
        const data = collectStoryData(code, name, this.dataLoader.latestClusters, postures, this.dataLoader.latestPredictions, signals, convergence);
        const canvas = await renderStoryToCanvas(data);
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `country-brief-${code.toLowerCase()}-${Date.now()}.png`;
        a.click();
      } catch (err) {
        console.error('[CountryBrief] Image export failed:', err);
      }
    });

    this.map.onCountryClicked(async (countryClick) => {
      if (countryClick.code && countryClick.name) {
        trackCountrySelected(countryClick.code, countryClick.name, 'map');
        this.openCountryBriefByCode(countryClick.code, countryClick.name);
      } else {
        this.openCountryBrief(countryClick.lat, countryClick.lon);
      }
    });

    this.countryBriefPage.onClose(() => {
      this.briefRequestToken++; // invalidate any in-flight reverse-geocode
      this.map?.clearCountryHighlight();
      this.map?.setRenderPaused(false);
      this.countryTimeline?.destroy();
      this.countryTimeline = null;
      // Force URL rewrite to drop ?country= immediately
      const shareUrl = this.eventManager?.getShareUrl() ?? null;
      if (shareUrl) history.replaceState(null, '', shareUrl);
    });
  }

  public async openCountryBrief(lat: number, lon: number): Promise<void> {
    if (!this.countryBriefPage) return;
    const token = ++this.briefRequestToken;
    this.countryBriefPage.showLoading();
    this.map?.setRenderPaused(true);

    const localGeo = getCountryAtCoordinates(lat, lon);
    if (localGeo) {
      if (token !== this.briefRequestToken) return; // superseded by newer click
      this.openCountryBriefByCode(localGeo.code, localGeo.name);
      return;
    }

    const geo = await reverseGeocode(lat, lon);
    if (token !== this.briefRequestToken) return; // superseded by newer click
    if (!geo) {
      this.countryBriefPage.hide();
      this.map?.setRenderPaused(false);
      return;
    }

    this.openCountryBriefByCode(geo.code, geo.country);
  }

  public async openCountryBriefByCode(code: string, country: string): Promise<void> {
    if (!this.countryBriefPage) return;
    this.map?.setRenderPaused(true);
    trackCountryBriefOpened(code);

    // Normalize to canonical name (GeoJSON may use "United States of America" etc.)
    const canonicalName = TIER1_COUNTRIES[code] || App.resolveCountryName(code);
    if (canonicalName !== code) country = canonicalName;

    const scores = calculateCII();
    const score = scores.find((s) => s.code === code) ?? null;
    const signals = this.getCountrySignals(code, country);

    this.countryBriefPage.show(country, code, score, signals);
    this.map?.highlightCountry(code);

    // Force URL to include ?country= immediately
    const shareUrl = this.eventManager?.getShareUrl() ?? null;
    if (shareUrl) history.replaceState(null, '', shareUrl);

    const marketClient = new MarketServiceClient('', { fetch: (...args) => globalThis.fetch(...args) });
    const stockPromise = marketClient.getCountryStockIndex({ countryCode: code })
      .then((resp) => ({
        available: resp.available,
        code: resp.code,
        symbol: resp.symbol,
        indexName: resp.indexName,
        price: String(resp.price),
        weekChangePercent: String(resp.weekChangePercent),
        currency: resp.currency,
      }))
      .catch(() => ({ available: false as const, code: '', symbol: '', indexName: '', price: '0', weekChangePercent: '0', currency: '' }));

    stockPromise.then((stock) => {
      if (this.countryBriefPage?.getCode() === code) this.countryBriefPage.updateStock(stock);
    });

    fetchCountryMarkets(country)
      .then((markets) => {
        if (this.countryBriefPage?.getCode() === code) this.countryBriefPage.updateMarkets(markets);
      })
      .catch(() => {
        if (this.countryBriefPage?.getCode() === code) this.countryBriefPage.updateMarkets([]);
      });

    // Pass evidence headlines
    const searchTerms = App.getCountrySearchTerms(country, code);
    const otherCountryTerms = App.getOtherCountryTerms(code);
    const matchingNews = this.dataLoader.allNews.filter((n) => {
      const t = n.title.toLowerCase();
      return searchTerms.some((term) => t.includes(term));
    });
    const filteredNews = matchingNews.filter((n) => {
      const t = n.title.toLowerCase();
      const ourPos = App.firstMentionPosition(t, searchTerms);
      const otherPos = App.firstMentionPosition(t, otherCountryTerms);
      return ourPos !== Infinity && (otherPos === Infinity || ourPos <= otherPos);
    });
    if (filteredNews.length > 0) {
      this.countryBriefPage.updateNews(filteredNews.slice(0, 8));
    }

    // Infrastructure exposure
    this.countryBriefPage.updateInfrastructure(code);

    // Timeline
    this.mountCountryTimeline(code, country);

    try {
      const context: Record<string, unknown> = {};
      if (score) {
        context.score = score.score;
        context.level = score.level;
        context.trend = score.trend;
        context.components = score.components;
        context.change24h = score.change24h;
      }
      Object.assign(context, signals);

      const countryCluster = signalAggregator.getCountryClusters().find((c) => c.country === code);
      if (countryCluster) {
        context.convergenceScore = countryCluster.convergenceScore;
        context.signalTypes = [...countryCluster.signalTypes];
      }

      const convergences = signalAggregator.getRegionalConvergence()
        .filter((r) => r.countries.includes(code));
      if (convergences.length) {
        context.regionalConvergence = convergences.map((r) => r.description);
      }

      const headlines = filteredNews.slice(0, 15).map((n) => n.title);
      if (headlines.length) context.headlines = headlines;

      const stockData = await stockPromise;
      if (stockData.available) {
        const pct = parseFloat(stockData.weekChangePercent);
        context.stockIndex = `${stockData.indexName}: ${stockData.price} (${pct >= 0 ? '+' : ''}${stockData.weekChangePercent}% week)`;
      }

      let briefText = '';
      try {
        const intelClient = new IntelligenceServiceClient('', { fetch: (...args) => globalThis.fetch(...args) });
        const resp = await intelClient.getCountryIntelBrief({ countryCode: code });
        briefText = resp.brief;
      } catch { /* server unreachable */ }

      if (briefText) {
        this.countryBriefPage!.updateBrief({ brief: briefText, country, code });
      } else {
        const briefHeadlines = (context.headlines as string[] | undefined) || [];
        let fallbackBrief = '';
        const sumModelId = BETA_MODE ? 'summarization-beta' : 'summarization';
        if (briefHeadlines.length >= 2 && mlWorker.isAvailable && mlWorker.isModelLoaded(sumModelId)) {
          try {
            const prompt = `Summarize the current situation in ${country} based on these headlines: ${briefHeadlines.slice(0, 8).join('. ')}`;
            const [summary] = await mlWorker.summarize([prompt], BETA_MODE ? 'summarization-beta' : undefined);
            if (summary && summary.length > 20) fallbackBrief = summary;
          } catch { /* T5 failed */ }
        }

        if (fallbackBrief) {
          this.countryBriefPage!.updateBrief({ brief: fallbackBrief, country, code, fallback: true });
        } else {
          const lines: string[] = [];
          if (score) lines.push(t('countryBrief.fallback.instabilityIndex', { score: String(score.score), level: t(`countryBrief.levels.${score.level}`), trend: t(`countryBrief.trends.${score.trend}`) }));
          if (signals.protests > 0) lines.push(t('countryBrief.fallback.protestsDetected', { count: String(signals.protests) }));
          if (signals.militaryFlights > 0) lines.push(t('countryBrief.fallback.aircraftTracked', { count: String(signals.militaryFlights) }));
          if (signals.militaryVessels > 0) lines.push(t('countryBrief.fallback.vesselsTracked', { count: String(signals.militaryVessels) }));
          if (signals.outages > 0) lines.push(t('countryBrief.fallback.internetOutages', { count: String(signals.outages) }));
          if (signals.earthquakes > 0) lines.push(t('countryBrief.fallback.recentEarthquakes', { count: String(signals.earthquakes) }));
          if (context.stockIndex) lines.push(t('countryBrief.fallback.stockIndex', { value: context.stockIndex }));
          if (briefHeadlines.length > 0) {
            lines.push('', t('countryBrief.fallback.recentHeadlines'));
            briefHeadlines.slice(0, 5).forEach(h => lines.push(`• ${h}`));
          }
          if (lines.length > 0) {
            this.countryBriefPage!.updateBrief({ brief: lines.join('\n'), country, code, fallback: true });
          } else {
            this.countryBriefPage!.updateBrief({ brief: '', country, code, error: 'No AI service available. Configure GROQ_API_KEY in Settings for full briefs.' });
          }
        }
      }
    } catch (err) {
      console.error('[CountryBrief] fetch error:', err);
      this.countryBriefPage!.updateBrief({ brief: '', country, code, error: 'Failed to generate brief' });
    }
  }

  private mountCountryTimeline(code: string, country: string): void {
    this.countryTimeline?.destroy();
    this.countryTimeline = null;

    const mount = this.countryBriefPage?.getTimelineMount();
    if (!mount) return;

    const events: TimelineEvent[] = [];
    const countryLower = country.toLowerCase();
    const hasGeoShape = hasCountryGeometry(code) || !!App.COUNTRY_BOUNDS[code];
    const inCountry = (lat: number, lon: number) => hasGeoShape && this.isInCountry(lat, lon, code);
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    if (this.dataLoader.intelligenceCache.protests?.events) {
      for (const e of this.dataLoader.intelligenceCache.protests.events) {
        if (e.country?.toLowerCase() === countryLower || inCountry(e.lat, e.lon)) {
          events.push({
            timestamp: new Date(e.time).getTime(),
            lane: 'protest',
            label: e.title || `${e.eventType} in ${e.city || e.country}`,
            severity: e.severity === 'high' ? 'high' : e.severity === 'medium' ? 'medium' : 'low',
          });
        }
      }
    }

    if (this.dataLoader.intelligenceCache.earthquakes) {
      for (const eq of this.dataLoader.intelligenceCache.earthquakes) {
        if (inCountry(eq.location?.latitude ?? 0, eq.location?.longitude ?? 0) || eq.place?.toLowerCase().includes(countryLower)) {
          events.push({
            timestamp: eq.occurredAt,
            lane: 'natural',
            label: `M${eq.magnitude.toFixed(1)} ${eq.place}`,
            severity: eq.magnitude >= 6 ? 'critical' : eq.magnitude >= 5 ? 'high' : eq.magnitude >= 4 ? 'medium' : 'low',
          });
        }
      }
    }

    if (this.dataLoader.intelligenceCache.military) {
      for (const f of this.dataLoader.intelligenceCache.military.flights) {
        if (hasGeoShape ? this.isInCountry(f.lat, f.lon, code) : f.operatorCountry?.toUpperCase() === code) {
          events.push({
            timestamp: new Date(f.lastSeen).getTime(),
            lane: 'military',
            label: `${f.callsign} (${f.aircraftModel || f.aircraftType})`,
            severity: f.isInteresting ? 'high' : 'low',
          });
        }
      }
      for (const v of this.dataLoader.intelligenceCache.military.vessels) {
        if (hasGeoShape ? this.isInCountry(v.lat, v.lon, code) : v.operatorCountry?.toUpperCase() === code) {
          events.push({
            timestamp: new Date(v.lastAisUpdate).getTime(),
            lane: 'military',
            label: `${v.name} (${v.vesselType})`,
            severity: v.isDark ? 'high' : 'low',
          });
        }
      }
    }

    const ciiData = getCountryData(code);
    if (ciiData?.conflicts) {
      for (const c of ciiData.conflicts) {
        events.push({
          timestamp: new Date(c.time).getTime(),
          lane: 'conflict',
          label: `${c.eventType}: ${c.location || c.country}`,
          severity: c.fatalities > 0 ? 'critical' : 'high',
        });
      }
    }

    this.countryTimeline = new CountryTimeline(mount);
    this.countryTimeline.render(events.filter(e => e.timestamp >= sevenDaysAgo));
  }

  private static COUNTRY_BOUNDS: Record<string, { n: number; s: number; e: number; w: number }> = {
    IR: { n: 40, s: 25, e: 63, w: 44 }, IL: { n: 33.3, s: 29.5, e: 35.9, w: 34.3 },
    SA: { n: 32, s: 16, e: 55, w: 35 }, AE: { n: 26.1, s: 22.6, e: 56.4, w: 51.6 },
    IQ: { n: 37.4, s: 29.1, e: 48.6, w: 38.8 }, SY: { n: 37.3, s: 32.3, e: 42.4, w: 35.7 },
    YE: { n: 19, s: 12, e: 54.5, w: 42 }, LB: { n: 34.7, s: 33.1, e: 36.6, w: 35.1 },
    CN: { n: 53.6, s: 18.2, e: 134.8, w: 73.5 }, TW: { n: 25.3, s: 21.9, e: 122, w: 120 },
    JP: { n: 45.5, s: 24.2, e: 153.9, w: 122.9 }, KR: { n: 38.6, s: 33.1, e: 131.9, w: 124.6 },
    KP: { n: 43.0, s: 37.7, e: 130.7, w: 124.2 }, IN: { n: 35.5, s: 6.7, e: 97.4, w: 68.2 },
    PK: { n: 37, s: 24, e: 77, w: 61 }, AF: { n: 38.5, s: 29.4, e: 74.9, w: 60.5 },
    UA: { n: 52.4, s: 44.4, e: 40.2, w: 22.1 }, RU: { n: 82, s: 41.2, e: 180, w: 19.6 },
    BY: { n: 56.2, s: 51.3, e: 32.8, w: 23.2 }, PL: { n: 54.8, s: 49, e: 24.1, w: 14.1 },
    EG: { n: 31.7, s: 22, e: 36.9, w: 25 }, LY: { n: 33, s: 19.5, e: 25, w: 9.4 },
    SD: { n: 22, s: 8.7, e: 38.6, w: 21.8 }, US: { n: 49, s: 24.5, e: -66.9, w: -125 },
    GB: { n: 58.7, s: 49.9, e: 1.8, w: -8.2 }, DE: { n: 55.1, s: 47.3, e: 15.0, w: 5.9 },
    FR: { n: 51.1, s: 41.3, e: 9.6, w: -5.1 }, TR: { n: 42.1, s: 36, e: 44.8, w: 26 },
    BR: { n: 5.3, s: -33.8, e: -34.8, w: -73.9 },
  };

  private static COUNTRY_ALIASES: Record<string, string[]> = {
    IL: ['israel', 'israeli', 'gaza', 'hamas', 'hezbollah', 'netanyahu', 'idf', 'west bank', 'tel aviv', 'jerusalem'],
    IR: ['iran', 'iranian', 'tehran', 'persian', 'irgc', 'khamenei'],
    RU: ['russia', 'russian', 'moscow', 'kremlin', 'putin', 'ukraine war'],
    UA: ['ukraine', 'ukrainian', 'kyiv', 'zelensky', 'zelenskyy'],
    CN: ['china', 'chinese', 'beijing', 'taiwan strait', 'south china sea', 'xi jinping'],
    TW: ['taiwan', 'taiwanese', 'taipei'],
    KP: ['north korea', 'pyongyang', 'kim jong'],
    KR: ['south korea', 'seoul'],
    SA: ['saudi', 'riyadh', 'mbs'],
    SY: ['syria', 'syrian', 'damascus', 'assad'],
    YE: ['yemen', 'houthi', 'sanaa'],
    IQ: ['iraq', 'iraqi', 'baghdad'],
    AF: ['afghanistan', 'afghan', 'kabul', 'taliban'],
    PK: ['pakistan', 'pakistani', 'islamabad'],
    IN: ['india', 'indian', 'new delhi', 'modi'],
    EG: ['egypt', 'egyptian', 'cairo', 'suez'],
    LB: ['lebanon', 'lebanese', 'beirut'],
    TR: ['turkey', 'turkish', 'ankara', 'erdogan', 'türkiye'],
    US: ['united states', 'american', 'washington', 'pentagon', 'white house'],
    GB: ['united kingdom', 'british', 'london', 'uk '],
    BR: ['brazil', 'brazilian', 'brasilia', 'lula', 'bolsonaro'],
    AE: ['united arab emirates', 'uae', 'emirati', 'dubai', 'abu dhabi'],
  };

  private static otherCountryTermsCache: Map<string, string[]> = new Map();

  private static firstMentionPosition(text: string, terms: string[]): number {
    let earliest = Infinity;
    for (const term of terms) {
      const idx = text.indexOf(term);
      if (idx !== -1 && idx < earliest) earliest = idx;
    }
    return earliest;
  }

  private static getOtherCountryTerms(code: string): string[] {
    const cached = App.otherCountryTermsCache.get(code);
    if (cached) return cached;

    const dedup = new Set<string>();
    Object.entries(App.COUNTRY_ALIASES).forEach(([countryCode, aliases]) => {
      if (countryCode === code) return;
      aliases.forEach((alias) => {
        const normalized = alias.toLowerCase();
        if (normalized.trim().length > 0) dedup.add(normalized);
      });
    });

    const terms = [...dedup];
    App.otherCountryTermsCache.set(code, terms);
    return terms;
  }

  private static resolveCountryName(code: string): string {
    if (TIER1_COUNTRIES[code]) return TIER1_COUNTRIES[code];

    try {
      const displayNamesCtor = (Intl as unknown as { DisplayNames?: IntlDisplayNamesCtor }).DisplayNames;
      if (!displayNamesCtor) return code;
      const displayNames = new displayNamesCtor(['en'], { type: 'region' });
      const resolved = displayNames.of(code);
      if (resolved && resolved.toUpperCase() !== code) return resolved;
    } catch {
      // Intl.DisplayNames unavailable in older runtimes.
    }

    return code;
  }

  private static getCountrySearchTerms(country: string, code: string): string[] {
    const aliases = App.COUNTRY_ALIASES[code];
    if (aliases) return aliases;
    if (/^[A-Z]{2}$/i.test(country.trim())) return [];
    return [country.toLowerCase()];
  }

  private isInCountry(lat: number, lon: number, code: string): boolean {
    const precise = isCoordinateInCountry(lat, lon, code);
    if (precise != null) return precise;
    const b = App.COUNTRY_BOUNDS[code];
    if (!b) return false;
    return lat >= b.s && lat <= b.n && lon >= b.w && lon <= b.e;
  }

  private getCountrySignals(code: string, country: string): CountryBriefSignals {
    const countryLower = country.toLowerCase();
    const hasGeoShape = hasCountryGeometry(code) || !!App.COUNTRY_BOUNDS[code];

    let protests = 0;
    if (this.dataLoader.intelligenceCache.protests?.events) {
      protests = this.dataLoader.intelligenceCache.protests.events.filter((e) =>
        e.country?.toLowerCase() === countryLower || (hasGeoShape && this.isInCountry(e.lat, e.lon, code))
      ).length;
    }

    let militaryFlights = 0;
    let militaryVessels = 0;
    if (this.dataLoader.intelligenceCache.military) {
      militaryFlights = this.dataLoader.intelligenceCache.military.flights.filter((f) =>
        hasGeoShape ? this.isInCountry(f.lat, f.lon, code) : f.operatorCountry?.toUpperCase() === code
      ).length;
      militaryVessels = this.dataLoader.intelligenceCache.military.vessels.filter((v) =>
        hasGeoShape ? this.isInCountry(v.lat, v.lon, code) : v.operatorCountry?.toUpperCase() === code
      ).length;
    }

    let outages = 0;
    if (this.dataLoader.intelligenceCache.outages) {
      outages = this.dataLoader.intelligenceCache.outages.filter((o) =>
        o.country?.toLowerCase() === countryLower || (hasGeoShape && this.isInCountry(o.lat, o.lon, code))
      ).length;
    }

    let earthquakes = 0;
    if (this.dataLoader.intelligenceCache.earthquakes) {
      earthquakes = this.dataLoader.intelligenceCache.earthquakes.filter((eq) => {
        if (hasGeoShape) return this.isInCountry(eq.location?.latitude ?? 0, eq.location?.longitude ?? 0, code);
        return eq.place?.toLowerCase().includes(countryLower);
      }).length;
    }

    const ciiData = getCountryData(code);
    const isTier1 = !!TIER1_COUNTRIES[code];

    return {
      protests,
      militaryFlights,
      militaryVessels,
      outages,
      earthquakes,
      displacementOutflow: ciiData?.displacementOutflow ?? 0,
      climateStress: ciiData?.climateStress ?? 0,
      conflictEvents: ciiData?.conflicts?.length ?? 0,
      isTier1,
    };
  }

  private openCountryStory(code: string, name: string): void {
    if (!dataFreshness.hasSufficientData() || this.dataLoader.latestClusters.length === 0) {
      this.showToast('Data still loading — try again in a moment');
      return;
    }
    const posturePanel = this.panels['strategic-posture'] as StrategicPosturePanel | undefined;
    const postures = posturePanel?.getPostures() || [];
    const signals = this.getCountrySignals(code, name);
    const cluster = signalAggregator.getCountryClusters().find(c => c.country === code);
    const regional = signalAggregator.getRegionalConvergence().filter(r => r.countries.includes(code));
    const convergence = cluster ? {
      score: cluster.convergenceScore,
      signalTypes: [...cluster.signalTypes],
      regionalDescriptions: regional.map(r => r.description),
    } : null;
    const data = collectStoryData(code, name, this.dataLoader.latestClusters, postures, this.dataLoader.latestPredictions, signals, convergence);
    openStoryModal(data);
  }

  private showToast(msg: string): void {
    document.querySelector('.toast-notification')?.remove();
    const el = document.createElement('div');
    el.className = 'toast-notification';
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('visible'));
    setTimeout(() => { el.classList.remove('visible'); setTimeout(() => el.remove(), 300); }, TOAST_DURATION_MS);
  }

  private shouldShowIntelligenceNotifications(): boolean {
    return !this.isMobile && !!this.findingsBadge?.isEnabled() && !!this.findingsBadge?.isPopupEnabled();
  }

  private setupSearchModal(): void {
    const searchOptions = SITE_VARIANT === 'tech'
      ? {
        placeholder: t('modals.search.placeholderTech'),
        hint: t('modals.search.hintTech'),
      }
      : SITE_VARIANT === 'finance'
        ? {
          placeholder: t('modals.search.placeholderFinance'),
          hint: t('modals.search.hintFinance'),
        }
        : SITE_VARIANT === 'care'
          ? {
            placeholder: 'Search care facilities, robotics labs, startups...',
            hint: 'Search across care intelligence data',
          }
          : {
            placeholder: t('modals.search.placeholder'),
            hint: t('modals.search.hint'),
          };
    this.searchModal = new SearchModal(this.container, searchOptions);

    if (SITE_VARIANT === 'tech') {
      // Tech variant: tech-specific sources
      this.searchModal.registerSource('techcompany', TECH_COMPANIES.map(c => ({
        id: c.id,
        title: c.name,
        subtitle: `${c.sector} ${c.city} ${c.keyProducts?.join(' ') || ''}`.trim(),
        data: c,
      })));

      this.searchModal.registerSource('ailab', AI_RESEARCH_LABS.map(l => ({
        id: l.id,
        title: l.name,
        subtitle: `${l.type} ${l.city} ${l.focusAreas?.join(' ') || ''}`.trim(),
        data: l,
      })));

      this.searchModal.registerSource('startup', STARTUP_ECOSYSTEMS.map(s => ({
        id: s.id,
        title: s.name,
        subtitle: `${s.ecosystemTier} ${s.topSectors?.join(' ') || ''} ${s.notableStartups?.join(' ') || ''}`.trim(),
        data: s,
      })));

      this.searchModal.registerSource('datacenter', AI_DATA_CENTERS.map(d => ({
        id: d.id,
        title: d.name,
        subtitle: `${d.owner} ${d.chipType || ''}`.trim(),
        data: d,
      })));

      this.searchModal.registerSource('cable', UNDERSEA_CABLES.map(c => ({
        id: c.id,
        title: c.name,
        subtitle: c.major ? 'Major internet backbone' : 'Undersea cable',
        data: c,
      })));

      // Register Tech HQs (unicorns, FAANG, public companies from map)
      this.searchModal.registerSource('techhq', TECH_HQS.map(h => ({
        id: h.id,
        title: h.company,
        subtitle: `${h.type === 'faang' ? 'Big Tech' : h.type === 'unicorn' ? 'Unicorn' : 'Public'} • ${h.city}, ${h.country}`,
        data: h,
      })));

      // Register Accelerators
      this.searchModal.registerSource('accelerator', ACCELERATORS.map(a => ({
        id: a.id,
        title: a.name,
        subtitle: `${a.type} • ${a.city}, ${a.country}${a.notable ? ` • ${a.notable.slice(0, 2).join(', ')}` : ''}`,
        data: a,
      })));
    } else if (SITE_VARIANT !== 'care') {
      // Full/Finance variant: geopolitical sources
      this.searchModal.registerSource('hotspot', INTEL_HOTSPOTS.map(h => ({
        id: h.id,
        title: h.name,
        subtitle: `${h.subtext || ''} ${h.keywords?.join(' ') || ''} ${h.description || ''}`.trim(),
        data: h,
      })));

      this.searchModal.registerSource('conflict', CONFLICT_ZONES.map(c => ({
        id: c.id,
        title: c.name,
        subtitle: `${c.parties?.join(' ') || ''} ${c.keywords?.join(' ') || ''} ${c.description || ''}`.trim(),
        data: c,
      })));

      this.searchModal.registerSource('base', MILITARY_BASES.map(b => ({
        id: b.id,
        title: b.name,
        subtitle: `${b.type} ${b.description || ''}`.trim(),
        data: b,
      })));

      this.searchModal.registerSource('pipeline', PIPELINES.map(p => ({
        id: p.id,
        title: p.name,
        subtitle: `${p.type} ${p.operator || ''} ${p.countries?.join(' ') || ''}`.trim(),
        data: p,
      })));

      this.searchModal.registerSource('cable', UNDERSEA_CABLES.map(c => ({
        id: c.id,
        title: c.name,
        subtitle: c.major ? 'Major cable' : '',
        data: c,
      })));

      this.searchModal.registerSource('datacenter', AI_DATA_CENTERS.map(d => ({
        id: d.id,
        title: d.name,
        subtitle: `${d.owner} ${d.chipType || ''}`.trim(),
        data: d,
      })));

      this.searchModal.registerSource('nuclear', NUCLEAR_FACILITIES.map(n => ({
        id: n.id,
        title: n.name,
        subtitle: `${n.type} ${n.operator || ''}`.trim(),
        data: n,
      })));

      this.searchModal.registerSource('irradiator', GAMMA_IRRADIATORS.map(g => ({
        id: g.id,
        title: `${g.city}, ${g.country}`,
        subtitle: g.organization || '',
        data: g,
      })));
    }

    if (SITE_VARIANT === 'finance') {
      // Finance variant: market-specific sources
      this.searchModal.registerSource('exchange', STOCK_EXCHANGES.map(e => ({
        id: e.id,
        title: `${e.shortName} - ${e.name}`,
        subtitle: `${e.tier} • ${e.city}, ${e.country}${e.marketCap ? ` • $${e.marketCap}T` : ''}`,
        data: e,
      })));

      this.searchModal.registerSource('financialcenter', FINANCIAL_CENTERS.map(f => ({
        id: f.id,
        title: f.name,
        subtitle: `${f.type} financial center${f.gfciRank ? ` • GFCI #${f.gfciRank}` : ''}${f.specialties ? ` • ${f.specialties.slice(0, 3).join(', ')}` : ''}`,
        data: f,
      })));

      this.searchModal.registerSource('centralbank', CENTRAL_BANKS.map(b => ({
        id: b.id,
        title: `${b.shortName} - ${b.name}`,
        subtitle: `${b.type}${b.currency ? ` • ${b.currency}` : ''} • ${b.city}, ${b.country}`,
        data: b,
      })));

      this.searchModal.registerSource('commodityhub', COMMODITY_HUBS.map(h => ({
        id: h.id,
        title: h.name,
        subtitle: `${h.type} • ${h.city}, ${h.country}${h.commodities ? ` • ${h.commodities.slice(0, 3).join(', ')}` : ''}`,
        data: h,
      })));
    }

    if (SITE_VARIANT === 'care') {
      // Care variant: care-specific sources
      this.searchModal.registerSource('carefacility', CARE_FACILITIES.map(f => ({
        id: f.id,
        title: f.name,
        subtitle: `${f.type} • ${f.operator} • ${f.country}${f.capacity ? ` • ${f.capacity} capacity` : ''}`,
        data: f,
      })));

      this.searchModal.registerSource('roboticslab', ROBOTICS_LABS.map(l => ({
        id: l.id,
        title: l.name,
        subtitle: `${l.region} • ${l.focus.join(', ')}${l.products ? ` • ${l.products.join(', ')}` : ''}`,
        data: l,
      })));

      this.searchModal.registerSource('carestartup', CARE_STARTUPS.map(s => ({
        id: s.id,
        title: s.name,
        subtitle: `${s.domain} • ${s.country} • ${s.fundingStage}${s.fundingAmountM ? ` • $${s.fundingAmountM}M` : ''}`,
        data: s,
      })));
    }

    // Register countries for all variants
    this.searchModal.registerSource('country', this.buildCountrySearchItems());

    // Handle result selection
    this.searchModal.setOnSelect((result) => this.handleSearchResult(result));

    // Global keyboard shortcut
    this.boundKeydownHandler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (this.searchModal?.isOpen()) {
          this.searchModal.close();
        } else {
          // Update search index with latest data before opening
          this.updateSearchIndex();
          this.searchModal?.open();
        }
      }
    };
    document.addEventListener('keydown', this.boundKeydownHandler);
  }

  private handleSearchResult(result: SearchResult): void {
    trackSearchResultSelected(result.type);
    switch (result.type) {
      case 'news': {
        // Find and scroll to the news panel containing this item
        const item = result.data as NewsItem;
        this.scrollToPanel('politics');
        this.highlightNewsItem(item.link);
        break;
      }
      case 'hotspot': {
        // Trigger map popup for hotspot
        const hotspot = result.data as typeof INTEL_HOTSPOTS[0];
        this.map?.setView('global');
        setTimeout(() => {
          this.map?.triggerHotspotClick(hotspot.id);
        }, 300);
        break;
      }
      case 'conflict': {
        const conflict = result.data as typeof CONFLICT_ZONES[0];
        this.map?.setView('global');
        setTimeout(() => {
          this.map?.triggerConflictClick(conflict.id);
        }, 300);
        break;
      }
      case 'market': {
        this.scrollToPanel('markets');
        break;
      }
      case 'prediction': {
        this.scrollToPanel('polymarket');
        break;
      }
      case 'base': {
        const base = result.data as typeof MILITARY_BASES[0];
        this.map?.setView('global');
        setTimeout(() => {
          this.map?.triggerBaseClick(base.id);
        }, 300);
        break;
      }
      case 'pipeline': {
        const pipeline = result.data as typeof PIPELINES[0];
        this.map?.setView('global');
        this.map?.enableLayer('pipelines');
        this.mapLayers.pipelines = true;
        setTimeout(() => {
          this.map?.triggerPipelineClick(pipeline.id);
        }, 300);
        break;
      }
      case 'cable': {
        const cable = result.data as typeof UNDERSEA_CABLES[0];
        this.map?.setView('global');
        this.map?.enableLayer('cables');
        this.mapLayers.cables = true;
        setTimeout(() => {
          this.map?.triggerCableClick(cable.id);
        }, 300);
        break;
      }
      case 'datacenter': {
        const dc = result.data as typeof AI_DATA_CENTERS[0];
        this.map?.setView('global');
        this.map?.enableLayer('datacenters');
        this.mapLayers.datacenters = true;
        setTimeout(() => {
          this.map?.triggerDatacenterClick(dc.id);
        }, 300);
        break;
      }
      case 'nuclear': {
        const nuc = result.data as typeof NUCLEAR_FACILITIES[0];
        this.map?.setView('global');
        this.map?.enableLayer('nuclear');
        this.mapLayers.nuclear = true;
        setTimeout(() => {
          this.map?.triggerNuclearClick(nuc.id);
        }, 300);
        break;
      }
      case 'irradiator': {
        const irr = result.data as typeof GAMMA_IRRADIATORS[0];
        this.map?.setView('global');
        this.map?.enableLayer('irradiators');
        this.mapLayers.irradiators = true;
        setTimeout(() => {
          this.map?.triggerIrradiatorClick(irr.id);
        }, 300);
        break;
      }
      case 'earthquake':
      case 'outage':
        // These are dynamic, just switch to map view
        this.map?.setView('global');
        break;
      case 'techcompany': {
        const company = result.data as typeof TECH_COMPANIES[0];
        this.map?.setView('global');
        this.map?.enableLayer('techHQs');
        this.mapLayers.techHQs = true;
        setTimeout(() => {
          this.map?.setCenter(company.lat, company.lon, 4);
        }, 300);
        break;
      }
      case 'ailab': {
        const lab = result.data as typeof AI_RESEARCH_LABS[0];
        this.map?.setView('global');
        setTimeout(() => {
          this.map?.setCenter(lab.lat, lab.lon, 4);
        }, 300);
        break;
      }
      case 'startup': {
        const ecosystem = result.data as typeof STARTUP_ECOSYSTEMS[0];
        this.map?.setView('global');
        this.map?.enableLayer('startupHubs');
        this.mapLayers.startupHubs = true;
        setTimeout(() => {
          this.map?.setCenter(ecosystem.lat, ecosystem.lon, 4);
        }, 300);
        break;
      }
      case 'techevent':
        this.map?.setView('global');
        this.map?.enableLayer('techEvents');
        this.mapLayers.techEvents = true;
        break;
      case 'techhq': {
        const hq = result.data as typeof TECH_HQS[0];
        this.map?.setView('global');
        this.map?.enableLayer('techHQs');
        this.mapLayers.techHQs = true;
        setTimeout(() => {
          this.map?.setCenter(hq.lat, hq.lon, 4);
        }, 300);
        break;
      }
      case 'accelerator': {
        const acc = result.data as typeof ACCELERATORS[0];
        this.map?.setView('global');
        this.map?.enableLayer('accelerators');
        this.mapLayers.accelerators = true;
        setTimeout(() => {
          this.map?.setCenter(acc.lat, acc.lon, 4);
        }, 300);
        break;
      }
      case 'exchange': {
        const exchange = result.data as typeof STOCK_EXCHANGES[0];
        this.map?.setView('global');
        this.map?.enableLayer('stockExchanges');
        this.mapLayers.stockExchanges = true;
        setTimeout(() => {
          this.map?.setCenter(exchange.lat, exchange.lon, 4);
        }, 300);
        break;
      }
      case 'financialcenter': {
        const fc = result.data as typeof FINANCIAL_CENTERS[0];
        this.map?.setView('global');
        this.map?.enableLayer('financialCenters');
        this.mapLayers.financialCenters = true;
        setTimeout(() => {
          this.map?.setCenter(fc.lat, fc.lon, 4);
        }, 300);
        break;
      }
      case 'centralbank': {
        const bank = result.data as typeof CENTRAL_BANKS[0];
        this.map?.setView('global');
        this.map?.enableLayer('centralBanks');
        this.mapLayers.centralBanks = true;
        setTimeout(() => {
          this.map?.setCenter(bank.lat, bank.lon, 4);
        }, 300);
        break;
      }
      case 'commodityhub': {
        const hub = result.data as typeof COMMODITY_HUBS[0];
        this.map?.setView('global');
        this.map?.enableLayer('commodityHubs');
        this.mapLayers.commodityHubs = true;
        setTimeout(() => {
          this.map?.setCenter(hub.lat, hub.lon, 4);
        }, 300);
        break;
      }
      case 'country': {
        const { code, name } = result.data as { code: string; name: string };
        trackCountrySelected(code, name, 'search');
        this.openCountryBriefByCode(code, name);
        break;
      }
    }
  }

  private scrollToPanel(panelId: string): void {
    const panel = document.querySelector(`[data-panel="${panelId}"]`);
    if (panel) {
      panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      panel.classList.add('flash-highlight');
      setTimeout(() => panel.classList.remove('flash-highlight'), 1500);
    }
  }

  private highlightNewsItem(itemId: string): void {
    setTimeout(() => {
      const item = document.querySelector(`[data-news-id="${itemId}"]`);
      if (item) {
        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
        item.classList.add('flash-highlight');
        setTimeout(() => item.classList.remove('flash-highlight'), 1500);
      }
    }, 100);
  }

  private updateSearchIndex(): void {
    if (!this.searchModal) return;

    // Keep country CII labels fresh with latest ingested signals.
    this.searchModal.registerSource('country', this.buildCountrySearchItems());

    // Update news sources (use link as unique id) - index up to 500 items for better search coverage
    const newsItems = this.dataLoader.allNews.slice(0, 500).map(n => ({
      id: n.link,
      title: n.title,
      subtitle: n.source,
      data: n,
    }));
    console.log(`[Search] Indexing ${newsItems.length} news items (allNews total: ${this.dataLoader.allNews.length})`);
    this.searchModal.registerSource('news', newsItems);

    // Update predictions if available
    if (this.dataLoader.latestPredictions.length > 0) {
      this.searchModal.registerSource('prediction', this.dataLoader.latestPredictions.map(p => ({
        id: p.title,
        title: p.title,
        subtitle: `${Math.round(p.yesPrice)}% probability`,
        data: p,
      })));
    }

    // Update markets if available
    if (this.dataLoader.latestMarkets.length > 0) {
      this.searchModal.registerSource('market', this.dataLoader.latestMarkets.map(m => ({
        id: m.symbol,
        title: `${m.symbol} - ${m.name}`,
        subtitle: `$${m.price?.toFixed(2) || 'N/A'}`,
        data: m,
      })));
    }
  }

  private buildCountrySearchItems(): { id: string; title: string; subtitle: string; data: { code: string; name: string } }[] {
    const panelScores = (this.panels['cii'] as CIIPanel | undefined)?.getScores() ?? [];
    const scores = panelScores.length > 0 ? panelScores : calculateCII();
    const ciiByCode = new Map(scores.map((score) => [score.code, score]));
    return Object.entries(TIER1_COUNTRIES).map(([code, name]) => {
      const score = ciiByCode.get(code);
      return {
        id: code,
        title: `${App.toFlagEmoji(code)} ${name}`,
        subtitle: score ? `CII: ${score.score}/100 • ${score.level}` : 'Country Brief',
        data: { code, name },
      };
    });
  }

  private static toFlagEmoji(code: string): string {
    const upperCode = code.toUpperCase();
    if (!/^[A-Z]{2}$/.test(upperCode)) return '🏳️';
    return upperCode
      .split('')
      .map((char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65))
      .join('');
  }

  private setupPlaybackControl(): void {
    this.playbackControl = new PlaybackControl();
    this.playbackControl.onSnapshot((snapshot) => {
      if (snapshot) {
        this.isPlaybackMode = true;
        this.restoreSnapshot(snapshot);
      } else {
        this.isPlaybackMode = false;
        this.dataLoader.loadAllData();
      }
    });

    const headerRight = this.container.querySelector('.header-right');
    if (headerRight) {
      headerRight.insertBefore(this.playbackControl.getElement(), headerRight.firstChild);
    }
  }

  private setupSnapshotSaving(): void {
    const saveCurrentSnapshot = async () => {
      if (this.isPlaybackMode || this.isDestroyed) return;

      const marketPrices: Record<string, number> = {};
      this.dataLoader.latestMarkets.forEach(m => {
        if (m.price !== null) marketPrices[m.symbol] = m.price;
      });

      await saveSnapshot({
        timestamp: Date.now(),
        events: this.dataLoader.latestClusters,
        marketPrices,
        predictions: this.dataLoader.latestPredictions.map(p => ({
          title: p.title,
          yesPrice: p.yesPrice
        })),
        hotspotLevels: this.map?.getHotspotLevels() ?? {}
      });
    };

    void saveCurrentSnapshot().catch((e) => console.warn('[Snapshot] save failed:', e));
    this.snapshotIntervalId = setInterval(() => void saveCurrentSnapshot().catch((e) => console.warn('[Snapshot] save failed:', e)), SNAPSHOT_INTERVAL_MS);
  }

  private restoreSnapshot(snapshot: import('@/services/storage').DashboardSnapshot): void {
    for (const panel of Object.values(this.newsPanels)) {
      panel.showLoading();
    }

    const events = snapshot.events as ClusteredEvent[];
    this.dataLoader.latestClusters = events;

    const predictions = snapshot.predictions.map((p, i) => ({
      id: `snap-${i}`,
      title: p.title,
      yesPrice: p.yesPrice,
      noPrice: 100 - p.yesPrice,
      volume24h: 0,
      liquidity: 0,
    }));
    this.dataLoader.latestPredictions = predictions;
    (this.panels['polymarket'] as PredictionPanel).renderPredictions(predictions);

    this.map?.setHotspotLevels(snapshot.hotspotLevels);
  }

  private renderLayout(): void {
    this.container.innerHTML = `
      <div class="header">
        <div class="header-left">
          <div class="variant-switcher" \${SITE_VARIANT === 'care' ? 'style="display: none !important;"' : ''}>
            <a href="${this.isDesktopApp ? '#' : (SITE_VARIANT === 'full' ? '#' : 'https://worldmonitor.app')}"
               class="variant-option ${SITE_VARIANT === 'full' ? 'active' : ''}"
               data-variant="full"
               ${!this.isDesktopApp && SITE_VARIANT !== 'full' ? 'target="_blank" rel="noopener"' : ''}
               title="${t('header.world')}${SITE_VARIANT === 'full' ? ` ${t('common.currentVariant')}` : ''}">
              <span class="variant-icon">🌍</span>
              <span class="variant-label">${t('header.world')}</span>
            </a>
            <span class="variant-divider"></span>
            <a href="${this.isDesktopApp ? '#' : (SITE_VARIANT === 'tech' ? '#' : 'https://tech.worldmonitor.app')}"
               class="variant-option ${SITE_VARIANT === 'tech' ? 'active' : ''}"
               data-variant="tech"
               ${!this.isDesktopApp && SITE_VARIANT !== 'tech' ? 'target="_blank" rel="noopener"' : ''}
               title="${t('header.tech')}${SITE_VARIANT === 'tech' ? ` ${t('common.currentVariant')}` : ''}">
              <span class="variant-icon">💻</span>
              <span class="variant-label">${t('header.tech')}</span>
            </a>
            <span class="variant-divider"></span>
            <a href="${this.isDesktopApp ? '#' : (SITE_VARIANT === 'finance' ? '#' : 'https://finance.worldmonitor.app')}"
               class="variant-option ${SITE_VARIANT === 'finance' ? 'active' : ''}"
               data-variant="finance"
               ${!this.isDesktopApp && SITE_VARIANT !== 'finance' ? 'target="_blank" rel="noopener"' : ''}
               title="${t('header.finance')}${SITE_VARIANT === 'finance' ? ` ${t('common.currentVariant')}` : ''}">
              <span class="variant-icon">📈</span>
              <span class="variant-label">${t('header.finance')}</span>
            </a>
            <span class="variant-divider"></span>
            <a href="${this.isDesktopApp ? '#' : (SITE_VARIANT === 'care' ? '#' : 'https://care.worldmonitor.app')}"
               class="variant-option ${SITE_VARIANT === 'care' ? 'active' : ''}"
               data-variant="care"
               ${!this.isDesktopApp && SITE_VARIANT !== 'care' ? 'target="_blank" rel="noopener"' : ''}
               title="Care${SITE_VARIANT === 'care' ? ` ${t('common.currentVariant')}` : ''}">
              <span class="variant-icon">🏥</span>
              <span class="variant-label">CARE</span>
            </a>
          </div>
          <span class="logo">MONITOR</span><span class="version">v${__APP_VERSION__}</span>${BETA_MODE ? '<span class="beta-badge">BETA</span>' : ''}
          <a href="https://x.com/eliehabib" target="_blank" rel="noopener" class="credit-link">
            <svg class="x-logo" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            <span class="credit-text">@eliehabib</span>
          </a>
          <a href="https://github.com/koala73/worldmonitor" target="_blank" rel="noopener" class="github-link" title="${t('header.viewOnGitHub')}">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
          </a>
          <div class="status-indicator">
            <span class="status-dot"></span>
            <span>${t('header.live')}</span>
          </div>
          <div class="region-selector" \${SITE_VARIANT === 'care' ? 'style="display: none !important;"' : ''}>
            <select id="regionSelect" class="region-select">
              <option value="global">${t('components.deckgl.views.global')}</option>
              <option value="america">${t('components.deckgl.views.americas')}</option>
              <option value="mena">${t('components.deckgl.views.mena')}</option>
              <option value="eu">${t('components.deckgl.views.europe')}</option>
              <option value="asia">${t('components.deckgl.views.asia')}</option>
              <option value="latam">${t('components.deckgl.views.latam')}</option>
              <option value="africa">${t('components.deckgl.views.africa')}</option>
              <option value="oceania">${t('components.deckgl.views.oceania')}</option>
            </select>
          </div>
        </div>
        <div class="header-right">
          <button class="search-btn" id="searchBtn"><kbd>⌘K</kbd> ${t('header.search')}</button>
          ${this.isDesktopApp ? '' : `<button class="copy-link-btn" id="copyLinkBtn">${t('header.copyLink')}</button>`}
          <button class="theme-toggle-btn" id="headerThemeToggle" title="${t('header.toggleTheme')}">
            ${getCurrentTheme() === 'dark'
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>'}
          </button>
          ${this.isDesktopApp ? '' : `<button class="fullscreen-btn" id="fullscreenBtn" title="${t('header.fullscreen')}">⛶</button>`}
          <button class="settings-btn" id="settingsBtn">⚙ ${t('header.settings')}</button>
          <button class="sources-btn" id="sourcesBtn">📡 ${t('header.sources')}</button>
        </div>
      </div>
      <div class="main-content">
        <div class="map-section" id="mapSection" \${SITE_VARIANT === 'care' ? 'style="display: none !important;"' : ''}>
          <div class="panel-header">
            <div class="panel-header-left">
              <span class="panel-title">${SITE_VARIANT === 'tech' ? t('panels.techMap') : SITE_VARIANT === 'care' ? 'Care Intelligence Map' : t('panels.map')}</span>
            </div>
            <span class="header-clock" id="headerClock"></span>
            <button class="map-pin-btn" id="mapPinBtn" title="${t('header.pinMap')}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V16a1 1 0 001 1h12a1 1 0 001-1v-.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V7a1 1 0 011-1 1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v1a1 1 0 001 1 1 1 0 011 1v3.76z"/>
              </svg>
            </button>
          </div>
          <div class="map-container" id="mapContainer"></div>
          <div class="map-resize-handle" id="mapResizeHandle"></div>
        </div>
        <div class="panels-grid" id="panelsGrid"></div>
      </div>
      <div class="modal-overlay" id="settingsModal">
        <div class="modal">
          <div class="modal-header">
            <span class="modal-title">${t('header.settings')}</span>
            <button class="modal-close" id="modalClose">×</button>
          </div>
          <div class="panel-toggle-grid" id="panelToggles"></div>
        </div>
      </div>
      <div class="modal-overlay" id="sourcesModal">
        <div class="modal sources-modal">
          <div class="modal-header">
            <span class="modal-title">${t('header.sources')}</span>
            <span class="sources-counter" id="sourcesCounter"></span>
            <button class="modal-close" id="sourcesModalClose">×</button>
          </div>
          <div class="sources-search">
            <input type="text" id="sourcesSearch" placeholder="${t('header.filterSources')}" />
          </div>
          <div class="sources-toggle-grid" id="sourceToggles"></div>
          <div class="sources-footer">
            <button class="sources-select-all" id="sourcesSelectAll">${t('common.selectAll')}</button>
            <button class="sources-select-none" id="sourcesSelectNone">${t('common.selectNone')}</button>
          </div>
        </div>
      </div>
    `;

    this.panelManager = new PanelManager({
      getMap: () => this.map,
      mapLayers: this.mapLayers,
      panelSettings: this.panelSettings,
      disabledSources: this.disabledSources,
      monitors: this.monitors,
      isMobile: this.isMobile,
      findingsBadge: this.findingsBadge,
      onMonitorsChanged: (monitors) => {
        this.monitors = monitors;
        saveToStorage(STORAGE_KEYS.monitors, monitors);
        this.dataLoader.updateMonitorResults();
      },
      onRelatedAssetClick: (asset) => this.handleRelatedAssetClick(asset),
      onRelatedAssetsFocus: (assets) => this.map?.highlightAssets(assets),
      onRelatedAssetsClear: () => this.map?.highlightAssets(null),
      onShareStory: (code, name) => this.openCountryStory(code, name),
      onLocationClick: (lat, lon, zoom) => {
        this.map?.setCenter(lat, lon, zoom);
      },
    });
    this.map = this.panelManager.createPanels();
    this.dataLoader.currentTimeRange = this.map.getTimeRange();
    this.map.onTimeRangeChanged((range) => {
      this.dataLoader.currentTimeRange = range;
      this.applyTimeRangeFilterToNewsPanelsDebounced();
    });
    // Sync panel/news references from PanelManager
    this.panels = this.panelManager.panels as Record<string, Panel>;
    this.newsPanels = this.panelManager.newsPanels as Record<string, NewsPanel>;
    this.applyInitialUrlState();
    this.panelManager.renderPanelToggles();
  }

  /**
   * Render critical military posture banner when buildup detected
   */
  private renderCriticalBanner(postures: TheaterPostureSummary[]): void {
    if (SITE_VARIANT === 'care') return;

    if (this.isMobile) {
      if (this.criticalBannerEl) {
        this.criticalBannerEl.remove();
        this.criticalBannerEl = null;
      }
      document.body.classList.remove('has-critical-banner');
      return;
    }

    // Check if banner was dismissed this session
    const dismissedAt = sessionStorage.getItem('banner-dismissed');
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < BANNER_DISMISS_DURATION_MS) {
      return; // Stay dismissed for 30 minutes
    }

    const critical = postures.filter(
      (p) => p.postureLevel === 'critical' || (p.postureLevel === 'elevated' && p.strikeCapable)
    );

    if (critical.length === 0) {
      if (this.criticalBannerEl) {
        this.criticalBannerEl.remove();
        this.criticalBannerEl = null;
        document.body.classList.remove('has-critical-banner');
      }
      return;
    }

    const top = critical[0]!;
    const isCritical = top.postureLevel === 'critical';

    if (!this.criticalBannerEl) {
      this.criticalBannerEl = document.createElement('div');
      this.criticalBannerEl.className = 'critical-posture-banner';
      const header = document.querySelector('.header');
      if (header) header.insertAdjacentElement('afterend', this.criticalBannerEl);
    }

    // Always ensure body class is set when showing banner
    document.body.classList.add('has-critical-banner');
    this.criticalBannerEl.className = `critical-posture-banner ${isCritical ? 'severity-critical' : 'severity-elevated'}`;
    this.criticalBannerEl.innerHTML = `
      <div class="banner-content">
        <span class="banner-icon">${isCritical ? '🚨' : '⚠️'}</span>
        <span class="banner-headline">${escapeHtml(top.headline)}</span>
        <span class="banner-stats">${top.totalAircraft} aircraft • ${escapeHtml(top.summary)}</span>
        ${top.strikeCapable ? '<span class="banner-strike">STRIKE CAPABLE</span>' : ''}
      </div>
      <button class="banner-view" data-lat="${top.centerLat}" data-lon="${top.centerLon}">View Region</button>
      <button class="banner-dismiss">×</button>
    `;

    // Event handlers
    this.criticalBannerEl.querySelector('.banner-view')?.addEventListener('click', () => {
      console.log('[Banner] View Region clicked:', top.theaterId, 'lat:', top.centerLat, 'lon:', top.centerLon);
      trackCriticalBannerAction('view', top.theaterId);
      // Use typeof check - truthy check would fail for coordinate 0
      if (typeof top.centerLat === 'number' && typeof top.centerLon === 'number') {
        this.map?.setCenter(top.centerLat, top.centerLon, 4);
      } else {
        console.error('[Banner] Missing coordinates for', top.theaterId);
      }
    });

    this.criticalBannerEl.querySelector('.banner-dismiss')?.addEventListener('click', () => {
      trackCriticalBannerAction('dismiss', top.theaterId);
      this.criticalBannerEl?.classList.add('dismissed');
      document.body.classList.remove('has-critical-banner');
      sessionStorage.setItem('banner-dismissed', Date.now().toString());
    });
  }

  /**
   * Clean up resources (for HMR/testing)
   */
  public destroy(): void {
    this.isDestroyed = true;

    // Clear snapshot saving interval
    if (this.snapshotIntervalId) {
      clearInterval(this.snapshotIntervalId);
      this.snapshotIntervalId = null;
    }

    // Clean up UpdateChecker
    this.updateChecker?.destroy();
    this.updateChecker = null;

    if (this.clockIntervalId) {
      clearInterval(this.clockIntervalId);
      this.clockIntervalId = null;
    }

    // Clean up DataLoader (clears all refresh timeouts)
    this.dataLoader?.destroy();

    // Remove global event listeners
    if (this.boundKeydownHandler) {
      document.removeEventListener('keydown', this.boundKeydownHandler);
      this.boundKeydownHandler = null;
    }
    // Clean up EventManager (fullscreen, resize, visibility, idle, desktop link handlers)
    this.eventManager?.destroy();
    this.eventManager = null;

    // Clean up panel manager (drag listeners, intersection observer, etc.)
    this.panelManager?.destroy();
    this.panelManager = null;

    // Clean up map and AIS
    this.map?.destroy();
    disconnectAisStream();
  }

  private applyInitialUrlState(): void {
    if (!this.initialUrlState || !this.map) return;

    const { view, zoom, lat, lon, timeRange, layers } = this.initialUrlState;

    if (view) {
      this.map.setView(view);
    }

    if (timeRange) {
      this.map.setTimeRange(timeRange);
    }

    if (layers) {
      this.mapLayers = layers;
      saveToStorage(STORAGE_KEYS.mapLayers, this.mapLayers);
      this.map.setLayers(layers);
    }

    // Only apply custom lat/lon/zoom if NO view preset is specified
    // When a view is specified (eu, mena, etc.), use the preset's positioning
    if (!view) {
      if (zoom !== undefined) {
        this.map.setZoom(zoom);
      }

      // Only apply lat/lon if user has zoomed in significantly (zoom > 2)
      // At default zoom (~1-1.5), show centered global view to avoid clipping issues
      if (lat !== undefined && lon !== undefined && zoom !== undefined && zoom > 2) {
        this.map.setCenter(lat, lon);
      }
    }

    // Sync header region selector with initial view
    const regionSelect = document.getElementById('regionSelect') as HTMLSelectElement;
    const currentView = this.map.getState().view;
    if (regionSelect && currentView) {
      regionSelect.value = currentView;
    }
  }

  private handleRelatedAssetClick(asset: RelatedAsset): void {
    if (!this.map) return;

    switch (asset.type) {
      case 'pipeline':
        this.map.enableLayer('pipelines');
        this.mapLayers.pipelines = true;
        saveToStorage(STORAGE_KEYS.mapLayers, this.mapLayers);
        this.map.triggerPipelineClick(asset.id);
        break;
      case 'cable':
        this.map.enableLayer('cables');
        this.mapLayers.cables = true;
        saveToStorage(STORAGE_KEYS.mapLayers, this.mapLayers);
        this.map.triggerCableClick(asset.id);
        break;
      case 'datacenter':
        this.map.enableLayer('datacenters');
        this.mapLayers.datacenters = true;
        saveToStorage(STORAGE_KEYS.mapLayers, this.mapLayers);
        this.map.triggerDatacenterClick(asset.id);
        break;
      case 'base':
        this.map.enableLayer('bases');
        this.mapLayers.bases = true;
        saveToStorage(STORAGE_KEYS.mapLayers, this.mapLayers);
        this.map.triggerBaseClick(asset.id);
        break;
      case 'nuclear':
        this.map.enableLayer('nuclear');
        this.mapLayers.nuclear = true;
        saveToStorage(STORAGE_KEYS.mapLayers, this.mapLayers);
        this.map.triggerNuclearClick(asset.id);
        break;
    }
  }

}
