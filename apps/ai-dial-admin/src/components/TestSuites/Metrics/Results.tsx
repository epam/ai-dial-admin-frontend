'use client';

import { FC, useMemo } from 'react';

import { jsonSchemaToFields } from '@/src/components/Common/SchemaGrid/utils';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Metric } from '@/src/models/evaluation/metric';

interface Props {
  selectedMetric: Metric;
}

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
      <div className="flex flex-col gap-y-2">
        {selectedMetricResults.map((result) => (
          <div key={result.id} className="flex flex-col gap-y-1">
            <span className="text-primary dial-small">{result.name}</span>
            <span className="text-secondary dial-tiny">{result.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Results;
