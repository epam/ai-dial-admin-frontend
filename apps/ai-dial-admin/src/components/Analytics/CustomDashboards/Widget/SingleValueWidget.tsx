'use client';

import { FC, ReactNode, useMemo } from 'react';

import classNames from 'classnames';

import { formatCardFigure } from '@/src/components/Analytics/CustomDashboards/utils/value-format';
import { buildSingleValueFigure } from '@/src/components/Analytics/CustomDashboards/utils/widget-view-options';
import KpiCard from '@/src/components/Analytics/Usage/Kpi/KpiCard';
import { ComparePeriod, KpiCardModel } from '@/src/components/Analytics/Usage/models';
import { COMPARE_NAME_KEY } from '@/src/components/Analytics/Usage/utils/labels';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { WidgetValueFormat } from '@/src/models/analytics/dashboard';
import { StructuredQueryResult } from '@/src/models/analytics/query';

interface Props {
  title: string;
  description?: string;
  column: string;
  result: StructuredQueryResult | null;
  previousResult: StructuredQueryResult | null;
  compare: ComparePeriod;
  isLoading: boolean;
  sparkline: number[];
  isRiseGood: boolean;
  valueFormat?: WidgetValueFormat;
  currency?: string;
  // The widget menu, in the card's title row.
  menu: ReactNode;
  // The whole card is the drag handle in edit mode: it has no header of its own to hold one.
  dragHandleClassName?: string;
}

/** One figure, drawn with the usage dashboard's own KPI card so the two dashboards read alike. */
const SingleValueWidget: FC<Props> = ({
  title,
  description,
  column,
  result,
  previousResult,
  compare,
  isLoading,
  sparkline,
  isRiseGood,
  valueFormat,
  currency,
  menu,
  dragHandleClassName,
}) => {
  const t = useI18n();
  const isComparisonOn = compare !== ComparePeriod.Off;

  const card = useMemo((): KpiCardModel => {
    const { value, previous, deltaRatio } = buildSingleValueFigure(result?.rows ?? [], column, previousResult?.rows);
    const formatted = value == null ? null : formatCardFigure(value, valueFormat, currency);
    const formattedPrevious = previous == null ? null : formatCardFigure(previous, valueFormat, currency);

    return {
      titleKey: '',
      title,
      hint: description,
      value: formatted?.value ?? null,
      unit: formatted?.unit,
      deltaRatio: isComparisonOn ? deltaRatio : null,
      isRiseGood,
      isNew: isComparisonOn && previous === 0 && (value ?? 0) > 0,
      footnote: isComparisonOn
        ? t(AnalyticsUsageI18nKey.KpiComparisonFoot, {
            value: formattedPrevious ? `${formattedPrevious.value}${formattedPrevious.unit ?? ''}` : '—',
            period: t(COMPARE_NAME_KEY[compare]),
          })
        : undefined,
      sparkline,
    };
  }, [
    result,
    previousResult,
    column,
    title,
    description,
    compare,
    isComparisonOn,
    isRiseGood,
    sparkline,
    valueFormat,
    currency,
    t,
  ]);

  return (
    <section
      aria-label={title}
      className={classNames('size-full', dragHandleClassName && [dragHandleClassName, 'cursor-move'])}
    >
      <KpiCard card={card} className="size-full" isLoading={isLoading} hasFailed={false} headerAction={menu} />
    </section>
  );
};

export default SingleValueWidget;
