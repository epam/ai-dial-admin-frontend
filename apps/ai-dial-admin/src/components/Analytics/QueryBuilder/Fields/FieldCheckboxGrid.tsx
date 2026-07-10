import { FC } from 'react';

import { DialCheckbox } from '@epam/ai-dial-ui-kit';

import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  idPrefix: string;
  fields: AnalyticsEntityField[];
  selected: string[];
  onToggle: (name: string) => void;
}

const FieldCheckboxGrid: FC<Props> = ({ idPrefix, fields, selected, onToggle }) => {
  const t = useI18n();
  const selectedSet = new Set(selected);

  if (!fields.length) {
    return <span className="text-secondary dial-tiny-text">{t(QueryBuilderI18nKey.NoFields)}</span>;
  }

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-3 xl:grid-cols-4">
      {fields.map((field) => (
        <DialCheckbox
          key={field.name}
          id={`${idPrefix}-${field.name}`}
          label={field.name}
          checked={selectedSet.has(field.name)}
          onChange={() => onToggle(field.name)}
        />
      ))}
    </div>
  );
};

export default FieldCheckboxGrid;
