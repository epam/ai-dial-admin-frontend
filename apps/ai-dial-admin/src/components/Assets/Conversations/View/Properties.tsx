import { FC, useEffect, useState } from 'react';

import { DialIconButton, DialLabel, DialLoader, DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';

import { getAllDeployments } from '@/src/app/[lang]/conversations/actions';
import { getAgentLinkForConversation } from '@/src/components/Assets/utils';
import ExpandableText from '@/src/components/Common/ExpandableText/ExpandableText';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { BasicI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { DialConversation } from '@/src/models/dial/conversation';

interface Props {
  selectedConversation: DialConversation;
}

const Properties: FC<Props> = ({ selectedConversation }) => {
  const t = useI18n();
  const currentLocale = useCurrentLocale();
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [deployment, setDeployment] = useState<Record<string, string> | null>(null);

  const model = selectedConversation.model?.id as string;

  const openResourceInNewTab = () => {
    window.open(getAgentLinkForConversation(deployment, currentLocale), '_blank');
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
    <div className="size-full flex flex-col gap-y-8">
      {selectedConversation.name && (
        <LabelledText label={t(EntityFieldsI18nKey.name)}>
          <DialTooltip tooltip={selectedConversation.name}>{selectedConversation.name}</DialTooltip>
        </LabelledText>
      )}

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
