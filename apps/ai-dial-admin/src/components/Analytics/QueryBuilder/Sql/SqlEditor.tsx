'use client';

import { FC, useCallback } from 'react';

import SqlCodeEditor from '@/src/components/Analytics/Common/SqlCodeEditor';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { buildSqlCompletions } from '@/src/components/Analytics/QueryBuilder/utils/sql-completions';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const SqlEditor: FC<Props> = ({ value, onChange }) => {
  // Autocomplete follows the selected source, read from the builder context rather than passed down —
  // one source of truth for which entity and fields are in play.
  const {
    state: { entityName, fields, functions },
  } = useQueryBuilder();

  const getCompletions = useCallback(
    () => buildSqlCompletions(fields, entityName, functions),
    [fields, entityName, functions],
  );

  return <SqlCodeEditor value={value} onChange={onChange} getCompletions={getCompletions} />;
};

export default SqlEditor;
