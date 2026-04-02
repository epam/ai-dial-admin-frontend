// todo: remove when run properties will be added
'use client';

import { ReactNode, useMemo } from 'react';

import { Entity } from '@epam/ai-dial-shared';
import { DialIconButton, DialLabelledText, TabModel } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';

import ReadonlyId from '@/src/components/BaseControls/Id/ReadonlyId';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import Tabs from '@/src/components/EntityHeaderControls/Tabs/HeaderTabs';
import { EntityFieldsI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';
import { ApplicationRoute } from '@/src/types/routes';
import { getHeaderClassName } from '@/src/utils/entities/view';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import SimpleButtonsWrapper, { SimpleButtonsWrapperProps } from './Wrappers/SimpleButtonsWrapper';

interface Props<T> extends SimpleButtonsWrapperProps<T> {
  tabs: TabModel[];
  activeTab: EntityViewTab;
  children?: ReactNode;

  onChangeActiveTab: (tab: EntityViewTab) => void;
}

const RunHeader = <T extends Entity>({
  jsonConfiguration,
  children,
  tabs,
  activeTab,
  onChangeActiveTab,
  ...props
}: Props<T>) => {
  const t = useI18n();
  const run = props.entity as unknown as Run;
  const isEditorEnabled = jsonConfiguration?.isEditorEnabled;
  const readonlyId = run.id || '';

  const headerPostfix = useMemo(() => {
    return (
      <div className="flex flex-col sm:flex-row gap-8 pb-8 border-b border-primary">
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
      </div>
    );
  }, [run?.completedAt, run?.startedAt, run.status, run.testRunName, run.testSuiteId, t]);
  return (
    <div className="flex flex-col gap-y-4 mb-8">
      <div className={getHeaderClassName(isEditorEnabled)}>
        {!isEditorEnabled && <ReadonlyId value={readonlyId} />}
        <SimpleButtonsWrapper jsonConfiguration={jsonConfiguration} {...props}>
          {children}
        </SimpleButtonsWrapper>
      </div>
      {headerPostfix}
      <Tabs isEditorEnabled={isEditorEnabled} tabs={tabs} activeTab={activeTab} onChangeActiveTab={onChangeActiveTab} />
    </div>
  );
};

export default RunHeader;
