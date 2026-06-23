import { notFound } from 'next/navigation';

import CompareView from '@/src/components/Runs/Compare/CompareView';
import { RUN_COMPARE_RUNS_QUERY_PARAM } from '@/src/components/Runs/Compare/constants';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ runs?: string }>;
}

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  const runId = params[RUN_COMPARE_RUNS_QUERY_PARAM]?.split(',')[0]?.trim();

  if (!runId) {
    notFound();
  }

  return <CompareView runId={decodeURIComponent(runId)} />;
}
