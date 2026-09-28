'use client';

import classNames from 'classnames';
import { FC } from 'react';

import { SpanFactRowProps as Props } from '@/src/models/analytics/sessions-trace';

const SpanFactRow: FC<Props> = ({ label, value, isMono, valueClassName }) => (
  <div className="flex flex-col py-1">
    <span className="text-secondary dial-tiny-text">{label}</span>
    <span className={classNames('break-all dial-tiny-text', isMono && 'font-mono', valueClassName ?? 'text-primary')}>
      {value}
    </span>
  </div>
);

export default SpanFactRow;
