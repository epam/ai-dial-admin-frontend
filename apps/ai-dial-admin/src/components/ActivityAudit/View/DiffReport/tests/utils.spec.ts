import { DiffStatus } from '@/src/types/activity-audit';
import { describe, expect, test } from 'vitest';
import { getDiffCount } from '../utils';

describe('Activity audit :: getDiffCount', () => {
  const createItem = (status?: DiffStatus) => ({ parameter: 'param', value: 'val', status });

  test('should count ADD statuses correctly', () => {
    const sections = [
      {
        section1: [createItem(DiffStatus.ADDED), createItem(DiffStatus.ADDED)],
        section2: [createItem(DiffStatus.REMOVED)],
      },
      {
        section3: [createItem(DiffStatus.ADDED)],
      },
    ];

    const count = getDiffCount(sections, DiffStatus.ADDED);
    expect(count).toBe(3);
  });

  test('should count REMOVE statuses correctly', () => {
    const sections = [
      {
        s1: [createItem(DiffStatus.REMOVED), createItem(DiffStatus.ADDED)],
      },
      {
        s2: [createItem(DiffStatus.REMOVED), createItem(DiffStatus.REMOVED)],
      },
    ];

    const count = getDiffCount(sections, DiffStatus.REMOVED);
    expect(count).toBe(3);
  });

  test('should count CHANGE statuses correctly and divide by 2', () => {
    const sections = [
      {
        s1: [createItem(DiffStatus.CHANGED), createItem(DiffStatus.CHANGED), createItem(DiffStatus.CHANGED)],
      },
      {
        s2: [createItem(DiffStatus.CHANGED)],
      },
    ];

    const count = getDiffCount(sections, DiffStatus.CHANGED);
    expect(count).toBe(2);
  });

  test('should return 0 if no matching status found', () => {
    const sections = [
      {
        s1: [createItem(DiffStatus.ADDED), createItem(DiffStatus.ADDED)],
      },
    ];
    const count = getDiffCount(sections, DiffStatus.REMOVED);
    expect(count).toBe(0);
  });

  test('should return 0 when no status argument provided', () => {
    const sections = [
      {
        s1: [createItem(DiffStatus.ADDED)],
      },
    ];
    const count = getDiffCount(sections);
    expect(count).toBe(0);
  });

  test('should ignore items without status', () => {
    const sections = [
      {
        s1: [createItem(), createItem(DiffStatus.ADDED)],
      },
    ];
    const count = getDiffCount(sections, DiffStatus.ADDED);
    expect(count).toBe(1);
  });
});
