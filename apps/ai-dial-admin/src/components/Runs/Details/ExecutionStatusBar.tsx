'use client';

import { FC } from 'react';

import Grafana from '@/public/images/icons/grafana.svg';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ExtractionResultStatus } from '@/src/models/evaluation/run';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { DialLinkButton } from '@epam/ai-dial-ui-kit';

import { getFormattedDuration, getTestCaseStatusClass } from '../View/utils';

interface Props {
  status?: ExtractionResultStatus;
  httpCode?: number;
  durationMs?: number;
  timestamp?: number;
  timestampLabel?: string;
  grafanaUrl?: string;
}

const StatusPill: FC<{ status?: ExtractionResultStatus }> = ({ status }) => {
  const isSuccess = status === ExtractionResultStatus.SUCCESS;
  const pillClass = isSuccess ? 'bg-success text-success' : 'bg-error text-error';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${pillClass}`}
    >
      {isSuccess ? '\u2713' : '\u2717'} {status ?? '—'}
    </span>
  );
};

const MetaSeparator = () => <span className="w-px h-3 bg-tertiary" />;

const MetaTag: FC<{ label: string; value: string; className?: string }> = ({ label, value, className }) => (
  <span className="inline-flex items-center gap-1 text-[11px] text-secondary">
    {label} <span className={`font-medium text-primary ${className ?? ''}`}>{value}</span>
  </span>
);

const ExecutionStatusBar: FC<Props> = ({ status, httpCode, durationMs, timestamp, timestampLabel, grafanaUrl }) => {
  const t = useI18n();
  const httpClass = getTestCaseStatusClass(httpCode);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 py-2.5 border-b border-tertiary">
        <StatusPill status={status} />
        <MetaSeparator />
        <MetaTag label="HTTP" value={httpCode != null ? String(httpCode) : '—'} className={httpClass} />
        <MetaSeparator />
        <MetaTag label="Duration" value={getFormattedDuration(durationMs)} />
        {timestamp != null && (
          <>
            <MetaSeparator />
            <MetaTag label={timestampLabel ?? 'Started'} value={formatDateTimeToLocalString(timestamp)} />
          </>
        )}
      </div>
      {grafanaUrl && (
        <DialLinkButton
          className="w-fit mt-1.5"
          iconBefore={<Grafana />}
          label={t(RunsI18nKey.GrafanaDetails)}
          onClick={() => window.open(grafanaUrl, '_blank')}
        />
      )}
    </div>
  );
};

export default ExecutionStatusBar;
