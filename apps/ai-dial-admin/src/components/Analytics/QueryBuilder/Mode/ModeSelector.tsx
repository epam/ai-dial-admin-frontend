import { FC } from 'react';

import { DialRadioGroup, DialSwitch, RadioButtonWithContent, RadioGroupOrientation } from '@epam/ai-dial-ui-kit';

import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { QueryMode } from '@/src/models/analytics/query';

const ModeSelector: FC = () => {
  const t = useI18n();
  const { state, patch } = useQueryBuilder();

  const radioButtons: RadioButtonWithContent[] = [
    { id: QueryMode.Row, name: t(QueryBuilderI18nKey.RowMode), caption: t(QueryBuilderI18nKey.RowModeCaption) },
    {
      id: QueryMode.Aggregate,
      name: t(QueryBuilderI18nKey.AggregateMode),
      caption: t(QueryBuilderI18nKey.AggregateModeCaption),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <DialRadioGroup
        elementId="qb-mode"
        radioButtons={radioButtons}
        activeRadioButton={state.mode}
        orientation={RadioGroupOrientation.Column}
        onChange={(id) => patch({ mode: id as QueryMode })}
      />
      <DialSwitch
        switchId="qb-distinct"
        label={t(QueryBuilderI18nKey.DistinctRows)}
        isOn={state.distinct}
        onChange={(value) => patch({ distinct: value })}
      />
    </div>
  );
};

export default ModeSelector;
