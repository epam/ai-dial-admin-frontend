import { renderCell } from '@/src/components/Analytics/QueryBuilder/utils/result';
import { TransformPreset } from '@/src/models/analytics/pipeline';
import { ModelRunEvaluation, ModelRunStatus } from '@/src/models/analytics/pipeline-model-run';
import { PreviewColumn, PreviewColumnRole, PreviewRow } from '@/src/models/analytics/pipeline-preview';

import { MODEL_RUN_GROUP_STAGES, MODEL_RUN_ROW_STAGES } from '../constants';
import { ModelRunStageEntry, ModelRunStageState } from '../models';

export const getStageStates = (
  { status, stage }: Pick<ModelRunEvaluation, 'status' | 'stage'>,
  isGroup: boolean,
): ModelRunStageEntry[] => {
  const order = isGroup ? MODEL_RUN_GROUP_STAGES : MODEL_RUN_ROW_STAGES;

  if (status === ModelRunStatus.Ok) return order.map((name) => ({ stage: name, state: ModelRunStageState.Passed }));

  const failedAt = stage == null ? -1 : order.indexOf(stage);
  if (failedAt === -1) {
    const notReached = order.map((name) => ({ stage: name, state: ModelRunStageState.NotReached }));
    return stage == null ? notReached : [{ stage, state: ModelRunStageState.Failed }, ...notReached];
  }

  return order.map((name, index) => {
    if (index < failedAt) return { stage: name, state: ModelRunStageState.Passed };
    return { stage: name, state: index === failedAt ? ModelRunStageState.Failed : ModelRunStageState.NotReached };
  });
};

const sameKey = (value: unknown, key: unknown): boolean =>
  value === key || (value != null && key != null && JSON.stringify(value) === JSON.stringify(key));

export const findEvaluatedRowIndex = (
  rows: PreviewRow[],
  columns: PreviewColumn[],
  evaluation: Pick<ModelRunEvaluation, 'grain_key'>,
): number => {
  if (rows.length === 0) return -1;

  const grainColumn = columns.find((column) => column.role === PreviewColumnRole.GrainKey)?.name;
  if (grainColumn == null || evaluation.grain_key == null) return 0;

  const index = rows.findIndex((row) => sameKey(row[grainColumn], evaluation.grain_key));
  return index === -1 ? 0 : index;
};

export const getModelColumnNames = (evaluation?: Pick<ModelRunEvaluation, 'outputs'>): string[] =>
  Object.keys(evaluation?.outputs ?? {});

export const formatModelText = (text: string): string => {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
};

export const getCorrectiveRetries = (attempts: number, preset?: TransformPreset): number =>
  preset === TransformPreset.DialAppRoute ? 0 : Math.max(attempts - 1, 0);

export const getMaxModelCalls = (preset?: TransformPreset): number => (preset === TransformPreset.DialAppRoute ? 1 : 2);

export const getPanelSubject = (
  evaluation: Pick<ModelRunEvaluation, 'grain_key' | 'group_key'> | undefined,
  isGroup: boolean,
  sampledGroupKey?: string,
): string => {
  if (!evaluation) return '';
  if (isGroup) return evaluation.group_key ?? sampledGroupKey ?? '';

  return evaluation.grain_key == null ? '' : renderCell(evaluation.grain_key);
};
