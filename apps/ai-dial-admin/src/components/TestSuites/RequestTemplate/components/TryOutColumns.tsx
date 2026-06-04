'use client';
import { FC, ReactNode, useEffect, useState } from 'react';

import { DialLoader, DialTag } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { capitalize } from 'lodash';

import { evaluateColumns, EvaluatedColumn } from '@/src/components/TestSuites/utils/evaluate-columns';
import { TestSuitesI18nKey, ValidityStatusI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ResponseColumn } from '@/src/models/evaluation/test-suite';
import CollapsibleSection from './CollapsibleSection';

interface Props {
  isLoading?: boolean;
  responseBody: ReactNode;
  columns?: ResponseColumn[];
  response?: Record<string, unknown>;
}

const TryOutColumns: FC<Props> = ({ isLoading, responseBody, columns, response }) => {
  const t = useI18n();
  const [evaluatedColumns, setEvaluatedColumns] = useState<EvaluatedColumn[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    if (!response) return;
    setIsEvaluating(true);
    evaluateColumns(columns || [], response || {})
      .then((res) => {
        setEvaluatedColumns(res);
      })
      .finally(() => {
        setIsEvaluating(false);
      });
  }, [columns, response]);

  return (
    <div className="flex-1 flex flex-col gap-y-8 pb-2 min-h-0">
      <CollapsibleSection title={t(TestSuitesI18nKey.Results)} growOnOpen>
        {isLoading || isEvaluating ? (
          <DialLoader />
        ) : (
          <div className="flex flex-col gap-3">
            {evaluatedColumns.map((column, index) => (
              <div
                key={`${column.name}-${index}`}
                className={classNames(
                  'flex flex-col gap-2 rounded p-3 border',
                  column.valid ? 'border-success bg-success' : 'border-error bg-error',
                )}
              >
                <div className="flex flex-row justify-between items-center">
                  <div className="flex flex-row gap-2 items-center">
                    <div className="small-text-semi text-primary">{column.name}</div>
                    <DialTag label={capitalize(column.type)} />
                  </div>
                  <DialTag
                    label={column.valid ? t(ValidityStatusI18nKey.Valid) : t(ValidityStatusI18nKey.Invalid)}
                    className={classNames(
                      column.valid
                        ? 'border-success bg-controls-accent-success-alpha-hover'
                        : 'border-error bg-controls-error-alpha-hover',
                    )}
                  />
                </div>
                <div className="text-secondary text-sm">{column.expression}</div>
                <div className="text-primary text-sm overflow-auto">
                  {column.result !== null ? column.result : 'Null'}
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>
      {responseBody}
    </div>
  );
};

export default TryOutColumns;
