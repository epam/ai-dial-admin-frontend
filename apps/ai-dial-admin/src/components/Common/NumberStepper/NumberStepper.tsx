'use client';

import {
  ButtonAppearance,
  DIAL_ICON_SIZE,
  ElementSize,
  Label,
  NeutralIconButton,
  NumberInput,
} from '@epam/ai-dial-ui-kit';
import { IconMinus, IconPlus } from '@tabler/icons-react';
import { FC, useCallback } from 'react';

import { stepDown, stepUp } from '@/src/components/Common/NumberStepper/utils';

interface Props {
  id: string;
  label: string;
  value: string | number | undefined;
  onChange: (value: string | number | undefined) => void;
  min: number;
  max?: number;
  decreaseAriaLabel: string;
  increaseAriaLabel: string;
  inputContainerClassName?: string;
  caption?: string;
  error?: string;
}

const NumberStepper: FC<Props> = ({
  id,
  label,
  value,
  onChange,
  min,
  max,
  decreaseAriaLabel,
  increaseAriaLabel,
  inputContainerClassName = 'w-[90px]',
  caption,
  error,
}) => {
  const onIncrement = useCallback(() => {
    onChange(stepUp(value, min, max));
  }, [onChange, value, min, max]);

  const onDecrement = useCallback(() => {
    onChange(stepDown(value, min));
  }, [onChange, value, min]);

  const constraintMessage = error ?? caption;
  const constraintId = `${id}-constraint`;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} label={label} />
      <div className="flex items-center gap-2">
        <NeutralIconButton
          appearance={ButtonAppearance.Outlined}
          size={ElementSize.Small}
          icon={<IconMinus size={DIAL_ICON_SIZE.SM} aria-hidden />}
          aria-label={decreaseAriaLabel}
          onClick={onDecrement}
        />
        <NumberInput
          id={id}
          integer
          value={value}
          containerClassName={inputContainerClassName}
          onChange={onChange}
          invalid={Boolean(error)}
          aria-describedby={constraintMessage ? constraintId : undefined}
        />
        <NeutralIconButton
          appearance={ButtonAppearance.Outlined}
          size={ElementSize.Small}
          icon={<IconPlus size={DIAL_ICON_SIZE.SM} aria-hidden />}
          aria-label={increaseAriaLabel}
          onClick={onIncrement}
        />
      </div>
      {constraintMessage ? (
        <p
          id={constraintId}
          role={error ? 'alert' : undefined}
          className={error ? 'dial-tiny-text text-error' : 'dial-tiny-text text-secondary'}
        >
          {constraintMessage}
        </p>
      ) : null}
    </div>
  );
};

export default NumberStepper;
