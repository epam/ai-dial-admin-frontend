'use client';

import { FC, useMemo } from 'react';

import DiffLegend from '@/src/components/ActivityAudit/View/DiffReport/DiffLegend';
import { countCompareDiffs } from '@/src/components/Runs/Compare/compare-metric-utils';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  rows: CompareAnalyticsRow[];
}

const CompareDiffLegend: FC<Props> = ({ rows }) => {
  const t = useI18n();
  const counts = useMemo(() => countCompareDiffs(rows), [rows]);

  return (
    <div className="flex items-center gap-2">
      <span className="dial-tiny-text text-secondary whitespace-nowrap">{t(RunsI18nKey.RunCompareDiffLabel)}</span>
      <DiffLegend added={counts.improved} changed={counts.changed} removed={counts.regressed} />
    </div>
  );
};

export default CompareDiffLegend;
