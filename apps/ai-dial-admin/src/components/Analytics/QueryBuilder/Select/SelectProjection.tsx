import { FC } from 'react';

import CategorizedFieldDropdown from '@/src/components/Analytics/QueryBuilder/Common/CategorizedFieldDropdown';
import FieldChip from '@/src/components/Analytics/QueryBuilder/Common/FieldChip';
import SectionBlock from '@/src/components/Analytics/QueryBuilder/Common/SectionBlock';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { fieldDisplayName, fieldsToOptions } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { QUERY_BUILDER_PALETTE } from '@/src/constants/analytics/query-builder-palette';
import { FieldDropdownMode, QueryBuilderColor } from '@/src/models/analytics/query-builder';

// Row-mode projection: fields added in selection order become the query's output columns; no
// selection means the backend's default projection.
const SelectProjection: FC = () => {
  const t = useI18n();
  const { state, refresh } = useQueryBuilder();

  // Picked fields stay listed so the dropdown can show them as selected and toggle them back off.
  const options = fieldsToOptions(state.fields);

  const toggleField = (name: string) => {
    const index = state.select.indexOf(name);
    if (index === -1) state.select.push(name);
    else state.select.splice(index, 1);
    refresh();
  };

  const removeField = (index: number) => {
    state.select.splice(index, 1);
    refresh();
  };

  return (
    <SectionBlock
      title={t(QueryBuilderI18nKey.Select)}
      markerClassName={QUERY_BUILDER_PALETTE[QueryBuilderColor.Dimension].marker}
      action={
        <CategorizedFieldDropdown
          id="qb-select-add"
          mode={FieldDropdownMode.MultiAdd}
          options={options}
          selected={state.select}
          onSelect={toggleField}
          addLabel={t(QueryBuilderI18nKey.AddField)}
          ariaLabel={`${t(QueryBuilderI18nKey.Select)}: ${t(QueryBuilderI18nKey.AddField)}`}
        />
      }
    >
      <div className="flex flex-wrap gap-1.5">
        {state.select.map((name, index) => (
          <FieldChip key={name} label={fieldDisplayName(state.fields, name)} onRemove={() => removeField(index)} />
        ))}
        {!state.select.length && (
          <span className="dial-tiny-text text-secondary">{t(QueryBuilderI18nKey.NoFields)}</span>
        )}
      </div>
    </SectionBlock>
  );
};

export default SelectProjection;
