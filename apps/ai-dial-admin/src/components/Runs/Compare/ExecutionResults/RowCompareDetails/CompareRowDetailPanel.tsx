'use client';

import { FC, useEffect, useMemo, useState } from 'react';

import classNames from 'classnames';
import { DialLoader } from '@epam/ai-dial-ui-kit';

import { getTestCaseRunResultDetails } from '@/src/app/[lang]/runs/actions';
import CompareRowDetailHeader from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareRowDetailHeader';
import CompareRowDetailTable from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareRowDetailTable';
import DiffLegend from '@/src/components/Runs/Compare/ExecutionResults/DiffLegend';
import {
  buildRowDetailSections,
  countRowDetailDiffs,
  getCompareRowDetailTitle,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/row-detail-sections';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsResult } from '@/src/models/evaluation/run';

interface Props {
  row: CompareAnalyticsRow;
  primaryRunName: string;
  comparedRunName: string;
  onClose: () => void;
  className?: string;
}

const CompareRowDetailPanel: FC<Props> = ({ row, primaryRunName, comparedRunName, onClose, className }) => {
  const t = useI18n();
  const [primaryDetail, setPrimaryDetail] = useState<AnalyticsResult | null>(null);
  const [comparedDetail, setComparedDetail] = useState<AnalyticsResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const comparedId = row._compared?.id ?? null;
  const hasComparedMatch = comparedId != null;
  const title = getCompareRowDetailTitle(row);

  useEffect(() => {
    if (!row.id) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    let isCancelled = false;

    setIsLoading(true);
    setHasError(false);
    setPrimaryDetail(null);
    setComparedDetail(null);

    const primaryPromise = getTestCaseRunResultDetails(row.id);
    const comparedPromise = comparedId ? getTestCaseRunResultDetails(comparedId) : Promise.resolve(null);

    Promise.all([primaryPromise, comparedPromise])
      .then(([primary, compared]) => {
        if (isCancelled) return;
        if (!primary) {
          setHasError(true);
          return;
        }
        setPrimaryDetail(primary);
        setComparedDetail(compared);
      })
      .catch(() => {
        if (!isCancelled) {
          setHasError(true);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [row.id, comparedId]);

  const sections = useMemo(() => {
    if (!primaryDetail) return [];
    return buildRowDetailSections(primaryDetail, comparedDetail);
  }, [primaryDetail, comparedDetail]);

  const counts = useMemo(() => countRowDetailDiffs(sections), [sections]);

  return (
    <div className={classNames('flex flex-col w-full h-full min-h-0 overflow-hidden bg-layer-0', className)}>
      <CompareRowDetailHeader title={title} onClose={onClose} />

      <div className="flex flex-col flex-1 min-h-0 gap-4 px-6 pb-6 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <DialLoader size={40} />
          </div>
        ) : hasError ? (
          <p className="text-secondary dial-small-text">{t(RunsI18nKey.LoadError)}</p>
        ) : (
          <>
            <CompareRowDetailTable
              key={row.id}
              sections={sections}
              primaryRunName={primaryRunName}
              comparedRunName={comparedRunName}
              hasComparedMatch={hasComparedMatch}
            />
            <DiffLegend counts={counts} className="shrink-0" />
          </>
        )}
      </div>
    </div>
  );
};

export default CompareRowDetailPanel;
