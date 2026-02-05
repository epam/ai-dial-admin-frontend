import { AuthPage } from '@/src/components/Toolsets/Auth/AuthPage';

export const dynamic = 'force-dynamic';

export default async function Page(params: { searchParams: Promise<{ code?: string }> }) {
  const searchParams = await params.searchParams;
  const oAuthCode = searchParams.code;

  return <AuthPage oAuthCode={oAuthCode} />;
}
