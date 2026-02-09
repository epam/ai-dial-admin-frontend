import { JSONEditorError, JSONEditorErrorNotification } from '@/src/types/editor';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { clearResolvedErrors } from '../utils';

describe('clearResolvedErrors', () => {
  let mockRemoveNotification: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRemoveNotification = vi.fn();
  });

  test('should remove notification when error is resolved', () => {
    const errorNotifications: JSONEditorErrorNotification[] = [
      {
        id: 'notif-1',
        message: 'Syntax error',
        startLineNumber: 5,
      },
    ];
    const errors: JSONEditorError[] = [];

    clearResolvedErrors(errorNotifications, mockRemoveNotification, errors);

    expect(mockRemoveNotification).toHaveBeenCalledWith('notif-1');
    expect(mockRemoveNotification).toHaveBeenCalledTimes(1);
  });

  test('should not remove notification when error still persists', () => {
    const errorNotifications: JSONEditorErrorNotification[] = [
      {
        id: 'notif-1',
        message: 'Syntax error',
        startLineNumber: 5,
      },
    ];
    const errors: JSONEditorError[] = [
      {
        message: 'Syntax error',
        startLineNumber: 5,
        endLineNumber: 5,
        startColumn: 1,
        endColumn: 10,
        severity: 8,
      },
    ];

    clearResolvedErrors(errorNotifications, mockRemoveNotification, errors);

    expect(mockRemoveNotification).not.toHaveBeenCalled();
  });
});
