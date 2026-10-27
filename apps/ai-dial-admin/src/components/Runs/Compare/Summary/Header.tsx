'use client';

import { FC } from 'react';

import { IconButton, LabelledText } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';

import { CompareRunSlot } from '@/src/components/Runs/Compare/constants';
import { CompareRun } from '@/src/components/Runs/Compare/models';
import DualRunField from '@/src/components/Runs/Compare/Summary/DualRunField';
import { DualRunFieldEntry } from '@/src/components/Runs/Compare/Summary/models';
import DeploymentExternalLink from '@/src/components/Runs/Summary/DeploymentExternalLink';
import {
  getSuiteApplicationName,
  resolveSuiteContextForDeploymentLink,
} from '@/src/components/Runs/Summary/resolve-run-deployment';
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
  runs: CompareRun[];
  primaryTestSuite: TestSuite | null;
  comparedTestSuite: TestSuite | null;
}

const Header: FC<Props> = ({ primaryRun, comparedRun, runs, primaryTestSuite, comparedTestSuite }) => {
  const t = useI18n();
  const primaryStartedAt = useLocalDateTimeString(primaryRun?.startedAt);
  const primaryCompletedAt = useLocalDateTimeString(primaryRun?.completedAt);
  const comparedStartedAt = useLocalDateTimeString(comparedRun?.startedAt);
  const comparedCompletedAt = useLocalDateTimeString(comparedRun?.completedAt);

  const primarySuiteContext = primaryRun.suiteSnapshot ?? primaryTestSuite;
  const comparedSuiteContext = comparedRun.suiteSnapshot ?? comparedTestSuite;
  const primaryDeploymentLinkContext = resolveSuiteContextForDeploymentLink(primaryRun.suiteSnapshot, primaryTestSuite);
  const comparedDeploymentLinkContext = resolveSuiteContextForDeploymentLink(
    comparedRun.suiteSnapshot,
    comparedTestSuite,
  );
  const primaryApplicationName = getSuiteApplicationName(primarySuiteContext);
  const comparedApplicationName = getSuiteApplicationName(comparedSuiteContext);
  const primarySuiteId = primaryRun.testSuiteId;
  const comparedSuiteId = comparedRun.testSuiteId;
  const suiteId = primarySuiteId ?? comparedSuiteId;
  const suiteName = (primaryTestSuite ?? comparedTestSuite)?.name || suiteId;
  const hasDifferentSuites = !!primarySuiteId && !!comparedSuiteId && primarySuiteId !== comparedSuiteId;
  const suiteBySlot = {
    [CompareRunSlot.Primary]: { id: primarySuiteId, name: primaryTestSuite?.name || primarySuiteId },
    [CompareRunSlot.Secondary]: { id: comparedSuiteId, name: comparedTestSuite?.name || comparedSuiteId },
  };

  const valueBySlot = {
    application: {
      [CompareRunSlot.Primary]: primaryApplicationName,
      [CompareRunSlot.Secondary]: comparedApplicationName,
    },
    startDate: { [CompareRunSlot.Primary]: primaryStartedAt, [CompareRunSlot.Secondary]: comparedStartedAt },
    endDate: { [CompareRunSlot.Primary]: primaryCompletedAt, [CompareRunSlot.Secondary]: comparedCompletedAt },
  };
  const deploymentLinkContextBySlot = {
    [CompareRunSlot.Primary]: primaryDeploymentLinkContext,
    [CompareRunSlot.Secondary]: comparedDeploymentLinkContext,
  };

  const toEntries = (
    valueOfSlot: Record<CompareRunSlot, string | null | undefined>,
    hasDeploymentLink = false,
  ): DualRunFieldEntry[] =>
    runs.map((run) => ({
      key: run.slot,
      runName: run.name,
      value: valueOfSlot[run.slot] || '—',
      postfix:
        hasDeploymentLink && valueOfSlot[run.slot] ? (
          <DeploymentExternalLink suiteContext={deploymentLinkContextBySlot[run.slot] ?? null} />
        ) : undefined,
    }));

  return (
    <div className="flex flex-col gap-8 pb-8 sm:flex-row">
      {hasDifferentSuites && (
        <DualRunField
          label={t(RunsI18nKey.TestSuite)}
          entries={runs.map(({ slot, name }) => ({
            key: slot,
            runName: name,
            value: suiteBySlot[slot].name ?? '—',
            postfix: (
              <IconButton
                className="text-secondary size-[20px]"
                onClick={() => onOpenInNewTab(ApplicationRoute.TestSuites, { id: suiteBySlot[slot].id })}
                icon={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
              />
            ),
          }))}
        />
      )}

      {!hasDifferentSuites && !!suiteId && (
        <LabelledText
          label={t(RunsI18nKey.TestSuite)}
          text={suiteName}
          postfix={
            <IconButton
              className="text-secondary size-[20px]"
              onClick={() => onOpenInNewTab(ApplicationRoute.TestSuites, { id: suiteId })}
              icon={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
            />
          }
        />
      )}

      {(!!primaryApplicationName || !!comparedApplicationName) && (
        <DualRunField label={t(RunsI18nKey.Application)} entries={toEntries(valueBySlot.application, true)} />
      )}

      {(!!primaryRun.startedAt || !!comparedRun.startedAt) && (
        <DualRunField label={t(RunsI18nKey.StartDate)} entries={toEntries(valueBySlot.startDate)} />
      )}

      {(!!primaryRun.completedAt || !!comparedRun.completedAt) && (
        <DualRunField label={t(RunsI18nKey.EndDate)} entries={toEntries(valueBySlot.endDate)} />
      )}
    </div>
  );
};

export default Header;
