'use client';

import { FC, useCallback, useEffect, useState } from 'react';

import { DialInputPopup, DialLabel, DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';
import classNames from 'classnames';

import { getDeployments } from '@/src/app/[lang]/test-suites/actions';
import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import EndpointSchema from '@/src/components/TestSuites/EndpointSchema/EndpointSchema';
import CreateTestSuite from '@/src/components/TestSuites/Modals/Create/CreateTestSuite';
import RequestTemplate from '@/src/components/TestSuites/RequestTemplate/RequestTemplate';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, CONTROL_WITH_BUTTON_WIDTH } from '@/src/constants/main-layout';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useI18n } from '@/src/locales/client';
import { Deployment } from '@/src/models/evaluation/deployment';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';

interface Props {
  isModal?: boolean;
  testSuite: TestSuite;
  onChange: (testSuite: TestSuite, isSkipRefresh?: boolean) => void;
  isSkipRefresh?: boolean;
}

const TestSuiteProperties: FC<Props> = ({ testSuite, onChange, isModal = false, isSkipRefresh }) => {
  const t = useI18n();
  const [deployments, setDeployments] = useState<Deployment[] | null>(null);
  const [selectedAppType, setSelectedAppType] = useState<string | undefined>(void 0);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const isMobile = useIsMobileScreen();

  const openInNewTab = useCallback(() => {
    onOpenInNewTab(selectedAppType === 'dial-application' ? ApplicationRoute.Applications : ApplicationRoute.Models, {
      name: testSuite.deploymentRef?.id,
    });
  }, [selectedAppType, testSuite.deploymentRef?.id]);

  const onUpdate = useCallback(
    (suite: TestSuite) => {
      const app = deployments?.find((d) => d.deploymentId === suite.deploymentRef?.id);
      setSelectedAppType(app?.$type);
      setIsAppModalOpen(false);
      onChange(suite);
    },
    [deployments, onChange],
  );

  useEffect(() => {
    getDeployments().then((res) => {
      if (res?.success) {
        const data = res.response || [];
        setDeployments(data);
        const type = data?.find((d) => d.deploymentId === testSuite.deploymentRef?.id)?.$type;
        setSelectedAppType(type);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-y-8">
      {isModal && (
        <DisplayNameControl
          displayName={testSuite.name}
          required
          isFullWidth={false}
          onChange={(name) => onChange({ ...testSuite, name })}
        />
      )}
      <DescriptionControl isFullWidth={false} entity={testSuite} onChangeEntity={onChange} />
      {!isModal && (
        <>
          <div className="flex gap-2">
            <div className={classNames(CONTROL_WITH_BUTTON_WIDTH, 'flex flex-col gap-y-2')}>
              <DialLabel label={t(TestSuitesI18nKey.Application)} htmlFor="applications" />
              <DialInputPopup
                open={isAppModalOpen}
                onOpen={() => setIsAppModalOpen(true)}
                selectedValue={`${testSuite.deploymentRef?.name}${testSuite.deploymentRef?.version ? ` (version: ${testSuite.deploymentRef.version})` : ''}`}
                elementId="applications"
                disabled={!deployments}
              >
                <CreateTestSuite
                  currentEntity={testSuite}
                  isModalOpen={isAppModalOpen}
                  onClose={() => setIsAppModalOpen(false)}
                  onCreate={onUpdate as (suite: TestSuite) => void}
                />
              </DialInputPopup>
            </div>

            <DialNeutralButton
              iconBefore={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
              className="self-end shrink-0"
              label={isMobile ? '' : t(ButtonsI18nKey.Open)}
              onClick={() => openInNewTab()}
            />
          </div>
          {/* <div className="flex flex-col gap-4">
            <h3>{t(TestSuitesI18nKey.Method)}</h3>
            <div className="flex border border-primary rounded h-[480px]">
              <MethodInfo selectedAppType={selectedAppType} testSuite={testSuite} onChangeTestSuite={onChange} />
            </div>
          </div> */}
          <div className="flex flex-col gap-4">
            <h3>{t(TestSuitesI18nKey.RequestTemplate)}</h3>
            <div className="flex border border-primary rounded h-[480px] p-4">
              <RequestTemplate testSuite={testSuite} onChangeTestSuite={onChange} />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h3>{t(TestSuitesI18nKey.EndpointSchema)}</h3>
            <div className="flex border border-primary rounded h-[680px] p-4">
              <EndpointSchema testSuite={testSuite} onChangeTestSuite={onChange} isSkipRefresh={isSkipRefresh} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TestSuiteProperties;
