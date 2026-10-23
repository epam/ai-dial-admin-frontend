'use client';

import { useEffect, useState } from 'react';

import { executeStructuredQuery, getRunsQuery } from '@/src/app/[lang]/runs/actions';
import { RUN_FILTER } from '@/src/components/TestSuites/Runs/constants';
import { RUN_ID_FIELD, TRENDS_RUN_WINDOW } from '@/src/components/TestSuites/Trends/constants';
import { TrendsData } from '@/src/components/TestSuites/Trends/models';
import { buildTrendsMetricScoresQuery } from '@/src/components/TestSuites/Trends/utils/build-trends-query';
import { emptyTrendsData, parseTrendsData } from '@/src/components/TestSuites/Trends/utils/parse-trends';
import { Run } from '@/src/models/evaluation/run';
import { StructuredQueryResult } from '@/src/models/evaluation/structured-query';
import { EvaluationPageData, FilterDto } from '@/src/models/request';
import { FilterOperatorDto } from '@/src/types/request';

interface TrendsDataState {
  data: TrendsData | null;
  isLoading: boolean;
}

const collectScoreRunIds = (scoreResult: StructuredQueryResult | null): string[] => {
  const ids = new Set<string>();
  for (const row of scoreResult?.rows ?? []) {
    const runId = row[RUN_ID_FIELD];
    if (typeof runId === 'string') {
      ids.add(runId);
    }
  }
  return [...ids];
};

const RUN_IDS_FILTER = (runIds: string[]): FilterDto => ({
  column: 'id',
  operator: FilterOperatorDto.INCLUDES,
  value: runIds.join(','),
});

export const useTrendsData = (suiteId: string | undefined): TrendsDataState => {
  const [data, setData] = useState<TrendsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!suiteId) {
      setData(emptyTrendsData());
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setData(null);
    setIsLoading(true);

    const load = async () => {
      try {
        const [scoreResult, recentRunsPage] = await Promise.all([
          executeStructuredQuery(buildTrendsMetricScoresQuery(suiteId)),
          getRunsQuery(0, TRENDS_RUN_WINDOW, [], [RUN_FILTER(suiteId)]),
        ]);

        if (cancelled) {
          return;
        }

        const recentRuns = ((recentRunsPage as EvaluationPageData<Run> | null)?.content ?? []) as Run[];
        const runsById = new Map(recentRuns.filter((run) => run.id).map((run) => [run.id as string, run]));

        const missingIds = collectScoreRunIds(scoreResult as StructuredQueryResult | null).filter(
          (runId) => !runsById.has(runId),
        );

        if (missingIds.length > 0) {
          const missingPage = await getRunsQuery(0, missingIds.length, [], [RUN_IDS_FILTER(missingIds)]);
          if (cancelled) {
            return;
          }
          for (const run of ((missingPage as EvaluationPageData<Run> | null)?.content ?? []) as Run[]) {
            if (run.id) {
              runsById.set(run.id, run);
            }
          }
        }

        setData(parseTrendsData(scoreResult as StructuredQueryResult | null, [...runsById.values()]));
      } catch {
        if (!cancelled) {
          setData(emptyTrendsData());
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [suiteId]);

  return { data, isLoading };
};
