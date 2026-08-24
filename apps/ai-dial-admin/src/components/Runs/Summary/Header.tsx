'use client';

import { FC } from 'react';

import { DialIconButton, DialLabelledText } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import RunStatusComponent from '@/src/components/Common/RunStatus/RunStatus';
import DeploymentExternalLink from '@/src/components/Runs/Summary/DeploymentExternalLink';
import { getSuiteApplicationName } from '@/src/components/Runs/Summary/resolve-run-deployment';
import { EntityFieldsI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useLocalDateTimeString } from '@/src/hooks/use-local-date-time-string';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';

interface Props {
  run: Run;
  testSuite: TestSuite | null;
}

const Header: FC<Props> = ({ run, testSuite }) => {
  const t = useI18n();
  const startedAt = useLocalDateTimeString(run?.startedAt);
  const completedAt = useLocalDateTimeString(run?.completedAt);
  const suiteContext = run.suiteSnapshot ?? testSuite;
  const applicationName = getSuiteApplicationName(suiteContext);
  const additionalRequestsCount = suiteContext?.additionalRequests?.length ?? 0;

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
          postfix={<DeploymentExternalLink suiteContext={suiteContext ?? null} />}
        />
      )}

      {!!run?.startedAt && <LabelledText label={t(RunsI18nKey.StartDate)} text={startedAt} />}
      {!!run?.completedAt && <LabelledText label={t(RunsI18nKey.EndDate)} text={completedAt} />}

      {additionalRequestsCount > 0 && (
        <LabelledText label={t(RunsI18nKey.RequestsInChain)} text={String(additionalRequestsCount + 1)} />
      )}

      {!!run?.status && (
        <LabelledText label={t(EntityFieldsI18nKey.status)}>
          <RunStatusComponent status={run.status} />
        </LabelledText>
      )}
    </div>
  );
};

export default Header;
