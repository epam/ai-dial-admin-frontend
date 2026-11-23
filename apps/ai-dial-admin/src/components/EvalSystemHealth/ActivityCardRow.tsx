'use client';

import { FC } from 'react';

import ActivityCard from '@/src/components/EvalSystemHealth/ActivityCard';
import { useActivityData } from '@/src/components/EvalSystemHealth/use-activity-data';

/** Shares the coverage row's four-column grid, so the cards sit under its first two columns. */
const ActivityCardRow: FC = () => {
  const { cards, windows } = useActivityData();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <ActivityCard key={card.kind} card={card} windows={windows} />
      ))}
    </div>
  );
};

export default ActivityCardRow;
