import { notFound } from 'next/navigation';

import SkillView from '@/src/components/Assets/Skills/View/View';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialSkillResource } from '@/src/models/dial/resource';
import { errorObjLog } from '@/src/server/logger';
import { getSkill } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ path: string }>;
}) {
  let skill: DialSkillResource | null = null;

  try {
    // Next already decodes the query param once, which restores the singly-encoded resource path
    // `ResourceInfo.path` carries. Decoding again would corrupt any encoded segment.
    const path = (await params.searchParams).path;

    skill = await getSkill(path).then((res) => (res.success ? (res.response as DialSkillResource) : null));
  } catch (e) {
    errorObjLog(e, 'Failed to fetch skill asset data');
  }

  if (skill == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <SkillView skill={skill} />
    </SaveValidationContextProvider>
  );
}
