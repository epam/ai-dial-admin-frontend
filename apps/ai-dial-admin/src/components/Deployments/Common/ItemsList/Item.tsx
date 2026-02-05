import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { DialRemoveButton, DialTextInputField } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import { FieldError } from '@/src/models/error';
import { EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getControlClassName } from '@/src/utils/entities/view';
import { useI18n } from '@/src/locales/client';

interface Props {
  item: string;
  index: number;
  onChange: (item: string | undefined, index: number) => void;
  onRemove: (index: number) => void;
  validate?: (item?: string) => FieldError | null;
  isModal: boolean;
  disabled: boolean;
  isPlaceholder?: boolean;
}

const Item = forwardRef<HTMLLIElement, Props>(
  ({ item, index, onChange, onRemove, validate, isModal, disabled, isPlaceholder = false }, ref) => {
    const t = useI18n();
    const { dispatch, resetCounter } = useSaveValidationContext();
    const [error, setError] = useState<FieldError | null>(null);

    const containerClassName = useMemo(() => getControlClassName(isModal), [isModal]);

    useEffect(() => {
      if (resetCounter) {
        if (validate) {
          const error = isPlaceholder ? null : validate?.(item);
          setError(error);
          dispatch({
            type: ValidationActionType.SetField,
            field: `item-${index}`,
            isValid: !error,
          });
        }
      }
    }, [dispatch, index, isPlaceholder, item, resetCounter, validate]);

    const onChangeItem = useCallback(
      (value: string | undefined, index: number) => {
        if (validate) {
          const error = validate(value);
          setError(error);
          dispatch({ type: ValidationActionType.SetField, field: `item-${index}`, isValid: !error });
        }
        onChange(value, index);
      },
      [dispatch, onChange, validate],
    );

    useEffect(() => {
      return () => {
        dispatch({ type: ValidationActionType.SetField, field: `item-${index}`, isValid: true });
      };
    }, [dispatch, index]);

    return (
      <li
        className={classNames('flex flex-row gap-2 w-full', error ? 'items-start' : 'items-center')}
        key={`item-${index}`}
        ref={ref}
      >
        <DialTextInputField
          elementId={`item-${index}`}
          value={item}
          containerClassName={containerClassName}
          placeholder={t(EntityPlaceholdersI18nKey.Domain)}
          onChange={(v) => onChangeItem(v, index)}
          invalid={!!error}
          errorText={error?.text}
          disabled={disabled}
        />
        <DialRemoveButton onClick={() => onRemove(index)} disabled={disabled} />
      </li>
    );
  },
);

export default Item;
