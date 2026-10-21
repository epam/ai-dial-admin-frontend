'use client';

import { ElementSize } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { FC } from 'react';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { SpanFactRowProps as Props } from '@/src/models/analytics/sessions-trace';

const SpanFactRow: FC<Props> = ({ label, value, isMono, valueClassName, copyText }) => (
  <div className="flex flex-col py-1">
    <span className="text-secondary dial-tiny-text">{label}</span>
    <span className="flex items-start justify-between gap-1">
      <span className={classNames('break-all dial-tiny-text', isMono && 'font-mono', valueClassName ?? 'text-primary')}>
        {value}
      </span>
      {copyText && <CopyButton value={copyText} valueLabel={label} size={ElementSize.Small} />}
    </span>
  </div>
);

export default SpanFactRow;
