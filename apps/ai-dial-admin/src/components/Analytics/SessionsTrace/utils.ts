import { ApplicationRoute } from '@/src/types/routes';

export const sessionDetailHref = (chatId: string): string =>
  `${ApplicationRoute.SessionsTrace}/${encodeURIComponent(chatId)}`;
