import { FC } from 'react';

import { DialCheckbox } from '@epam/ai-dial-ui-kit';

import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { sortByName } from '@/src/components/Analytics/QueryBuilder/utils/fields';

interface Props {
  idPrefix: string;
  fields: AnalyticsEntityField[];
  selected: string[];
  onToggle: (name: string) => void;
}

const FieldCheckboxGrid: FC<Props> = ({ idPrefix, fields, selected, onToggle }) => {
  const t = useI18n();
  const selectedSet = new Set(selected);
  const sortedFields = sortByName(fields);

  if (!fields.length) {
    return <span className="text-secondary dial-tiny-text">{t(QueryBuilderI18nKey.NoFields)}</span>;
  }

  return (
    <div className="columns-2 gap-x-6 md:columns-3 xl:columns-4">
      {sortedFields.map((field) => (
        <div key={field.name} className="mb-2 break-inside-avoid">
          <DialCheckbox
            id={`${idPrefix}-${field.name}`}
            label={field.name}
            checked={selectedSet.has(field.name)}
            onChange={() => onToggle(field.name)}
          />
        </div>
      ))}
    </div>
  );
};

export default FieldCheckboxGrid;
