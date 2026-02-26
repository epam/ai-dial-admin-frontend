'use client';

import { FC, useCallback, useMemo } from 'react';

import { DialCloseButton } from '@epam/ai-dial-ui-kit';

import Accordion from '@/src/components/Common/Accordion/Accordion';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ExtractionResult } from '@/src/models/evaluation/run';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import classNames from 'classnames';
import { getTestCaseStatusClass } from './utils';

interface Props {
  result: ExtractionResult;
  onClose: () => void;
}

const RunResultDetailPanel: FC<Props> = ({ result, onClose }) => {
  const t = useI18n();

  const durationMs = result.executionInfo?.durationMs;
  const durationStr =
    durationMs != null ? (durationMs >= 1000 ? `${(durationMs / 1000).toFixed(1)}s` : `${durationMs}ms`) : '—';

  const executionEntries: Array<[string, string]> = [
    ['Status', result.executionInfo?.status || '—'],
    ['HTTP', String(result.responseStatusCode ?? '—')],
    ['Duration', durationStr],
    ['Started', result.executionInfo?.startedAt ? formatDateTimeToLocalString(result.executionInfo?.startedAt) : '—'],
  ];

  const testCaseEntries = useMemo(() => {
    const testCaseData = result.testCaseData ?? {};
    return Object.keys(testCaseData).map((key) => {
      return [key, String(testCaseData[key])] as [string, string];
    });
  }, [result.testCaseData]);

  const requestJson = result.requestBody != null ? JSON.stringify(result.requestBody, null, 2) : '—';
  const responseJson = result.responseBody != null ? JSON.stringify(result.responseBody, null, 2) : '—';

  const title = `${result.testCaseName} - Run #${result.runIndex ?? 0}`;

  const getCollapseBlock = useCallback((title: string, content: string) => {
    return (
      <Accordion
        title={title}
        contentPaddingClassName="p-0"
        containerPaddingClassName="p-0"
        containerClassName="p-0 border-0"
      >
        <pre className="p-4 rounded bg-layer-3 text-primary dial-small overflow-x-auto whitespace-pre-wrap break-words">
          {content}
        </pre>
      </Accordion>
    );
  }, []);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-start justify-between">
        <h1 className="truncate">{title}</h1>
        <DialCloseButton onClose={onClose} />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-6 mt-4">
        <section className="flex flex-col gap-2">
          <h4>{t(RunsI18nKey.Execution)}</h4>

          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 dial-small">
            {executionEntries.map(([key, value]) => (
              <span key={key} className="contents">
                <p className="text-secondary break-all">{key}</p>
                <p
                  className={classNames(
                    'font-medium text-right break-all',
                    key === 'Status' && getTestCaseStatusClass(result.responseStatusCode),
                  )}
                >
                  {value}
                </p>
              </span>
            ))}
          </div>
        </section>

        {testCaseEntries.length > 0 && (
          <section className="flex flex-col gap-2">
            <h4>{t(RunsI18nKey.TestCaseData)}</h4>

            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 dial-small">
              {testCaseEntries.map(([key, value]) => (
                <span key={key} className="contents">
                  <p className="text-secondary break-all">{key}</p>
                  <p className="font-medium text-right break-all">{value}</p>
                </span>
              ))}
            </div>
          </section>
        )}

        {getCollapseBlock(t(RunsI18nKey.RequestBody), requestJson)}
        {getCollapseBlock(t(RunsI18nKey.ResponseBody), responseJson)}
      </div>
    </div>
  );
};

export default RunResultDetailPanel;
