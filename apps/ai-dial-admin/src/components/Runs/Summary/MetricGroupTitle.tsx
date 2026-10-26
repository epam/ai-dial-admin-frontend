'use client';

import { FC } from 'react';

import { Tooltip } from '@epam/ai-dial-ui-kit';

interface Props {
  name: string;
  description?: string;
}

// `DialAnalyticsBarGroup`'s own `titleTooltip` wraps the title in a `truncate` trigger, so a long
// metric name gets clipped; rendering the tooltip here lets the name wrap instead.
const MetricGroupTitle: FC<Props> = ({ name, description }) => (
  <Tooltip tooltip={description} hideTooltip={!description} triggerClassName="text-start break-words">
    {name}
  </Tooltip>
);

export default MetricGroupTitle;
