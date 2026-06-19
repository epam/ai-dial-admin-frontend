import { notFound } from 'next/navigation';

import TestSuiteView from '@/src/components/TestSuites/View/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { FileFolderProvider } from '@/src/context/assets/FileFolderContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { errorObjLog } from '@/src/server/logger';
import { createDatasetForSuite, getTestSuite } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  let testSuite: TestSuite | null = null;
  let etag = DEFAULT_ETAG;

  const id = (await params.params).id;

  try {
    const res = await getTestSuite(id, etag);
    etag = res?.etag || DEFAULT_ETAG;
    testSuite = res?.response as TestSuite | null;

    if (testSuite && !testSuite.datasetId) {
      await createDatasetForSuite(id);
      const refreshed = await getTestSuite(id, DEFAULT_ETAG);
      etag = refreshed?.etag || DEFAULT_ETAG;
      testSuite = (refreshed?.response as TestSuite | null) ?? testSuite;
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch test suite view data');
  }

  if (testSuite == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <FileFolderProvider>
        <TestSuiteView originalTestSuite={testSuite} etag={etag} />
      </FileFolderProvider>
    </SaveValidationContextProvider>
  );
}
