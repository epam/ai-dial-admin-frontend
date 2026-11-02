'use client';

import { FC } from 'react';

import { EllipsisTooltip } from '@epam/ai-dial-ui-kit';

import CompareRunIndexBadge from '@/src/components/Runs/Compare/CompareRunIndexBadge';
import { METRIC_INFO_SECTION_I18N } from '@/src/components/Runs/Details/ValuePopups/constants';
import MetricInfoCard from '@/src/components/Runs/Details/ValuePopups/MetricInfoCard';
import { MetricInfoSection, ScoreRunData } from '@/src/components/Runs/Details/ValuePopups/models';
import ScoreChip from '@/src/components/Runs/Details/ValuePopups/ScoreChip';
import { ErrorI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TextDiffRange } from '@/src/models/text-diff';

interface Props {
  data: ScoreRunData;
  hasRunHeader: boolean;
  openSection: MetricInfoSection | null;
  reasonHighlights: TextDiffRange[];
  onToggleSection: (section: MetricInfoSection) => void;
}

const INFO_SECTIONS = [MetricInfoSection.Reason, MetricInfoSection.Logs];

const ScoreColumn: FC<Props> = ({ data, hasRunHeader, openSection, reasonHighlights, onToggleSection }) => {
  const t = useI18n();
  const { run, label, isMissing, raw, isFailed } = data;

  return (
    <section aria-label={label} className="flex flex-col min-h-0 min-w-0 gap-3 px-6 py-4">
      {hasRunHeader && (
        <div className="flex items-center gap-2 min-w-0 dial-small-text text-secondary">
          <CompareRunIndexBadge runIndex={run.index} />
          <EllipsisTooltip text={label} className="text-secondary" />
        </div>
      )}
      {isMissing ? (
        <span className="text-secondary dial-small-text">{t(RunsI18nKey.RunCompareNoMatch)}</span>
      ) : (
        <>
          <div className="flex flex-col gap-2 rounded bg-layer-2 px-4 py-3 shrink-0">
            <span className="dial-tiny-text text-secondary">{t(RunsI18nKey.MetricScoreLabel)}</span>
            <ScoreChip raw={raw} isFailed={isFailed} />
          </div>
          {INFO_SECTIONS.map((section) => {
            const info = data[section];
            // A run with nothing under a section gets no card for it.
            if (!info) return null;

            const isErrorCard = section === MetricInfoSection.Reason && data.isReasonError;

            return (
              <MetricInfoCard
                key={section}
                title={isErrorCard ? t(ErrorI18nKey.Error) : t(METRIC_INFO_SECTION_I18N[section])}
                info={info}
                isOpen={openSection === section}
                onToggle={() => onToggleSection(section)}
                highlights={section === MetricInfoSection.Reason ? reasonHighlights : undefined}
              />
            );
          })}
        </>
      )}
    </section>
  );
};

export default ScoreColumn;
