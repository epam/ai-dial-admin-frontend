import { FC } from 'react';

import TaggedFieldPicker from '@/src/components/Analytics/QueryBuilder/Fields/TaggedFieldPicker';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';

const GroupBySection: FC = () => {
  const { state, refresh } = useQueryBuilder();

  const toggleField = (name: string) => {
    const idx = state.groupBy.indexOf(name);
    if (idx === -1) state.groupBy.push(name);
    else state.groupBy.splice(idx, 1);
    refresh();
  };

  return (
    <TaggedFieldPicker idPrefix="qb-groupby" fields={state.fields} selected={state.groupBy} onToggle={toggleField} />
  );
};

export default GroupBySection;
