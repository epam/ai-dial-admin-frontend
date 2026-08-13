'use client';

import { DialLoader } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

const LOADER_SIZE = 40;

interface Props {
  label: string;
}

const LoadingOverlay: FC<Props> = ({ label }) => (
  <div role="status" aria-live="polite" className="absolute inset-0 flex items-center justify-center bg-layer-2">
    <DialLoader size={LOADER_SIZE} />
    <span className="sr-only">{label}</span>
  </div>
);

export default LoadingOverlay;
