'use client';

import { FC } from 'react';

import TagsCellRenderer from '@/src/components/Grid/CellRenderers/TagsCellRenderer';

interface Props {
  items: string[];
  allItems: string[];
  label: string;
}

const ModelsCellRenderer: FC<Props> = ({ items, allItems, label }) => (
  <div role="group" aria-label={`${label}: ${allItems.join(', ')}`} className="flex w-full overflow-hidden">
    <TagsCellRenderer items={items} />
  </div>
);

export default ModelsCellRenderer;
