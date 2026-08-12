import { describe, expect, test } from 'vitest';

import { MetricOption, MetricScoresData } from '@/src/components/Runs/Summary/models';
import {
  getCompareBarGroups,
  getCompareMetricStatCards,
  intersectStatistics,
  maxBarValue,
  unionMetricOptions,
} from '../utils';

const PRIMARY_SCORES: MetricScoresData = {
  overallScore: 0.8,
  statistics: ['AVG', 'P90', 'MAX'],
  byStatistic: {
    AVG: [
      { name: 'ragas', bars: { context_recall: 0.8, noise_sensitivity: 0.5 }, description: 'ragas desc' },
      { name: 'aidial', bars: { faithfulness: 0.7 } },
    ],
    P90: [{ name: 'ragas', bars: { context_recall: 0.9 } }],
    MAX: [{ name: 'ragas', bars: { context_recall: 1 } }],
  },
};

const COMPARED_SCORES: MetricScoresData = {
  overallScore: 0.3,
  statistics: ['AVG', 'P90', 'MIN'],
  byStatistic: {
    AVG: [
      { name: 'ragas', bars: { context_recall: 0.3, noise_sensitivity: 0.2 } },
      { name: 'other', bars: { score: 0.4 } },
    ],
    P90: [{ name: 'ragas', bars: { context_recall: 0.4 } }],
    MIN: [{ name: 'ragas', bars: { context_recall: 0.1 } }],
  },
};

describe('Compare Summary :: utils', () => {
  test('intersectStatistics keeps primary order of shared stats', () => {
    expect(intersectStatistics(['AVG', 'P90', 'MAX'], ['P90', 'AVG', 'MIN'])).toEqual(['AVG', 'P90']);
  });

  test('unionMetricOptions prefers primary option on name collision', () => {
    const primary: MetricOption[] = [{ name: 'ragas.score', field: 'metric::ragas::score', computationId: 'c1' }];
    const compared: MetricOption[] = [
      { name: 'ragas.score', field: 'metric::ragas::score', computationId: 'c2' },
      { name: 'other.score', field: 'metric::other::score', computationId: 'c3' },
    ];

    expect(unionMetricOptions(primary, compared)).toEqual([
      { name: 'ragas.score', field: 'metric::ragas::score', computationId: 'c1' },
      { name: 'other.score', field: 'metric::other::score', computationId: 'c3' },
    ]);
  });

  test('getCompareBarGroups aligns shared and compared-only groups', () => {
    const groups = getCompareBarGroups(PRIMARY_SCORES, COMPARED_SCORES, 'AVG');

    expect(groups.map((group) => group.name)).toEqual(['ragas', 'aidial', 'other']);
    expect(groups[0].data).toEqual({ context_recall: 0.8, noise_sensitivity: 0.5 });
    expect(groups[0].compareData).toEqual({ context_recall: 0.3, noise_sensitivity: 0.2 });
    expect(groups[1].data).toEqual({ faithfulness: 0.7 });
    expect(groups[1].compareData).toEqual({ faithfulness: null });
    expect(groups[2].data).toEqual({ score: null });
    expect(groups[2].compareData).toEqual({ score: 0.4 });
  });

  test('getCompareBarGroups fills null for asymmetric keys in a shared group', () => {
    const primary: MetricScoresData = {
      overallScore: 0.8,
      statistics: ['AVG'],
      byStatistic: {
        AVG: [{ name: 'ragas', bars: { context_recall: 0.8, noise_sensitivity: 0.5 } }],
      },
    };
    const compared: MetricScoresData = {
      overallScore: 0.3,
      statistics: ['AVG'],
      byStatistic: {
        AVG: [{ name: 'ragas', bars: { context_recall: 0.3 } }],
      },
    };

    const groups = getCompareBarGroups(primary, compared, 'AVG');

    expect(groups).toHaveLength(1);
    expect(groups[0].data).toEqual({ context_recall: 0.8, noise_sensitivity: 0.5 });
    expect(groups[0].compareData).toEqual({ context_recall: 0.3, noise_sensitivity: null });
  });

  test('getCompareBarGroups returns empty when statistic or primary is missing', () => {
    expect(getCompareBarGroups(null, COMPARED_SCORES, 'AVG')).toEqual([]);
    expect(getCompareBarGroups(PRIMARY_SCORES, COMPARED_SCORES, null)).toEqual([]);
  });

  test('getCompareMetricStatCards merges primary and compared values', () => {
    const cards = getCompareMetricStatCards(PRIMARY_SCORES, COMPARED_SCORES, 'ragas.context_recall');

    expect(cards).toEqual([
      { name: 'AVG', primaryValue: 0.8, comparedValue: 0.3 },
      { name: 'P90', primaryValue: 0.9, comparedValue: 0.4 },
      { name: 'MAX', primaryValue: 1, comparedValue: null },
      { name: 'MIN', primaryValue: null, comparedValue: 0.1 },
    ]);
  });

  test('maxBarValue uses at least 1 and both series', () => {
    expect(maxBarValue({ a: 0.2 }, { a: 0.5 })).toBe(1);
    expect(maxBarValue({ a: 1.2 }, { a: 0.5 })).toBe(1.2);
    expect(maxBarValue({ a: null }, { a: 1.5 })).toBe(1.5);
  });
});
