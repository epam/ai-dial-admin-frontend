import { getErrorNotification, getNotification, getPrepareNotification, getSuccessNotification } from '../notification';
import { NotificationType } from '@/src/models/notification';

describe('Utils :: getErrorNotification', () => {
  it('Should return error notification', () => {
    const result = getErrorNotification('header', 'description', null);
    expect(result).toEqual({
      type: NotificationType.error,
      title: 'header',
      description: 'description',
      duration: null,
    });
  });

  it('Should return empty error notification with duration 12', () => {
    const result = getErrorNotification(void 0, void 0, 12);
    expect(result).toEqual({
      type: NotificationType.error,
      title: '',
      description: '',
      duration: 12,
    });
  });

  it('Should return empty error notification with duration 12', () => {
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
  it('Should return success notification', () => {
    const result = getPrepareNotification('header', 'description', null);
    expect(result).toEqual({
      type: NotificationType.prepare,
      title: 'header',
      description: 'description',
      duration: null,
    });
  });

  it('Should return empty success notification with duration 12', () => {
    const result = getPrepareNotification(void 0, void 0, 12);
    expect(result).toEqual({
      type: NotificationType.prepare,
      title: '',
      description: '',
      duration: 12,
    });
  });

  it('Should return empty success notification with duration 12', () => {
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
  it('Should return success notification', () => {
    const result = getSuccessNotification('header', 'description', null);
    expect(result).toEqual({
      type: NotificationType.success,
      title: 'header',
      description: 'description',
      duration: null,
    });
  });

  it('Should return empty success notification with duration 12', () => {
    const result = getSuccessNotification(void 0, void 0, 12);
    expect(result).toEqual({
      type: NotificationType.success,
      title: '',
      description: '',
      duration: 12,
    });
  });

  it('Should return empty success notification with duration 12', () => {
    const result = getSuccessNotification(void 0, void 0, null);
    expect(result).toEqual({
      type: NotificationType.success,
      title: '',
      description: '',
      duration: null,
    });
  });
});

describe('Utils :: getNotification', () => {
  it('Should return empty success notification with duration 12', () => {
    const result = getNotification(NotificationType.success);
    expect(result).toEqual({
      type: NotificationType.success,
      title: '',
      description: '',
      duration: null,
    });
  });
});
