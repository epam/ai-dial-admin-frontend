'use client';
import { FC, ReactNode, useEffect, useMemo, useState } from 'react';

import { DialLoader, DialTag } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { capitalize } from 'lodash';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import {
  evaluateTryOutColumnSections,
  EvaluatedColumn,
  TryOutColumnTurnResult,
  TryOutColumnResults,
} from '@/src/components/TestSuites/utils/evaluate-columns';
import { BasicI18nKey, TestSuitesI18nKey, ValidityStatusI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ResponseColumn, TestCaseSchema, TestSuite, TryOutHistoryEntry } from '@/src/models/evaluation/test-suite';
import CollapsibleSection from './CollapsibleSection';

interface Props {
  isLoading?: boolean;
  responseBody: ReactNode;
  testSuite: TestSuite;
  history?: TryOutHistoryEntry[];
  schema?: TestCaseSchema[];
  multiTurnData?: Record<string, unknown>[];
  columns?: ResponseColumn[];
  response?: Record<string, unknown>;
  request?: Record<string, unknown>;
  selectedRequestIndex?: number;
}

const ColumnResultsList: FC<{ columns: EvaluatedColumn[] }> = ({ columns }) => {
  const t = useI18n();

  return (
    <div className="flex flex-col gap-3">
      {columns.map((column, index) => (
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
          <div className="text-primary text-sm overflow-auto">{column.result !== null ? column.result : 'Null'}</div>
        </div>
      ))}
    </div>
  );
};

const TurnColumnSection: FC<{ turn: TryOutColumnTurnResult; showTurnLabel: boolean }> = ({ turn, showTurnLabel }) => {
  const t = useI18n();
  const copyText = useMemo(
    () => (turn.responseBody != null ? JSON.stringify(turn.responseBody, null, 2) : ''),
    [turn.responseBody],
  );

  return (
    <div className="flex flex-col gap-y-4 shrink-0">
      {showTurnLabel ? (
        <h2 className="dial-small-text font-semibold">
          {t(TestSuitesI18nKey.TurnLabel, { index: turn.turnIndex + 1 })}
        </h2>
      ) : null}
      <ColumnResultsList columns={turn.columns} />
      <CollapsibleSection
        title={t(BasicI18nKey.Response)}
        fullViewContent={copyText}
        headerIcon={<CopyButton value={copyText} valueLabel={t(BasicI18nKey.Response)} />}
        growOnOpen={false}
      >
        <div className="h-64">
          <JsonEditor
            entity={(turn.responseBody ?? null) as object | null}
            options={{ stickyScroll: { enabled: false }, wordWrap: 'off' }}
            readonly={true}
          />
        </div>
      </CollapsibleSection>
    </div>
  );
};

const TryOutColumns: FC<Props> = ({
  isLoading,
  responseBody,
  testSuite,
  history,
  schema,
  multiTurnData,
  columns,
  response,
  request,
  selectedRequestIndex = 0,
}) => {
  const t = useI18n();
  const [results, setResults] = useState<TryOutColumnResults>({ shape: 'single', flatColumns: [] });
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setIsEvaluating(true);
    evaluateTryOutColumnSections({
      testSuite,
      history,
      schema,
      multiTurnLength: multiTurnData?.length ?? 0,
      fallbackColumns: columns || [],
      fallbackResponse: response || {},
      fallbackRequest: request,
    })
      .then((res) => {
        if (!cancelled) {
          setResults(res);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsEvaluating(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [testSuite, history, schema, multiTurnData, columns, response, request]);

  const renderGrouped = () => {
    const group = results.groups?.find((item) => item.requestIndex === selectedRequestIndex);
    if (!group?.turns.length) {
      return null;
    }

    return (
      <div className="flex flex-col gap-y-6">
        {group.turns.map((turn) => (
          <TurnColumnSection
            key={`turn-${group.requestIndex}-${turn.turnIndex}`}
            turn={turn}
            showTurnLabel={group.showTurnLabels}
          />
        ))}
      </div>
    );
  };

  const showGrouped = results.shape === 'requests' || results.shape === 'combined';

  return (
    <div className="flex-1 flex flex-col gap-y-8 pb-2 min-h-0 overflow-auto">
      {isLoading || isEvaluating ? (
        <DialLoader />
      ) : showGrouped ? (
        renderGrouped()
      ) : (
        <CollapsibleSection title={t(TestSuitesI18nKey.Results)}>
          <ColumnResultsList columns={results.flatColumns ?? []} />
        </CollapsibleSection>
      )}
      {!showGrouped ? responseBody : null}
    </div>
  );
};

export default TryOutColumns;
