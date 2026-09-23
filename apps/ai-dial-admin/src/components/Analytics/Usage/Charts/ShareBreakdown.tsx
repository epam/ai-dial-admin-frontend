'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { DialLinkButton, DialLoader, ElementSize, Popup, PopupSize, Search } from '@epam/ai-dial-ui-kit';

import DashboardCard from '@/src/components/Analytics/Usage/Card/DashboardCard';
import DonutFigure from '@/src/components/Analytics/Usage/Charts/DonutFigure';
import EmptyRing from '@/src/components/Analytics/Usage/Empty/EmptyRing';
import { DONUT_MODAL_SIZE, DONUT_SIZE, DONUT_SLICE_COUNT } from '@/src/components/Analytics/Usage/constants';
import { BreakdownRow, BreakdownTab, DonutSliceView, RequestState } from '@/src/components/Analytics/Usage/models';
import { getSliceColor } from '@/src/components/Analytics/Usage/utils/chart-options';
import { buildDonutSlices, getSliceShare } from '@/src/components/Analytics/Usage/utils/donut';
import { formatGroupedNumber, formatPercent } from '@/src/components/Analytics/Usage/utils/format';
import { BREAKDOWN_TAB_COLUMN_LABEL_KEY, getFallbackLabelKey } from '@/src/components/Analytics/Usage/utils/labels';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  rows: RequestState<BreakdownRow[]>;
  tab: BreakdownTab;
  windowTotal: number | null;
  /** The dialog is owned above, because opening it is what widens the request behind this card. */
  isFullOpen: boolean;
  /** Whether the window holds rows beyond the ones loaded, which is what the legend scrolls for. */
  hasMoreRows: boolean;
  isReadingMore: boolean;
  onLoadMoreRows: () => void;
  onShowAll: () => void;
  onHideAll: () => void;
}

/** Smaller than the card's own loader: it sits under a list, not in place of a figure. */
const LEGEND_LOADER_SIZE = 20;

const ShareBreakdown: FC<Props> = ({
  rows,
  tab,
  windowTotal,
  isFullOpen,
  hasMoreRows,
  isReadingMore,
  onLoadMoreRows,
  onShowAll,
  onHideAll,
}) => {
  const t = useI18n();
  const [legendFilter, setLegendFilter] = useState('');

  const otherLabel = t(AnalyticsUsageI18nKey.DonutOther);
  const fallbackKey = getFallbackLabelKey(tab);

  // One ranking read at two depths: the card names five entities, the dialog every row that came
  // back. The share is resolved here so both surfaces divide by the same window total.
  const toViews = useCallback(
    (sliceCount: number): DonutSliceView[] =>
      buildDonutSlices(rows.data ?? [], otherLabel, windowTotal, sliceCount).map((slice, index) => {
        const share = getSliceShare(slice, windowTotal);

        return {
          id: slice.id,
          label: slice.isFallbackLabel && fallbackKey ? t(fallbackKey) : slice.label,
          value: slice.value,
          isOther: slice.isOther,
          valueLabel: formatGroupedNumber(slice.value),
          shareLabel: share == null ? null : formatPercent(share, 0),
          color: getSliceColor(index, slice.isOther),
        };
      }),
    [rows.data, otherLabel, windowTotal, fallbackKey, t],
  );

  const cardSlices = useMemo(() => toViews(DONUT_SLICE_COUNT), [toViews]);
  const fullSlices = useMemo(() => toViews(rows.data?.length ?? 0), [toViews, rows.data]);

  // The term narrows the list, never the ring: the reader is looking one entity up in a figure that
  // has to keep adding up to the window.
  const filteredSlices = useMemo(() => {
    const term = legendFilter.trim().toLowerCase();

    return term ? fullSlices.filter((slice) => slice.label.toLowerCase().includes(term)) : fullSlices;
  }, [fullSlices, legendFilter]);

  const isEmptyWindow = !rows.isLoading && (rows.hasFailed || cardSlices.length === 0);
  const total = windowTotal == null ? null : formatGroupedNumber(windowTotal);
  const centerValue = total;
  const centerCaption = t(AnalyticsUsageI18nKey.DonutTotal);
  const searchPlaceholder = t(AnalyticsUsageI18nKey.SearchPlaceholder, {
    dimension: t(BREAKDOWN_TAB_COLUMN_LABEL_KEY[tab]),
  });

  const onCloseFull = useCallback(() => {
    onHideAll();
    setLegendFilter('');
  }, [onHideAll]);

  const renderFigure = () => {
    if (rows.isLoading) {
      return <DialLoader size={24} />;
    }

    if (isEmptyWindow) {
      return (
        <div className="flex justify-center">
          <EmptyRing size={DONUT_SIZE}>
            <span className="dial-display2-text text-secondary">—</span>
            <span className="dial-small-text text-secondary">{t(AnalyticsUsageI18nKey.DonutEmptyCenter)}</span>
          </EmptyRing>
        </div>
      );
    }

    return (
      <DonutFigure slices={cardSlices} centerValue={centerValue} centerCaption={centerCaption} size={DONUT_SIZE} />
    );
  };

  return (
    <DashboardCard
      title={t(AnalyticsUsageI18nKey.DonutTitle)}
      subtitle={
        isEmptyWindow
          ? t(AnalyticsUsageI18nKey.DonutEmptySubtitle)
          : t(AnalyticsUsageI18nKey.DonutSubtitle, { count: String(DONUT_SLICE_COUNT) })
      }
      headerActions={
        cardSlices.length > 0 && <DialLinkButton label={t(AnalyticsUsageI18nKey.ViewAll)} onClick={onShowAll} />
      }
      className="flex-[1_1_320px]"
    >
      {renderFigure()}

      <Popup
        open={isFullOpen}
        size={PopupSize.Md}
        header={t(AnalyticsUsageI18nKey.DonutTitle)}
        headerActions={
          <div className="w-[240px]">
            <Search
              id="donut-legend-search"
              size={ElementSize.Small}
              value={legendFilter}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              onChange={(next) => setLegendFilter(next ?? '')}
            />
          </div>
        }
        onClose={onCloseFull}
      >
        <div className="px-6 pb-4">
          {/* The ring draws every row read so far, not the card's five: the dialog is where the
              long tail is being read, and a ring that kept folding it into one slice answered the
              question the card had already answered. Its residual shrinks as the legend reads on. */}
          <DonutFigure
            slices={fullSlices}
            legendSlices={filteredSlices}
            centerValue={centerValue}
            centerCaption={centerCaption}
            size={DONUT_MODAL_SIZE}
            legendClassName="max-h-[320px] overflow-y-auto pr-1"
            // Not while a block is in flight: a scroll fires an event per frame, and each one
            // stepped the limit again, so one flick sent a request per step.
            onLegendEndReached={hasMoreRows && !isReadingMore ? onLoadMoreRows : void 0}
          />
          {/* Under the list rather than over it: the rows already read stay where the reader left
              them, and the spinner says the next ones are on their way. */}
          {isReadingMore && (
            <div className="flex justify-center pt-3">
              <DialLoader size={LEGEND_LOADER_SIZE} />
            </div>
          )}
        </div>
      </Popup>
    </DashboardCard>
  );
};

export default ShareBreakdown;
