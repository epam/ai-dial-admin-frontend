'use client';

import { useCallback, useState } from 'react';

import { useI18n } from '@/src/locales/client';
import { CreateEvaluatorDto, EvaluatorRequest, EvaluatorType } from '@/src/models/analytics/evaluator';
import { FieldError } from '@/src/models/error';
import { applyTypeChange, buildEvaluatorDto, isEvaluatorShapeValid } from '@/src/utils/analytics/evaluator-dto';
import { getEvaluatorNameError } from '@/src/utils/validation/evaluator-name-error';

interface Params {
  existingNames: string[];
}

export interface CreateEvaluatorFormState {
  draft: CreateEvaluatorDto;
  onChange: (patch: Partial<CreateEvaluatorDto>) => void;
  nameError: FieldError | null;
  isValid: boolean;
  buildDto: () => EvaluatorRequest;
}

const INITIAL_DRAFT: CreateEvaluatorDto = { name: '', type: EvaluatorType.Llm, outputs: [] };

export const useCreateEvaluatorForm = ({ existingNames }: Params): CreateEvaluatorFormState => {
  const t = useI18n();
  const [draft, setDraft] = useState<CreateEvaluatorDto>(INITIAL_DRAFT);

  const onChange = useCallback(
    (patch: Partial<CreateEvaluatorDto>) => setDraft((prev) => ({ ...prev, ...applyTypeChange(prev, patch) })),
    [],
  );

  const nameError = getEvaluatorNameError(draft.name, existingNames, t);

  const buildDto = useCallback(() => buildEvaluatorDto({ ...draft, name: draft.name.trim() }), [draft]);

  return {
    draft,
    onChange,
    nameError,
    isValid: isEvaluatorShapeValid(draft) && !nameError,
    buildDto,
  };
};
