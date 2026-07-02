'use client';

import { IHeaderParams } from 'ag-grid-community';
import { FC } from 'react';

import { HEAT_MAP_HEADER_LABEL_BOTTOM_PADDING } from '@/src/components/Runs/Compare/HeatMap/constants';

interface Props extends IHeaderParams {
  label?: string;
}

const HeatMapTestCaseHeader: FC<Props> = ({ displayName, label }) => {
  const headerLabel = label ?? displayName;

  return (
    <div
      className="flex h-full w-full items-end justify-center"
      style={{ paddingBottom: HEAT_MAP_HEADER_LABEL_BOTTOM_PADDING }}
    >
      <span
        className="dial-small-semi-text text-secondary whitespace-nowrap"
        style={{
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          lineHeight: '20px',
        }}
      >
        {headerLabel}
      </span>
    </div>
  );
};

export default HeatMapTestCaseHeader;
