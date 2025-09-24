import { redirect } from 'next/navigation';

import { getFiles } from '@/src/app/[lang]/files/actions';
import FileView from '@/src/components/Assets/FileView/FileView';
import Page403 from '@/src/components/Page403/Page403';
import { FileFolderProvider } from '@/src/context/FileFolderContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialFile } from '@/src/models/dial/file';
import { logger } from '@/src/server/logger';
import { ApplicationRoute } from '@/src/types/routes';
import { addTrailingSlash, getFolderNameAndPath } from '@/src/utils/files/path';

export const dynamic = 'force-dynamic';

export default async function Page(params: { searchParams: Promise<{ path: string }> }) {
  let file: DialFile | null = null;

  try {
    const fullPath = decodeURIComponent((await params.searchParams).path);
    const { name, path } = getFolderNameAndPath(fullPath);
    const files = await getFiles(addTrailingSlash(path));
    if (files === void 0) {
      return <Page403 />;
    }
    file = files?.find((f) => f.name === name) as DialFile;
  } catch (e) {
    logger.error('Getting file view data error', e);
  }

  if (file == null) {
    redirect(ApplicationRoute.Files);
  }

  return (
    <SaveValidationContextProvider>
      <FileFolderProvider>
        <FileView originalFile={file} />
      </FileFolderProvider>
    </SaveValidationContextProvider>
  );
}
