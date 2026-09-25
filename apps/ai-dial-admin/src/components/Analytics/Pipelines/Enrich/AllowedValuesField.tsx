'use client';

import { FC } from 'react';

import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';

interface Props {
  index: number;
  values: string[];
  disabled?: boolean;
  onChange: (values: string[]) => void;
}

/**
 * The private provider is why this is a wrapper rather than a bare `Multiselect`: the popup's rows register
 * in `SaveValidationContext` under a key shared with every other list, so an entry one output's list left
 * behind would disable Apply in the next one's for no visible reason.
 */
const AllowedValuesField: FC<Props> = ({ index, values, disabled, onChange }) => {
  const t = useI18n();

  return (
    // The popup control carries no name of its own, and there is one per output row, so the group names
    // which row's domain this is — the same way the other row editors name their select cells.
    <SaveValidationContextProvider>
      <div role="group" aria-label={`${t(AnalyticsPipelinesI18nKey.OutputValues)} ${index + 1}`} className="flex-1">
        <Multiselect
          className="min-w-[180px]"
          elementId={`transform-output-values-${index}`}
          label={t(AnalyticsPipelinesI18nKey.OutputValues)}
          heading={t(AnalyticsPipelinesI18nKey.OutputValues)}
          addTitle={t(AnalyticsPipelinesI18nKey.OutputValuesAdd)}
          addPlaceholder={t(AnalyticsPipelinesI18nKey.OutputValuePlaceholder)}
          disabled={disabled}
          allItems={values}
          selectedItems={values}
          onChangeItems={onChange}
        />
      </div>
    </SaveValidationContextProvider>
  );
};

export default AllowedValuesField;
