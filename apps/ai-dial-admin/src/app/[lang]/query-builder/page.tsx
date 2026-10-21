import { redirect } from 'next/navigation';

import { ApplicationRoute } from '@/src/types/routes';

// The standalone builder route is retired: a query is now an addressable saved object, reached through
// the Queries list. Kept as a redirect so existing links and bookmarks still resolve.
export default function Page() {
  redirect(ApplicationRoute.AnalyticsQueries);
}
