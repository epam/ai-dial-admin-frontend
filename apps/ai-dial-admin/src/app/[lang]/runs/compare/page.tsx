import { notFound } from 'next/navigation';

import CompareView from '@/src/components/Runs/Compare/CompareView';
import { RUN_COMPARE_RUNS_QUERY_PARAM } from '@/src/components/Runs/Compare/constants';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ runs?: string }>;
}

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  const [primaryRunId, comparedRunId] =
    params[RUN_COMPARE_RUNS_QUERY_PARAM]?.split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .map(decodeURIComponent) ?? [];

  if (!primaryRunId || !comparedRunId) {
    notFound();
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full">
      <CompareView runId={primaryRunId} comparedRunId={comparedRunId} />
    </div>
  );
}
