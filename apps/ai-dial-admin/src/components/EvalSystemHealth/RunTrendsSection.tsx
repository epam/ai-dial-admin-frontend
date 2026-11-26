'use client';

import { FC } from 'react';

import {
  Button,
  NoDataContent,
  Notification,
  NotificationType,
  NotificationVariant,
  Spinner,
} from '@epam/ai-dial-ui-kit';

import RunTrendsPager from '@/src/components/EvalSystemHealth/RunTrendsPager';
import RunTrendsTable from '@/src/components/EvalSystemHealth/RunTrendsTable';
import { CoverageStatus } from '@/src/components/EvalSystemHealth/models';
import { useRunTrendsData } from '@/src/components/EvalSystemHealth/use-run-trends-data';
import SummarySection from '@/src/components/Runs/Summary/SummarySection';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const RunTrendsSection: FC = () => {
  const t = useI18n();
  const { status, rows, page, totalPages, totalElements, goToPreviousPage, goToNextPage, retry } = useRunTrendsData();

  let content;
  if (status === CoverageStatus.Loading) {
    content = <Spinner size={32} fullWidth />;
  } else if (status === CoverageStatus.Error) {
    content = (
      <div className="flex flex-col items-start gap-2">
        <Notification
          variant={NotificationVariant.Error}
          type={NotificationType.SectionMessage}
          iconSize={20}
          message={t(EvalSystemHealthI18nKey.RunTrendsLoadFailed)}
          role="alert"
        />
        <Button label={t(EvalSystemHealthI18nKey.RunTrendsRetry)} onClick={retry} />
      </div>
    );
  } else if (totalElements === 0 && rows.length === 0) {
    content = (
      <NoDataContent
        title={t(EvalSystemHealthI18nKey.RunTrendsEmptyTitle)}
        description={t(EvalSystemHealthI18nKey.RunTrendsEmptyDescription)}
      />
    );
  } else {
    content = <RunTrendsTable rows={rows} />;
  }

  return (
    <SummarySection title={t(EvalSystemHealthI18nKey.RunTrends)} isFillHeight={false}>
      <div className="flex flex-col gap-3">
        {content}
        <RunTrendsPager
          page={page}
          totalPages={totalPages}
          isDisabled={status === CoverageStatus.Loading}
          onPrevious={goToPreviousPage}
          onNext={goToNextPage}
        />
      </div>
    </SummarySection>
  );
};

export default RunTrendsSection;
