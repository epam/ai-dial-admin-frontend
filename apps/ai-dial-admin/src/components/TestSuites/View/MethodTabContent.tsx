'use client';

import { FC, useEffect, useState } from 'react';

import { ButtonAppearance, DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { IconEdit } from '@tabler/icons-react';

import { getDeployments } from '@/src/app/[lang]/test-suites/actions';
import EndpointSchema from '@/src/components/TestSuites/EndpointSchema/EndpointSchema';
import ChangeMethodModal from '@/src/components/TestSuites/Modals/ChangeMethodModal/ChangeMethodModal';
import MethodEndpoint from '@/src/components/TestSuites/Methods/Endpoint';
import RequestTemplate from '@/src/components/TestSuites/RequestTemplate/RequestTemplate';
import TryOutButton from '@/src/components/TestSuites/RequestTemplate/components/TryOutButton';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import { Deployment } from '@/src/models/evaluation/deployment';
import { TestSuite } from '@/src/models/evaluation/test-suite';

interface Props {
  testSuite: TestSuite;
  onChange: (testSuite: TestSuite, isSkipRefresh?: boolean) => void;
  isSkipRefresh?: boolean;
}

const MethodTabContent: FC<Props> = ({ testSuite, onChange, isSkipRefresh }) => {
  const t = useI18n();
  const [deployments, setDeployments] = useState<Deployment[] | null>(null);
  const [isChangeMethodModalOpen, setIsChangeMethodModalOpen] = useState(false);
  const { sidebar } = useAppContext();
  const isTryOutOpen = sidebar.show;

  const selectedApplication = deployments?.find((d) => d.deploymentId === testSuite.deploymentRef?.id) ?? null;

  useEffect(() => {
    getDeployments().then((res) => {
      if (res?.success) {
        setDeployments(res.response || []);
      }
    });
  }, []);

  return (
    <div className="flex flex-col gap-y-8">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col">
          <div className="flex flex-row justify-between">
            <MethodEndpoint testSuite={testSuite} showFormattedUrl />

            <div className="flex flex-row gap-3 items-center">
              <DialPrimaryButton
                iconBefore={<IconEdit {...BASE_BUTTON_ICON_PROPS} />}
                appearance={ButtonAppearance.Ghost}
                label={t(TestSuitesI18nKey.ChangeMethod)}
                disabled={isTryOutOpen}
                tooltipProps={
                  isTryOutOpen ? { tooltip: t(TestSuitesI18nKey.ChangeMethodDisabledWhileTryOutOpen) } : undefined
                }
                onClick={() => setIsChangeMethodModalOpen(true)}
              />
              <TryOutButton testSuite={testSuite} />
            </div>
          </div>
        </div>

        <RequestTemplate testSuite={testSuite} onChangeTestSuite={onChange} />
        <EndpointSchema testSuite={testSuite} onChangeTestSuite={onChange} isSkipRefresh={isSkipRefresh} />
        <ChangeMethodModal
          isModal={true}
          testSuite={testSuite}
          onChangeTestSuite={onChange}
          selectedApplication={selectedApplication}
          isOpen={isChangeMethodModalOpen}
          onClose={() => setIsChangeMethodModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default MethodTabContent;
