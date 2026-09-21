'use client';

import { FC, useId, useMemo, useState } from 'react';

import { DialDropdown, DialSearch } from '@epam/ai-dial-ui-kit';
import { IconChevronDown } from '@tabler/icons-react';
import classNames from 'classnames';

import AttributeOption from '@/src/components/TestSuites/Common/DynamicConfiguration/AttributeOption';
import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AttributeSamples } from '@/src/models/evaluation/attribute-samples';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';

interface Props {
  schema: TestCaseSchema[];
  value?: string;
  samples?: AttributeSamples;
  disabled?: boolean;
  onChange: (dataField: string) => void;
}

// Binds a template variable to a test case column. Two columns of the same type are only told apart
// by the data behind them, so each row previews the dataset's own first rows on hover; ui-kit's
// select has no room for that, which is why the list is built on DialDropdown the way CompactSelect
// and CategorizedFieldDropdown are, with a trigger that keeps the ui-kit input styling.
const AttributeSelect: FC<Props> = ({ schema, value, samples, disabled, onChange }) => {
  const t = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const listboxId = useId();

  const term = search.trim().toLowerCase();
  const visibleFields = useMemo(
    () => (term ? schema.filter((field) => field.name.toLowerCase().includes(term)) : schema),
    [schema, term],
  );

  const onOpenChange = (next: boolean) => {
    if (next) {
      setSearch('');
    }
    setIsOpen(next);
  };

  const onPick = (dataField: string) => {
    onChange(dataField);
    setIsOpen(false);
  };

  return (
    <DialDropdown
      open={isOpen}
      onOpenChange={onOpenChange}
      disabled={disabled}
      placement="bottom-start"
      matchReferenceWidth
      renderOverlay={() => (
        <div className="flex max-h-[352px] min-w-[144px] flex-col overflow-hidden rounded border border-primary bg-layer-0 shadow-lg">
          <div className="shrink-0 px-3 py-1">
            <DialSearch
              id={`${listboxId}-search`}
              value={search}
              placeholder={t(BasicI18nKey.Search)}
              onChange={setSearch}
            />
          </div>
          <div
            id={listboxId}
            role="listbox"
            aria-label={t(TestSuitesI18nKey.Attribute)}
            className="min-h-0 flex-1 overflow-y-auto py-1"
          >
            {visibleFields.length === 0 ? (
              <p className="px-3 py-2 dial-tiny-text text-secondary">
                {schema.length === 0 ? t(TestSuitesI18nKey.NoSchemaFields) : t(TestSuitesI18nKey.NoMatchingColumns)}
              </p>
            ) : (
              visibleFields.map((field) => (
                <AttributeOption
                  key={field.name}
                  field={field}
                  isSelected={field.name === value}
                  samples={samples}
                  onPick={() => onPick(field.name)}
                />
              ))
            )}
          </div>
        </div>
      )}
    >
      <button
        type="button"
        aria-label={t(TestSuitesI18nKey.Attribute)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        disabled={disabled}
        className="dial-input flex cursor-pointer items-center justify-between gap-2 px-3 dial-small-text"
      >
        <span className={classNames('truncate', value ? 'text-primary' : 'text-secondary')}>
          {value || t(TestSuitesI18nKey.SelectAttribute)}
        </span>
        <IconChevronDown aria-hidden size={18} className="shrink-0 text-secondary" />
      </button>
    </DialDropdown>
  );
};

export default AttributeSelect;
