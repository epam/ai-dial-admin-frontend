'use client';

import { IHeaderParams } from 'ag-grid-community';
import classNames from 'classnames';
import { FC } from 'react';

import {
  HEAT_MAP_HEADER_LABEL_BOTTOM_PADDING,
  HEAT_MAP_HEADER_LABEL_LINE_HEIGHT,
  HEAT_MAP_HEADER_LABEL_TOP_PADDING,
} from '@/src/components/Runs/Compare/HeatMap/constants';
import { shouldShowHeatMapCellValue } from '@/src/components/Runs/Compare/HeatMap/utils/format-heat-map-cell-value';

interface Props extends IHeaderParams {
  label?: string;
}

const HeatMapTestCaseHeader: FC<Props> = ({ displayName, label, column }) => {
  const headerLabel = label ?? displayName;
  const columnWidth = column?.getActualWidth() ?? 0;
  const isHorizontal = shouldShowHeatMapCellValue(columnWidth);

  return (
    <div
      className={classNames('flex h-full w-full justify-center', isHorizontal ? 'items-center px-1' : 'items-end')}
      style={
        isHorizontal
          ? undefined
          : {
              paddingTop: HEAT_MAP_HEADER_LABEL_TOP_PADDING,
              paddingBottom: HEAT_MAP_HEADER_LABEL_BOTTOM_PADDING,
            }
      }
    >
      <span
        className="dial-small-semi-text text-secondary whitespace-nowrap truncate"
        style={
          isHorizontal
            ? { lineHeight: `${HEAT_MAP_HEADER_LABEL_LINE_HEIGHT}px` }
            : {
                display: 'inline-block',
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                transformOrigin: 'center center',
                lineHeight: `${HEAT_MAP_HEADER_LABEL_LINE_HEIGHT}px`,
              }
        }
      >
        {headerLabel}
      </span>
    </div>
  );
};

export default HeatMapTestCaseHeader;
