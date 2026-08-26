'use client';

import { useCallback, useMemo, useState } from 'react';

import { CreateEvaluatorDto, Evaluator, EvaluatorSummary } from '@/src/models/analytics/evaluator';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { buildEvaluatorDto, isEvaluatorShapeValid, toEvaluatorDraft } from '@/src/utils/analytics/evaluator-dto';

interface Params {
  evaluator: Evaluator;
  summary: EvaluatorSummary | null;
}

export interface EvaluatorFormState {
  draft: CreateEvaluatorDto;
  onChange: (patch: Partial<CreateEvaluatorDto>) => void;
  reset: () => void;
  isChanged: boolean;
  isValid: boolean;
  buildDto: () => CreateEvaluatorDto;
  nextVersion: number | null;
}

export const useEvaluatorForm = ({ evaluator, summary }: Params): EvaluatorFormState => {
  const [draft, setDraft] = useState<CreateEvaluatorDto>(() => toEvaluatorDraft(evaluator));

  const onChange = useCallback((patch: Partial<CreateEvaluatorDto>) => setDraft((prev) => ({ ...prev, ...patch })), []);

  const reset = useCallback(() => setDraft(toEvaluatorDraft(evaluator)), [evaluator]);

  const buildDto = useCallback(() => buildEvaluatorDto(draft), [draft]);

  const isChanged = useMemo(
    () => !isEqualSkippingUndefined(buildEvaluatorDto(draft), buildEvaluatorDto(toEvaluatorDraft(evaluator))),
    [draft, evaluator],
  );

  return {
    draft,
    onChange,
    reset,
    isChanged,
    isValid: isEvaluatorShapeValid(draft),
    buildDto,
    nextVersion: summary ? summary.latest_version + 1 : null,
  };
};
