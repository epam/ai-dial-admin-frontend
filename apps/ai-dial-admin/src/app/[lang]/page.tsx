import { ApplicationRoute } from '@/src/types/routes';
import { redirect } from 'next/navigation';

export default function Page() {
  redirect(ApplicationRoute.Home);
}
