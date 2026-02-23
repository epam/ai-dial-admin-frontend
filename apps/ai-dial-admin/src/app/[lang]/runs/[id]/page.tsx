import { notFound } from 'next/navigation';

import RunView from '@/src/components/Runs/View/View';
import { Run } from '@/src/models/evaluation/run';
import { errorObjLog } from '@/src/server/logger';
import { getRun } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  let run: Run | null = null;

  try {
    const { id } = await params.params;
    run = await getRun(decodeURIComponent(id));
  } catch (e) {
    errorObjLog(e, 'Failed to fetch run view data');
  }

  if (run == null) {
    notFound();
  }

  return <RunView run={run} />;
}
