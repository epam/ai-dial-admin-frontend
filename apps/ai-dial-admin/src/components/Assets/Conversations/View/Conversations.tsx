import { FC } from 'react';

import Icon from '@/public/images/conversation-icon.svg';
import { DialConversation } from '@/src/models/dial/conversation';

interface Props {
  selectedConversation: DialConversation;
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

const Conversations: FC<Props> = ({ selectedConversation }) => {
  return (
    <div className="w-full h-full bg-layer-1 overflow-y-auto">
      <div className="mx-auto w-[800px] max-w-full flex flex-col gap-6 py-6 px-4">
        {selectedConversation.messages.map((message, index) =>
          message.role === 'user' ? (
            <UserMessage key={index} message={message.content} />
          ) : (
            <AssistantMessage key={index} message={message.content} />
          ),
        )}
      </div>
    </div>
  );
};

export default Conversations;
