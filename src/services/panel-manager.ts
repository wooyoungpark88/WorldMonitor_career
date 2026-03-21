import type { PanelConfig, MapLayers, RelatedAsset } from '@/types';
import {
  FEEDS,
  INTEL_SOURCES,
  DEFAULT_PANELS,
  STORAGE_KEYS,
  SITE_VARIANT,
} from '@/config';
import { saveToStorage } from '@/utils';
import { escapeHtml } from '@/utils/sanitize';
import { focusInvestmentOnMap } from '@/services/investments-focus';
import { isDesktopRuntime } from '@/services/runtime';
import { t } from '@/services/i18n';
import { trackPanelView, trackPanelToggled } from '@/services/analytics';
import {
  MapContainer,
  NewsPanel,
  MarketPanel,
  HeatmapPanel,
  CommoditiesPanel,
  CryptoPanel,
  PredictionPanel,
  MonitorPanel,
  Panel,
  EconomicPanel,
  GdeltIntelPanel,
  LiveNewsPanel,
  LiveWebcamsPanel,
  CIIPanel,
  CascadePanel,
  StrategicRiskPanel,
  StrategicPosturePanel,
  IntelligenceGapBadge,
  TechEventsPanel,
  ServiceStatusPanel,
  RuntimeConfigPanel,
  InsightsPanel,
  TechReadinessPanel,
  MacroSignalsPanel,
  ETFFlowsPanel,
  StablecoinPanel,
  UcdpEventsPanel,
  DisplacementPanel,
  ClimateAnomalyPanel,
  PopulationExposurePanel,
  InvestmentsPanel,
  MarketPulsePanel,
  OpportunityRadarPanel,
  FinancialGymPanel,
  DailyBriefPanel,
} from '@/components';
import { SatelliteFiresPanel } from '@/components/SatelliteFiresPanel';
import type { Monitor } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PanelManagerDeps {
  /** The map instance (set after createPanels initialises it). */
  getMap: () => MapContainer | null;
  /** Current map layers (mutable reference owned by App). */
  mapLayers: MapLayers;
  /** Panel visibility settings (mutable reference owned by App). */
  panelSettings: Record<string, PanelConfig>;
  /** Disabled RSS source names (mutable reference owned by App). */
  disabledSources: Set<string>;
  /** Active monitors list. */
  monitors: Monitor[];
  /** Whether running on mobile. */
  isMobile: boolean;
  /** Intelligence findings badge (desktop only). */
  findingsBadge: IntelligenceGapBadge | null;

  // Callbacks into App for cross-cutting concerns
  onMonitorsChanged: (monitors: Monitor[]) => void;
  onRelatedAssetClick: (asset: RelatedAsset) => void;
  onRelatedAssetsFocus: (assets: RelatedAsset[]) => void;
  onRelatedAssetsClear: () => void;
  onShareStory: (code: string, name: string) => void;
  onLocationClick: (lat: number, lon: number, zoom?: number) => void;
}

// ---------------------------------------------------------------------------
// PanelManager
// ---------------------------------------------------------------------------

export class PanelManager {
  private readonly PANEL_ORDER_KEY = 'panel-order';
  private readonly isDesktopApp = isDesktopRuntime();

  private _panels: Record<string, Panel> = {};
  private _newsPanels: Record<string, NewsPanel> = {};
  private panelDragCleanupHandlers: Array<() => void> = [];
  private viewTrackingObserver: IntersectionObserver | null = null;

  private deps: PanelManagerDeps;

  constructor(deps: PanelManagerDeps) {
    this.deps = deps;
  }

  // ---- Readonly accessors --------------------------------------------------

  get panels(): Readonly<Record<string, Panel>> {
    return this._panels;
  }

  get newsPanels(): Readonly<Record<string, NewsPanel>> {
    return this._newsPanels;
  }

  /** Mutable access for App (e.g. updating panel data). */
  getPanel(key: string): Panel | undefined {
    return this._panels[key];
  }

  getNewsPanel(key: string): NewsPanel | undefined {
    return this._newsPanels[key];
  }

  // ---- Panel creation ------------------------------------------------------

  /**
   * Create all panel instances and append them to `#panelsGrid`.
   * Also initialises `MapContainer` in `#mapContainer` and returns it so App
   * can store the reference.
   */
  createPanels(): MapContainer {
    const panelsGrid = document.getElementById('panelsGrid')!;

    // Initialise map
    const mapContainer = document.getElementById('mapContainer') as HTMLElement;
    const map = new MapContainer(mapContainer, {
      zoom: this.deps.isMobile ? 2.5 : 1.0,
      pan: { x: 0, y: 0 },
      view: this.deps.isMobile ? 'mena' : 'global',
      layers: this.deps.mapLayers,
      timeRange: '7d',
    });
    map.initEscalationGetters();

    // Helper: create a NewsPanel and register it
    const makeNewsPanel = (key: string, label: string): NewsPanel => {
      const panel = new NewsPanel(key, label);
      this.attachRelatedAssetHandlers(panel);
      this._newsPanels[key] = panel;
      this._panels[key] = panel;
      return panel;
    };

    // Core news panels
    makeNewsPanel('politics', t('panels.politics'));
    makeNewsPanel('tech', t('panels.tech'));
    makeNewsPanel('finance', t('panels.finance'));

    this._panels['heatmap'] = new HeatmapPanel();
    this._panels['markets'] = new MarketPanel();

    const monitorPanel = new MonitorPanel(this.deps.monitors);
    this._panels['monitors'] = monitorPanel;
    monitorPanel.onChanged((monitors) => {
      this.deps.onMonitorsChanged(monitors);
    });

    this._panels['commodities'] = new CommoditiesPanel();
    this._panels['polymarket'] = new PredictionPanel();

    makeNewsPanel('gov', t('panels.gov'));
    makeNewsPanel('intel', t('panels.intel'));

    this._panels['crypto'] = new CryptoPanel();

    makeNewsPanel('middleeast', t('panels.middleeast'));
    makeNewsPanel('layoffs', t('panels.layoffs'));
    makeNewsPanel('ai', t('panels.ai'));

    // Tech variant panels
    makeNewsPanel('startups', t('panels.startups'));
    makeNewsPanel('vcblogs', t('panels.vcblogs'));
    makeNewsPanel('regionalStartups', t('panels.regionalStartups'));
    makeNewsPanel('unicorns', t('panels.unicorns'));
    makeNewsPanel('accelerators', t('panels.accelerators'));
    makeNewsPanel('funding', t('panels.funding'));
    makeNewsPanel('producthunt', t('panels.producthunt'));
    makeNewsPanel('security', t('panels.security'));
    makeNewsPanel('policy', t('panels.policy'));
    makeNewsPanel('hardware', t('panels.hardware'));
    makeNewsPanel('cloud', t('panels.cloud'));
    makeNewsPanel('dev', t('panels.dev'));
    makeNewsPanel('github', t('panels.github'));
    makeNewsPanel('ipo', t('panels.ipo'));
    makeNewsPanel('thinktanks', t('panels.thinktanks'));

    this._panels['economic'] = new EconomicPanel();

    // Regional panels
    makeNewsPanel('africa', t('panels.africa'));
    makeNewsPanel('latam', t('panels.latam'));
    makeNewsPanel('asia', t('panels.asia'));
    makeNewsPanel('energy', t('panels.energy'));

    // Dynamic FEEDS panels
    for (const key of Object.keys(FEEDS)) {
      if (this._newsPanels[key]) continue;
      if (!Array.isArray((FEEDS as Record<string, unknown>)[key])) continue;
      const panelKey = this._panels[key] && !this._newsPanels[key] ? `${key}-news` : key;
      if (this._panels[panelKey]) continue;
      const panelConfig = DEFAULT_PANELS[panelKey] ?? DEFAULT_PANELS[key];
      const label = panelConfig?.name ?? key.charAt(0).toUpperCase() + key.slice(1);
      const panel = new NewsPanel(panelKey, label);
      this.attachRelatedAssetHandlers(panel);
      this._newsPanels[key] = panel;
      this._panels[panelKey] = panel;
    }

    // Geopolitical-only panels (full variant)
    if (SITE_VARIANT === 'full') {
      this._panels['gdelt-intel'] = new GdeltIntelPanel();

      const ciiPanel = new CIIPanel();
      ciiPanel.setShareStoryHandler((code, name) => {
        this.deps.onShareStory(code, name);
      });
      this._panels['cii'] = ciiPanel;

      this._panels['cascade'] = new CascadePanel();
      this._panels['satellite-fires'] = new SatelliteFiresPanel();

      const strategicRiskPanel = new StrategicRiskPanel();
      strategicRiskPanel.setLocationClickHandler((lat, lon) => {
        this.deps.onLocationClick(lat, lon, 4);
      });
      this._panels['strategic-risk'] = strategicRiskPanel;

      const strategicPosturePanel = new StrategicPosturePanel();
      strategicPosturePanel.setLocationClickHandler((lat, lon) => {
        console.log('[PanelManager] StrategicPosture handler called:', { lat, lon });
        this.deps.onLocationClick(lat, lon, 4);
      });
      this._panels['strategic-posture'] = strategicPosturePanel;

      const ucdpEventsPanel = new UcdpEventsPanel();
      ucdpEventsPanel.setEventClickHandler((lat, lon) => {
        this.deps.onLocationClick(lat, lon, 5);
      });
      this._panels['ucdp-events'] = ucdpEventsPanel;

      const displacementPanel = new DisplacementPanel();
      displacementPanel.setCountryClickHandler((lat, lon) => {
        this.deps.onLocationClick(lat, lon, 4);
      });
      this._panels['displacement'] = displacementPanel;

      const climatePanel = new ClimateAnomalyPanel();
      climatePanel.setZoneClickHandler((lat, lon) => {
        this.deps.onLocationClick(lat, lon, 4);
      });
      this._panels['climate'] = climatePanel;

      this._panels['population-exposure'] = new PopulationExposurePanel();
    }

    // GCC Investments Panel (finance variant)
    if (SITE_VARIANT === 'finance') {
      const investmentsPanel = new InvestmentsPanel((inv) => {
        focusInvestmentOnMap(this.deps.getMap(), this.deps.mapLayers, inv.lat, inv.lon);
      });
      this._panels['gcc-investments'] = investmentsPanel;
    }

    // Care Variant Panels
    if (SITE_VARIANT === 'care') {
      this._panels['marketPulse'] = new MarketPulsePanel();
      this._panels['opportunityRadar'] = new OpportunityRadarPanel();
      this._panels['financialGym'] = new FinancialGymPanel();
      this._panels['dailyBrief'] = new DailyBriefPanel();
    }

    this._panels['live-news'] = new LiveNewsPanel();
    this._panels['live-webcams'] = new LiveWebcamsPanel();
    this._panels['events'] = new TechEventsPanel('events');
    this._panels['service-status'] = new ServiceStatusPanel();

    if (this.isDesktopApp) {
      this._panels['runtime-config'] = new RuntimeConfigPanel({ mode: 'alert' });
    }

    this._panels['tech-readiness'] = new TechReadinessPanel();
    this._panels['macro-signals'] = new MacroSignalsPanel();
    this._panels['etf-flows'] = new ETFFlowsPanel();
    this._panels['stablecoins'] = new StablecoinPanel();
    this._panels['insights'] = new InsightsPanel();

    // Order and append to grid
    const defaultOrder = Object.keys(DEFAULT_PANELS).filter(k => k !== 'map');
    const savedOrder = this.getSavedPanelOrder();
    let panelOrder = defaultOrder;
    if (savedOrder.length > 0) {
      const missing = defaultOrder.filter(k => !savedOrder.includes(k));
      const valid = savedOrder.filter(k => defaultOrder.includes(k));
      const monitorsIdx = valid.indexOf('monitors');
      if (monitorsIdx !== -1) valid.splice(monitorsIdx, 1);
      const insertIdx = valid.indexOf('politics') + 1 || 0;
      const newPanels = missing.filter(k => k !== 'monitors');
      valid.splice(insertIdx, 0, ...newPanels);
      valid.push('monitors');
      panelOrder = valid;
    }

    // live-news MUST be first for CSS Grid layout (spans 2 columns)
    const liveNewsIdx = panelOrder.indexOf('live-news');
    if (liveNewsIdx > 0) {
      panelOrder.splice(liveNewsIdx, 1);
      panelOrder.unshift('live-news');
    }

    // live-webcams MUST follow live-news
    const webcamsIdx = panelOrder.indexOf('live-webcams');
    if (webcamsIdx !== -1 && webcamsIdx !== panelOrder.indexOf('live-news') + 1) {
      panelOrder.splice(webcamsIdx, 1);
      const afterNews = panelOrder.indexOf('live-news') + 1;
      panelOrder.splice(afterNews, 0, 'live-webcams');
    }

    // Desktop config stays near the top in Tauri builds
    if (this.isDesktopApp) {
      const runtimeIdx = panelOrder.indexOf('runtime-config');
      if (runtimeIdx > 1) {
        panelOrder.splice(runtimeIdx, 1);
        panelOrder.splice(1, 0, 'runtime-config');
      } else if (runtimeIdx === -1) {
        panelOrder.splice(1, 0, 'runtime-config');
      }
    }

    panelOrder.forEach((key: string) => {
      const panel = this._panels[key];
      if (panel) {
        const el = panel.getElement();
        this.makeDraggable(el, key);
        panelsGrid.appendChild(el);
      }
    });

    this.applyPanelSettings();

    return map;
  }

  // ---- Panel ordering ------------------------------------------------------

  getSavedPanelOrder(): string[] {
    try {
      const saved = localStorage.getItem(this.PANEL_ORDER_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  savePanelOrder(): void {
    const grid = document.getElementById('panelsGrid');
    if (!grid) return;
    const order = Array.from(grid.children)
      .map((el) => (el as HTMLElement).dataset.panel)
      .filter((key): key is string => !!key);
    localStorage.setItem(this.PANEL_ORDER_KEY, JSON.stringify(order));
  }

  // ---- Panel toggles (settings modal) --------------------------------------

  renderPanelToggles(): void {
    const container = document.getElementById('panelToggles')!;
    const panelHtml = Object.entries(this.deps.panelSettings)
      .filter(([key]) => key !== 'runtime-config' || this.isDesktopApp)
      .map(
        ([key, panel]) => `
        <div class="panel-toggle-item ${panel.enabled ? 'active' : ''}" data-panel="${key}">
          <div class="panel-toggle-checkbox">${panel.enabled ? '\u2713' : ''}</div>
          <span class="panel-toggle-label">${this.getLocalizedPanelName(key, panel.name)}</span>
        </div>
      `
      )
      .join('');

    const findingsHtml = this.deps.isMobile
      ? ''
      : (() => {
        const findingsEnabled = this.deps.findingsBadge?.isEnabled() ?? IntelligenceGapBadge.getStoredEnabledState();
        return `
      <div class="panel-toggle-item ${findingsEnabled ? 'active' : ''}" data-panel="intel-findings">
        <div class="panel-toggle-checkbox">${findingsEnabled ? '\u2713' : ''}</div>
        <span class="panel-toggle-label">Intelligence Findings</span>
      </div>
    `;
      })();

    container.innerHTML = panelHtml + findingsHtml;

    container.querySelectorAll('.panel-toggle-item').forEach((item) => {
      item.addEventListener('click', () => {
        const panelKey = (item as HTMLElement).dataset.panel!;

        if (panelKey === 'intel-findings') {
          if (!this.deps.findingsBadge) return;
          const newState = !this.deps.findingsBadge.isEnabled();
          this.deps.findingsBadge.setEnabled(newState);
          trackPanelToggled('intel-findings', newState);
          this.renderPanelToggles();
          return;
        }

        const config = this.deps.panelSettings[panelKey];
        console.log('[Panel Toggle] Clicked:', panelKey, 'Current enabled:', config?.enabled);
        if (config) {
          config.enabled = !config.enabled;
          trackPanelToggled(panelKey, config.enabled);
          console.log('[Panel Toggle] New enabled:', config.enabled);
          saveToStorage(STORAGE_KEYS.panels, this.deps.panelSettings);
          this.renderPanelToggles();
          this.applyPanelSettings();
          console.log('[Panel Toggle] After apply - config.enabled:', this.deps.panelSettings[panelKey]?.enabled);
        }
      });
    });
  }

  getLocalizedPanelName(panelKey: string, fallback: string): string {
    if (panelKey === 'runtime-config') {
      return t('modals.runtimeConfig.title');
    }
    const key = panelKey.replace(/-([a-z])/g, (_match, group: string) => group.toUpperCase());
    const lookup = `panels.${key}`;
    const localized = t(lookup);
    return localized === lookup ? fallback : localized;
  }

  applyPanelSettings(): void {
    Object.entries(this.deps.panelSettings).forEach(([key, config]) => {
      if (key === 'map') {
        const mapSection = document.getElementById('mapSection');
        if (mapSection) {
          mapSection.classList.toggle('hidden', !config.enabled);
        }
        return;
      }
      const panel = this._panels[key];
      panel?.toggle(config.enabled);
    });
  }

  // ---- Source toggles ------------------------------------------------------

  getAllSourceNames(): string[] {
    const sources = new Set<string>();
    Object.values(FEEDS).forEach(feeds => {
      if (feeds) feeds.forEach(f => sources.add(f.name));
    });
    INTEL_SOURCES.forEach(f => sources.add(f.name));
    return Array.from(sources).sort((a, b) => a.localeCompare(b));
  }

  renderSourceToggles(filter = ''): void {
    const container = document.getElementById('sourceToggles')!;
    const allSources = this.getAllSourceNames();
    const filterLower = filter.toLowerCase();
    const filteredSources = filter
      ? allSources.filter(s => s.toLowerCase().includes(filterLower))
      : allSources;

    container.innerHTML = filteredSources.map(source => {
      const isEnabled = !this.deps.disabledSources.has(source);
      const escaped = escapeHtml(source);
      return `
        <div class="source-toggle-item ${isEnabled ? 'active' : ''}" data-source="${escaped}">
          <div class="source-toggle-checkbox">${isEnabled ? '\u2713' : ''}</div>
          <span class="source-toggle-label">${escaped}</span>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.source-toggle-item').forEach(item => {
      item.addEventListener('click', () => {
        const sourceName = (item as HTMLElement).dataset.source!;
        if (this.deps.disabledSources.has(sourceName)) {
          this.deps.disabledSources.delete(sourceName);
        } else {
          this.deps.disabledSources.add(sourceName);
        }
        saveToStorage(STORAGE_KEYS.disabledFeeds, Array.from(this.deps.disabledSources));
        this.renderSourceToggles(filter);
      });
    });

    // Update counter
    const enabledCount = allSources.length - this.deps.disabledSources.size;
    const counterEl = document.getElementById('sourcesCounter');
    if (counterEl) {
      counterEl.textContent = t('header.sourcesEnabled', { enabled: String(enabledCount), total: String(allSources.length) });
    }
  }

  setupSourcesModal(): void {
    document.getElementById('sourcesBtn')?.addEventListener('click', () => {
      document.getElementById('sourcesModal')?.classList.add('active');
      const searchInput = document.getElementById('sourcesSearch') as HTMLInputElement | null;
      if (searchInput) searchInput.value = '';
      this.renderSourceToggles();
    });

    document.getElementById('sourcesModalClose')?.addEventListener('click', () => {
      document.getElementById('sourcesModal')?.classList.remove('active');
    });

    document.getElementById('sourcesModal')?.addEventListener('click', (e) => {
      if ((e.target as HTMLElement)?.classList?.contains('modal-overlay')) {
        document.getElementById('sourcesModal')?.classList.remove('active');
      }
    });

    document.getElementById('sourcesSearch')?.addEventListener('input', (e) => {
      const filter = (e.target as HTMLInputElement).value;
      this.renderSourceToggles(filter);
    });

    document.getElementById('sourcesSelectAll')?.addEventListener('click', () => {
      this.deps.disabledSources.clear();
      saveToStorage(STORAGE_KEYS.disabledFeeds, []);
      const filter = (document.getElementById('sourcesSearch') as HTMLInputElement)?.value || '';
      this.renderSourceToggles(filter);
    });

    document.getElementById('sourcesSelectNone')?.addEventListener('click', () => {
      const allSources = this.getAllSourceNames();
      this.deps.disabledSources = new Set(allSources);
      saveToStorage(STORAGE_KEYS.disabledFeeds, allSources);
      const filter = (document.getElementById('sourcesSearch') as HTMLInputElement)?.value || '';
      this.renderSourceToggles(filter);
    });
  }

  // ---- Panel dragging ------------------------------------------------------

  makeDraggable(el: HTMLElement, key: string): void {
    el.dataset.panel = key;
    let isDragging = false;
    let dragStarted = false;
    let startX = 0;
    let startY = 0;
    let rafId = 0;
    const DRAG_THRESHOLD = 8;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (el.dataset.resizing === 'true') return;
      if (target.classList?.contains('panel-resize-handle') || target.closest?.('.panel-resize-handle')) return;
      if (target.closest('button, a, input, select, textarea, .panel-content')) return;

      isDragging = true;
      dragStarted = false;
      startX = e.clientX;
      startY = e.clientY;
      e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      if (!dragStarted) {
        const dx = Math.abs(e.clientX - startX);
        const dy = Math.abs(e.clientY - startY);
        if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) return;
        dragStarted = true;
        el.classList.add('dragging');
      }
      const cx = e.clientX;
      const cy = e.clientY;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        this.handlePanelDragMove(el, cx, cy);
        rafId = 0;
      });
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      if (dragStarted) {
        el.classList.remove('dragging');
        this.savePanelOrder();
      }
      dragStarted = false;
    };

    el.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    this.panelDragCleanupHandlers.push(() => {
      el.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      isDragging = false;
      dragStarted = false;
      el.classList.remove('dragging');
    });
  }

  private handlePanelDragMove(dragging: HTMLElement, clientX: number, clientY: number): void {
    const grid = document.getElementById('panelsGrid');
    if (!grid) return;

    dragging.style.pointerEvents = 'none';
    const target = document.elementFromPoint(clientX, clientY);
    dragging.style.pointerEvents = '';

    if (!target) return;
    const targetPanel = target.closest('.panel') as HTMLElement | null;
    if (!targetPanel || targetPanel === dragging || targetPanel.classList.contains('hidden')) return;
    if (targetPanel.parentElement !== grid) return;

    const targetRect = targetPanel.getBoundingClientRect();
    const draggingRect = dragging.getBoundingClientRect();

    const children = Array.from(grid.children);
    const dragIdx = children.indexOf(dragging);
    const targetIdx = children.indexOf(targetPanel);
    if (dragIdx === -1 || targetIdx === -1) return;

    const sameRow = Math.abs(draggingRect.top - targetRect.top) < 30;
    const targetMid = sameRow
      ? targetRect.left + targetRect.width / 2
      : targetRect.top + targetRect.height / 2;
    const cursorPos = sameRow ? clientX : clientY;

    if (dragIdx < targetIdx) {
      if (cursorPos > targetMid) {
        grid.insertBefore(dragging, targetPanel.nextSibling);
      }
    } else {
      if (cursorPos < targetMid) {
        grid.insertBefore(dragging, targetPanel);
      }
    }
  }

  // ---- Panel view tracking -------------------------------------------------

  setupPanelViewTracking(): void {
    const viewedPanels = new Set<string>();
    this.viewTrackingObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
          const id = (entry.target as HTMLElement).dataset.panel;
          if (id && !viewedPanels.has(id)) {
            viewedPanels.add(id);
            trackPanelView(id);
          }
        }
      }
    }, { threshold: 0.3 });

    const grid = document.getElementById('panelsGrid');
    if (grid) {
      for (const child of Array.from(grid.children)) {
        if ((child as HTMLElement).dataset.panel) {
          this.viewTrackingObserver.observe(child);
        }
      }
    }
  }

  // ---- Related asset handlers (delegated to App) ---------------------------

  private attachRelatedAssetHandlers(panel: NewsPanel): void {
    panel.setRelatedAssetHandlers({
      onRelatedAssetClick: (asset) => this.deps.onRelatedAssetClick(asset),
      onRelatedAssetsFocus: (assets) => this.deps.onRelatedAssetsFocus(assets),
      onRelatedAssetsClear: () => this.deps.onRelatedAssetsClear(),
    });
  }

  // ---- Cleanup -------------------------------------------------------------

  destroy(): void {
    // Clean up drag listeners
    this.panelDragCleanupHandlers.forEach((cleanup) => cleanup());
    this.panelDragCleanupHandlers = [];

    // Disconnect intersection observer
    if (this.viewTrackingObserver) {
      this.viewTrackingObserver.disconnect();
      this.viewTrackingObserver = null;
    }
  }
}
