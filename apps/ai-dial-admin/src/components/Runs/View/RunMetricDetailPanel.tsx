'use client';

import { FC, useEffect, useState } from 'react';

import { DialCloseButton, DialLoader } from '@epam/ai-dial-ui-kit';

import { getTestCaseRunResultDetails } from '@/src/app/[lang]/runs/actions';
import { ExtractionResult } from '@/src/models/evaluation/run';

interface Props {
  resultId: string;
  onClose: () => void;
}

const RunMetricDetailPanel: FC<Props> = ({ resultId, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [details, setDetails] = useState<ExtractionResult | null>(null);

  useEffect(() => {
    if (!resultId) return;

    if (!isLoading && !details) {
      setIsLoading(true);
      getTestCaseRunResultDetails(resultId).then((res) => {
        const content = res;
        setDetails(content);
        setIsLoading(false);
      });
    }
  }, [isLoading, details, resultId]);

  return (
    <div className="flex flex-col size-full">
      <div className="flex items-start justify-between">
        <h1 className="truncate">{resultId}</h1>
        <DialCloseButton onClose={onClose} />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-6 mt-4">
        {isLoading ? <DialLoader size={40} /> : <div>Result details content</div>}
      </div>
    </div>
  );
};

export default RunMetricDetailPanel;
