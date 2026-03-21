import { debounce, buildMapUrl, getCurrentTheme, setTheme } from '@/utils';
import type { MapContainer, MapView } from '@/components';
import type { PanelConfig } from '@/types';
import { STORAGE_KEYS, SITE_VARIANT } from '@/config';
import { mlWorker } from '@/services/ml-worker';
import { invokeTauri } from '@/services/tauri-bridge';
import { trackThemeChanged, trackMapViewChange, trackVariantSwitch } from '@/services/analytics';
import { changeLanguage } from '@/services/i18n';

/**
 * Callbacks that EventManager needs from the host App — keeps the dependency
 * direction one-way (EventManager never imports App).
 */
export interface EventManagerCallbacks {
  onSearchRequested: () => void;
  onSettingsOpen: () => void;
  onSettingsClose: () => void;
  onStoragePanelsChanged: (panels: Record<string, PanelConfig>) => void;
  onStorageFindingsChanged: (newValue: string | null) => void;
  onStorageLiveChannelsChanged: () => void;
  onSourcesModalOpen: () => void;
  onVariantSwitch: (variant: string) => void;
  onVisibilityReturn: () => void;
  onFocalPointsReady: () => void;
  onThemeChanged: () => void;
  getShareUrl: () => string | null;
  getMapState: () => { view: string; zoom: number; layers: Record<string, boolean>; timeRange: string };
  getMapCenter: () => { lat: number; lng: number };
  getCountryBriefInfo: () => { visible: boolean; code: string | null };
  renderMap: () => void;
}

export interface EventManagerDeps {
  container: HTMLElement;
  map: MapContainer | null;
  isDesktopApp: boolean;
  isMobile: boolean;
  callbacks: EventManagerCallbacks;
}

export class EventManager {
  private readonly container: HTMLElement;
  private map: MapContainer | null;
  private readonly isDesktopApp: boolean;
  private readonly cb: EventManagerCallbacks;

  // Bound handlers for cleanup
  private boundFullscreenHandler: (() => void) | null = null;
  private boundResizeHandler: (() => void) | null = null;
  private boundVisibilityHandler: (() => void) | null = null;
  private boundDesktopExternalLinkHandler: ((e: MouseEvent) => void) | null = null;
  private boundIdleResetHandler: (() => void) | null = null;
  private boundStorageHandler: ((e: StorageEvent) => void) | null = null;
  private boundFocalPointsHandler: (() => void) | null = null;
  private boundThemeChangedHandler: (() => void) | null = null;

  // Idle state
  private idleTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private _isIdle = false;
  private readonly IDLE_PAUSE_MS = 2 * 60 * 1000; // 2 minutes
  private hiddenSince = 0;

  get isIdle(): boolean {
    return this._isIdle;
  }

  constructor(deps: EventManagerDeps) {
    this.container = deps.container;
    this.map = deps.map;
    this.isDesktopApp = deps.isDesktopApp;
    this.cb = deps.callbacks;
  }

  /** Attach a new map instance (e.g. after late initialisation). */
  setMap(map: MapContainer | null): void {
    this.map = map;
  }

  // ---------- Public API ----------

  setupEventListeners(): void {
    // Search button
    document.getElementById('searchBtn')?.addEventListener('click', () => {
      this.cb.onSearchRequested();
    });

    // Copy link button
    document.getElementById('copyLinkBtn')?.addEventListener('click', async () => {
      const shareUrl = this.getShareUrl();
      if (!shareUrl) return;
      const button = document.getElementById('copyLinkBtn');
      try {
        await this.copyToClipboard(shareUrl);
        this.setCopyLinkFeedback(button, 'Copied!');
      } catch (error) {
        console.warn('Failed to copy share link:', error);
        this.setCopyLinkFeedback(button, 'Copy failed');
      }
    });

    // Settings modal
    document.getElementById('settingsBtn')?.addEventListener('click', () => {
      document.getElementById('settingsModal')?.classList.add('active');
    });

    // Sync panel state when settings are changed in the separate settings window
    this.boundStorageHandler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.panels && e.newValue) {
        try {
          const panels = JSON.parse(e.newValue) as Record<string, PanelConfig>;
          this.cb.onStoragePanelsChanged(panels);
        } catch (_) {}
      }
      if (e.key === 'worldmonitor-intel-findings') {
        this.cb.onStorageFindingsChanged(e.newValue);
      }
      if (e.key === STORAGE_KEYS.liveChannels && e.newValue) {
        this.cb.onStorageLiveChannelsChanged();
      }
    };
    window.addEventListener('storage', this.boundStorageHandler);

    document.getElementById('modalClose')?.addEventListener('click', () => {
      document.getElementById('settingsModal')?.classList.remove('active');
    });

    document.getElementById('settingsModal')?.addEventListener('click', (e) => {
      if ((e.target as HTMLElement)?.classList?.contains('modal-overlay')) {
        document.getElementById('settingsModal')?.classList.remove('active');
      }
    });

    // Header theme toggle button
    document.getElementById('headerThemeToggle')?.addEventListener('click', () => {
      const next = getCurrentTheme() === 'dark' ? 'light' : 'dark';
      setTheme(next);
      this.updateHeaderThemeIcon();
      trackThemeChanged(next);
    });

    // Sources modal (delegated to host)
    this.cb.onSourcesModalOpen();

    // Variant switcher: switch variant locally on desktop (reload with new config)
    if (this.isDesktopApp) {
      this.container.querySelectorAll<HTMLAnchorElement>('.variant-option').forEach(link => {
        link.addEventListener('click', (e) => {
          const variant = link.dataset.variant;
          if (variant && variant !== SITE_VARIANT) {
            e.preventDefault();
            trackVariantSwitch(SITE_VARIANT, variant);
            localStorage.setItem('worldmonitor-variant', variant);
            window.location.reload();
          }
        });
      });
    }

    // Fullscreen toggle
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (!this.isDesktopApp && fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
      this.boundFullscreenHandler = () => {
        fullscreenBtn.textContent = document.fullscreenElement ? '\u26F6' : '\u26F6';
        fullscreenBtn.classList.toggle('active', !!document.fullscreenElement);
      };
      document.addEventListener('fullscreenchange', this.boundFullscreenHandler);
    }

    // Region selector
    const regionSelect = document.getElementById('regionSelect') as HTMLSelectElement;
    regionSelect?.addEventListener('change', () => {
      this.map?.setView(regionSelect.value as MapView);
      trackMapViewChange(regionSelect.value);
    });

    // Language selector
    const langSelect = document.getElementById('langSelect') as HTMLSelectElement;
    langSelect?.addEventListener('change', () => {
      void changeLanguage(langSelect.value);
    });

    // Window resize
    this.boundResizeHandler = () => {
      this.map?.render();
    };
    window.addEventListener('resize', this.boundResizeHandler);

    // Map section resize handle
    this.setupMapResize();

    // Map pin toggle
    this.setupMapPin();

    // Pause animations when tab is hidden, unload ML models to free memory.
    // On return, flush any data refreshes that went stale while hidden.
    this.boundVisibilityHandler = () => {
      document.body.classList.toggle('animations-paused', document.hidden);
      if (document.hidden) {
        this.hiddenSince = this.hiddenSince || Date.now();
        mlWorker.unloadOptionalModels();
      } else {
        this.resetIdleTimer();
        this.cb.onVisibilityReturn();
      }
    };
    document.addEventListener('visibilitychange', this.boundVisibilityHandler);

    // Refresh CII when focal points are ready
    this.boundFocalPointsHandler = () => {
      this.cb.onFocalPointsReady();
    };
    window.addEventListener('focal-points-ready', this.boundFocalPointsHandler);

    // Re-render components with baked getCSSColor() values on theme change
    this.boundThemeChangedHandler = () => {
      this.map?.render();
      this.updateHeaderThemeIcon();
      this.cb.onThemeChanged();
    };
    window.addEventListener('theme-changed', this.boundThemeChangedHandler);

    // Desktop: intercept external link clicks and open in system browser.
    if (this.isDesktopApp) {
      if (this.boundDesktopExternalLinkHandler) {
        document.removeEventListener('click', this.boundDesktopExternalLinkHandler, true);
      }
      this.boundDesktopExternalLinkHandler = (e: MouseEvent) => {
        if (!(e.target instanceof Element)) return;
        const anchor = e.target.closest('a[href]') as HTMLAnchorElement | null;
        if (!anchor) return;
        const href = anchor.href;
        if (!href || href.startsWith('javascript:') || href === '#' || href.startsWith('#')) return;
        try {
          const url = new URL(href, window.location.href);
          if (url.origin === window.location.origin) return;
          e.preventDefault();
          e.stopPropagation();
          void invokeTauri<void>('open_url', { url: url.toString() }).catch(() => {
            window.open(url.toString(), '_blank');
          });
        } catch { /* malformed URL — let browser handle */ }
      };
      document.addEventListener('click', this.boundDesktopExternalLinkHandler, true);
    }

    // Idle detection - pause animations after 2 minutes of inactivity
    this.setupIdleDetection();
  }

  // ---------- Idle Detection ----------

  setupIdleDetection(): void {
    this.boundIdleResetHandler = () => {
      if (this._isIdle) {
        this._isIdle = false;
        document.body.classList.remove('animations-paused');
      }
      this.resetIdleTimer();
    };

    ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'].forEach(event => {
      document.addEventListener(event, this.boundIdleResetHandler!, { passive: true });
    });

    this.resetIdleTimer();
  }

  resetIdleTimer(): void {
    if (this.idleTimeoutId) {
      clearTimeout(this.idleTimeoutId);
    }
    this.idleTimeoutId = setTimeout(() => {
      if (!document.hidden) {
        this._isIdle = true;
        document.body.classList.add('animations-paused');
        console.log('[EventManager] User idle - pausing animations to save resources');
      }
    }, this.IDLE_PAUSE_MS);
  }

  // ---------- URL State Sync ----------

  setupUrlStateSync(): void {
    if (!this.map) return;
    const update = debounce(() => {
      const shareUrl = this.getShareUrl();
      if (!shareUrl) return;
      history.replaceState(null, '', shareUrl);
    }, 250);

    this.map.onStateChanged(() => {
      update();
      // Sync header region selector with map view
      const regionSelect = document.getElementById('regionSelect') as HTMLSelectElement;
      if (regionSelect && this.map) {
        const state = this.map.getState();
        if (regionSelect.value !== state.view) {
          regionSelect.value = state.view;
        }
      }
    });
    update();
  }

  getShareUrl(): string | null {
    if (!this.map) return null;
    const state = this.map.getState();
    const center = this.map.getCenter();
    const briefInfo = this.cb.getCountryBriefInfo();
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    return buildMapUrl(baseUrl, {
      view: state.view,
      zoom: state.zoom,
      center,
      timeRange: state.timeRange,
      layers: state.layers,
      country: briefInfo.visible ? (briefInfo.code ?? undefined) : undefined,
    });
  }

  // ---------- Clipboard Utilities ----------

  async copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  setCopyLinkFeedback(button: HTMLElement | null, message: string): void {
    if (!button) return;
    const originalText = button.textContent ?? '';
    button.textContent = message;
    button.classList.add('copied');
    window.setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove('copied');
    }, 1500);
  }

  // ---------- Fullscreen ----------

  toggleFullscreen(): void {
    if (document.fullscreenElement) {
      try { void document.exitFullscreen()?.catch(() => {}); } catch {}
    } else {
      const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
      if (el.requestFullscreen) {
        try { void el.requestFullscreen()?.catch(() => {}); } catch {}
      } else if (el.webkitRequestFullscreen) {
        try { el.webkitRequestFullscreen(); } catch {}
      }
    }
  }

  // ---------- Map Resize ----------

  setupMapResize(): void {
    const mapSection = document.getElementById('mapSection');
    const resizeHandle = document.getElementById('mapResizeHandle');
    if (!mapSection || !resizeHandle) return;

    const getMinHeight = () => (window.innerWidth >= 2000 ? 320 : 400);
    const getMaxHeight = () => Math.max(getMinHeight(), window.innerHeight - 60);

    // Load saved height
    const savedHeight = localStorage.getItem('map-height');
    if (savedHeight) {
      const numeric = Number.parseInt(savedHeight, 10);
      if (Number.isFinite(numeric)) {
        const clamped = Math.max(getMinHeight(), Math.min(numeric, getMaxHeight()));
        mapSection.style.height = `${clamped}px`;
        if (clamped !== numeric) {
          localStorage.setItem('map-height', `${clamped}px`);
        }
      } else {
        localStorage.removeItem('map-height');
      }
    }

    let isResizing = false;
    let startY = 0;
    let startHeight = 0;

    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startY = e.clientY;
      startHeight = mapSection.offsetHeight;
      mapSection.classList.add('resizing');
      document.body.style.cursor = 'ns-resize';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const deltaY = e.clientY - startY;
      const newHeight = Math.max(getMinHeight(), Math.min(startHeight + deltaY, getMaxHeight()));
      mapSection.style.height = `${newHeight}px`;
      this.map?.render();
    });

    document.addEventListener('mouseup', () => {
      if (!isResizing) return;
      isResizing = false;
      mapSection.classList.remove('resizing');
      document.body.style.cursor = '';
      localStorage.setItem('map-height', mapSection.style.height);
      this.map?.render();
    });
  }

  // ---------- Map Pin ----------

  setupMapPin(): void {
    const mapSection = document.getElementById('mapSection');
    const pinBtn = document.getElementById('mapPinBtn');
    if (!mapSection || !pinBtn) return;

    const isPinned = localStorage.getItem('map-pinned') === 'true';
    if (isPinned) {
      mapSection.classList.add('pinned');
      pinBtn.classList.add('active');
    }

    pinBtn.addEventListener('click', () => {
      const nowPinned = mapSection.classList.toggle('pinned');
      pinBtn.classList.toggle('active', nowPinned);
      localStorage.setItem('map-pinned', String(nowPinned));
    });
  }

  // ---------- Theme ----------

  updateHeaderThemeIcon(): void {
    const btn = document.getElementById('headerThemeToggle');
    if (!btn) return;
    const isDark = getCurrentTheme() === 'dark';
    btn.innerHTML = isDark
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
  }

  // ---------- hiddenSince accessor (used by App for stale refresh logic) ----------

  getHiddenSince(): number {
    return this.hiddenSince;
  }

  clearHiddenSince(): void {
    this.hiddenSince = 0;
  }

  // ---------- Cleanup ----------

  destroy(): void {
    if (this.boundFullscreenHandler) {
      document.removeEventListener('fullscreenchange', this.boundFullscreenHandler);
      this.boundFullscreenHandler = null;
    }
    if (this.boundResizeHandler) {
      window.removeEventListener('resize', this.boundResizeHandler);
      this.boundResizeHandler = null;
    }
    if (this.boundVisibilityHandler) {
      document.removeEventListener('visibilitychange', this.boundVisibilityHandler);
      this.boundVisibilityHandler = null;
    }
    if (this.boundDesktopExternalLinkHandler) {
      document.removeEventListener('click', this.boundDesktopExternalLinkHandler, true);
      this.boundDesktopExternalLinkHandler = null;
    }
    if (this.boundStorageHandler) {
      window.removeEventListener('storage', this.boundStorageHandler);
      this.boundStorageHandler = null;
    }
    if (this.boundFocalPointsHandler) {
      window.removeEventListener('focal-points-ready', this.boundFocalPointsHandler);
      this.boundFocalPointsHandler = null;
    }
    if (this.boundThemeChangedHandler) {
      window.removeEventListener('theme-changed', this.boundThemeChangedHandler);
      this.boundThemeChangedHandler = null;
    }
    if (this.idleTimeoutId) {
      clearTimeout(this.idleTimeoutId);
      this.idleTimeoutId = null;
    }
    if (this.boundIdleResetHandler) {
      ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'].forEach(event => {
        document.removeEventListener(event, this.boundIdleResetHandler!);
      });
      this.boundIdleResetHandler = null;
    }
  }
}
