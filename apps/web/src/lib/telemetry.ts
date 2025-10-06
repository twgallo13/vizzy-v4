import { createFirebase, isUsingMocks } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
const fb = createFirebase();
const db = fb?.db as any;
const analytics = (fb as any)?.analytics ?? null;
import { logEvent as firebaseLogEvent } from 'firebase/analytics';

export interface TelemetryEvent {
  id?: string;
  event: string;
  payload: Record<string, unknown>;
  outcome: 'ok' | 'error' | 'warning';
  userId?: string;
  sessionId?: string;
  timestamp?: Date;
  userAgent?: string;
  url?: string;
  referrer?: string;
  metadata?: Record<string, unknown>;
}

export interface TelemetryConfig {
  enabled: boolean;
  sampleRate: number;
  batchSize: number;
  flushInterval: number;
}

const envAny = (import.meta as any).env || {};
const config: TelemetryConfig = {
  enabled: Boolean(envAny.PROD) || envAny.VITE_TELEMETRY_ENABLED === 'true',
  sampleRate: 1.0,
  batchSize: 10,
  flushInterval: 5000, // 5 seconds
};

let eventQueue: TelemetryEvent[] = [];
let flushTimer: NodeJS.Timeout | null = null;

// Initialize session tracking
const sessionId = generateSessionId();
const startTime = Date.now();

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function shouldSample(): boolean {
  return Math.random() < config.sampleRate;
}

function getBaseEvent(): Partial<TelemetryEvent> {
  const base: Partial<TelemetryEvent> = {
    sessionId,
    userAgent: navigator.userAgent,
    url: window.location.href,
  };
  if (document.referrer) {
    base.referrer = document.referrer;
  }
  return base;
}

export async function track(
  event: string,
  payload: Record<string, unknown> = {},
  outcome: 'ok' | 'error' | 'warning' = 'ok',
  metadata?: Record<string, unknown>
): Promise<void> {
  if (!config.enabled || !shouldSample()) {
    return;
  }

  const base = getBaseEvent();
  const telemetryEvent: TelemetryEvent = {
    ...base,
    event,
    payload,
    outcome,
    timestamp: new Date(),
  } as TelemetryEvent;
  if (metadata) {
    (telemetryEvent as any).metadata = metadata;
  }

  // Add to queue
  eventQueue.push(telemetryEvent);

  // Send to Firebase Analytics if available
  if (analytics && outcome === 'ok') {
    try {
      firebaseLogEvent(analytics as any, event, { ...payload, outcome });
    } catch (error) {
      console.warn('Failed to send event to Firebase Analytics:', error);
    }
  }

  // Auto-flush if queue is full
  if (eventQueue.length >= config.batchSize) {
    await flush();
  } else if (!flushTimer) {
    // Set timer for next flush
    flushTimer = setTimeout(flush, config.flushInterval);
  }
}

async function flush(): Promise<void> {
  if (eventQueue.length === 0) return;

  const eventsToSend = [...eventQueue];
  eventQueue = [];

  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  try {
    if (!isUsingMocks() && db) {
      // Batch write to Firestore when Firebase is active
      const batch = eventsToSend.map(event =>
        addDoc(collection(db, 'telemetry'), {
          ...event,
          timestamp: serverTimestamp(),
        })
      );
      await Promise.all(batch);
    }
    
    console.debug(`Flushed ${eventsToSend.length} telemetry events`);
  } catch (error) {
    console.error('Failed to flush telemetry events:', error);
    
    // Re-queue events on failure (with backoff)
    eventQueue.unshift(...eventsToSend);
    
    // Retry with exponential backoff
    setTimeout(() => {
      if (eventQueue.length > 0) {
        flush();
      }
    }, 5000);
  }
}

// Performance tracking
export function trackPerformance(
  name: string,
  duration: number,
  metadata?: Record<string, unknown>
): void {
  track('performance', {
    name,
    duration,
    ...metadata,
  });
}

// Error tracking
export function trackError(
  error: Error,
  context?: string,
  metadata?: Record<string, unknown>
): void {
  track('error', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    context,
    ...metadata,
  }, 'error');
}

// User action tracking
export function trackUserAction(
  action: string,
  target?: string,
  metadata?: Record<string, unknown>
): void {
  track('user_action', {
    action,
    target,
    ...metadata,
  });
}

// Page view tracking
export function trackPageView(
  path: string,
  title?: string,
  metadata?: Record<string, unknown>
): void {
  track('page_view', {
    path,
    title,
    ...metadata,
  });
}

// Route view tracking (explicit event per spec)
export function trackRouteView(path: string): void {
  track('route_view', { path });
}

// API call tracking
export function trackApiCall(
  endpoint: string,
  method: string,
  status: number,
  duration: number,
  metadata?: Record<string, unknown>
): void {
  track('api_call', {
    endpoint,
    method,
    status,
    duration,
    ...metadata,
  }, status >= 400 ? 'error' : 'ok');
}

// Feature usage tracking
export function trackFeatureUsage(
  feature: string,
  action: string,
  metadata?: Record<string, unknown>
): void {
  track('feature_usage', {
    feature,
    action,
    ...metadata,
  });
}

// Initialize telemetry on page load
if (typeof window !== 'undefined') {
  // Track initial page load
  trackPageView(window.location.pathname, document.title);
  
  // Track session duration on page unload
  window.addEventListener('beforeunload', () => {
    const sessionDuration = Date.now() - startTime;
    track('session_end', {
      duration: sessionDuration,
    });
    
    // Force flush on page unload
    flush();
  });
  
  // Track visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      track('page_hidden');
    } else {
      track('page_visible');
    }
  });
}

// Export configuration for testing
export { config };
