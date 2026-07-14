import { FC } from 'react';

import CategorizedFieldDropdown from '@/src/components/Analytics/QueryBuilder/Common/CategorizedFieldDropdown';
import FieldChip from '@/src/components/Analytics/QueryBuilder/Common/FieldChip';
import SectionBlock from '@/src/components/Analytics/QueryBuilder/Common/SectionBlock';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { fieldsToOptions } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import { getAggregateWarnings } from '@/src/components/Analytics/QueryBuilder/utils/serialize';
import { GROUP_BY_SECTION_WARNINGS, WARNING_I18N } from '@/src/constants/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { QUERY_BUILDER_PALETTE } from '@/src/constants/analytics/query-builder-palette';
import { QueryBuilderColor } from '@/src/models/analytics/query-builder';

const GroupBySection: FC = () => {
  const t = useI18n();
  const { state, refresh } = useQueryBuilder();

  const options = fieldsToOptions(state.fields).filter((f) => !state.groupBy.includes(f.name));
  const warnings = getAggregateWarnings(state).filter((w) => GROUP_BY_SECTION_WARNINGS.includes(w));
  const warning = warnings.length ? warnings.map((w) => t(WARNING_I18N[w])).join(' ') : undefined;

  const addField = (name: string) => {
    state.groupBy.push(name);
    refresh();
  };

  const removeField = (index: number) => {
    state.groupBy.splice(index, 1);
    refresh();
  };

  return (
    <SectionBlock
      title={t(QueryBuilderI18nKey.GroupBy)}
      markerClassName={QUERY_BUILDER_PALETTE[QueryBuilderColor.Dimension].marker}
      warning={warning}
      action={
        <CategorizedFieldDropdown
          id="qb-groupby-add"
          options={options}
          onSelect={addField}
          addLabel={t(QueryBuilderI18nKey.AddField)}
          ariaLabel={`${t(QueryBuilderI18nKey.GroupBy)}: ${t(QueryBuilderI18nKey.AddField)}`}
        />
      }
    >
      <div className="flex flex-wrap gap-1.5">
        {state.groupBy.map((name, index) => (
          <FieldChip key={name} label={name} onRemove={() => removeField(index)} />
        ))}
        {!state.groupBy.length && (
          <span className="dial-tiny-text text-secondary">{t(QueryBuilderI18nKey.NoFields)}</span>
        )}
      </div>
    </SectionBlock>
  );
};

export default GroupBySection;
