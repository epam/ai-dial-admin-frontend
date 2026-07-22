'use client';

import { IHeaderParams } from 'ag-grid-community';
import { FC } from 'react';

import { DialEllipsisTooltip, DialTooltip } from '@epam/ai-dial-ui-kit';

import {
  HEAT_MAP_HEADER_LABEL_BOTTOM_PADDING,
  HEAT_MAP_HEADER_LABEL_TOP_PADDING,
  HEAT_MAP_HEADER_LABEL_VERTICAL_PADDING,
  HEAT_MAP_HEADER_VERTICAL_FONT_SIZE,
  HEAT_MAP_HEADER_VERTICAL_LINE_HEIGHT,
} from '@/src/components/Runs/Compare/HeatMap/constants';
import { shouldShowHeatMapCellValue } from '@/src/components/Runs/Compare/HeatMap/utils/format-heat-map-cell-value';
import { measureVerticalHeatMapHeaderLabelHeight } from '@/src/components/Runs/Compare/HeatMap/utils/heat-map-layout';

interface Props extends IHeaderParams {
  label?: string;
}

const HeatMapTestCaseHeader: FC<Props> = ({ displayName, label, column, api }) => {
  const headerLabel = label ?? displayName;
  const columnWidth = column?.getActualWidth() ?? 0;
  const isHorizontal = shouldShowHeatMapCellValue(columnWidth);

  if (isHorizontal) {
    return (
      <div className="flex h-full w-full min-w-0 items-center justify-center px-1">
        <DialEllipsisTooltip
          text={headerLabel}
          className="min-w-0 max-w-full dial-small-semi-text text-secondary"
          contentClassName="truncate"
        />
      </div>
    );
  }

  const headerHeight = (api?.getGridOption?.('headerHeight') as number | undefined) ?? 0;
  const hideTooltip =
    measureVerticalHeatMapHeaderLabelHeight(headerLabel) + HEAT_MAP_HEADER_LABEL_VERTICAL_PADDING <= headerHeight;

  return (
    <div
      className="flex h-full w-full justify-center items-end"
      style={{
        paddingTop: HEAT_MAP_HEADER_LABEL_TOP_PADDING,
        paddingBottom: HEAT_MAP_HEADER_LABEL_BOTTOM_PADDING,
      }}
    >
      <DialTooltip tooltip={headerLabel} hideTooltip={hideTooltip} triggerClassName="min-w-0 max-h-full">
        <span
          className="font-semibold text-secondary whitespace-nowrap truncate"
          style={{
            display: 'inline-block',
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            transformOrigin: 'center center',
            fontSize: `${HEAT_MAP_HEADER_VERTICAL_FONT_SIZE}px`,
            lineHeight: `${HEAT_MAP_HEADER_VERTICAL_LINE_HEIGHT}px`,
            maxHeight: '100%',
          }}
        >
          {headerLabel}
        </span>
      </DialTooltip>
    </div>
  );
};

export default HeatMapTestCaseHeader;
