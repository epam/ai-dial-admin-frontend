import { NotificationType } from '@/src/models/notification';
import { describe, expect, test } from 'vitest';
import {
  getCopyToClipboardNotification,
  getErrorNotification,
  getNotification,
  getPrepareNotification,
  getSuccessNotification,
  toReadFailure,
} from '../notification';

describe('Utils :: getErrorNotification', () => {
  test('Should return error notification', () => {
    const result = getErrorNotification('header', 'description', void 0, null);
    expect(result).toEqual({
      type: NotificationType.error,
      title: 'header',
      description: 'description',
      duration: null,
    });
  });

  test('Should return empty error notification with duration 12', () => {
    const result = getErrorNotification(void 0, void 0, 'aaa', 12);
    expect(result).toEqual({
      type: NotificationType.error,
      title: '',
      description: '',
      requestId: 'aaa',
      duration: 12,
    });
  });

  test('Should return empty error notification with duration 12', () => {
    const result = getErrorNotification();
    expect(result).toEqual({
      type: NotificationType.error,
      title: '',
      description: '',
      duration: null,
    });
  });
});

describe('Utils :: getPrepareNotification', () => {
  test('Should return error notification', () => {
    const result = getPrepareNotification('header', 'description', null);
    expect(result).toEqual({
      type: NotificationType.prepare,
      title: 'header',
      description: 'description',
      duration: null,
    });
  });

  test('Should return empty error notification with duration 12', () => {
    const result = getPrepareNotification(void 0, void 0, 12);
    expect(result).toEqual({
      type: NotificationType.prepare,
      title: '',
      description: '',
      duration: 12,
    });
  });

  test('Should return empty error notification', () => {
    const result = getPrepareNotification();
    expect(result).toEqual({
      type: NotificationType.prepare,
      title: '',
      description: '',
      duration: null,
    });
  });
});

describe('Utils :: getSuccessNotification', () => {
  test('Should return success notification', () => {
    const result = getSuccessNotification('header', 'description', null);
    expect(result).toEqual({
      type: NotificationType.success,
      title: 'header',
      description: 'description',
      duration: null,
    });
  });

  test('Should return empty success notification with duration 12', () => {
    const result = getSuccessNotification(void 0, void 0, 12);
    expect(result).toEqual({
      type: NotificationType.success,
      title: '',
      description: '',
      duration: 12,
    });
  });

  test('Should return empty success notification', () => {
    const result = getSuccessNotification(void 0, void 0, null);
    expect(result).toEqual({
      type: NotificationType.success,
      title: '',
      description: '',
      duration: null,
    });
  });
});

describe('Utils :: getCopyToClipboardNotification', () => {
  test('Should return success notification with a customTitle element', () => {
    const result = getCopyToClipboardNotification('Copied!');
    expect(result).toMatchObject({
      type: NotificationType.success,
      customTitle: 'Copied!',
    });
    expect(result.customTitle).toBeDefined();
  });
});

describe('Utils :: getNotification', () => {
  test('Should return empty notification', () => {
    const result = getNotification(NotificationType.success);
    expect(result).toEqual({
      type: NotificationType.success,
      title: '',
      description: '',
    });
  });
});

describe('Utils :: toReadFailure', () => {
  test('Should narrow an unsuccessful response to its reportable members', () => {
    const result = toReadFailure({
      success: false,
      status: 503,
      errorHeader: 'Upstream unavailable',
      errorMessage: 'registry timed out',
      requestId: 'trace-1',
      etag: 'ignored',
    });
    expect(result).toEqual({
      errorHeader: 'Upstream unavailable',
      errorMessage: 'registry timed out',
      requestId: 'trace-1',
    });
  });

  test('Should return a failure with no words when there is no response', () => {
    expect(toReadFailure()).toEqual({
      errorHeader: void 0,
      errorMessage: void 0,
      requestId: void 0,
    });
  });
});
