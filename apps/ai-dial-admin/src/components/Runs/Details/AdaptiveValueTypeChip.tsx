'use client';

import { FC } from 'react';

interface TypeChipProps {
  text: string;
  className?: string;
}

const TypeChip: FC<TypeChipProps> = ({ text, className }) => (
  <span
    className={`inline-block text-[9px] font-semibold text-accent-secondary bg-accent-secondary-alpha px-[5px] py-px rounded-sm uppercase tracking-wide mr-1 leading-[14px]${className ? ` ${className}` : ''}`}
  >
    {text}
  </span>
);

export default TypeChip;
