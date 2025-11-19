import { describe, expect, test } from 'vitest';
import { mergeLimits } from '../set-roles-diffs';

describe('Activity audit ::  mergeLimits', () => {
  test('should merge two arrays with the same parameter', () => {
    const arr1 = [{ parameter: 'myrole', value: 'minute: 1, day: 2, week: 3, month: 44' }];

    const arr2 = [{ parameter: 'myrole', value: 'maxAcceptedUsers: 9, invitationTtl: 145', diffStatus: 'changed' }];

    const expected = [
      {
        parameter: 'myrole',
        value: 'minute: 1, day: 2, week: 3, month: 44, maxAcceptedUsers: 9, invitationTtl: 145',
        diffStatus: 'changed',
      },
    ];

    expect(mergeLimits(arr1, arr2)).toEqual(expected);
  });

  test('should merge arrays with different parameters', () => {
    const arr1 = [{ parameter: 'myrole', value: 'minute: 1, day: 2, week: 3, month: 44' }];

    const arr2 = [{ parameter: 'user', value: 'maxAcceptedUsers: 9, invitationTtl: 145', diffStatus: 'changed' }];

    const expected = [
      {
        parameter: 'myrole',
        value: 'minute: 1, day: 2, week: 3, month: 44',
      },
      {
        parameter: 'user',
        value: 'maxAcceptedUsers: 9, invitationTtl: 145',
        diffStatus: 'changed',
      },
    ];

    expect(mergeLimits(arr1, arr2)).toEqual(expected);
  });

  test('should handle missing status and default it to "unchanged"', () => {
    const arr1 = [{ parameter: 'myrole', value: 'minute: 1, day: 2' }];

    const arr2 = [{ parameter: 'myrole', value: 'week: 3, month: 44' }];

    const expected = [
      {
        parameter: 'myrole',
        value: 'minute: 1, day: 2, week: 3, month: 44',
      },
    ];

    expect(mergeLimits(arr1, arr2)).toEqual(expected);
  });

  test('should update status to "changed" if present in second array', () => {
    const arr1 = [{ parameter: 'myrole', value: 'minute: 1' }];

    const arr2 = [{ parameter: 'myrole', value: 'day: 2, week: 3', diffStatus: 'changed' }];

    const expected = [
      {
        parameter: 'myrole',
        value: 'minute: 1, day: 2, week: 3',
        diffStatus: 'changed',
      },
    ];

    expect(mergeLimits(arr1, arr2)).toEqual(expected);
  });

  test('should handle empty arrays', () => {
    const arr1 = [];
    const arr2 = [];

    const expected = [];

    expect(mergeLimits(arr1, arr2)).toEqual(expected);
  });

  test('should return an array with only the first array content if the second is empty', () => {
    const arr1 = [{ parameter: 'myrole', value: 'minute: 1' }];

    const arr2 = [];

    const expected = [
      {
        parameter: 'myrole',
        value: 'minute: 1',
      },
    ];

    expect(mergeLimits(arr1, arr2)).toEqual(expected);
  });

  test('should return an array with only the second array content if the first is empty', () => {
    const arr1 = [];
    const arr2 = [{ parameter: 'myrole', value: 'minute: 1', diffStatus: 'changed' }];

    const expected = [
      {
        parameter: 'myrole',
        value: 'minute: 1',
        diffStatus: 'changed',
      },
    ];

    expect(mergeLimits(arr1, arr2)).toEqual(expected);
  });
});
