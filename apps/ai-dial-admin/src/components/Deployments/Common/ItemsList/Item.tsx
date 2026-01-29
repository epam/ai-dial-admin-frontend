import { forwardRef, useCallback, useEffect, useState } from 'react';
import { DialTextInputField } from '@epam/ai-dial-ui-kit';
import { EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import classNames from 'classnames';
import { IconTrash } from '@tabler/icons-react';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';

interface Props {
  item: string;
  index: number;
  onChange: (item: string | undefined, index: number) => void;
  onRemove: (index: number) => void;
  validate?: (item?: string) => FieldError | null;
}

const Item = forwardRef<HTMLLIElement, Props>(({ item, index, onChange, onRemove, validate }, ref) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();

  const [error, setError] = useState<FieldError | null>(null);

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
    <li className="flex flex-row gap-2 items-center w-full" key={`item-${index}`} ref={ref}>
      <DialTextInputField
        elementId={`item-${index}`}
        value={item}
        placeholder={t(EntityPlaceholdersI18nKey.Domain)}
        onChange={(v) => onChangeItem(v, index)}
        invalid={!!error}
        errorText={error?.text}
      />
      <button
        className={classNames(
          'flex p-2 cursor-pointer',
          !item ? 'text-secondary' : 'text-error',
          !!error && 'self-baseline',
        )}
        onClick={() => onRemove(index)}
      >
        <IconTrash size={24} stroke={2} />
      </button>
    </li>
  );
});

export default Item;
