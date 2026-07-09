'use client';

import { FC, useEffect, useState } from 'react';

import { IconSearch } from '@tabler/icons-react';
import {
  ButtonAppearance,
  DialDropdown,
  DialInput,
  DialNeutralButton,
  DialNumberInput,
  DialSelect,
  SelectOption,
  SelectSize,
} from '@epam/ai-dial-ui-kit';

import FilterFunnelButton from '@/src/components/Grid/Filter/FilterFunnelButton';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { GridFilterType } from '@/src/types/grid-filter';

interface Props {
  title: string;
  placeholder: string;
  isNumeric?: boolean;
  operatorOptions: SelectOption[];
  defaultOperator: GridFilterType;
  operator: GridFilterType | null;
  value: string;
  onApply: (operator: GridFilterType, value: string) => void;
  onClear: () => void;
}

const GridFilterDropdown: FC<Props> = ({
  title,
  placeholder,
  isNumeric = false,
  operatorOptions,
  defaultOperator,
  operator,
  value,
  onApply,
  onClear,
}) => {
  const t = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [draftOperator, setDraftOperator] = useState<GridFilterType>(operator ?? defaultOperator);
  const [draftValue, setDraftValue] = useState<string>(value);

  useEffect(() => {
    setDraftOperator(operator ?? defaultOperator);
    setDraftValue(value);
  }, [operator, value, defaultOperator]);

  const isActive = value.trim().length > 0;

  const emit = (nextOperator: GridFilterType, nextValue: string) => {
    if (nextValue.trim()) {
      onApply(nextOperator, nextValue);
    } else {
      onClear();
    }
  };

  const onOperatorChange = (next: GridFilterType) => {
    setDraftOperator(next);
    emit(next, draftValue);
  };

  const onValueChange = (next: string) => {
    setDraftValue(next);
    emit(draftOperator, next);
  };

  const onReset = () => {
    setDraftOperator(defaultOperator);
    setDraftValue('');
    onClear();
  };

  return (
    <DialDropdown
      open={isOpen}
      onOpenChange={setIsOpen}
      placement="bottom-end"
      renderOverlay={() => (
        <div className="flex flex-col gap-2 p-3 w-[205px] bg-layer-4">
          <DialSelect
            size={SelectSize.Sm}
            options={operatorOptions}
            value={draftOperator}
            onChange={(next) => onOperatorChange(next as GridFilterType)}
          />
          {isNumeric ? (
            <DialNumberInput
              placeholder={placeholder}
              value={draftValue}
              iconBefore={<IconSearch size={16} />}
              onChange={(next) => onValueChange(next == null ? '' : String(next))}
            />
          ) : (
            <DialInput
              placeholder={placeholder}
              value={draftValue}
              iconBefore={<IconSearch size={16} />}
              onChange={(next) => onValueChange(next ?? '')}
            />
          )}
          <div className="flex items-center justify-end">
            <DialNeutralButton
              appearance={ButtonAppearance.Outlined}
              label={t(ButtonsI18nKey.Reset)}
              onClick={onReset}
            />
          </div>
        </div>
      )}
    >
      <FilterFunnelButton isActive={isActive} title={title} />
    </DialDropdown>
  );
};

export default GridFilterDropdown;
