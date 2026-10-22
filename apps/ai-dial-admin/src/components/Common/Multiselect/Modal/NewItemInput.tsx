import { FC, useCallback, useEffect, useState } from 'react';
import { DialErrorText, DialInput } from '@epam/ai-dial-ui-kit';

import { FieldError, GetItemError } from '@/src/models/error';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getTopicError } from '@/src/utils/validation/topic-error';
import { useI18n } from '@/src/locales/client';
import RemoveButton from '@/src/components/Common/RemoveButton/RemoveButton';

interface Props {
  value: string;
  index: number;
  placeholder?: string;
  getItemError?: GetItemError;
  onChangeItem: (item: string | undefined, index: number) => void;
  onRemoveItem: (index: number) => void;
}

const NewItemInput: FC<Props> = ({
  value,
  index,
  placeholder,
  getItemError = getTopicError,
  onRemoveItem,
  onChangeItem,
}) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();

  const [error, setError] = useState<FieldError | null>(null);

  useEffect(() => {
    if (resetCounter || (value != null && value.length > 0)) {
      const error = getItemError(value, t);
      setError(error);
      dispatch({ type: ValidationActionType.SetField, field: `topic_${index}`, isValid: !error });
    }
  }, [dispatch, getItemError, index, resetCounter, setError, t, value]);

  const onChange = useCallback(
    (value?: string) => {
      const error = getItemError(value, t);
      setError(error);
      dispatch({ type: ValidationActionType.SetField, field: `topic_${index}`, isValid: !error });

      onChangeItem(value, index);
    },
    [dispatch, getItemError, index, onChangeItem, t],
  );

  const onRemove = useCallback(() => {
    dispatch({ type: ValidationActionType.SetField, field: `topic_${index}`, isValid: true });

    onRemoveItem(index);
  }, [dispatch, index, onRemoveItem]);

  return (
    <div className="flex gap-x-2 items-start w-full">
      <div className="flex flex-col w-full">
        <div className="flex-1 min-w-0">
          <DialInput
            invalid={!!error}
            id={`item-${index}`}
            value={value}
            placeholder={placeholder}
            onChange={onChange}
          />
        </div>
        <DialErrorText text={error?.text} />
      </div>
      <div className="shrink-0">
        <RemoveButton onClick={onRemove} />
      </div>
    </div>
  );
};

export default NewItemInput;
