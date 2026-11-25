import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Tag } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import AutocompleteField from '@/src/components/Common/AutocompleteField/AutocompleteField';
import { MultiValueOption } from '@/src/components/Common/AutocompleteField/models';
import { useAutocomplete } from '@/src/components/Common/AutocompleteField/use-autocomplete';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

export type { MultiValueOption };

interface Props {
  selected: MultiValueOption[];
  availableItems: MultiValueOption[];
  placeholder?: string;
  error?: string;
  isReadOnlyAdmin?: boolean;
  caption?: string;
  onAdd: (item: MultiValueOption) => void;
  onRemove: (index: number) => void;
}

const ADD_KEYS = [','];

const MultiValueAutocomplete: FC<Props> = ({
  selected,
  availableItems,
  placeholder,
  error = '',
  isReadOnlyAdmin = false,
  caption,
  onAdd,
  onRemove,
}) => {
  const t = useI18n();
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [wraps, setWraps] = useState(false);

  const excludedValues = useMemo(() => selected.map((s) => s.value), [selected]);
  const autocomplete = useAutocomplete({ availableItems, excludedValues, addKeys: ADD_KEYS, onSelect: onAdd });

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (rowRef.current) {
        setWraps(rowRef.current.scrollHeight > rowRef.current.clientHeight + 10);
      }
    });
    if (rowRef.current) observer.observe(rowRef.current);
    return () => observer.disconnect();
  }, []);

  const onRemoveItem = useCallback((idx: number) => () => onRemove(idx), [onRemove]);

  return (
    <AutocompleteField
      autocomplete={autocomplete}
      placeholder={placeholder}
      error={error}
      caption={caption}
      disabled={isReadOnlyAdmin}
      rowRef={rowRef}
      rowClassName={classNames('items-start', wraps ? 'flex-col-reverse' : 'flex-row')}
      inputMinWidthClassName="min-w-[180px]"
    >
      {selected.map((att, idx) => (
        <Tag
          key={att.value}
          label={att.label}
          closable
          removeLabel={`${t(ButtonsI18nKey.Remove)} ${att.label}`}
          onRemove={onRemoveItem(idx)}
          className="h-6 rounded-md border border-secondary bg-layer-sunken"
        />
      ))}
    </AutocompleteField>
  );
};

export default MultiValueAutocomplete;
