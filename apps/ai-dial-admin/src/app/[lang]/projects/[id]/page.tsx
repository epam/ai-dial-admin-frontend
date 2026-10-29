import { notFound } from 'next/navigation';

import ProjectView from '@/src/components/Assets/Artifacts/Projects/View/View';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialProjectResource } from '@/src/models/dial/resource';
import { errorObjLog } from '@/src/server/logger';
import { getContextLimits, getProject, getProjectManifest } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ path: string }>;
}) {
  let project: DialProjectResource | null = null;
  let manifestContent = '';

  try {
    // Next already decodes the query param once, which restores the singly-encoded resource path
    // `ResourceInfo.path` carries. Decoding again would corrupt any encoded segment.
    const path = (await params.searchParams).path;

    project = await getProject(path).then((res) => (res.success ? (res.response as DialProjectResource) : null));
    if (project) {
      // A missing or unreadable `PROJECT.md` is not a missing project: the fields just render empty.
      const manifest = await getProjectManifest(path);
      manifestContent = manifest.success ? (manifest.response as string) : '';
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch project asset data');
  }

  if (project == null) {
    notFound();
  }

  const limits = await getContextLimits();

  return (
    <SaveValidationContextProvider>
      <ProjectView project={project} manifestContent={manifestContent} limits={limits} />
    </SaveValidationContextProvider>
  );
}
