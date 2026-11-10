'use client';

import { FC, useEffect, useMemo, useState } from 'react';

import {
  ElementSize,
  GhostButton,
  Notification,
  NotificationType,
  NotificationVariant,
  Select,
  SelectOption,
  Spinner,
} from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';

import AllSuitesTrendsHeader from '@/src/components/EntityView/EvalTrends/AllSuitesTrendsHeader';
import EvalMonthCostCard from '@/src/components/EntityView/EvalTrends/EvalMonthCostCard';
import { useEntityTestSuites } from '@/src/components/EntityView/EvalTrends/use-entity-test-suites';
import Trends from '@/src/components/TestSuites/Trends/Trends';
import TrendsPreviewRunsBadge from '@/src/components/TestSuites/Trends/TrendsPreviewRunsBadge';
import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';

interface Props {
  deploymentId: string;
}

const pickDefaultSuiteId = (suites: TestSuite[]): string | null => suites[0]?.id ?? null;

const EvalTrendsTab: FC<Props> = ({ deploymentId }) => {
  const t = useI18n();
  const { suites, isLoading } = useEntityTestSuites(deploymentId);
  const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(null);
  const [trendsRunCount, setTrendsRunCount] = useState<number | null>(null);

  useEffect(() => {
    setSelectedSuiteId(pickDefaultSuiteId(suites));
    setTrendsRunCount(null);
  }, [suites]);

  const selectedSuite = useMemo(
    () => suites.find((suite) => suite.id === selectedSuiteId) ?? null,
    [suites, selectedSuiteId],
  );

  const suiteOptions: SelectOption[] = useMemo(
    () =>
      suites
        .filter((suite): suite is TestSuite & { id: string } => !!suite.id)
        .map((suite) => ({
          value: suite.id,
          label: suite.name || suite.id,
        })),
    [suites],
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size={40} fullWidth />
      </div>
    );
  }

  if (suites.length === 0) {
    return (
      <div className="p-4">
        <Notification
          variant={NotificationVariant.Info}
          type={NotificationType.SectionMessage}
          iconSize={20}
          textClassName="flex-col"
          title={t(TestSuitesI18nKey.EvalTrendsNoSuitesTitle)}
          message={t(TestSuitesI18nKey.EvalTrendsNoSuitesDescription)}
          role="status"
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-col gap-4 px-4 pt-4">
        <AllSuitesTrendsHeader suiteCount={suites.length} />
        <EvalMonthCostCard deploymentId={deploymentId} suiteCount={suites.length} />
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 pt-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="dial-small-semi-text text-primary whitespace-nowrap">
            {t(TestSuitesI18nKey.ViewInTestSuite)}
          </span>
          <Select
            options={suiteOptions}
            value={selectedSuiteId ?? undefined}
            size={ElementSize.Small}
            searchable
            searchPlaceholder={t(BasicI18nKey.Search)}
            ariaLabel={t(TestSuitesI18nKey.ViewInTestSuite)}
            className="w-auto max-w-[16rem]"
            fieldClassName="w-auto bg-layer-4"
            listClassName="min-w-[20rem]"
            onChange={(next) => {
              setSelectedSuiteId(typeof next === 'string' ? next : null);
              setTrendsRunCount(null);
            }}
          />
          {selectedSuiteId && (
            <GhostButton
              size={ElementSize.Small}
              label={t(TestSuitesI18nKey.OpenInNewTab)}
              iconAfter={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
              onClick={() => onOpenInNewTab(ApplicationRoute.TestSuites, { id: selectedSuiteId })}
            />
          )}
        </div>
        <TrendsPreviewRunsBadge runCount={trendsRunCount} />
      </div>
      {selectedSuite && (
        <div className="flex flex-1 flex-col">
          <Trends
            key={selectedSuite.id}
            selectedTestSuite={selectedSuite}
            onTrendsRunCountChange={setTrendsRunCount}
            isFillHeight={false}
          />
        </div>
      )}
    </div>
  );
};

export default EvalTrendsTab;
