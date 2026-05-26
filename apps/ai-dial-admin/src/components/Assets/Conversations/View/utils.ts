import { DialConversation } from '@/src/models/dial/conversation';
import { getNameVersionFromAsset, modifyNameVersionInAsset } from '@/src/utils/entities/versions';

export const getConversationPathWithVersion = (conversation: DialConversation, newVersion: string): string => {
  return modifyNameVersionInAsset(conversation.path, undefined, newVersion);
};

export const getConversationVersions = (
  conversation: DialConversation,
  conversations: DialConversation[] | null | undefined,
): string[] => {
  if (!conversations?.length) {
    return [];
  }

  const fullName = conversation.path.split('/').pop() || '';
  const { name: conversationName } = getNameVersionFromAsset(fullName);

  const versions = new Set<string>();

  conversations.forEach((item) => {
    const itemName = item.path.split('/').pop() || '';
    const { name: itemBaseName, version } = getNameVersionFromAsset(itemName);

    if (itemBaseName === conversationName && version) {
      versions.add(version);
    }
  });

  return Array.from(versions);
};
