import { redirect } from 'next/navigation';

import { ApplicationRoute } from '@/src/types/routes';

export default function Page() {
  redirect(ApplicationRoute.Dashboard);
}
