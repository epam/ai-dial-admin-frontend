import notFound from '@/src/app/not-found';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialConversation } from '@/src/models/dial/conversation';
import { errorObjLog } from '@/src/server/logger';
import { getConversation, getConversations } from '../actions';
import ConversationView from '@/src/components/Assets/Conversations/View/View';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ path: string }>;
}) {
  let etag = DEFAULT_ETAG;

  let conversation: DialConversation | null = null;
  let conversations: DialConversation[] = [];

  try {
    const path = decodeURIComponent((await params.searchParams).path);

    conversation = await getConversation(path, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as DialConversation | null;
    });

    if (conversation) {
      conversations = (await getConversations(`${conversation?.folderId}/`)) as DialConversation[];
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch conversation view data');
  }

  if (!conversation) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <ConversationView conversation={conversation as DialConversation} conversations={conversations} />
    </SaveValidationContextProvider>
  );
}
