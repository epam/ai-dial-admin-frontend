'use client';

import { DialSelectField } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useMemo } from 'react';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Metric } from '@/src/models/evaluation/metric';
import { StructuredQuery } from '@/src/models/evaluation/structured-query';
import { ResponseColumn, TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { OVERALL_SCORE_FUNCTION_NAME_TO_LABEL_KEY } from './constants';
import FunctionParameterRow from './FunctionParameterRow';
import { FunctionParameterSource, OverallScoreFunctionName } from './models';
import { getFunctionName, getFunctionParameterSources } from './utils';

interface Props {
  expression: StructuredQuery;
  testCaseSchema?: TestCaseSchema[];
  responseColumns?: ResponseColumn[];
  metrics?: Metric[];
  onChange: (functionName: OverallScoreFunctionName, parameterSources: FunctionParameterSource[]) => void;
}

const SpecificFunction: FC<Props> = ({ expression, testCaseSchema, responseColumns, metrics, onChange }) => {
  const t = useI18n();

  const functionName = useMemo(() => getFunctionName(expression), [expression]);
  const parameterSources = useMemo(() => getFunctionParameterSources(expression), [expression]);

  const functionOptions = useMemo(
    () =>
      Object.entries(OVERALL_SCORE_FUNCTION_NAME_TO_LABEL_KEY).map(([value, labelKey]) => ({
        value,
        label: t(labelKey),
      })),
    [t],
  );

  const onFunctionNameChange = useCallback(
    (value: string | string[]) => {
      onChange(value as OverallScoreFunctionName, parameterSources);
    },
    [onChange, parameterSources],
  );

  const onParameterChange = useCallback(
    (index: number, source: FunctionParameterSource) => {
      onChange(
        functionName,
        parameterSources.map((existing, i) => (i === index ? source : existing)),
      );
    },
    [functionName, onChange, parameterSources],
  );

  return (
    <div className="mt-4 rounded bg-layer-2 p-4">
      <span className="tiny-semi text-secondary">{t(TestSuitesI18nKey.OverallScoreFunction)}</span>

      <div className="mt-3">
        <DialSelectField
          id="overallScoreFunctionName"
          label={t(TestSuitesI18nKey.OverallScoreFunctionLabel)}
          value={functionName}
          options={functionOptions}
          onChange={onFunctionNameChange}
        />
      </div>

      <div className="mt-4 border-l border-secondary pl-4">
        <span className="tiny-semi text-secondary">{t(TestSuitesI18nKey.OverallScoreFunctionParameters)}</span>

        <div className="mt-3 flex flex-col gap-3">
          <FunctionParameterRow
            labelKey={TestSuitesI18nKey.OverallScoreDatasetColumn}
            source={parameterSources[0]}
            testCaseSchema={testCaseSchema}
            responseColumns={responseColumns}
            metrics={metrics}
            onChange={(source) => onParameterChange(0, source)}
          />
          <FunctionParameterRow
            labelKey={TestSuitesI18nKey.OverallScoreParameterP}
            source={parameterSources[1]}
            testCaseSchema={testCaseSchema}
            responseColumns={responseColumns}
            metrics={metrics}
            onChange={(source) => onParameterChange(1, source)}
          />
        </div>
      </div>
    </div>
  );
};

export default SpecificFunction;
