import { JSONEditorError, JSONEditorErrorNotification } from '@/src/types/editor';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { clearResolvedErrors, mergeWithIgnoredFields } from '../utils';

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

describe('mergeWithIgnoredFields', () => {
  test('should merge parsed into prev when no ignored fields', () => {
    const prev = { id: '1', name: 'original', version: '1.0' };
    const parsed = { id: '1', name: 'updated', version: '2.0' };

    const result = mergeWithIgnoredFields(prev, parsed);

    expect(result).toEqual({ id: '1', name: 'updated', version: '2.0' });
  });

  test('should preserve ignored fields from prev', () => {
    const prev = { id: 'abc', name: 'original', version: '1.0' };
    const parsed = { id: 'xyz', name: 'updated', version: '2.0' };

    const result = mergeWithIgnoredFields(prev, parsed, ['id']);

    expect(result).toEqual({ id: 'abc', name: 'updated', version: '2.0' });
  });

  test('should preserve multiple ignored fields', () => {
    const prev = { name: 'original', $type: 'mcp' as const, version: '1.0' };
    const parsed = { name: 'changed', $type: 'adapter' as const, version: '2.0' };

    const result = mergeWithIgnoredFields(prev, parsed, ['name', '$type']);

    expect(result).toEqual({ name: 'original', $type: 'mcp', version: '2.0' });
  });

  test('should handle undefined ignoredFields', () => {
    const prev = { id: '1', name: 'original' };
    const parsed = { id: '2', name: 'updated' };

    const result = mergeWithIgnoredFields(prev, parsed, undefined);

    expect(result).toEqual({ id: '2', name: 'updated' });
  });

  test('should handle empty ignoredFields array', () => {
    const prev = { id: '1', name: 'original' };
    const parsed = { id: '2', name: 'updated' };

    const result = mergeWithIgnoredFields(prev, parsed, []);

    expect(result).toEqual({ id: '2', name: 'updated' });
  });
});
