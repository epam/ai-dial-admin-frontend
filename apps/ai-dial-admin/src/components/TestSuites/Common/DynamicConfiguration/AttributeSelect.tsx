'use client';

import { FC, useId, useState } from 'react';

import { DialDropdown } from '@epam/ai-dial-ui-kit';
import { IconChevronDown } from '@tabler/icons-react';
import classNames from 'classnames';

import AttributeOption from '@/src/components/TestSuites/Common/DynamicConfiguration/AttributeOption';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';

interface Props {
  schema: TestCaseSchema[];
  value?: string;
  disabled?: boolean;
  onChange: (dataField: string) => void;
}

// Binds a template variable to a test case column. A column is only recognisable from its type and
// its example value together, which makes the option two lines tall; ui-kit's select renders an
// option as one fixed-height line, so the list is built on DialDropdown the way CompactSelect and
// CategorizedFieldDropdown are, with a trigger that keeps the ui-kit input styling.
const AttributeSelect: FC<Props> = ({ schema, value, disabled, onChange }) => {
  const t = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const listboxId = useId();

  const onPick = (dataField: string) => {
    onChange(dataField);
    setIsOpen(false);
  };

  return (
    <DialDropdown
      open={isOpen}
      onOpenChange={setIsOpen}
      disabled={disabled}
      placement="bottom-start"
      matchReferenceWidth
      renderOverlay={() => (
        <div className="flex max-h-[352px] min-w-[144px] flex-col overflow-hidden rounded border border-primary bg-layer-0 shadow-lg">
          <div className="shrink-0 truncate px-3 py-2 dial-tiny-semi-text text-secondary">
            {t(TestSuitesI18nKey.TestCaseColumns)}
          </div>
          <div
            id={listboxId}
            role="listbox"
            aria-label={t(TestSuitesI18nKey.Attribute)}
            className="min-h-0 flex-1 overflow-y-auto"
          >
            {schema.length === 0 ? (
              <p className="px-3 py-2 dial-tiny-text text-secondary">{t(TestSuitesI18nKey.NoSchemaFields)}</p>
            ) : (
              schema.map((field) => (
                <AttributeOption
                  key={field.name}
                  field={field}
                  isSelected={field.name === value}
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
