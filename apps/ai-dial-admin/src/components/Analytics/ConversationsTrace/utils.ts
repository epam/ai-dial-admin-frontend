import { ApplicationRoute } from '@/src/types/routes';

export const conversationDetailHref = (chatId: string): string =>
  `${ApplicationRoute.ConversationsTrace}/${encodeURIComponent(chatId)}`;
