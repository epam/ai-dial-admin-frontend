import { FC } from 'react';

import { MetricBinding } from '@/src/models/evaluation/metric';

interface Props {
  title: string;
  bindings?: MetricBinding[];
}

const MetricBindingsDisplay: FC<Props> = ({ title, bindings }) => {
  if (!bindings?.length) {
    return null;
  }

  return (
    <div className="flex flex-row gap-3 items-center">
      <p className="dial-tiny-semi-text">{title}:</p>
      <div className="flex flex-row flex-wrap gap-2">
        {bindings.map((binding) => (
          <div
            key={binding.property}
            className="flex dial-tiny-text flex-row p-1 items-center gap-1 bg-layer-3 rounded"
          >
            {binding.property}: {(binding.source.value?.toString() as string) || '-'}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MetricBindingsDisplay;
