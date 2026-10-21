'use client';

import { DialLoader } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

const LOADER_SIZE = 40;

interface Props {
  label: string;
}

// `z-20` because an overlay with no stacking level does not reliably cover what it overlays: a positioned
// descendant of the content paints above it. ui-kit's segmented control gives its *selected* segment
// `relative z-10` so that segment's border overlaps its neighbour's — which left the selected segment, and
// only that one, floating over this overlay while everything around it was covered.
const LoadingOverlay: FC<Props> = ({ label }) => (
  <div role="status" aria-live="polite" className="absolute inset-0 z-20 flex items-center justify-center bg-layer-2">
    <DialLoader size={LOADER_SIZE} />
    <span className="sr-only">{label}</span>
  </div>
);

export default LoadingOverlay;
