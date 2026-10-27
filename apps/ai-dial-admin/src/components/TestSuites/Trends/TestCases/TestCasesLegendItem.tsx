'use client';

import classNames from 'classnames';
import { FC } from 'react';

interface Props {
  swatchClass: string;
  label: string;
}

const TestCasesLegendItem: FC<Props> = ({ swatchClass, label }) => (
  <span className="flex items-center gap-1">
    <span className={classNames('size-2 shrink-0 rounded-[2px]', swatchClass)} aria-hidden />
    <span className="dial-tiny-text text-secondary whitespace-nowrap">{label}</span>
  </span>
);

export default TestCasesLegendItem;
