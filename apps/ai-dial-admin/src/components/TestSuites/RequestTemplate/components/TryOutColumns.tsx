'use client';
import { FC, ReactNode, useEffect, useMemo, useState } from 'react';

import { DialLoader, DialTag } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { capitalize } from 'lodash';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { evaluateTryOutColumnSections } from '@/src/components/TestSuites/utils/evaluate-columns';
import {
  ColumnExtractionStatus,
  EvaluatedColumn,
  NotExtractedReason,
  TryOutColumnResults,
  TryOutColumnTurnResult,
  TryOutInvocation,
} from '@/src/components/TestSuites/utils/models';
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
  /** The try-out's own reported extraction, for the single-invocation case. */
  invocation?: TryOutInvocation;
  /** Normalized response and request bodies — used only by the MCP fallback. */
  response?: Record<string, unknown>;
  request?: Record<string, unknown>;
  selectedRequestIndex?: number;
}

const CARD_CLASS: Record<ColumnExtractionStatus, string> = {
  [ColumnExtractionStatus.Extracted]: 'border-success bg-success',
  [ColumnExtractionStatus.Failed]: 'border-error bg-error',
  [ColumnExtractionStatus.NotExtracted]: 'border-primary bg-layer-2',
};

const BADGE_CLASS: Record<ColumnExtractionStatus, string> = {
  [ColumnExtractionStatus.Extracted]: 'border-success bg-controls-accent-success-alpha-hover',
  [ColumnExtractionStatus.Failed]: 'border-error bg-controls-error-alpha-hover',
  [ColumnExtractionStatus.NotExtracted]: 'border-primary bg-layer-3',
};

const STATUS_LABEL_KEY: Record<ColumnExtractionStatus, string> = {
  [ColumnExtractionStatus.Extracted]: ValidityStatusI18nKey.Valid,
  [ColumnExtractionStatus.Failed]: ValidityStatusI18nKey.Invalid,
  [ColumnExtractionStatus.NotExtracted]: TestSuitesI18nKey.ColumnNotExtracted,
};

/** Stated per reason rather than through a lookup, so each key keeps its own interpolation params. */
const getNotExtractedReason = (t: ReturnType<typeof useI18n>, column: EvaluatedColumn): string => {
  if (column.reason === NotExtractedReason.RequestFailed) {
    return t(TestSuitesI18nKey.ColumnNotExtractedRequestFailed, { statusCode: column.statusCode ?? '' });
  }
  if (column.reason === NotExtractedReason.StreamIncomplete) {
    return t(TestSuitesI18nKey.ColumnNotExtractedStreamIncomplete);
  }

  return t(TestSuitesI18nKey.ColumnNotExtractedNoneReported);
};

const ColumnResultCard: FC<{ column: EvaluatedColumn }> = ({ column }) => {
  const t = useI18n();
  const isNotExtracted = column.status === ColumnExtractionStatus.NotExtracted;
  const statusLabel = t(STATUS_LABEL_KEY[column.status]);
  const reason = isNotExtracted ? getNotExtractedReason(t, column) : column.error;

  return (
    <div
      role="group"
      aria-label={t(TestSuitesI18nKey.ColumnResultLabel, { name: column.name, status: statusLabel })}
      className={classNames('flex flex-col gap-2 rounded p-3 border', CARD_CLASS[column.status])}
    >
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row gap-2 items-center">
          <div className="small-text-semi text-primary">{column.name}</div>
          <DialTag label={capitalize(column.type)} />
        </div>
        <DialTag label={statusLabel} className={BADGE_CLASS[column.status]} />
      </div>
      <div className="text-secondary text-sm">{column.expression}</div>
      {reason ? <div className="text-secondary text-sm">{reason}</div> : null}
      {isNotExtracted ? null : <div className="text-primary text-sm overflow-auto">{column.result}</div>}
    </div>
  );
};

const ColumnResultsList: FC<{ columns: EvaluatedColumn[] }> = ({ columns }) => (
  <div className="flex flex-col gap-3">
    {columns.map((column, index) => (
      <ColumnResultCard key={`${column.name}-${index}`} column={column} />
    ))}
  </div>
);

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
  invocation,
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
      fallbackInvocation: invocation || {},
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
  }, [testSuite, history, schema, multiTurnData, columns, invocation, response, request]);

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
