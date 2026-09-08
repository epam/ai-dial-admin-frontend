import { EntityParameterKeys } from '@/src/components/ActivityAudit/constants';
import { ActivityAuditDiffSection } from '@/src/models/activity-audit';
import { DiffStatus, DiffView } from '@/src/types/activity-audit';
import { describe, expect, test } from 'vitest';
import { filterNotEmptySections, getDiffCount } from '../utils';

describe('Activity audit :: getDiffCount', () => {
  const createItem = (diffStatus?: DiffStatus) => ({ parameter: 'param', value: 'val', diffStatus });

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

describe('Activity audit :: filterNotEmptySections', () => {
  const row = (parameter: string, diffStatus?: DiffStatus) => ({ parameter, value: 'value', diffStatus });

  const columnSection = (label: string, diffStatus?: DiffStatus): ActivityAuditDiffSection => ({
    current: [row('name'), row('type')],
    compare: [row('name'), row('type')],
    label,
    diffStatus,
  });

  test('passes the label and the status of a named section through to the renderer', () => {
    const groups = filterNotEmptySections(
      [columnSection('amount', DiffStatus.ADDED)],
      EntityParameterKeys.COLUMNS,
      DiffView.ALL,
    );

    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe('amount');
    expect(groups[0].diffStatus).toBe(DiffStatus.ADDED);
  });

  test('leaves the label and the status undefined for a section that carries neither', () => {
    const groups = filterNotEmptySections(
      [{ current: [row('cpu')], compare: [row('cpu')] }],
      EntityParameterKeys.RESOURCES,
      DiffView.ALL,
    );

    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBeUndefined();
    expect(groups[0].diffStatus).toBeUndefined();
  });

  test('drops a named section with no marked row in diff-only view and keeps a marked one', () => {
    const unchanged = columnSection('amount');
    const changed: ActivityAuditDiffSection = {
      current: [row('name'), row('sensitive', DiffStatus.CHANGED)],
      compare: [row('name'), row('sensitive', DiffStatus.CHANGED)],
      label: 'email',
      diffStatus: DiffStatus.CHANGED,
    };

    const groups = filterNotEmptySections([unchanged, changed], EntityParameterKeys.COLUMNS, DiffView.DIFF);

    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe('email');
    expect(groups[0].diffStatus).toBe(DiffStatus.CHANGED);
  });

  test('keeps a removed column in diff-only view, where one side holds only mirror placeholders', () => {
    const removed: ActivityAuditDiffSection = {
      current: [row('name', DiffStatus.MIRROR), row('type', DiffStatus.MIRROR)],
      compare: [row('name', DiffStatus.REMOVED), row('type', DiffStatus.REMOVED)],
      label: 'legacy_id',
      diffStatus: DiffStatus.REMOVED,
    };

    const groups = filterNotEmptySections([removed], EntityParameterKeys.COLUMNS, DiffView.DIFF);

    expect(groups).toHaveLength(1);
    expect(groups[0].currentData).toHaveLength(2);
    expect(groups[0].compareData).toHaveLength(2);
  });
});
