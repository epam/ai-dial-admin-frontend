'use client';

import { FC } from 'react';

import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  rowId: string;
  values: string[];
  errorText?: string;
  // Read-only: the same field, not editable. Used where the domain can be shown but never changed — the
  // per-column edit modal, since the service refuses a domain change outright.
  disabled?: boolean;
  onChange?: (values: string[]) => void;
}

/**
 * An Enum column's declared value set, authored through the shared list popup Topics uses — used as it is,
 * not adapted. `draggable` is what makes it the right control here rather than a plain multi-select: the
 * declared order becomes each value's id in the physical type, so the column sorts in this order and
 * reordering the list is a real edit.
 *
 * Renders **label + field only**, nothing beneath: the column row bottom-aligns its fields, so anything this
 * adds below the control lifts it out of line with every other input in the row. The declared-order note
 * therefore lives once under the row set, in `ColumnRowsEditor`.
 *
 * Two consequences of taking the shared component as-is, both deliberate:
 *
 * - Its rows validate with the shared topic rule (2-255 characters), not the enum rule. The authoritative
 *   check is the column row's own — `getAnalyticsEnumValuesError` via `getColumnRowErrors` — which gates
 *   Save on the real service limits (1-512 values, each 1-64 characters, distinct after trimming). The
 *   popup's own check is therefore only ever stricter on the low end: a single-character value has to be
 *   entered as part of a set the row-level check then accepts.
 * - Its rows register in `SaveValidationContext` under a shared `topic_` key. The popup's Apply is gated on
 *   that map, so a stale entry left by another list would disable Apply here for no visible reason — hence
 *   the private provider below, which keeps this field's row validity to itself. It renders no element of
 *   its own, so the field stays a direct flex child of the row.
 */
const EnumValuesField: FC<Props> = ({ rowId, values, errorText, disabled, onChange }) => {
  const t = useI18n();

  return (
    <SaveValidationContextProvider>
      <Multiselect
        draggable
        required={!disabled}
        disabled={disabled}
        className="flex-1 min-w-[160px]"
        elementId={`col-enum-values-${rowId}`}
        label={t(AnalyticsTablesI18nKey.EnumValues)}
        heading={t(AnalyticsTablesI18nKey.EnumValues)}
        addTitle={t(AnalyticsTablesI18nKey.EnumValuesAdd)}
        addPlaceholder={t(AnalyticsTablesI18nKey.EnumValuePlaceholder)}
        allItems={values}
        selectedItems={values}
        errorText={errorText}
        onChangeItems={onChange}
      />
    </SaveValidationContextProvider>
  );
};

export default EnumValuesField;
