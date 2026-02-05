import { redirect } from 'next/navigation';

import { ApplicationRoute } from '@/src/types/routes';

export const dynamic = 'force-dynamic';

export default async function Page(params: { searchParams: Promise<{ code?: string }> }) {
  const searchParams = await params.searchParams;
  const oAuthCode = searchParams.code;

  redirect(`${ApplicationRoute.Toolsets}?code=${oAuthCode ?? ''}`);
}
