'use client';

import { FC } from 'react';

import { Tooltip } from '@epam/ai-dial-ui-kit';

import { formatTrendAxisRunName } from '@/src/components/TestSuites/Trends/utils/format';

/** Max vertical extent of a rotated run-name label (Figma 12405:245295). */
export const TREND_RUN_AXIS_LABEL_HEIGHT_PX = 64;

/** Column width for two lines of 12px/16px text after -90° rotation. */
const TREND_RUN_AXIS_LABEL_COLUMN_PX = 28;

interface Props {
  /** Full original run name (shown in tooltip; display strips a leading `Run`). */
  name: string;
  triggerClassName?: string;
}

/**
 * Always-vertical run-name glyph for Trends x-axes (Figma 12405:245295):
 * -90°, 64px max height, two-line wrap then ellipsis; tooltip keeps the full name.
 */
const TrendRunNameLabel: FC<Props> = ({ name, triggerClassName }) => {
  const displayName = formatTrendAxisRunName(name);

  return (
    <Tooltip tooltip={name} asChild>
      <div
        className={triggerClassName ?? 'flex h-full w-full items-center justify-center overflow-hidden cursor-default'}
      >
        <div
          className="flex items-center justify-center overflow-hidden"
          style={{ height: TREND_RUN_AXIS_LABEL_HEIGHT_PX, width: TREND_RUN_AXIS_LABEL_COLUMN_PX }}
        >
          <div className="-rotate-90">
            <span
              className="dial-tiny-text line-clamp-2 block w-16 text-center leading-4 text-secondary"
              style={{ maxHeight: 32 }}
            >
              {displayName}
            </span>
          </div>
        </div>
      </div>
    </Tooltip>
  );
};

export default TrendRunNameLabel;
