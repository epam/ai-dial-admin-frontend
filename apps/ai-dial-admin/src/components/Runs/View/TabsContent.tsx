'use client';

import { FC, useMemo } from 'react';

import { DialIconButton, DialLabelledText } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import PropertiesTabContent from '@/src/components/EntityTabs/PropertiesTabContent';
import { EntityFieldsI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';
import { ApplicationRoute } from '@/src/types/routes';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import AnalyticsTab from './Analytics';
import ExtractionResultTab from './ExtractionResult';

interface Props {
  run: Run;
  activeTab: EntityViewTab;
}

const TabsContent: FC<Props> = ({ run, activeTab }) => {
  const t = useI18n();

  const headerPostfix = useMemo(() => {
    return (
      <>
        {!!run?.startedAt && (
          <LabelledText label={t(RunsI18nKey.StartTime)} text={formatDateTimeToLocalString(run?.startedAt)} />
        )}
        {!!run?.completedAt && (
          <LabelledText label={t(RunsI18nKey.EndTime)} text={formatDateTimeToLocalString(run?.completedAt)} />
        )}

        {!!run?.status && <LabelledText label={t(EntityFieldsI18nKey.status)} text={run.status} />}
        {!!run?.testRunName && (
          <DialLabelledText
            label={t(RunsI18nKey.TestSuite)}
            text={run.testSuiteId}
            postfix={
              <DialIconButton
                className="text-secondary size-[20px]"
                onClick={() => onOpenInNewTab(ApplicationRoute.TestSuites, { id: run.testSuiteId })}
                icon={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
              />
            }
          />
        )}
      </>
    );
  }, [run?.completedAt, run?.startedAt, run.status, run.testRunName, run.testSuiteId, t]);

  return (
    <>
      {activeTab === EntityViewTab.ExtractionResult && <ExtractionResultTab run={run} />}

      {activeTab === EntityViewTab.Summary && (
        <PropertiesTabContent entity={run} view={ApplicationRoute.Runs} headerPostfix={headerPostfix}>
          <div></div>
        </PropertiesTabContent>
      )}
      {activeTab === EntityViewTab.Analytics && <AnalyticsTab run={run} />}
    </>
  );
};

export default TabsContent;
