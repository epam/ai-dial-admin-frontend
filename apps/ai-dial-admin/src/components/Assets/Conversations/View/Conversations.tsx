import { FC, useEffect, useState } from 'react';

import Icon from '@/public/images/conversation-icon.svg';
import { DialConversation } from '@/src/models/dial/conversation';
import { ConversationPublication } from '@/src/models/dial/publications';
import ConversationsSidebar from './ConversationsSidebar';
import Properties from './Properties';

interface Props {
  publication?: ConversationPublication;
  conversation?: DialConversation;
}

const UserMessage: FC<{ message: string }> = ({ message }) => (
  <div className="flex justify-end">
    <div
      className="bg-layer-4 px-6 py-4 max-w-[80%] whitespace-pre-wrap"
      style={{
        borderRadius: '16px 16px 0 16px',
      }}
    >
      {message}
    </div>
  </div>
);

const AssistantMessage: FC<{ message: string }> = ({ message }) => (
  <div className="flex items-start gap-5">
    <div className="shrink-0 mt-1">
      <Icon />
    </div>
    <div className="whitespace-pre-wrap">{message}</div>
  </div>
);

const Conversations: FC<Props> = ({ publication, conversation }) => {
  const [selectedConversation, setSelectedConversation] = useState<DialConversation | undefined>(
    () =>
      conversation ??
      ((publication as ConversationPublication).conversations?.[0]?.conversation as DialConversation | undefined),
  );

  useEffect(() => {
    setSelectedConversation(
      conversation ??
        ((publication as ConversationPublication).conversations?.[0]?.conversation as DialConversation | undefined),
    );
  }, [publication, conversation]);
  const conversations = (publication?.conversations ?? []).map((pc) => pc.conversation as DialConversation);

  return (
    <div className="flex gap-4 size-full">
      {conversations.length > 1 && (
        <ConversationsSidebar
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelect={setSelectedConversation}
        />
      )}
      <div className="flex flex-col gap-4 flex-1 min-w-0 overflow-y-auto border-secondary border rounded p-4">
        <div className="flex">{selectedConversation && <Properties selectedConversation={selectedConversation} />}</div>
        <div className="flex-1 bg-layer-1">
          <div className="mx-auto w-[800px] max-w-full flex flex-col gap-6 py-6 px-4">
            {selectedConversation?.messages.map((message, index) =>
              message.role === 'user' ? (
                <UserMessage key={index} message={message.content} />
              ) : (
                <AssistantMessage key={index} message={message.content} />
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Conversations;
