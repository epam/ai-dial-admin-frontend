'use client';

import { FC, ReactNode, useEffect, useId, useRef } from 'react';

import { ElementSize, GhostIconButton, Select, Switch } from '@epam/ai-dial-ui-kit';
import {
  IconAdjustmentsHorizontal,
  IconChartBar,
  IconChartDots,
  IconChartLine,
  IconChartPie,
  IconLayoutSidebarRight,
  IconLayoutSidebarRightCollapse,
  IconNumber1,
} from '@tabler/icons-react';

import { ChartSlotView } from '@/src/components/Analytics/QueryBuilder/Result/models';
import { CHART_TYPE_OPTIONS } from '@/src/constants/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ChartLegendConfig, ChartLegendPosition, ChartType } from '@/src/models/analytics/query-builder';

interface Props {
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
  type: ChartType;
  types: ChartType[];
  onChangeType: (type: ChartType) => void;
  slots: ChartSlotView[];
  legend?: ChartLegendConfig;
  onChangeLegend: (legend: ChartLegendConfig) => void;
}

const ICON_SIZE = 16;

const TYPE_ICONS: Record<ChartType, ReactNode> = {
  [ChartType.Bar]: <IconChartBar size={ICON_SIZE} aria-hidden />,
  [ChartType.Line]: <IconChartLine size={ICON_SIZE} aria-hidden />,
  [ChartType.Scatter]: <IconChartDots size={ICON_SIZE} aria-hidden />,
  [ChartType.Pie]: <IconChartPie size={ICON_SIZE} aria-hidden />,
  [ChartType.Scorecard]: <IconNumber1 size={ICON_SIZE} aria-hidden />,
};

const LEGEND_POSITION_LABELS: Record<ChartLegendPosition, QueryBuilderI18nKey> = {
  [ChartLegendPosition.Above]: QueryBuilderI18nKey.ChartLegendAbove,
  [ChartLegendPosition.Right]: QueryBuilderI18nKey.ChartLegendRight,
  [ChartLegendPosition.Below]: QueryBuilderI18nKey.ChartLegendBelow,
  [ChartLegendPosition.Left]: QueryBuilderI18nKey.ChartLegendLeft,
};

const ChartFormattingPanel: FC<Props> = ({
  isOpen,
  onToggle,
  type,
  types,
  onChangeType,
  slots,
  legend,
  onChangeLegend,
}) => {
  const t = useI18n();
  const panelId = useId();
  const headingId = useId();
  const typeId = useId();
  const legendId = useId();
  const positionId = useId();
  const expandRef = useRef<HTMLButtonElement>(null);
  const collapseRef = useRef<HTMLDivElement>(null);
  const isFocusMoved = useRef(false);

  useEffect(() => {
    if (!isFocusMoved.current) return;
    isFocusMoved.current = false;
    const target = isOpen ? collapseRef.current?.querySelector('button') : expandRef.current;
    target?.focus();
  }, [isOpen]);

  const onToggleWithFocus = (next: boolean) => {
    isFocusMoved.current = true;
    onToggle(next);
  };

  if (!isOpen) {
    return (
      <button
        ref={expandRef}
        type="button"
        aria-label={t(QueryBuilderI18nKey.ChartFormattingExpand)}
        aria-expanded="false"
        className="flex w-12 shrink-0 flex-col items-center gap-4 border-l border-tertiary py-3 text-secondary hover:bg-layer-raised hover:text-primary focus-visible:bg-layer-raised focus-visible:text-primary focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
        onClick={() => onToggleWithFocus(true)}
      >
        <IconLayoutSidebarRight size={18} className="shrink-0" aria-hidden />
        <IconAdjustmentsHorizontal size={18} className="shrink-0" aria-hidden />
        <span className="text-primary dial-small-semi-text [writing-mode:vertical-rl]">
          {t(QueryBuilderI18nKey.ChartFormatting)}
        </span>
      </button>
    );
  }

  const typeOptions = CHART_TYPE_OPTIONS.filter(
    (option) => option.value === type || types.includes(option.value as ChartType),
  ).map((option) => ({ ...option, icon: TYPE_ICONS[option.value as ChartType] }));
  const positionOptions = Object.values(ChartLegendPosition).map((position) => ({
    value: position,
    label: t(LEGEND_POSITION_LABELS[position]),
  }));

  return (
    <aside
      id={panelId}
      aria-labelledby={headingId}
      className="flex w-[300px] max-w-full shrink-0 flex-col gap-4 overflow-y-auto border-l border-tertiary p-4"
    >
      <div ref={collapseRef} className="flex items-center gap-2">
        <IconAdjustmentsHorizontal size={18} className="shrink-0 text-secondary" aria-hidden />
        <h3 id={headingId} className="dial-small-semi-text text-primary">
          {t(QueryBuilderI18nKey.ChartFormatting)}
        </h3>
        <GhostIconButton
          className="ml-auto"
          size={ElementSize.Small}
          aria-label={t(QueryBuilderI18nKey.ChartFormattingCollapse)}
          aria-expanded="true"
          aria-controls={panelId}
          icon={<IconLayoutSidebarRightCollapse size={18} aria-hidden />}
          onClick={() => onToggleWithFocus(false)}
        />
      </div>

      <section className="flex flex-col gap-4" aria-label={t(QueryBuilderI18nKey.ChartDataSection)}>
        <span className="dial-tiny-semi-text uppercase text-secondary" aria-hidden>
          {t(QueryBuilderI18nKey.ChartDataSection)}
        </span>
        <Select
          id={typeId}
          labelProps={{ label: t(QueryBuilderI18nKey.ChartTypeSwitcher) }}
          options={typeOptions}
          value={type}
          onChange={(value) => onChangeType(value as ChartType)}
        />
        {slots.map((slot) => (
          <Select
            key={slot.id}
            id={slot.id}
            labelProps={{ label: slot.label }}
            options={slot.options}
            multiple={slot.isMultiple}
            collapseTagOverflow={slot.isMultiple}
            value={slot.value}
            onChange={slot.onChange}
          />
        ))}
      </section>

      {legend && (
        <section className="flex flex-col gap-4" aria-label={t(QueryBuilderI18nKey.ChartLegendSection)}>
          <Switch
            id={legendId}
            labelProps={{ label: t(QueryBuilderI18nKey.ChartLegendShow) }}
            isOn={legend.isVisible}
            onChange={(isVisible) => onChangeLegend({ ...legend, isVisible })}
          />
          <Select
            id={positionId}
            labelProps={{ label: t(QueryBuilderI18nKey.ChartLegendPosition) }}
            options={positionOptions}
            value={legend.position}
            disabled={!legend.isVisible}
            onChange={(value) => onChangeLegend({ ...legend, position: value as ChartLegendPosition })}
          />
        </section>
      )}
    </aside>
  );
};

export default ChartFormattingPanel;
