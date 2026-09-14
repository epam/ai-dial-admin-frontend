'use client';

import { useState } from 'react';

import { DialGhostButton, DialInput, DialLabel, DialRemoveButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import classNames from 'classnames';

import { ButtonsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';

interface KeyValueRow {
  id: string;
  key: string;
  value: string;
}

const createRow = (key: string, value: string): KeyValueRow => ({
  id: Math.random().toString(36).slice(2),
  key,
  value,
});

// Always keeps at least one (possibly blank) row so the inputs are there to type into immediately —
// never an empty list gated behind clicking "Add" first.
const ensureAtLeastOneRow = (rows: KeyValueRow[]): KeyValueRow[] => (rows.length ? rows : [createRow('', '')]);

interface Props {
  value?: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  disabled?: boolean;
  label?: string;
  addButtonLabel?: string;
  className?: string;
}

// Plain key/value input rows, no grid — its own "Add" button sits below the rows, so no
// forwardRef/useImperativeHandle is needed to trigger it from outside (unlike ParamsTab). Values are
// always plain strings here (e.g. HTTP header values), so rows need nothing more than two text inputs.
const KeyValueGrid = ({ value, onChange, disabled, label, addButtonLabel, className }: Props) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isReadonly = disabled || isReadOnlyAdmin;

  const [rows, setRows] = useState<KeyValueRow[]>(() =>
    ensureAtLeastOneRow(Object.entries(value || {}).map(([key, rowValue]) => createRow(key, rowValue))),
  );

  const emitChange = (updatedRows: KeyValueRow[]) => {
    setRows(updatedRows);
    onChange(Object.fromEntries(updatedRows.filter((row) => row.key !== '').map((row) => [row.key, row.value])));
  };

  const onAddRow = () => emitChange([...rows, createRow('', '')]);

  const onRemoveRow = (id: string) => emitChange(ensureAtLeastOneRow(rows.filter((row) => row.id !== id)));

  const onChangeKey = (id: string, key: string) =>
    emitChange(rows.map((row) => (row.id === id ? { ...row, key } : row)));

  const onChangeValue = (id: string, rowValue: string) =>
    emitChange(rows.map((row) => (row.id === id ? { ...row, value: rowValue } : row)));

  return (
    <div className={className}>
      {label && <DialLabel label={label} />}

      <div className={classNames('flex flex-col gap-y-2', label && 'mt-2')}>
        {rows.map((row) => (
          <div key={row.id} className="flex gap-x-2 items-start">
            <DialInput
              value={row.key}
              disabled={isReadonly}
              onChange={(key) => onChangeKey(row.id, key ?? '')}
              placeholder={t(EntityPlaceholdersI18nKey.Key)}
              containerClassName="w-2/5"
            />
            <DialInput
              value={row.value}
              disabled={isReadonly}
              onChange={(rowValue) => onChangeValue(row.id, rowValue ?? '')}
              placeholder={t(EntityPlaceholdersI18nKey.Value)}
              containerClassName="flex-1"
            />
            {!isReadonly && (
              <DialRemoveButton
                onClick={() => onRemoveRow(row.id)}
                aria-label={t(ButtonsI18nKey.Delete)}
                className="shrink-0"
              />
            )}
          </div>
        ))}
      </div>

      {!isReadonly && (
        <div className="mt-2">
          <DialGhostButton
            iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
            label={addButtonLabel ?? t(ButtonsI18nKey.Add)}
            onClick={onAddRow}
          />
        </div>
      )}
    </div>
  );
};

export default KeyValueGrid;
