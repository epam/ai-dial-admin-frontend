'use client';

import { FC } from 'react';

import { PassFailErrorCounts } from '@/src/components/Common/PassFailStatus/models';

interface Props {
  counts: PassFailErrorCounts;
}

const PassFailFraction: FC<Props> = ({ counts }) => (
  <div className="flex items-baseline gap-1">
    <span className="dial-display2-text text-primary">{counts.passed}</span>
    <span className="dial-body-text text-secondary">/ {counts.total}</span>
  </div>
);

export default PassFailFraction;
