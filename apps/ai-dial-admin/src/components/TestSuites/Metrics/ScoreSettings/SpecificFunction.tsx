'use client';

import { Notification, NotificationType, NotificationVariant, Select } from '@epam/ai-dial-ui-kit';
import { FC, ReactNode, useCallback, useMemo, useState } from 'react';

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
  testCaseScoreContent?: ReactNode;
  onChange: (functionName: OverallScoreFunctionName, parameterSources: FunctionParameterSource[]) => void;
}

const SpecificFunction: FC<Props> = ({
  expression,
  testCaseSchema,
  responseColumns,
  metrics,
  testCaseScoreContent,
  onChange,
}) => {
  const t = useI18n();
  const [isSuiteAlertVisible, setIsSuiteAlertVisible] = useState(true);

  const functionName = useMemo(() => getFunctionName(expression), [expression]);
  const parameterSources = useMemo(() => getFunctionParameterSources(expression), [expression]);
  const functionLabel = t(OVERALL_SCORE_FUNCTION_NAME_TO_LABEL_KEY[functionName]);

  const suiteLevelOnlyLabel = t(TestSuitesI18nKey.OverallScoreSuiteLevelOnly);

  const functionOptions = useMemo(
    () =>
      Object.entries(OVERALL_SCORE_FUNCTION_NAME_TO_LABEL_KEY).map(([value, labelKey]) => {
        const label = t(labelKey);

        return {
          value,
          label,
          labelNode: (
            <span className="inline-flex min-w-0 items-center gap-2">
              <span className="truncate">{label}</span>
              <span className="shrink-0 rounded-full bg-layer-4 px-2 py-0.5 dial-tiny-semi-text text-secondary">
                {suiteLevelOnlyLabel}
              </span>
            </span>
          ),
        };
      }),
    [suiteLevelOnlyLabel, t],
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
    <div className="mt-4 flex flex-col gap-4 rounded bg-layer-2 p-4">
      <span className="dial-tiny-semi-text text-secondary">{t(TestSuitesI18nKey.OverallScoreFunction)}</span>

      <Select
        id="overallScoreFunctionName"
        labelProps={{ label: t(TestSuitesI18nKey.OverallScoreFunctionLabel) }}
        value={functionName}
        options={functionOptions}
        onChange={onFunctionNameChange}
      />

      <div className="flex flex-col gap-4 border-l border-secondary pl-4">
        <span className="dial-tiny-semi-text text-secondary">
          {t(TestSuitesI18nKey.OverallScoreFunctionParameters)}
        </span>

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

      {isSuiteAlertVisible && (
        <Notification
          type={NotificationType.SectionMessage}
          variant={NotificationVariant.Info}
          closable
          className="!gap-2 !p-2 [&>div:first-child]:!items-center [&>div:first-child]:!gap-2 [&>div.relative]:!size-6"
          onClose={() => setIsSuiteAlertVisible(false)}
          message={
            <div className="flex flex-col gap-0.5 dial-tiny-text text-primary">
              <p>
                <span className="font-bold">{functionLabel}</span>
                {` ${t(TestSuitesI18nKey.OverallScoreFunctionSuiteOnlyAlertSuffix)}`}
              </p>
              <p>{t(TestSuitesI18nKey.OverallScoreFunctionSuiteOnlyAlertHint)}</p>
            </div>
          }
        />
      )}

      {testCaseScoreContent}
    </div>
  );
};

export default SpecificFunction;
