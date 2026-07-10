import { FC, ReactNode } from 'react';

interface Props {
  value: ReactNode;
  label: string;
}

const StatChip: FC<Props> = ({ value, label }) => (
  <div className="flex items-baseline gap-1.5 rounded bg-layer-3 px-2.5 py-1">
    <span className="dial-small-semi text-primary">{value}</span>
    <span className="uppercase text-secondary dial-tiny-text">{label}</span>
  </div>
);

export default StatChip;
