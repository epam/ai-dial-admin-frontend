'use client';

import { FC } from 'react';

import CoverageCard from '@/src/components/EvalSystemHealth/CoverageCard';
import { useCoverageData } from '@/src/components/EvalSystemHealth/use-coverage-data';

const CoverageCardRow: FC = () => {
  const cards = useCoverageData();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <CoverageCard key={card.kind} card={card} />
      ))}
    </div>
  );
};

export default CoverageCardRow;
