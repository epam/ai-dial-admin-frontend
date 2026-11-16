'use client';

import { ComponentProps, FC, useCallback, useState } from 'react';

import QueryBuilder from '@/src/components/Analytics/QueryBuilder/QueryBuilder';

type Props = Omit<ComponentProps<typeof QueryBuilder>, 'savedQuery' | 'onResetDraft'>;

const QueryBuilderDraft: FC<Props> = (props) => {
  const [resetCount, setResetCount] = useState(0);

  const onResetDraft = useCallback(() => setResetCount((count) => count + 1), []);

  return <QueryBuilder key={resetCount} {...props} onResetDraft={onResetDraft} />;
};

export default QueryBuilderDraft;
