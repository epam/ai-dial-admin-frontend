import { NotificationType } from '@/src/models/notification';
import { describe, expect, test } from 'vitest';
import { getCopyToClipboardNotification, getErrorNotification, getNotification, getPrepareNotification, getSuccessNotification } from '../notification';

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
  test('Should return success notification with disableTitleTruncate set to true', () => {
    const result = getCopyToClipboardNotification('Copied!');
    expect(result).toEqual({
      type: NotificationType.success,
      title: 'Copied!',
      description: '',
      disableTitleTruncate: true,
    });
  });

  test('Should return notification with the provided title', () => {
    const result = getCopyToClipboardNotification('https://example.com/very/long/url');
    expect(result).toEqual({
      type: NotificationType.success,
      title: 'https://example.com/very/long/url',
      description: '',
      disableTitleTruncate: true,
    });
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
