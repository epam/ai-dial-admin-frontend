'use client';

import { FC, useMemo } from 'react';

import { DialIconButton, DialLoader } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';

import { resolveRunDeployment } from '@/src/components/Runs/Summary/resolve-run-deployment';
import { useDeploymentType } from '@/src/components/Runs/Summary/use-deployment-type';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useUtilityDeployments } from '@/src/hooks/use-utility-deployments';
import { SuiteSnapshot, TestSuite } from '@/src/models/evaluation/test-suite';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';

interface Props {
  suiteContext: SuiteSnapshot | TestSuite | null;
}

const DeploymentExternalLink: FC<Props> = ({ suiteContext }) => {
  const utilityDeployments = useUtilityDeployments();
  const { deploymentType, isLoading } = useDeploymentType(suiteContext?.deploymentRef);

  const deployment = useMemo(
    () => resolveRunDeployment(suiteContext, deploymentType, utilityDeployments),
    [suiteContext, deploymentType, utilityDeployments],
  );

  if (deployment) {
    return (
      <DialIconButton
        className="text-secondary size-[20px]"
        onClick={() => onOpenInNewTab(deployment.route, deployment.entity)}
        icon={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex size-[20px] items-center justify-center">
        <DialLoader fullWidth={false} size={16} className="text-secondary" />
      </div>
    );
  }

  return null;
};

export default DeploymentExternalLink;
