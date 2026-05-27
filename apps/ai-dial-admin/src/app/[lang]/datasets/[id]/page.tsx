import { notFound } from 'next/navigation';

import { getDataset } from '@/src/app/[lang]/datasets/actions';
import DatasetView from '@/src/components/Datasets/View/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { FileFolderProvider } from '@/src/context/assets/FileFolderContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Dataset } from '@/src/models/evaluation/dataset';
import { errorObjLog } from '@/src/server/logger';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  let dataset: Dataset | null = null;
  let etag = DEFAULT_ETAG;

  try {
    dataset = await getDataset((await params.params).id, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return (res?.response as Dataset | null) ?? null;
    });
  } catch (e) {
    errorObjLog(e, 'Failed to fetch dataset view data');
  }

  if (dataset == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <FileFolderProvider>
        <DatasetView originalDataset={dataset} etag={etag} />
      </FileFolderProvider>
    </SaveValidationContextProvider>
  );
}
