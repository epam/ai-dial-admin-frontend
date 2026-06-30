'use client';

import { FC } from 'react';

import classNames from 'classnames';

import BaseDiffLegend from '@/src/components/Common/DiffLegend/DiffLegend';
import { CompareDiffCounts } from '@/src/components/Runs/Compare/ExecutionResults/models';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  counts: CompareDiffCounts;
  className?: string;
}

const DiffLegend: FC<Props> = ({ counts, className }) => {
  const t = useI18n();

  return (
    <div className={classNames('flex items-center gap-2', className)}>
      <span className="dial-tiny-text text-secondary whitespace-nowrap">{t(RunsI18nKey.RunCompareDiffLabel)}</span>
      <BaseDiffLegend added={counts.improved} changed={counts.changed} removed={counts.regressed} />
    </div>
  );
};

export default DiffLegend;
