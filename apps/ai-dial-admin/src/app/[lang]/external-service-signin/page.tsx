import { ExternalServiceSignInPage } from '@/src/components/Assets/Resources/Auth/ExternalServiceSignInPage';

export const dynamic = 'force-dynamic';

export default async function Page(params: { searchParams: Promise<{ code?: string }> }) {
  const searchParams = await params.searchParams;
  const oAuthCode = searchParams.code;

  return <ExternalServiceSignInPage oAuthCode={oAuthCode} />;
}
