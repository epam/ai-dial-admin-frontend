'use client';

import { FC, ReactNode } from 'react';

import ActivityCard from '@/src/components/EvalSystemHealth/ActivityCard';
import EvalCostCard from '@/src/components/EvalSystemHealth/EvalCostCard';
import { useActivityData } from '@/src/components/EvalSystemHealth/use-activity-data';
import { useEvalCostData } from '@/src/components/EvalSystemHealth/use-eval-cost-data';

interface Props {
  /** Cards that lead the row, before the activity cards. */
  children?: ReactNode;
}

/** The key figures: four to a line on a wide screen, then three, two and one as the screen narrows. */
const ActivityCardRow: FC<Props> = ({ children }) => {
  const { cards, windows } = useActivityData();
  const costCard = useEvalCostData(windows);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {children}
      {cards.map((card) => (
        <ActivityCard key={card.kind} card={card} windows={windows} />
      ))}
      <EvalCostCard card={costCard} windows={windows} />
    </div>
  );
};

export default ActivityCardRow;
