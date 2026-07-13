import { FC } from 'react';

import { DialCollapsibleSidebar, DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import { TabsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialConversation } from '@/src/models/dial/conversation';

interface Props {
  conversations: DialConversation[];
  selectedConversation?: DialConversation;
  onSelect: (conversation: DialConversation) => void;
}

const ConversationsSidebar: FC<Props> = ({ conversations, selectedConversation, onSelect }) => {
  const t = useI18n();

  return (
    <DialCollapsibleSidebar width={296} title={t(TabsI18nKey.Conversations)} containerClassName="bg-layer-3 mr-4">
      <div className="h-full flex flex-col">
        <h1 className="mb-6">{t(TabsI18nKey.Conversations)}</h1>
        <div className="flex-1 min-h-0 flex flex-col gap-y-2 overflow-auto">
          {conversations.map((conversation, index) => {
            const isSelected = conversation === selectedConversation;
            return (
              <button
                key={conversation.name ?? index}
                role="tab"
                className={classNames(
                  'rounded pl-3 py-2 flex flex-row h-[32px] w-full small cursor-pointer hover:text-accent-primary',
                  isSelected ? 'bg-accent-primary-alpha border-l-2 border-l-accent-primary' : 'text-primary',
                )}
                onClick={() => onSelect(conversation)}
              >
                <span className="flex-1 min-w-0 text-left truncate">
                  <DialEllipsisTooltip text={conversation.name} />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </DialCollapsibleSidebar>
  );
};

export default ConversationsSidebar;
