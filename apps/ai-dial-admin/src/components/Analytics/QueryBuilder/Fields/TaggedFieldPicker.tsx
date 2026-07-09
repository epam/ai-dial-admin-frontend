import { FC, useEffect, useMemo, useState } from 'react';

import { DialTag } from '@epam/ai-dial-ui-kit';

import { UNTAGGED_KEY } from '@/src/constants/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import FieldCheckboxGrid from '@/src/components/Analytics/QueryBuilder/Fields/FieldCheckboxGrid';
import { distinctTags, filterFieldsByTags } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';

interface Props {
  idPrefix: string;
  fields: AnalyticsEntityField[];
  selected: string[];
  onToggle: (name: string) => void;
}

const TaggedFieldPicker: FC<Props> = ({ idPrefix, fields, selected, onToggle }) => {
  const t = useI18n();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    setSelectedTags([]);
  }, [fields]);

  const tags = useMemo(() => distinctTags(fields), [fields]);
  const visibleFields = useMemo(() => filterFieldsByTags(fields, selectedTags), [fields, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]));
  };

  return (
    <div className="flex flex-col gap-3">
      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-secondary dial-tiny-text">{t(QueryBuilderI18nKey.Tags)}</span>
          {tags.map((tag) => (
            <DialTag
              key={tag}
              label={tag === UNTAGGED_KEY ? t(QueryBuilderI18nKey.Untagged) : tag}
              selected={selectedTags.includes(tag)}
              onClick={() => toggleTag(tag)}
            />
          ))}
        </div>
      )}
      <FieldCheckboxGrid idPrefix={idPrefix} fields={visibleFields} selected={selected} onToggle={onToggle} />
    </div>
  );
};

export default TaggedFieldPicker;
