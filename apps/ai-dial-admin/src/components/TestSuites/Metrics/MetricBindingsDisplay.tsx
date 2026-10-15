import { FC, ReactNode } from 'react';

import classNames from 'classnames';

import { MetricBinding } from '@/src/models/evaluation/metric';
import { getBindingDisplayValue } from './utils';

const LONG_TAG_THRESHOLD = 80;

interface FieldRowProps {
  label: string;
  children: ReactNode;
}

export const MetricCardFieldRow: FC<FieldRowProps> = ({ label, children }) => (
  <div className={classNames('flex w-full flex-row gap-2 items-start')}>
    <p className="dial-tiny-semi-text w-[84px] shrink-0 text-secondary py-1">{label}</p>
    <div className="flex min-w-0 flex-1 flex-row flex-wrap content-start items-center gap-2">{children}</div>
  </div>
);

interface TagProps {
  children: ReactNode;
  fullWidth?: boolean;
}

export const MetricCardTag: FC<TagProps> = ({ children, fullWidth }) => (
  <div
    className={classNames(
      'flex items-center gap-1 rounded bg-layer-3 p-1 dial-tiny-text text-primary',
      fullWidth ? 'w-full whitespace-pre-wrap' : 'shrink-0 whitespace-nowrap',
    )}
  >
    {children}
  </div>
);

export const isLongBindingDisplayValue = (value: string): boolean =>
  value.includes('\n') || value.length >= LONG_TAG_THRESHOLD;

interface Props {
  title: string;
  bindings?: MetricBinding[];
  align?: 'center' | 'start';
}

const MetricBindingsDisplay: FC<Props> = ({ title, bindings }) => {
  if (!bindings?.length) {
    return null;
  }

  return (
    <MetricCardFieldRow label={title}>
      {bindings.map((binding) => {
        const displayValue = getBindingDisplayValue(binding);
        const fullWidth = isLongBindingDisplayValue(displayValue);

        return (
          <MetricCardTag key={binding.property} fullWidth={fullWidth}>
            {binding.property}: {displayValue}
          </MetricCardTag>
        );
      })}
    </MetricCardFieldRow>
  );
};

export default MetricBindingsDisplay;
