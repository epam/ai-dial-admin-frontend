'use client';

import { AlertVariant, DialNeutralButton, ElementSize } from '@epam/ai-dial-ui-kit';
import { FC, ReactNode } from 'react';

import EntityBanner from '@/src/components/Deployments/Common/EntityBanner/EntityBanner';

interface Props {
  message: ReactNode;
  buttonLabel: string;
  onAddToAllowed: () => void;
  className?: string;
}

const BlockedDomainBanner: FC<Props> = ({ message, buttonLabel, onAddToAllowed, className }) => {
  return (
    <EntityBanner className={className} variant={AlertVariant.Error} message={message}>
      <DialNeutralButton className="shrink-0" size={ElementSize.Small} label={buttonLabel} onClick={onAddToAllowed} />
    </EntityBanner>
  );
};

export default BlockedDomainBanner;
