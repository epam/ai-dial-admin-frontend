'use client';

import { FC } from 'react';

import classNames from 'classnames';

import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  rowId: string;
  values: string[];
  errorText?: string;
  isLabelHidden?: boolean;
  disabled?: boolean;
  onChange?: (values: string[]) => void;
}

/**
 * An Enum column's declared value set, authored in the shared list popup Topics uses, as it is. `draggable`
 * is the point: the declared order becomes each value's id in the physical type, so reordering is a real edit.
 *
 * - The popup validates each value with the topic rule (2-255 characters). The authoritative check is the row's
 *   `getAnalyticsEnumValuesError` (1-64, distinct), so a value of 65-255 characters passes the popup and is
 *   rejected on the row after Apply.
 * - Its rows register under a shared `topic_` key in `SaveValidationContext`, so the private provider keeps a
 *   stale entry from another list from disabling Apply here.
 */
const EnumValuesField: FC<Props> = ({ rowId, values, errorText, isLabelHidden, disabled, onChange }) => {
  const t = useI18n();

  return (
    <SaveValidationContextProvider>
      <div className="flex min-w-[160px] flex-1 flex-col gap-1">
        <Multiselect
          draggable
          required={!disabled}
          disabled={disabled}
          className={classNames(isLabelHidden && '[&>label]:sr-only')}
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
        {!disabled && <p className="dial-tiny-text text-secondary">{t(AnalyticsTablesI18nKey.EnumValuesOrderHint)}</p>}
      </div>
    </SaveValidationContextProvider>
  );
};

export default EnumValuesField;
