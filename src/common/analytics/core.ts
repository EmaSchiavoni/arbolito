// Analítica de uso anónima (Umami, sin cookies) para mejorar la app.
// El tracker se carga desde index.html; este módulo es el único punto de
// entrada para emitir eventos: cola mientras el script carga, opt-out,
// filtro de automatización y propiedades tipadas.
//
// Reglas:
// - Nunca enviar claves ni contenido de los árboles (solo cantidades/rótulos).
// - Los nombres de evento son estables y pocos; la variación va en propiedades.

export type AnalyticsValue = string | number | boolean;
export type AnalyticsData = Record<string, AnalyticsValue | null | undefined>;

export type NavSource = 'landing' | 'footer' | 'header' | 'direct' | 'internal';

interface UmamiTracker {
  track: (event: string, data?: AnalyticsData) => void | Promise<unknown>;
}

declare global {
  interface Window {
    umami?: UmamiTracker;
  }
}

const OPT_OUT_KEY = 'arboles:analytics-opt-out';
const PENDING_NAV_TTL_MS = 1500;
const MAX_QUEUE = 50;
const FLUSH_INTERVAL_MS = 500;
const MAX_FLUSH_ATTEMPTS = 20;

const queue: Array<{ event: string; data?: AnalyticsData }> = [];
const lastSentAt = new Map<string, number>();

let enabled: boolean | null = null;
let flushTimer: number | null = null;
let flushAttempts = 0;
let pendingNav: { source: NavSource; at: number } | null = null;
let visitedRoute = false;

function clean(data?: AnalyticsData): AnalyticsData | undefined {
  if (!data) return undefined;
  const out: AnalyticsData = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) out[key] = value;
  }
  return out;
}

function resolveEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  // Los navegadores automatizados (CI, capturas, bots) no cuentan como uso real.
  if (window.navigator.webdriver) return false;
  try {
    if (new URLSearchParams(window.location.search).get('no-track') === '1') {
      window.localStorage.setItem(OPT_OUT_KEY, '1');
      return false;
    }
    return window.localStorage.getItem(OPT_OUT_KEY) !== '1';
  } catch {
    return true;
  }
}

export function isAnalyticsEnabled(): boolean {
  if (enabled === null) enabled = resolveEnabled();
  return enabled;
}

export function optOutAnalytics(): void {
  enabled = false;
  try {
    window.localStorage.setItem(OPT_OUT_KEY, '1');
  } catch {
  }
}

function flushQueue(): boolean {
  const tracker = window.umami;
  if (!tracker?.track) return false;
  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) break;
    try {
      tracker.track(item.event, item.data);
    } catch {
      // Un evento fallido no debe romper la app.
    }
  }
  return true;
}

function scheduleFlush(): void {
  if (flushTimer !== null || flushAttempts >= MAX_FLUSH_ATTEMPTS) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    flushAttempts += 1;
    if (!flushQueue()) scheduleFlush();
  }, FLUSH_INTERVAL_MS);
}

export function track(event: string, data?: AnalyticsData): void {
  if (!isAnalyticsEnabled()) return;
  const payload = clean(data);
  if (window.umami?.track) {
    try {
      window.umami.track(event, payload);
    } catch {
    }
    return;
  }
  if (queue.length >= MAX_QUEUE) queue.shift();
  queue.push({ event, data: payload });
  scheduleFlush();
}

export function trackOnce(key: string, event: string, data?: AnalyticsData): void {
  if (!isAnalyticsEnabled()) return;
  const storageKey = `arboles:analytics:${key}`;
  try {
    if (window.sessionStorage.getItem(storageKey) === '1') return;
    window.sessionStorage.setItem(storageKey, '1');
  } catch {
  }
  track(event, data);
}

export function trackThrottled(key: string, event: string, data?: AnalyticsData, ms = 2000): void {
  const now = Date.now();
  const previous = lastSentAt.get(key) ?? 0;
  if (now - previous < ms) return;
  lastSentAt.set(key, now);
  track(event, data);
}

export function trackUi(action: string, data?: AnalyticsData): void {
  track('ui_action', { action, ...data });
}

export function trackConfig(setting: string, value: AnalyticsValue, extra?: AnalyticsData): void {
  track('config_change', { setting, value, ...extra });
}

export function trackOutbound(destination: string, location: string): void {
  track('outbound_click', { destination, location });
}

export function trackLandingCta(target: string, location: string): void {
  track('landing_cta', { target, location });
}

export function setNavSource(source: NavSource): void {
  pendingNav = { source, at: Date.now() };
}

/**
 * Consume el origen pendiente. Si no hubo navegación explícita, distingue
 * la primera ruta (deep link / recarga) de las internas (atrás/adelante).
 */
export function takeNavSource(): NavSource {
  const fresh = pendingNav && Date.now() - pendingNav.at < PENDING_NAV_TTL_MS ? pendingNav.source : null;
  pendingNav = null;
  const source = fresh ?? (visitedRoute ? 'internal' : 'direct');
  visitedRoute = true;
  return source;
}

export function initAnalytics(): void {
  if (typeof window === 'undefined') return;
  if (document.readyState === 'complete') {
    flushQueue();
    return;
  }
  window.addEventListener('load', () => flushQueue(), { once: true });
}
