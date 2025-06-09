import { redirect } from 'next/navigation';
import { ApplicationRoute } from '@/src/types/routes';
import { DialFile } from '@/src/models/dial/file';
import { getFiles } from '@/src/app/[lang]/files/actions';
import { addTrailingSlash, getFolderNameAndPath } from '@/src/utils/files/path';
import FileView from '@/src/components/FileView/FileView';
import { logger } from '@/src/server/logger';

export const dynamic = 'force-dynamic';

export default async function Page(params: { searchParams: Promise<{ path: string }> }) {
  let file: DialFile | null = null;

  try {
    const fullPath = decodeURIComponent((await params.searchParams).path);
    const { name, path } = getFolderNameAndPath(fullPath);
    const files = await getFiles(addTrailingSlash(path));
    file = files?.find((f) => f.name === name) as DialFile;
  } catch (e) {
    logger.error('Getting file view data error', e);
  }

  if (file == null) {
    redirect(ApplicationRoute.Files);
  }

  return <FileView originalFile={file}></FileView>;
}
