import { describe, test, expect, beforeEach, vi } from 'vitest';
import { requestRegistry } from '../request-registry';

describe('RequestRegistry', () => {
  beforeEach(() => {
    // Clear registry before each test
    requestRegistry.cancelAll();
  });

  test('register creates and returns a new AbortController', () => {
    const controller = requestRegistry.register('test-request-1');

    expect(controller).toBeInstanceOf(AbortController);
    expect(controller.signal).toBeDefined();
    expect(controller.signal.aborted).toBe(false);
  });

  test('register adds controller to internal map', () => {
    const controller1 = requestRegistry.register('req-1');
    const controller2 = requestRegistry.register('req-2');

    // Both controllers should be tracked
    expect(controller1.signal.aborted).toBe(false);
    expect(controller2.signal.aborted).toBe(false);

    // Cancel all to verify both were tracked
    requestRegistry.cancelAll();
    expect(controller1.signal.aborted).toBe(true);
    expect(controller2.signal.aborted).toBe(true);
  });

  test('unregister removes controller from map', () => {
    const controller1 = requestRegistry.register('req-1');
    const controller2 = requestRegistry.register('req-2');

    requestRegistry.unregister('req-1');

    // Cancel all should only affect req-2
    requestRegistry.cancelAll();
    expect(controller1.signal.aborted).toBe(false);
    expect(controller2.signal.aborted).toBe(true);
  });

  test('cancelAll aborts all controllers', () => {
    const controller1 = requestRegistry.register('req-1');
    const controller2 = requestRegistry.register('req-2');
    const controller3 = requestRegistry.register('req-3');

    requestRegistry.cancelAll();

    expect(controller1.signal.aborted).toBe(true);
    expect(controller2.signal.aborted).toBe(true);
    expect(controller3.signal.aborted).toBe(true);
  });

  test('cancelAll clears the map', () => {
    requestRegistry.register('req-1');
    requestRegistry.register('req-2');

    requestRegistry.cancelAll();

    // Register a new controller after cancel
    const newController = requestRegistry.register('req-3');

    // Only the new controller should exist
    requestRegistry.cancelAll();
    expect(newController.signal.aborted).toBe(true);
  });

  test('cancelAll is idempotent (calling twice is safe)', () => {
    const controller = requestRegistry.register('req-1');

    requestRegistry.cancelAll();
    expect(controller.signal.aborted).toBe(true);

    // Second call should not throw
    expect(() => requestRegistry.cancelAll()).not.toThrow();
    expect(controller.signal.aborted).toBe(true);
  });

  test('abort signal can be used with fetch', async () => {
    const controller = requestRegistry.register('fetch-test');

    // Simulate aborting before fetch completes
    controller.abort();

    try {
      await fetch('https://example.com', { signal: controller.signal });
      expect.fail('Fetch should have thrown AbortError');
    } catch (error: any) {
      expect(error.name).toBe('AbortError');
    }

    requestRegistry.unregister('fetch-test');
  });
});
