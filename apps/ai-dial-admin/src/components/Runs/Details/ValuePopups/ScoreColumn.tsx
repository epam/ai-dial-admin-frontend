'use client';

import { FC } from 'react';

import { EllipsisTooltip } from '@epam/ai-dial-ui-kit';

import CompareRunIndexBadge from '@/src/components/Runs/Compare/CompareRunIndexBadge';
import MetricInfoCard from '@/src/components/Runs/Details/ValuePopups/MetricInfoCard';
import { MetricInfoSection, ScoreRunData } from '@/src/components/Runs/Details/ValuePopups/models';
import ScoreChip from '@/src/components/Runs/Details/ValuePopups/ScoreChip';
import { getScoreCards } from '@/src/components/Runs/Details/ValuePopups/utils';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TextDiffRange } from '@/src/models/text-diff';

interface Props {
  data: ScoreRunData;
  hasRunHeader: boolean;
  openCardId: string | null;
  reasonHighlights: TextDiffRange[];
  onToggleCard: (cardId: string) => void;
}

const ScoreColumn: FC<Props> = ({ data, hasRunHeader, openCardId, reasonHighlights, onToggleCard }) => {
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
          {getScoreCards(data, t).map((card) => (
            <MetricInfoCard
              key={card.id}
              title={card.title}
              info={card.info}
              isOpen={openCardId === card.id}
              onToggle={() => onToggleCard(card.id)}
              highlights={card.section === MetricInfoSection.Reason ? reasonHighlights : undefined}
            />
          ))}
        </>
      )}
    </section>
  );
};

export default ScoreColumn;
