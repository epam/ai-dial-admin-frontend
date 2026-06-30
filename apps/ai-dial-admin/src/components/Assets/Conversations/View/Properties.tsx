import { FC, useEffect, useMemo, useState } from 'react';

import { DialIconButton, DialLabel, DialLoader, DialSelect, DialTooltip, SelectOption } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';

import { getAllDeployments } from '@/src/app/[lang]/conversations/actions';
import { getAgentLinkForConversation } from '@/src/components/Assets/utils';
import ExpandableText from '@/src/components/Common/ExpandableText/ExpandableText';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { BasicI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { DialConversation } from '@/src/models/dial/conversation';

interface Props {
  selectedConversation: DialConversation;
  conversations?: DialConversation[];
  onConversationChange?: (conversation: DialConversation) => void;
}

const Properties: FC<Props> = ({ selectedConversation, conversations, onConversationChange }) => {
  const t = useI18n();
  const currentLocale = useCurrentLocale();
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [deployment, setDeployment] = useState<Record<string, string> | null>(null);

  const model = selectedConversation.model?.id as string;
  const isMultiConversation = !!conversations && conversations.length > 1;

  const conversationOptions: SelectOption[] = useMemo(() => {
    if (!isMultiConversation) return [];
    return conversations!.map((c) => ({
      value: c.name as string,
      label: c.name as string,
    }));
  }, [conversations, isMultiConversation]);

  const openResourceInNewTab = () => {
    window.open(getAgentLinkForConversation(deployment, currentLocale), '_blank');
  };

  const onSelectConversation = (name: string) => {
    const found = conversations?.find((c) => c.name === name);
    if (found) onConversationChange?.(found);
  };

  useEffect(() => {
    getAllDeployments()
      .then((data) => {
        const deployments = (data?.response as Record<string, string>[] | undefined) ?? [];
        const found = deployments.find((d) => d.reference === model) ?? null;
        setDeployment(found);
      })
      .finally(() => {
        setIsModelLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`size-full flex flex-col gap-y-8 ${STANDARD_CONTROL_WIDTH}`}>
      <LabelledText label={t(EntityFieldsI18nKey.name)}>
        {isMultiConversation ? (
          <DialSelect
            options={conversationOptions}
            value={selectedConversation.name as string}
            onChange={(v) => onSelectConversation(v as string)}
          />
        ) : (
          <DialTooltip tooltip={selectedConversation.name}>{selectedConversation.name}</DialTooltip>
        )}
      </LabelledText>

      <LabelledText label={t(EntityFieldsI18nKey.agent)}>
        <div className="flex flex-row gap-1 items-center">
          {isModelLoading ? (
            <div className="flex-none">
              <DialLoader />
            </div>
          ) : (
            <>
              <DialTooltip tooltip={model}>{model}</DialTooltip>
              <DialIconButton
                onClick={() => openResourceInNewTab()}
                className="text-secondary size-auto"
                icon={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
              />
            </>
          )}
        </div>
      </LabelledText>

      {selectedConversation.prompt && (
        <div className="flex flex-col gap-2">
          <DialLabel label={t(EntityFieldsI18nKey.prompt)} />
          <ExpandableText lines={5} popupHeader={t(BasicI18nKey.PreviewPrompt)}>
            <div className="text-sm whitespace-pre-wrap">{selectedConversation.prompt}</div>
          </ExpandableText>
        </div>
      )}
      {selectedConversation.temperature != null && (
        <LabelledText label={t(EntityFieldsI18nKey.temperature)} text={selectedConversation.temperature.toString()} />
      )}
    </div>
  );
};

export default Properties;
