import { describe, expect, it } from 'vitest';

import { ColumnGroupId, groupColumns } from '@/src/components/Runs/Export/utils/group-columns';

describe('groupColumns', () => {
  it('assigns data: prefix to Data group', () => {
    const groups = groupColumns(['data:prompt', 'data:attachment']);
    const dataGroup = groups.find((g) => g.id === ColumnGroupId.Data);
    expect(dataGroup).toBeDefined();
    expect(dataGroup!.columns.map((c) => c.name)).toEqual(['data:prompt', 'data:attachment']);
  });

  it('strips data: prefix for display name', () => {
    const groups = groupColumns(['data:prompt']);
    const dataGroup = groups.find((g) => g.id === ColumnGroupId.Data)!;
    expect(dataGroup.columns[0].displayName).toBe('prompt');
  });

  it('assigns response: prefix to Response group', () => {
    const groups = groupColumns(['response:answer', 'response:file']);
    const responseGroup = groups.find((g) => g.id === ColumnGroupId.Response);
    expect(responseGroup).toBeDefined();
    expect(responseGroup!.columns).toHaveLength(2);
  });

  it('assigns metric: to Metrics group and sub-groups by metric name', () => {
    const groups = groupColumns(['metric:Accuracy:score', 'metric:Accuracy:details', 'metric:Recall:score']);
    const metricsGroup = groups.find((g) => g.id === ColumnGroupId.Metrics)!;
    expect(metricsGroup).toBeDefined();
    expect(metricsGroup.columns).toHaveLength(3);
    expect(metricsGroup.columns[0].subGroup).toBe('Accuracy');
    expect(metricsGroup.columns[2].subGroup).toBe('Recall');
  });

  it('assigns metricInfo: to Metrics group', () => {
    const groups = groupColumns(['metricInfo:Accuracy:score']);
    const metricsGroup = groups.find((g) => g.id === ColumnGroupId.Metrics);
    expect(metricsGroup).toBeDefined();
    expect(metricsGroup!.columns[0].subGroup).toBe('Accuracy');
  });

  it('assigns metricError: to Metrics group', () => {
    const groups = groupColumns(['metricError:Accuracy']);
    const metricsGroup = groups.find((g) => g.id === ColumnGroupId.Metrics);
    expect(metricsGroup).toBeDefined();
    expect(metricsGroup!.columns[0].subGroup).toBe('Accuracy');
  });

  it('assigns body columns to Body group', () => {
    const groups = groupColumns(['requestBody', 'responseBody', 'extractionWarnings']);
    const bodyGroup = groups.find((g) => g.id === ColumnGroupId.Body);
    expect(bodyGroup).toBeDefined();
    expect(bodyGroup!.columns).toHaveLength(3);
  });

  it('assigns unprefixed columns to Identification group', () => {
    const groups = groupColumns(['id', 'testSuiteId', 'createdAt', 'executionStatus']);
    const identGroup = groups.find((g) => g.id === ColumnGroupId.Identification);
    expect(identGroup).toBeDefined();
    expect(identGroup!.columns).toHaveLength(4);
  });

  it('defaults body columns to unchecked', () => {
    const groups = groupColumns(['requestBody', 'responseBody']);
    const bodyGroup = groups.find((g) => g.id === ColumnGroupId.Body)!;
    expect(bodyGroup.columns.every((c) => c.defaultChecked === false)).toBe(true);
  });

  it('defaults non-body columns to checked', () => {
    const groups = groupColumns(['id', 'data:prompt', 'response:answer', 'metric:Accuracy:score']);
    const nonBodyGroups = groups.filter((g) => g.id !== ColumnGroupId.Body);
    const allChecked = nonBodyGroups.flatMap((g) => g.columns).every((c) => c.defaultChecked === true);
    expect(allChecked).toBe(true);
  });

  it('preserves group order: identification, data, response, metrics, body', () => {
    const groups = groupColumns(['id', 'data:prompt', 'response:answer', 'metric:Accuracy:score', 'requestBody']);
    const ids = groups.map((g) => g.id);
    expect(ids).toEqual([
      ColumnGroupId.Identification,
      ColumnGroupId.Data,
      ColumnGroupId.Response,
      ColumnGroupId.Metrics,
      ColumnGroupId.Body,
    ]);
  });

  it('omits empty groups', () => {
    const groups = groupColumns(['id']);
    expect(groups).toHaveLength(1);
    expect(groups[0].id).toBe(ColumnGroupId.Identification);
  });

  it('strips metric: prefix for display name (returns third segment)', () => {
    const groups = groupColumns(['metric:Accuracy:score']);
    const metricsGroup = groups.find((g) => g.id === ColumnGroupId.Metrics)!;
    expect(metricsGroup.columns[0].displayName).toBe('score');
  });
});
