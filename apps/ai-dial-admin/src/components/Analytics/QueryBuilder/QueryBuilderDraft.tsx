'use client';

import { ComponentProps, FC, useState } from 'react';

import QueryBuilder from '@/src/components/Analytics/QueryBuilder/QueryBuilder';

type Props = Omit<ComponentProps<typeof QueryBuilder>, 'savedQuery' | 'onResetDraft'>;

const QueryBuilderDraft: FC<Props> = (props) => {
  const [resetCount, setResetCount] = useState(0);

  return <QueryBuilder key={resetCount} {...props} onResetDraft={() => setResetCount((count) => count + 1)} />;
};

export default QueryBuilderDraft;
