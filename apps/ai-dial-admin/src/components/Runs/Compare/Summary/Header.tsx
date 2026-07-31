'use client';

import { FC } from 'react';

import { DialIconButton, DialLabelledText } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';

import DualRunField from '@/src/components/Runs/Compare/Summary/DualRunField';
import DeploymentExternalLink from '@/src/components/Runs/Summary/DeploymentExternalLink';
import { getSuiteApplicationName } from '@/src/components/Runs/Summary/resolve-run-deployment';
import { RunsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useLocalDateTimeString } from '@/src/hooks/use-local-date-time-string';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';

interface Props {
  primaryRun: Run;
  comparedRun: Run;
  primaryRunName: string;
  comparedRunName: string;
  testSuite: TestSuite | null;
}

const Header: FC<Props> = ({ primaryRun, comparedRun, primaryRunName, comparedRunName, testSuite }) => {
  const t = useI18n();
  const primaryStartedAt = useLocalDateTimeString(primaryRun?.startedAt);
  const primaryCompletedAt = useLocalDateTimeString(primaryRun?.completedAt);
  const comparedStartedAt = useLocalDateTimeString(comparedRun?.startedAt);
  const comparedCompletedAt = useLocalDateTimeString(comparedRun?.completedAt);

  const primarySuiteContext = primaryRun.suiteSnapshot ?? testSuite;
  const comparedSuiteContext = comparedRun.suiteSnapshot ?? testSuite;
  const primaryApplicationName = getSuiteApplicationName(primarySuiteContext);
  const comparedApplicationName = getSuiteApplicationName(comparedSuiteContext);
  const suiteId = primaryRun.testSuiteId ?? comparedRun.testSuiteId;
  const suiteName = testSuite?.name || suiteId;

  return (
    <div className="flex flex-col gap-8 border-b border-primary pb-8 sm:flex-row">
      {!!suiteId && (
        <DialLabelledText
          label={t(RunsI18nKey.TestSuite)}
          text={suiteName}
          postfix={
            <DialIconButton
              className="text-secondary size-[20px]"
              onClick={() => onOpenInNewTab(ApplicationRoute.TestSuites, { id: suiteId })}
              icon={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
            />
          }
        />
      )}

      {(!!primaryApplicationName || !!comparedApplicationName) && (
        <DualRunField
          label={t(RunsI18nKey.Application)}
          primaryRunName={primaryRunName}
          comparedRunName={comparedRunName}
          primaryValue={primaryApplicationName || '—'}
          comparedValue={comparedApplicationName || '—'}
          primaryPostfix={
            primaryApplicationName ? <DeploymentExternalLink suiteContext={primarySuiteContext ?? null} /> : undefined
          }
          comparedPostfix={
            comparedApplicationName ? <DeploymentExternalLink suiteContext={comparedSuiteContext ?? null} /> : undefined
          }
        />
      )}

      {(!!primaryRun.startedAt || !!comparedRun.startedAt) && (
        <DualRunField
          label={t(RunsI18nKey.StartDate)}
          primaryRunName={primaryRunName}
          comparedRunName={comparedRunName}
          primaryValue={primaryStartedAt || '—'}
          comparedValue={comparedStartedAt || '—'}
        />
      )}

      {(!!primaryRun.completedAt || !!comparedRun.completedAt) && (
        <DualRunField
          label={t(RunsI18nKey.EndDate)}
          primaryRunName={primaryRunName}
          comparedRunName={comparedRunName}
          primaryValue={primaryCompletedAt || '—'}
          comparedValue={comparedCompletedAt || '—'}
        />
      )}
    </div>
  );
};

export default Header;
