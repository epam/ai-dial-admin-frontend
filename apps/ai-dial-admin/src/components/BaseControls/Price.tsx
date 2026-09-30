import { DialNumberInput } from '@epam/ai-dial-ui-kit';
import { IconCurrencyDollar } from '@tabler/icons-react';
import { FC, InputEvent, useEffect, useState } from 'react';

import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  elementId: string;
  label?: string;
  placeholder?: string;
  value?: number | string;
  containerClassName?: string;
  disabled?: boolean;
  onChange?: (value?: number | string) => void;
}
const NON_NEGATIVE_DECIMAL_PATTERN = /^\d*\.?\d*$/;

const PriceControl: FC<Props> = ({ elementId, label, value, onChange, ...props }) => {
  const [draftValue, setDraftValue] = useState(value?.toString() ?? '');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setDraftValue(value?.toString() ?? '');
    }
  }, [isEditing, value]);

  const onInput = (event: InputEvent<HTMLInputElement>) => {
    const nextValue = event.currentTarget.value;
    if (!NON_NEGATIVE_DECIMAL_PATTERN.test(nextValue)) return;

    setDraftValue(nextValue);
  };

  const onChangeValue = (nextValue?: number | string) => {
    onChange?.(nextValue);
  };

  const onFocus = () => setIsEditing(true);
  const onBlur = () => setIsEditing(false);

  return (
    <DialNumberInput
      id={elementId}
      labelProps={{ label }}
      iconBefore={<IconCurrencyDollar className="text-secondary" {...BASE_BUTTON_ICON_PROPS} />}
      min={0}
      {...props}
      value={draftValue}
      onInput={onInput}
      onChange={onChangeValue}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
};
export default PriceControl;
