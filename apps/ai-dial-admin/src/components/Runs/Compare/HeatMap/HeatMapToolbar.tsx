'use client';

import {
  DialCheckbox,
  DialDropdown,
  DialEllipsisTooltip,
  DialSearch,
  DialSegmentedControl,
  ElementSize,
  SegmentedControlOption,
} from '@epam/ai-dial-ui-kit';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { FC, useCallback, useMemo, useState } from 'react';

import {
  HEAT_MAP_METRICS_DROPDOWN_MAX_HEIGHT,
  HEAT_MAP_METRICS_SEARCH_THRESHOLD,
} from '@/src/components/Runs/Compare/HeatMap/constants';
import { HeatMapColorDisplayMode } from '@/src/components/Runs/Compare/HeatMap/models';
import {
  filterMetricGroupsBySearch,
  formatHeatMapMetricsTriggerLabel,
  getMetricGroupsCheckState,
  MetricGroupsCheckState,
  toggleAllMetricGroups,
  toggleMetricGroup,
} from '@/src/components/Runs/Compare/HeatMap/utils/heat-map-metric-selection';
import { BasicI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  availableMetricGroups: string[];
  selectedMetricGroups: Set<string>;
  onSelectedMetricGroupsChange: (groups: Set<string>) => void;
  colorDisplayMode: HeatMapColorDisplayMode;
  onColorDisplayModeChange: (mode: HeatMapColorDisplayMode) => void;
}

const HeatMapToolbar: FC<Props> = ({
  availableMetricGroups,
  selectedMetricGroups,
  onSelectedMetricGroupsChange,
  colorDisplayMode,
  onColorDisplayModeChange,
}) => {
  const t = useI18n();
  const [isMetricsDropdownOpen, setIsMetricsDropdownOpen] = useState(false);
  const [metricsSearchQuery, setMetricsSearchQuery] = useState('');

  const isSearchVisible = availableMetricGroups.length >= HEAT_MAP_METRICS_SEARCH_THRESHOLD;

  const allCheckState = useMemo(
    () => getMetricGroupsCheckState(selectedMetricGroups, availableMetricGroups),
    [selectedMetricGroups, availableMetricGroups],
  );

  const filteredMetricGroups = useMemo(
    () => filterMetricGroupsBySearch(metricsSearchQuery, availableMetricGroups),
    [metricsSearchQuery, availableMetricGroups],
  );

  const triggerLabel = useMemo(
    () => formatHeatMapMetricsTriggerLabel(selectedMetricGroups, availableMetricGroups, t),
    [selectedMetricGroups, availableMetricGroups, t],
  );

  const chevronIcon = useMemo(
    () =>
      isMetricsDropdownOpen ? (
        <IconChevronUp size={16} className="shrink-0 text-secondary" aria-hidden />
      ) : (
        <IconChevronDown size={16} className="shrink-0 text-secondary" aria-hidden />
      ),
    [isMetricsDropdownOpen],
  );

  const onMetricsDropdownOpenChange = useCallback((open: boolean) => {
    setIsMetricsDropdownOpen(open);

    if (!open) {
      setMetricsSearchQuery('');
    }
  }, []);

  const onToggleAll = useCallback(() => {
    onSelectedMetricGroupsChange(toggleAllMetricGroups(selectedMetricGroups, availableMetricGroups));
  }, [onSelectedMetricGroupsChange, selectedMetricGroups, availableMetricGroups]);

  const onToggleGroup = useCallback(
    (groupKey: string, value?: boolean) => {
      if (value === undefined) {
        return;
      }

      onSelectedMetricGroupsChange(toggleMetricGroup(selectedMetricGroups, groupKey));
    },
    [onSelectedMetricGroupsChange, selectedMetricGroups],
  );

  const colorDisplayOptions = useMemo<SegmentedControlOption<HeatMapColorDisplayMode>[]>(
    () => [
      { value: HeatMapColorDisplayMode.Absolute, label: t(RunsI18nKey.RunCompareAbsoluteValues) },
      { value: HeatMapColorDisplayMode.Delta, label: t(RunsI18nKey.RunCompareDelta) },
    ],
    [t],
  );

  const isMetricsDropdownDisabled = availableMetricGroups.length === 0;

  return (
    <div className="flex items-center gap-4 shrink-0">
      <DialDropdown
        listClassName="w-[280px]"
        disabled={isMetricsDropdownDisabled}
        onOpenChange={onMetricsDropdownOpenChange}
        renderOverlay={() => (
          <div className="bg-layer-0 rounded shadow flex flex-col w-[280px]">
            {isSearchVisible && (
              <div className="pt-2 px-2 pb-1">
                <DialSearch
                  id="heat-map-metrics-search"
                  value={metricsSearchQuery}
                  onChange={setMetricsSearchQuery}
                  placeholder={t(BasicI18nKey.Search)}
                  size={ElementSize.Small}
                />
              </div>
            )}
            <div className="flex h-[34px] items-center px-3">
              <DialCheckbox
                checked={allCheckState === MetricGroupsCheckState.Checked}
                indeterminate={allCheckState === MetricGroupsCheckState.Indeterminate}
                id="heat-map-metrics-all"
                label={t(RunsI18nKey.RunCompareHeatMapMetricsOptionAll)}
                onChange={onToggleAll}
              />
            </div>
            <div className="flex flex-col overflow-y-auto" style={{ maxHeight: HEAT_MAP_METRICS_DROPDOWN_MAX_HEIGHT }}>
              {filteredMetricGroups.map((groupKey) => (
                <div key={groupKey} className="flex h-[34px] items-center pl-10 pr-3">
                  <DialCheckbox
                    checked={selectedMetricGroups.has(groupKey)}
                    id={`heat-map-metric-${groupKey}`}
                    label={groupKey}
                    onChange={(value) => onToggleGroup(groupKey, value)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      >
        <button
          type="button"
          disabled={isMetricsDropdownDisabled}
          className="inline-flex items-center gap-1 rounded-sm bg-layer-3 px-1.5 py-1 dial-small-text text-primary max-w-[280px] disabled:opacity-70 disabled:cursor-not-allowed"
          aria-disabled={isMetricsDropdownDisabled}
        >
          <DialEllipsisTooltip text={triggerLabel} className="truncate" />
          {chevronIcon}
        </button>
      </DialDropdown>

      <div className="flex items-center gap-1">
        <span className="dial-small-text text-secondary whitespace-nowrap">
          {t(RunsI18nKey.RunCompareColorDisplay)}
        </span>
        <DialSegmentedControl
          options={colorDisplayOptions}
          value={colorDisplayMode}
          onChange={onColorDisplayModeChange}
          ariaLabel={t(RunsI18nKey.RunCompareColorDisplay)}
        />
      </div>
    </div>
  );
};

export default HeatMapToolbar;
