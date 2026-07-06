'use client';

import { FC, useMemo } from 'react';

import { DialIconButton, DialLabelledText } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import RunStatusComponent from '@/src/components/Common/RunStatus/RunStatus';
import { EntityFieldsI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useLocalDateTimeString } from '@/src/hooks/use-local-date-time-string';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';
import { SuiteType, TestSuite } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { RunDeployment } from '../View/models';

interface Props {
  run: Run;
  testSuite: TestSuite | null;
}

const Header: FC<Props> = ({ run, testSuite }) => {
  const t = useI18n();
  const startedAt = useLocalDateTimeString(run?.startedAt);
  const completedAt = useLocalDateTimeString(run?.completedAt);

  const deployment = useMemo<RunDeployment | null>(() => {
    if (!testSuite) {
      return null;
    }
    if (testSuite.suiteType === SuiteType.McpTool && testSuite.mcpDeploymentRef?.name) {
      return { name: testSuite.mcpDeploymentRef.name, route: ApplicationRoute.McpContainers };
    }
    if (testSuite.deploymentRef?.name) {
      return { name: testSuite.deploymentRef.name, route: ApplicationRoute.Applications };
    }
    return null;
  }, [testSuite]);

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

      {!!deployment && (
        <DialLabelledText
          label={t(RunsI18nKey.Application)}
          text={deployment.name}
          postfix={
            <DialIconButton
              className="text-secondary size-[20px]"
              onClick={() => onOpenInNewTab(deployment.route, { name: deployment.name })}
              icon={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
            />
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
