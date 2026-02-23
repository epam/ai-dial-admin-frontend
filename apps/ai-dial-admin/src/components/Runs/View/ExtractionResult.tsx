'use client';

import { FC } from 'react';

import { Run } from '@/src/models/evaluation/run';

interface Props {
  run: Run;
}

const ExtractionResult: FC<Props> = () => {
  return <div className="flex flex-col gap-4">ExtractionResult</div>;
};

export default ExtractionResult;
