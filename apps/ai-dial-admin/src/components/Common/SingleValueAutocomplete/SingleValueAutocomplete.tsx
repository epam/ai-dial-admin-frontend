import { FC, useCallback, useMemo } from 'react';

import { EllipsisTooltip, Tag } from '@epam/ai-dial-ui-kit';

import AutocompleteField from '@/src/components/Common/AutocompleteField/AutocompleteField';
import { MultiValueOption } from '@/src/components/Common/AutocompleteField/models';
import { useAutocomplete } from '@/src/components/Common/AutocompleteField/use-autocomplete';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  elementId?: string;
  label?: string;
  value: string;
  availableItems: MultiValueOption[];
  placeholder?: string;
  error?: string;
  caption?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

const SingleValueAutocomplete: FC<Props> = ({
  elementId,
  label,
  value,
  availableItems,
  placeholder,
  error = '',
  caption,
  disabled = false,
  onChange,
}) => {
  const t = useI18n();

  const onSelect = useCallback((item: MultiValueOption) => onChange(item.value), [onChange]);
  const autocomplete = useAutocomplete({ availableItems, onSelect });

  const onRemoveValue = useCallback(() => {
    if (!disabled) {
      onChange('');
    }
  }, [disabled, onChange]);

  const selectedLabel = useMemo(
    () => availableItems.find((opt) => opt.value === value)?.label ?? value,
    [availableItems, value],
  );

  return (
    <AutocompleteField
      autocomplete={autocomplete}
      elementId={elementId}
      label={label}
      placeholder={placeholder}
      error={error}
      caption={caption}
      disabled={disabled}
      isUpperCased={false}
      rowClassName="items-center"
      inputMinWidthClassName="min-w-[120px]"
    >
      {value && (
        <div className="flex h-6 max-w-full min-w-0 items-center">
          <EllipsisTooltip
            className="min-w-0 flex-1"
            contentClassName="max-w-full"
            text={
              <Tag
                label={selectedLabel}
                closable={!disabled}
                removeLabel={`${t(ButtonsI18nKey.Remove)} ${selectedLabel}`}
                onRemove={onRemoveValue}
                className="h-6 rounded-md border border-secondary bg-layer-sunken"
              />
            }
          />
        </div>
      )}
    </AutocompleteField>
  );
};

export default SingleValueAutocomplete;
