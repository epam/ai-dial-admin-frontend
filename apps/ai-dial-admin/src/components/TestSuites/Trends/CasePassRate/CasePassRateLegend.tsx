'use client';

import classNames from 'classnames';
import { FC } from 'react';

import { STATUS_DOT_CLASSES, STATUS_DOT_ICONS } from '@/src/components/Common/PassFailStatus/constants';
import { SEGMENT_ICON_SIZE } from '@/src/components/TestSuites/Trends/CasePassRate/constants';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

/**
 * Colour key for the bar segments. Carries no counts — the numbers belong to the latest-run
 * readout, and repeating them here would read as a window total.
 */
const CasePassRateLegend: FC = () => {
  const t = useI18n();

  const entries = [
    { key: 'pass', label: t(RunsI18nKey.Pass) },
    { key: 'fail', label: t(RunsI18nKey.Fail) },
    { key: 'error', label: t(RunsI18nKey.ExecError) },
    { key: 'notScored', label: t(RunsI18nKey.NotScored) },
  ] as const;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 dial-tiny-text">
      {entries.map(({ key, label }) => {
        const StatusIcon = STATUS_DOT_ICONS[key];
        return (
          <span key={key} className={classNames('flex items-center gap-1', STATUS_DOT_CLASSES[key])}>
            <StatusIcon aria-hidden size={SEGMENT_ICON_SIZE} />
            {label}
          </span>
        );
      })}
    </div>
  );
};

export default CasePassRateLegend;
