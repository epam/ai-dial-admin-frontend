'use client';

import { FC } from 'react';

import CoverageCard from '@/src/components/EvalSystemHealth/CoverageCard';
import { CoverageCardModel } from '@/src/components/EvalSystemHealth/models';

interface Props {
  cards: CoverageCardModel[];
}

/**
 * Sits beside the health distribution chart on a wide screen, two cards wide, its lines sharing the height the
 * chart gives them so the cards stretch to match it; stacked above the chart it is three, two, then one wide.
 */
const CoverageCardRow: FC<Props> = ({ cards }) => (
  <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2">
    {cards.map((card) => (
      <CoverageCard key={card.kind} card={card} />
    ))}
  </div>
);

export default CoverageCardRow;
