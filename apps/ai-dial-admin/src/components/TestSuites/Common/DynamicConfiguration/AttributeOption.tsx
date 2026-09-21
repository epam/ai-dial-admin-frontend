'use client';

import { FC } from 'react';

import { DialTag, DialTooltip } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import AttributeSamplesPreview from '@/src/components/TestSuites/Common/DynamicConfiguration/AttributeSamplesPreview';
import { AttributeSamples } from '@/src/models/evaluation/attribute-samples';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';

interface Props {
  field: TestCaseSchema;
  isSelected: boolean;
  samples?: AttributeSamples;
  onPick: () => void;
}

const AttributeOption: FC<Props> = ({ field, isSelected, samples, onPick }) => {
  const values = samples?.valuesByField[field.name] ?? [];
  const hasSamples = values.length > 0;

  return (
    <DialTooltip
      hideTooltip={!hasSamples}
      tooltip={
        hasSamples && (
          <AttributeSamplesPreview
            title={field.name}
            type={field.type.toLowerCase()}
            values={values}
            totalCount={samples?.totalCount ?? 0}
          />
        )
      }
      contentClassName="[&&]:border-0 [&&]:bg-layer-1 [&>svg]:hidden"
      placement="right-start"
      triggerClassName="w-full"
    >
      <button
        type="button"
        role="option"
        aria-selected={isSelected}
        className={classNames(
          'flex w-full items-center gap-2 px-3 py-2 text-left',
          'hover:bg-accent-primary-alpha focus-visible:bg-accent-primary-alpha focus-visible:outline-none',
          isSelected && 'bg-accent-primary-alpha',
        )}
        onClick={onPick}
      >
        <span className="truncate dial-small-text text-primary">{field.name}</span>
        <DialTag label={field.type.toLowerCase()} />
      </button>
    </DialTooltip>
  );
};

export default AttributeOption;
