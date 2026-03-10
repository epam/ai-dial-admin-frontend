import { notFound } from 'next/navigation';

import ModelsList from '@/src/components/Models/List/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialModel } from '@/src/models/dial/model';
import { errorObjLog } from '@/src/server/logger';
import { getModelsList } from './actions';

export const dynamic = 'force-dynamic';

export default async function Page() {
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
