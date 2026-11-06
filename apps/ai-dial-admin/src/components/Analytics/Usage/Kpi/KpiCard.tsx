'use client';

import { CSSProperties, FC, ReactNode } from 'react';

import classNames from 'classnames';

import { Badge, Spinner } from '@epam/ai-dial-ui-kit';

import DeltaBadge from '@/src/components/Analytics/Usage/Delta/DeltaBadge';
import Sparkline from '@/src/components/Analytics/Usage/Kpi/Sparkline';
import FieldCaveat from '@/src/components/Common/FieldCaveat/FieldCaveat';
import { KpiCardModel } from '@/src/components/Analytics/Usage/models';
import { AnalyticsUsageI18nKey, BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  card: KpiCardModel;
  className?: string;
  style?: CSSProperties;
  isLoading: boolean;
  /** A failed window reads as an absent figure; the notification carries what went wrong. */
  hasFailed: boolean;
  // Rendered last in the title row: a custom dashboard widget's menu.
  headerAction?: ReactNode;
}

const KpiCard: FC<Props> = ({ card, className, style, isLoading, hasFailed, headerAction }) => {
  const t = useI18n();

  const renderFigure = () => {
    if (isLoading) {
      return <Spinner size={24} fullWidth />;
    }

    // A failure and an empty window read the same on a card: no figure to state. What went wrong
    // is said once, in a notification, rather than seven times across the row.
    if (hasFailed || card.value == null) {
      return (
        <>
          <span aria-label={t(BasicI18nKey.NoData)} className="my-2 h-0.5 w-7 rounded bg-controls-disable" />
          <div className="h-[34px]" />
        </>
      );
    }

    return (
      <>
        <div className="flex items-baseline gap-1">
          <span className="dial-display2-text leading-none text-primary">{card.value}</span>
          {card.unit && <span className="dial-small-semi-text text-secondary">{card.unit}</span>}
        </div>
        {/* The slot keeps its height with or without a line, so every card's footnote sits level. */}
        <div className="h-[34px]">
          <Sparkline points={card.sparkline} />
        </div>
      </>
    );
  };

  return (
    <div
      className={classNames(
        'flex flex-col gap-2.5 rounded border border-secondary bg-layer-2 px-4 pb-3 pt-4 shadow-xs',
        className,
      )}
      style={style}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1">
          <span className="dial-tiny-text text-secondary">{card.title ?? t(card.titleKey)}</span>
          {card.hint && <FieldCaveat hint={card.hint} />}
        </span>
        <div className="flex items-center gap-1">
          {card.deltaRatio == null && card.isNew && <Badge label={t(AnalyticsUsageI18nKey.RowIsNew)} />}
          {card.deltaRatio != null && (
            <DeltaBadge ratio={card.deltaRatio} metric={card.metric} isRiseGood={card.isRiseGood} />
          )}
          {headerAction}
        </div>
      </div>

      {renderFigure()}

      {card.footnote && <span className="mt-auto dial-tiny-text text-secondary">{card.footnote}</span>}
    </div>
  );
};

export default KpiCard;
