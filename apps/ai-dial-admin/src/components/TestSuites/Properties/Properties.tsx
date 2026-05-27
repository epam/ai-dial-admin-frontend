'use client';

import { FC, useCallback, useEffect, useState } from 'react';

import { DialInputPopup, DialLabel, DialNeutralButton, DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';
import classNames from 'classnames';

import { getDataset, patchDatasetVisibility } from '@/src/app/[lang]/datasets/actions';
import { getDeployments } from '@/src/app/[lang]/test-suites/actions';
import { useNotification } from '@/src/context/NotificationContext';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import CreateDatasetModal from '@/src/components/Common/DatasetPicker/CreateDatasetModal';
import DatasetPicker from '@/src/components/Common/DatasetPicker/DatasetPicker';
import CreateTestSuite from '@/src/components/TestSuites/Modals/Create/CreateTestSuite';
import { ButtonsI18nKey, DatasetsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, CONTROL_WITH_BUTTON_WIDTH } from '@/src/constants/main-layout';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useI18n } from '@/src/locales/client';
import { Dataset } from '@/src/models/evaluation/dataset';
import { Deployment } from '@/src/models/evaluation/deployment';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { DatasetVisibility } from '@/src/types/evaluation';
import { ApplicationRoute } from '@/src/types/routes';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
interface Props {
  isModal?: boolean;
  testSuite: TestSuite;
  onChange: (testSuite: TestSuite, isSkipRefresh?: boolean) => void;
  nameExistsError?: string;
}

const TestSuiteProperties: FC<Props> = ({ testSuite, onChange, isModal = false, nameExistsError }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const [deployments, setDeployments] = useState<Deployment[] | null>(null);
  const [selectedAppType, setSelectedAppType] = useState<string | undefined>(void 0);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [boundDataset, setBoundDataset] = useState<Dataset | null>(null);
  const [isDatasetPickerOpen, setIsDatasetPickerOpen] = useState(false);
  const [isCreateDatasetOpen, setIsCreateDatasetOpen] = useState(false);
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

  useEffect(() => {
    let cancelled = false;
    if (!testSuite.datasetId) {
      setBoundDataset(null);
      return;
    }
    getDataset(testSuite.datasetId, '').then((res) => {
      if (cancelled) return;
      if (res?.success && res.response) {
        setBoundDataset(res.response as Dataset);
      } else {
        setBoundDataset(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [testSuite.datasetId]);

  const onPickDataset = useCallback(
    (dataset: Dataset) => {
      setBoundDataset(dataset);
      onChange({ ...testSuite, datasetId: dataset.id });
    },
    [onChange, testSuite],
  );

  const onCreatedDataset = useCallback(
    (dataset: Dataset) => {
      setBoundDataset(dataset);
      // The dataset was created server-side already bound to this suite (bindToSuiteId)
      // so reflect that in local state for downstream consumers (run button, TestCases tab).
      onChange({ ...testSuite, datasetId: dataset.id });
    },
    [onChange, testSuite],
  );

  const onUnbindDataset = useCallback(() => {
    setBoundDataset(null);
    onChange({ ...testSuite, datasetId: null });
  }, [onChange, testSuite]);

  const openDatasetPage = useCallback(() => {
    if (!boundDataset) return;
    onOpenInNewTab(ApplicationRoute.Datasets, { id: boundDataset.id });
  }, [boundDataset]);

  const onPromoteToPublic = useCallback(() => {
    if (!boundDataset) return;
    patchDatasetVisibility(boundDataset.id, { visibility: DatasetVisibility.PUBLIC }).then((res) => {
      if (res?.success && res.response) {
        setBoundDataset(res.response as Dataset);
        showNotification(getSuccessNotification(t(DatasetsI18nKey.Visibility), `${boundDataset.name} is now public`));
      } else {
        showNotification(getErrorNotification(res?.errorHeader, res?.errorMessage, res?.requestId));
      }
    });
  }, [boundDataset, showNotification, t]);

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
          <div className="flex flex-col gap-y-2">
            <DialLabel label={t(DatasetsI18nKey.Dataset)} />
            {boundDataset ? (
              <div className="flex items-center gap-2">
                <span className="dial-small-text">{boundDataset.name}</span>
                <span className="dial-small-text text-secondary">
                  (
                  {boundDataset.visibility === DatasetVisibility.PRIVATE
                    ? t(DatasetsI18nKey.Private)
                    : t(DatasetsI18nKey.Public)}
                  )
                </span>
                {boundDataset.visibility === DatasetVisibility.PUBLIC && (
                  <>
                    <DialNeutralButton
                      iconBefore={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
                      label={t(ButtonsI18nKey.Open)}
                      onClick={openDatasetPage}
                    />
                    <DialNeutralButton label={t(DatasetsI18nKey.Unbind)} onClick={onUnbindDataset} />
                  </>
                )}
                {boundDataset.visibility === DatasetVisibility.PRIVATE && (
                  <>
                    <DialNeutralButton
                      iconBefore={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
                      label={t(DatasetsI18nKey.OpenDataset)}
                      onClick={openDatasetPage}
                    />
                    <DialNeutralButton label={t(DatasetsI18nKey.MakePublic)} onClick={onPromoteToPublic} />
                    <span className="dial-small-text text-secondary">{t(DatasetsI18nKey.PrivateBoundLocked)}</span>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <DialNeutralButton label={t(DatasetsI18nKey.PickPublic)} onClick={() => setIsDatasetPickerOpen(true)} />
                <DialPrimaryButton
                  label={t(DatasetsI18nKey.CreatePrivate)}
                  onClick={() => setIsCreateDatasetOpen(true)}
                  disabled={!testSuite.id}
                />
              </div>
            )}
          </div>
        </>
      )}
      <DatasetPicker
        isModalOpen={isDatasetPickerOpen}
        onClose={() => setIsDatasetPickerOpen(false)}
        onSelect={onPickDataset}
      />
      {isCreateDatasetOpen && testSuite.id && (
        <CreateDatasetModal
          isModalOpen={isCreateDatasetOpen}
          visibility={DatasetVisibility.PRIVATE}
          bindToSuiteId={testSuite.id}
          onClose={() => setIsCreateDatasetOpen(false)}
          onCreated={onCreatedDataset}
        />
      )}
    </div>
  );
};

export default TestSuiteProperties;
