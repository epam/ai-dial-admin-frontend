'use client';

import { FC } from 'react';

import { TestSuite } from '@/src/models/evaluation/test-suite';

interface Props {
  testSuite: TestSuite;
  showFormattedUrl?: boolean;
}

const MethodEndpoint: FC<Props> = ({ testSuite, showFormattedUrl = false }) => {
  return (
    <div>
      {testSuite?.endpointRef?.method && (
        <span className="tiny bg-layer-3 rounded p-1 border border-primary whitespace-nowrap max-w-[200px] overflow-hidden">
          {testSuite?.endpointRef.method}
        </span>
      )}
      <span className="truncate text-primary ml-1">
        {showFormattedUrl ? testSuite?.requestTemplate?.urlTemplate : testSuite?.endpointRef?.relativeUrlPattern}
      </span>
    </div>
  );
};

export default MethodEndpoint;
