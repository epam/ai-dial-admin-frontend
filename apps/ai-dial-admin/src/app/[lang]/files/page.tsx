import FilesList from '@/src/components/Assets/Files/List';
import { FileFolderProvider } from '@/src/context/assets/FileFolderContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <FileFolderProvider>
      <FilesList />
    </FileFolderProvider>
  );
}
