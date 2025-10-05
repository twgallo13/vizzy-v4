import { describe, it, expect, vi, beforeEach } from 'vitest';
import { track, trackError, trackUserAction, trackPageView } from '@/lib/telemetry';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  addDoc: vi.fn(() => Promise.resolve({ id: 'mock-id' })),
  serverTimestamp: vi.fn(() => ({})),
}));

// Mock analytics
vi.mock('@/app/init', () => ({
  analytics: {
    logEvent: vi.fn(),
  },
}));

describe('Telemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('track', () => {
    it('tracks events successfully', async () => {
      const { addDoc } = await import('firebase/firestore');
      
      await track('test_event', { key: 'value' });
      
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          event: 'test_event',
          payload: { key: 'value' },
          outcome: 'ok',
        })
      );
    });

    it('tracks events with error outcome', async () => {
      const { addDoc } = await import('firebase/firestore');
      
      await track('test_event', { error: 'test error' }, 'error');
      
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          event: 'test_event',
          payload: { error: 'test error' },
          outcome: 'error',
        })
      );
    });
  });

  describe('trackError', () => {
    it('tracks errors with proper format', async () => {
      const { addDoc } = await import('firebase/firestore');
      const error = new Error('Test error');
      
      trackError(error, 'test_context');
      
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          event: 'error',
          payload: expect.objectContaining({
            message: 'Test error',
            name: 'Error',
            context: 'test_context',
          }),
          outcome: 'error',
        })
      );
    });
  });

  describe('trackUserAction', () => {
    it('tracks user actions', async () => {
      const { addDoc } = await import('firebase/firestore');
      
      trackUserAction('button_click', 'test_button');
      
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          event: 'user_action',
          payload: expect.objectContaining({
            action: 'button_click',
            target: 'test_button',
          }),
          outcome: 'ok',
        })
      );
    });
  });

  describe('trackPageView', () => {
    it('tracks page views', async () => {
      const { addDoc } = await import('firebase/firestore');
      
      trackPageView('/test-page', 'Test Page');
      
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          event: 'page_view',
          payload: expect.objectContaining({
            path: '/test-page',
            title: 'Test Page',
          }),
          outcome: 'ok',
        })
      );
    });
  });
});
