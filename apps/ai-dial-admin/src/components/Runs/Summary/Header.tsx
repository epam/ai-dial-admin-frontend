'use client';

import { FC, useMemo } from 'react';

import { DialIconButton, DialLabelledText, DialLoader } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import RunStatusComponent from '@/src/components/Common/RunStatus/RunStatus';
import { EntityFieldsI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useLocalDateTimeString } from '@/src/hooks/use-local-date-time-string';
import { useI18n } from '@/src/locales/client';
import { DeploymentType } from '@/src/models/evaluation/deployment';
import { Run } from '@/src/models/evaluation/run';
import { SuiteType, TestSuite } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { RunDeployment } from '../View/models';
import { useDeploymentType } from './use-deployment-type';

interface Props {
  run: Run;
  testSuite: TestSuite | null;
}

const Header: FC<Props> = ({ run, testSuite }) => {
  const t = useI18n();
  const startedAt = useLocalDateTimeString(run?.startedAt);
  const completedAt = useLocalDateTimeString(run?.completedAt);
  const { deploymentType, isLoading: isDeploymentTypeLoading } = useDeploymentType(testSuite?.deploymentRef);

  const deployment = useMemo<RunDeployment | null>(() => {
    if (!testSuite) {
      return null;
    }
    if (testSuite.suiteType === SuiteType.McpTool && testSuite.mcpDeploymentRef?.name) {
      return {
        name: testSuite.mcpDeploymentRef.name,
        linkId: testSuite.mcpDeploymentRef.id ?? testSuite.mcpDeploymentRef.name,
        route: ApplicationRoute.McpContainers,
      };
    }
    if (testSuite.deploymentRef?.name && testSuite.deploymentRef?.id && deploymentType) {
      const route =
        deploymentType === DeploymentType.Application ? ApplicationRoute.Applications : ApplicationRoute.Models;
      return {
        name: testSuite.deploymentRef.name,
        linkId: testSuite.deploymentRef.id,
        route,
      };
    }
    return null;
  }, [testSuite, deploymentType]);

  const applicationName =
    testSuite?.deploymentRef?.name ||
    (testSuite?.suiteType === SuiteType.McpTool ? testSuite?.mcpDeploymentRef?.name : '');

  return (
    <div className="flex flex-col sm:flex-row gap-8 pb-8 border-b border-primary">
      {!!run?.testRunName && <LabelledText label={t(EntityFieldsI18nKey.name)} text={run.testRunName} />}

      {!!run?.testSuiteId && (
        <DialLabelledText
          label={t(RunsI18nKey.TestSuite)}
          text={testSuite?.name || run.testSuiteId}
          postfix={
            <DialIconButton
              className="text-secondary size-[20px]"
              onClick={() => onOpenInNewTab(ApplicationRoute.TestSuites, { id: run.testSuiteId })}
              icon={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
            />
          }
        />
      )}

      {!!applicationName && (
        <DialLabelledText
          label={t(RunsI18nKey.Application)}
          text={applicationName}
          postfix={
            deployment ? (
              <DialIconButton
                className="text-secondary size-[20px]"
                onClick={() => onOpenInNewTab(deployment.route, { name: deployment.linkId })}
                icon={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
              />
            ) : isDeploymentTypeLoading ? (
              <div className="flex size-[20px] items-center justify-center">
                <DialLoader fullWidth={false} size={16} className="text-secondary" />
              </div>
            ) : undefined
          }
        />
      )}

      {!!run?.startedAt && <LabelledText label={t(RunsI18nKey.StartDate)} text={startedAt} />}
      {!!run?.completedAt && <LabelledText label={t(RunsI18nKey.EndDate)} text={completedAt} />}

      {!!run?.status && (
        <LabelledText label={t(EntityFieldsI18nKey.status)}>
          <RunStatusComponent status={run.status} />
        </LabelledText>
      )}
    </div>
  );
};

export default Header;
