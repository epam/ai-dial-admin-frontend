import { FC } from 'react';

import TaggedFieldPicker from '@/src/components/Analytics/QueryBuilder/Fields/TaggedFieldPicker';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';

const SelectProjection: FC = () => {
  const { state, refresh } = useQueryBuilder();

  const toggleField = (name: string) => {
    const idx = state.select.indexOf(name);
    if (idx === -1) state.select.push(name);
    else state.select.splice(idx, 1);
    refresh();
  };

  return (
    <TaggedFieldPicker idPrefix="qb-select" fields={state.fields} selected={state.select} onToggle={toggleField} />
  );
};

export default SelectProjection;
