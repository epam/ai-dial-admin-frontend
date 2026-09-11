import { notFound, redirect } from 'next/navigation';

import { ApplicationRoute } from '@/src/types/routes';

import ModelsList from '@/src/components/Models/List/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialModel } from '@/src/models/dial/model';
import { errorObjLog } from '@/src/server/logger';
import { getModelsList } from './actions';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (!process.env.DIAL_ADMIN_API_URL) {
    redirect(ApplicationRoute.Home);
  }
  let data: DialModel[] | null = null;

  try {
    data = await getModelsList();
  } catch (e) {
    errorObjLog(e, 'Failed to fetch models view data');
  }

  if (data == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <ModelsList data={data || []} />
    </SaveValidationContextProvider>
  );
}
