'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { DialInputPopup, DialLabel, DialLoader, DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';
import classNames from 'classnames';

import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import { useDeploymentType } from '@/src/components/Runs/Summary/use-deployment-type';
import { useModelDeploymentRoute } from '@/src/components/Runs/Summary/use-model-deployment-route';
import CreateTestSuite from '@/src/components/TestSuites/Modals/Create/CreateTestSuite';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, CONTROL_WITH_BUTTON_WIDTH } from '@/src/constants/main-layout';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useI18n } from '@/src/locales/client';
import { SuiteType, TestSuite } from '@/src/models/evaluation/test-suite';
import {
  resolveDeploymentNavigationTarget,
  resolveMcpDeploymentNavigationTarget,
} from '@/src/utils/deployment-navigation';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';

interface Props {
  isModal?: boolean;
  testSuite: TestSuite;
  onChange: (testSuite: TestSuite, isSkipRefresh?: boolean) => void;
  nameExistsError?: string;
}

const TestSuiteProperties: FC<Props> = ({ testSuite, onChange, isModal = false, nameExistsError }) => {
  const t = useI18n();
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const isMobile = useIsMobileScreen();
  const { deploymentType, isLoading: isTypeLoading } = useDeploymentType(isModal ? null : testSuite.deploymentRef);
  const { modelRoute, isLoading: isModelRouteLoading } = useModelDeploymentRoute(
    isModal ? undefined : testSuite.deploymentRef?.id,
    deploymentType,
  );

  const isMcpSuite =
    testSuite.suiteType === SuiteType.McpTool || (!!testSuite.mcpDeploymentRef?.id && !testSuite.deploymentRef?.id);

  const navigationTarget = useMemo(() => {
    if (isMcpSuite) {
      return resolveMcpDeploymentNavigationTarget(testSuite.mcpDeploymentRef);
    }

    if (!testSuite.deploymentRef) {
      return null;
    }

    return resolveDeploymentNavigationTarget(testSuite.deploymentRef, deploymentType, [], { modelRoute });
  }, [deploymentType, isMcpSuite, modelRoute, testSuite.deploymentRef, testSuite.mcpDeploymentRef]);

  const openInNewTab = useCallback(() => {
    if (!navigationTarget) {
      return;
    }
    onOpenInNewTab(navigationTarget.route, navigationTarget.entity);
  }, [navigationTarget]);

  const onUpdate = useCallback(
    (suite: TestSuite) => {
      setIsAppModalOpen(false);
      onChange(suite);
    },
    [onChange],
  );

  const applicationName = testSuite.deploymentRef?.name || testSuite.mcpDeploymentRef?.name || '';
  const versionSuffix = testSuite.deploymentRef?.version ? ` (version: ${testSuite.deploymentRef.version})` : '';
  const selectedApplicationValue = `${applicationName}${versionSuffix}`;
  const isResolvingLink = !isModal && (isTypeLoading || isModelRouteLoading);

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
                >
                  <CreateTestSuite
                    currentEntity={testSuite}
                    isModalOpen={isAppModalOpen}
                    onClose={() => setIsAppModalOpen(false)}
                    onCreate={onUpdate as (suite: TestSuite) => void}
                  />
                </DialInputPopup>
              </div>
              {isResolvingLink ? (
                <div className="self-end flex size-[36px] items-center justify-center shrink-0">
                  <DialLoader fullWidth={false} size={16} className="text-secondary" />
                </div>
              ) : (
                !!navigationTarget && (
                  <DialNeutralButton
                    iconBefore={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
                    className="self-end shrink-0"
                    label={isMobile ? '' : t(ButtonsI18nKey.Open)}
                    onClick={openInNewTab}
                  />
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TestSuiteProperties;
