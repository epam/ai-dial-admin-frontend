import FoldersStorage from '@/src/components/FoldersStorage/FoldersStorage';

export const dynamic = 'force-dynamic';

export default async function Page(params: { searchParams: Promise<{ path: string }> }) {
  const initialPath = (await params.searchParams).path;

  return <FoldersStorage initialPath={initialPath && decodeURIComponent(initialPath)} />;
}
