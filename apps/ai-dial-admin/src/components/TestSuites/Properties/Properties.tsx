'use client';

import { FC, useCallback, useEffect, useState } from 'react';

import { DialInputPopup, DialLabel, DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';
import classNames from 'classnames';

import { getDeployments } from '@/src/app/[lang]/test-suites/actions';
import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import CreateTestSuite from '@/src/components/TestSuites/Modals/Create/CreateTestSuite';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, CONTROL_WITH_BUTTON_WIDTH } from '@/src/constants/main-layout';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useUtilityDeployments } from '@/src/hooks/use-utility-deployments';
import { useI18n } from '@/src/locales/client';
import { Deployment } from '@/src/models/evaluation/deployment';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { resolveDeploymentNavigationTarget } from '@/src/utils/deployment-navigation';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';

interface Props {
  isModal?: boolean;
  testSuite: TestSuite;
  onChange: (testSuite: TestSuite, isSkipRefresh?: boolean) => void;
  nameExistsError?: string;
}

const TestSuiteProperties: FC<Props> = ({ testSuite, onChange, isModal = false, nameExistsError }) => {
  const t = useI18n();
  const [deployments, setDeployments] = useState<Deployment[] | null>(null);
  const [selectedAppType, setSelectedAppType] = useState<string | undefined>(void 0);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const isMobile = useIsMobileScreen();
  const utilityDeployments = useUtilityDeployments();

  const openInNewTab = useCallback(() => {
    if (!testSuite.deploymentRef) {
      return;
    }

    const navigationTarget = resolveDeploymentNavigationTarget(
      testSuite.deploymentRef,
      selectedAppType,
      utilityDeployments,
    );
    if (!navigationTarget) {
      return;
    }

    onOpenInNewTab(navigationTarget.route, navigationTarget.entity);
  }, [selectedAppType, testSuite.deploymentRef, utilityDeployments]);

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

  const applicationName = testSuite.deploymentRef?.name || testSuite.mcpDeploymentRef?.name || '';
  const versionSuffix = testSuite.deploymentRef?.version ? ` (version: ${testSuite.deploymentRef.version})` : '';
  const selectedApplicationValue = `${applicationName}${versionSuffix}`;

  return (
    <div className="flex flex-col gap-y-8">
      <DisplayNameControl
        displayName={testSuite.name}
        required
        isFullWidth={false}
        onChange={(name) => onChange({ ...testSuite, name })}
        externalError={nameExistsError}
      />
      <DescriptionControl isFullWidth={false} entity={testSuite} onChangeEntity={onChange} />
      {!isModal && (
        <>
          <div className="flex gap-2">
            <div className="flex gap-2">
              <div className={classNames(CONTROL_WITH_BUTTON_WIDTH, 'flex flex-col gap-y-1')}>
                <DialLabel label={t(TestSuitesI18nKey.Application)} htmlFor="applications" />
                <DialInputPopup
                  open={isAppModalOpen}
                  onOpen={() => setIsAppModalOpen(true)}
                  selectedValue={selectedApplicationValue}
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
              {deployments && (
                <DialNeutralButton
                  iconBefore={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
                  className="self-end shrink-0"
                  label={isMobile ? '' : t(ButtonsI18nKey.Open)}
                  onClick={() => openInNewTab()}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TestSuiteProperties;
