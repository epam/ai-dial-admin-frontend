import { FC, useEffect, useMemo, useState } from 'react';

import type { DeploymentData } from '@epam/ai-dial-typescript-sdk';

import { IconButton, Label, Spinner, Tooltip } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';

import { getDeployment } from '@/src/app/[lang]/conversations/actions';
import { getAgentLinkForConversation } from '@/src/components/Assets/utils';
import ExpandableText from '@/src/components/Common/ExpandableText/ExpandableText';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { useModelDeploymentRoute } from '@/src/components/Runs/Summary/use-model-deployment-route';
import { BasicI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { DialConversation } from '@/src/models/dial/conversation';
import { DeploymentType } from '@/src/models/evaluation/deployment';
import { getDeploymentTypeFromCoreObject } from '@/src/utils/deployment-navigation';

interface Props {
  selectedConversation: DialConversation;
}

const Properties: FC<Props> = ({ selectedConversation }) => {
  const t = useI18n();
  const currentLocale = useCurrentLocale();
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [deployment, setDeployment] = useState<DeploymentData | null>(null);

  const model = selectedConversation.model?.id as string;
  const deploymentType = getDeploymentTypeFromCoreObject(deployment);
  const { modelRoute, isLoading: isModelRouteLoading } = useModelDeploymentRoute(model, deploymentType);

  const agentLink = useMemo(
    () => getAgentLinkForConversation(model, deployment, deploymentType, currentLocale, modelRoute),
    [currentLocale, deployment, deploymentType, model, modelRoute],
  );

  const openResourceInNewTab = () => {
    if (!agentLink) {
      return;
    }
    window.open(agentLink, '_blank');
  };

  useEffect(() => {
    if (!model) {
      setDeployment(null);
      setIsModelLoading(false);
      return;
    }

    let cancelled = false;
    setIsModelLoading(true);

    const loadDeployment = async () => {
      let data: DeploymentData | null = null;
      try {
        data = await getDeployment(model);
      } catch {
        // A failed lookup offers no link, like a deployment Core does not know.
      }
      if (!cancelled) {
        setDeployment(data);
        setIsModelLoading(false);
      }
    };

    void loadDeployment();

    return () => {
      cancelled = true;
    };
  }, [model]);

  // The hook's `isLoading` turns true in an effect, so for one render after the lookup lands a model has
  // neither a route nor a loading flag; waiting on the route itself keeps the name from flashing unlinked.
  // TODO: fix the gap in `useModelDeploymentRoute` instead (key the route by the id it was resolved for and
  // report loading until it matches), so `DeploymentExternalLink` and TestSuites `Properties` get it too.
  const isModelRoutePending = deploymentType === DeploymentType.Model && modelRoute === undefined;
  const isResolvingAgent = isModelLoading || isModelRouteLoading || isModelRoutePending;

  return (
    <div className={`size-full flex flex-col gap-y-8 ${STANDARD_CONTROL_WIDTH}`}>
      <LabelledText label={t(EntityFieldsI18nKey.name)}>
        <Tooltip tooltip={selectedConversation.name}>{selectedConversation.name}</Tooltip>
      </LabelledText>
      <LabelledText label={t(EntityFieldsI18nKey.agent)}>
        <div className="flex flex-row gap-1 items-center">
          {isResolvingAgent ? (
            <div className="flex-none">
              <Spinner size={18} fullWidth />
            </div>
          ) : (
            <>
              <Tooltip tooltip={model}>{model}</Tooltip>
              {!!agentLink && (
                <IconButton
                  onClick={() => openResourceInNewTab()}
                  className="text-secondary size-auto"
                  icon={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
                />
              )}
            </>
          )}
        </div>
      </LabelledText>

      {selectedConversation.prompt && (
        <div className="flex flex-col gap-2">
          <Label label={t(EntityFieldsI18nKey.prompt)} />
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
