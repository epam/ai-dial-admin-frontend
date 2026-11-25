'use client';

import { FC } from 'react';

import ActivityCard from '@/src/components/EvalSystemHealth/ActivityCard';
import EvalCostCard from '@/src/components/EvalSystemHealth/EvalCostCard';
import { useActivityData } from '@/src/components/EvalSystemHealth/use-activity-data';
import { useEvalCostData } from '@/src/components/EvalSystemHealth/use-eval-cost-data';

/** Shares the coverage row's four-column grid, so the cards sit under its first three columns. */
const ActivityCardRow: FC = () => {
  const { cards, windows } = useActivityData();
  const costCard = useEvalCostData(windows);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <ActivityCard key={card.kind} card={card} windows={windows} />
      ))}
      <EvalCostCard card={costCard} windows={windows} />
    </div>
  );
};

export default ActivityCardRow;
