'use client';

import { FC } from 'react';

import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import { AnalyticsEvaluatorsI18nKey } from '@/src/constants/i18n';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';

interface Props {
  index: number;
  values: string[];
  disabled?: boolean;
  onChange: (values: string[]) => void;
}

/**
 * The closed domain an llm output may declare, authored through the same list popup an Enum column's values
 * use — the two are the same set, checked against one another when a pipeline composes them.
 *
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
      <div role="group" aria-label={`${t(AnalyticsEvaluatorsI18nKey.OutputValues)} ${index + 1}`} className="flex-1">
        <Multiselect
          className="min-w-[180px]"
          elementId={`evaluator-output-values-${index}`}
          label={t(AnalyticsEvaluatorsI18nKey.OutputValues)}
          heading={t(AnalyticsEvaluatorsI18nKey.OutputValues)}
          addTitle={t(AnalyticsEvaluatorsI18nKey.OutputValuesAdd)}
          addPlaceholder={t(AnalyticsEvaluatorsI18nKey.OutputValuePlaceholder)}
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
