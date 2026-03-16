'use client';

import { FC, useMemo } from 'react';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Metric } from '@/src/models/evaluation/metric';
import { jsonSchemaToFields, SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';

interface Props {
  selectedMetric: Metric;
}

const ResultItem: FC<{ result: SchemaFieldRow; depth: number }> = ({ result, depth }) => (
  <div className="flex flex-col gap-y-1" style={{ paddingLeft: depth * 16 }}>
    <span className="text-primary dial-small">{result.name}</span>
    <span className="text-secondary dial-tiny">{result.description}</span>
    {result.children?.length > 0 && (
      <div className="flex flex-col gap-y-2 mt-1">
        {result.children.map((child) => (
          <ResultItem key={child.id} result={child} depth={depth + 1} />
        ))}
      </div>
    )}
  </div>
);

const Results: FC<Props> = ({ selectedMetric }) => {
  const t = useI18n();

  const selectedMetricResults = useMemo(() => {
    return jsonSchemaToFields(
      selectedMetric?.metricDeclarationVersion?.outputSchema,
      selectedMetric?.metricDeclarationVersion?.outputSchema,
    );
  }, [selectedMetric?.metricDeclarationVersion?.outputSchema]);

  return (
    <div className="flex flex-col gap-y-4 min-h-0">
      <h1>{t(TestSuitesI18nKey.Results)}</h1>
      <div className="flex flex-col gap-y-2 min-h-0 overflow-auto">
        {selectedMetricResults.map((result) => (
          <ResultItem key={result.id} result={result} depth={0} />
        ))}
      </div>
    </div>
  );
};

export default Results;
