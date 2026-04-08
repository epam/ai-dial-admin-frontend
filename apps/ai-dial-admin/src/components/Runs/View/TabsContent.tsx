'use client';

import { FC } from 'react';

import { Run } from '@/src/models/evaluation/run';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import AnalyticsTab from './Analytics';
import ExtractionResultTab from './ExtractionResult';

interface Props {
  run: Run;
  activeTab: EntityViewTab;
}
// todo: return original markup when properties tab will be ready
const TabsContent: FC<Props> = ({ run, activeTab }) => {
  // const t = useI18n();

  // const headerPostfix = useMemo(() => {
  //   return (
  //     <>
  //       {!!run?.startedAt && (
  //         <LabelledText label={t(RunsI18nKey.StartTime)} text={formatDateTimeToLocalString(run?.startedAt)} />
  //       )}
  //       {!!run?.completedAt && (
  //         <LabelledText label={t(RunsI18nKey.EndTime)} text={formatDateTimeToLocalString(run?.completedAt)} />
  //       )}

  //       {!!run?.status && (
  //   <LabelledText label={t(EntityFieldsI18nKey.status)}>
  //     <RunStatusComponent status={run.status} />
  //   </LabelledText>
  // )}
  //       {!!run?.testRunName && (
  //         <DialLabelledText
  //           label={t(RunsI18nKey.TestSuite)}
  //           text={run.testSuiteId}
  //           postfix={
  //             <DialIconButton
  //               className="text-secondary size-[20px]"
  //               onClick={() => onOpenInNewTab(ApplicationRoute.TestSuites, { id: run.testSuiteId })}
  //               icon={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
  //             />
  //           }
  //         />
  //       )}
  //     </>
  //   );
  // }, [run?.completedAt, run?.startedAt, run.status, run.testRunName, run.testSuiteId, t]);

  return (
    <>
      {activeTab === EntityViewTab.ExtractionResult && <ExtractionResultTab run={run} />}

      {/* {activeTab === EntityViewTab.Summary && (
        <PropertiesTabContent entity={run} view={ApplicationRoute.Runs} headerPostfix={headerPostfix}>
          <div></div>
        </PropertiesTabContent>
      )} */}
      {activeTab === EntityViewTab.Analytics && <AnalyticsTab run={run} />}
    </>
  );
};

export default TabsContent;
