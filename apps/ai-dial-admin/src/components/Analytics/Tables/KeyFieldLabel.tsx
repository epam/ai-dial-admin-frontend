'use client';

import { FC } from 'react';

import FieldCaveat from '@/src/components/Common/FieldCaveat/FieldCaveat';

interface Props {
  label: string;
  hint: string;
}

// The draft-schema surface and the ACTIVE header summary show the same physical keys, so they share one
// label so the explanation cannot drift between where a key is chosen and where it is read.
const KeyFieldLabel: FC<Props> = ({ label, hint }) => (
  <span className="flex items-center gap-1">
    <span>{label}</span>
    <FieldCaveat hint={hint} />
  </span>
);

export default KeyFieldLabel;
