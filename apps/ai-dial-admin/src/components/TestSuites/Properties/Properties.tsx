'use client';

import { FC, useCallback, useEffect, useState } from 'react';

import { DialInputPopup, DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';
import classNames from 'classnames';

import { getDeployments } from '@/src/app/[lang]/test-suites/actions';
import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import Field from '@/src/components/Common/Field/Field';
import MethodInfo from '@/src/components/TestSuites/Methods/MethodInfo';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, CONTROL_WITH_BUTTON_WIDTH, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { Deployment } from '@/src/models/evaluation/deployment';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import SelectApplicationModal from '../Modals/SelectApplication/SelectApplicationModal';

interface Props {
  isModal?: boolean;
  testSuite: TestSuite;
  onChange: (testSuite: TestSuite) => void;
}

const TestSuiteProperties: FC<Props> = ({ testSuite, onChange, isModal = false }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const [deployments, setDeployments] = useState<Deployment[] | null>(null);
  const [selectedAppType, setSelectedAppType] = useState<string | undefined>(void 0);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);

  const openInNewTab = useCallback(() => {
    onOpenInNewTab(selectedAppType === 'dial-application' ? ApplicationRoute.Applications : ApplicationRoute.Models, {
      name: testSuite.deploymentRef?.id,
    });
  }, [selectedAppType, testSuite.deploymentRef?.id]);

  const onSelectApp = useCallback(
    (id?: string) => {
      const app = deployments?.find((d) => d.deploymentId === id);
      onChange({
        ...testSuite,
        deploymentRef: {
          id: app?.deploymentId,
          name: app?.displayName,
          version: app?.version,
        },
        endpointRef: void 0,
      });
      dispatch({ type: ValidationActionType.SetField, field: 'endpointRef', isValid: false });
      setSelectedAppType(app?.$type);
      setIsAppModalOpen(false);
    },
    [deployments, dispatch, onChange, testSuite],
  );

  useEffect(() => {
    getDeployments().then((data) => {
      setDeployments(data);
      const type = data?.find((d) => d.deploymentId === testSuite.deploymentRef?.id)?.$type;
      setSelectedAppType(type);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full flex flex-col gap-y-8">
      {isModal && (
        <DisplayNameControl
          displayName={testSuite.name}
          required={true}
          isFullWidth={false}
          onChange={(name) => onChange({ ...testSuite, name })}
        />
      )}
      <DescriptionControl isFullWidth={false} entity={testSuite} onChangeEntity={onChange} />
      {!isModal && (
        <>
          <div className={classNames('flex gap-2', STANDARD_CONTROL_WIDTH)}>
            <div className={CONTROL_WITH_BUTTON_WIDTH}>
              <Field fieldTitle={t(TestSuitesI18nKey.Application)} htmlFor="applications" />
              <DialInputPopup
                open={isAppModalOpen}
                onOpen={() => setIsAppModalOpen(true)}
                selectedValue={testSuite.deploymentRef?.name}
                elementId="applications"
                disabled={!deployments}
              >
                <SelectApplicationModal
                  selected={testSuite.deploymentRef?.id}
                  onClose={() => setIsAppModalOpen(false)}
                  onApply={onSelectApp}
                  apps={deployments || []}
                  isModalOpen={isAppModalOpen}
                />
              </DialInputPopup>
            </div>

            <DialNeutralButton
              iconBefore={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
              className="self-end shrink-0"
              label={t(ButtonsI18nKey.Open)}
              onClick={() => openInNewTab()}
            />
          </div>
          <div className="flex flex-col gap-4">
            <h3>{t(TestSuitesI18nKey.Method)}</h3>
            <div className="flex border border-primary rounded h-[480px]">
              <MethodInfo selectedAppType={selectedAppType} testSuite={testSuite} onChangeTestSuite={onChange} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TestSuiteProperties;
