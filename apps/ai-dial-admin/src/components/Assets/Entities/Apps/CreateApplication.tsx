'use client';

import { Popup, Step, StepStatus, Steps } from '@epam/ai-dial-ui-kit';

import PopupLoader from '@/src/components/Common/FormPopup/PopupLoader';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useMemo, useState } from 'react';

import { checkIsUniqueDeploymentName } from '@/src/app/actions';
import ResourceSourceField from '@/src/components/Assets/Resources/ResourceSourceField';
import StepperModalButtons from '@/src/components/Common/StepperModalButtons/StepperModalButtons';
import { getStepStatusLabels } from '@/src/components/Common/Steps/utils';
import {
  ASSET_APPLICATION_CREATE_SOURCE_ITEMS,
  ASSET_APPLICATION_INTERFACES_SOURCE_TYPE,
} from '@/src/components/SourceField/constants';
import { ButtonsI18nKey, EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { DEFAULT_NEW_ENTITY_VERSION } from '@/src/constants/dial-base-entity';
import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { AssetWithVersion, DeploymentAsset } from '@/src/models/dial/deployment-asset';
import { DialApplicationResource } from '@/src/models/dial/resource';
import { ServerActionResponse } from '@/src/models/server-action';
import type { ResourceInfo } from '@/src/server/core/asset-metadata';
import { ApplicationRoute } from '@/src/types/routes';
import { getAssetDestinationError, getAssetPathsFromVersions } from '@/src/utils/validation/asset-version';
import { ResourceType } from '@/src/types/resource-type';
import {
  getCreateEntityTitle,
  getCreateNotificationDescription,
  getCreateNotificationTitle,
} from '@/src/utils/entities/create-entity';
import { isPlatformBucketPath } from '@/src/utils/files/root-folder';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { isValidEndpoint } from '@/src/utils/validation/url-error';
import AssetProperties from '@/src/components/EntityMainProperties/Properties/AssetProperties';

enum CreateStep {
  Details = 'details',
  Source = 'source',
}

interface Props {
  isOpen: boolean;
  names: string[];
  runners?: DialApplicationScheme[];
  versionsMap?: Record<string, string[]>;
  translators?: ResourceInfo[];
  getContext: () => AssetsFolderContextReader<AssetListItem>;
  onClose: () => void;
  onCreate?: (asset: AssetWithVersion) => Promise<ServerActionResponse>;
}

const CreateApplication: FC<Props> = ({
  isOpen,
  names,
  runners,
  versionsMap,
  translators,
  getContext,
  onClose,
  onCreate,
}) => {
  const t = useI18n();
  const router = useRouter();
  const { codeAppEditorUrl } = useAppContext();
  const { showNotification } = useNotification();
  const { isValid } = useSaveValidationContext();
  const protectedRequest = useProtectedRequest();
  const folderContext = getContext();
  const isPlatform = isPlatformBucketPath(folderContext.filePath);
  const initialAsset = useMemo(
    () =>
      ({
        name: '',
        displayName: '',
        description: '',
        interfaces: {},
        folderId: folderContext.filePath,
        ...(isPlatform ? { user_roles: [] } : { version: DEFAULT_NEW_ENTITY_VERSION }),
      }) as DialApplicationResource,
    [isPlatform, folderContext.filePath],
  );
  const [step, setStep] = useState(CreateStep.Details);
  const [asset, setAsset] = useState(initialAsset);
  const [source, setSource] = useState(ASSET_APPLICATION_INTERFACES_SOURCE_TYPE);
  const [isLoading, setIsLoading] = useState(false);
  const [isUniqueNameError, setIsUniqueNameError] = useState(false);

  const onCloseAndReset = useCallback(() => {
    setStep(CreateStep.Details);
    setAsset(initialAsset);
    setSource(ASSET_APPLICATION_INTERFACES_SOURCE_TYPE);
    setIsUniqueNameError(false);
    onClose();
  }, [initialAsset, onClose]);

  const onNext = useCallback(async () => {
    if (!isPlatform) {
      setStep(CreateStep.Source);
      return;
    }

    const isUnique = await checkIsUniqueDeploymentName(asset.name?.trim() || '');
    setIsUniqueNameError(!isUnique);
    if (isUnique) setStep(CreateStep.Source);
  }, [asset.name, isPlatform]);

  const onCreateApplication = useCallback(async () => {
    if (!onCreate) return;
    setIsLoading(true);
    const entity = {
      ...asset,
      name: asset.name?.trim() || '',
      folderId: folderContext.filePath,
      ...(!isPlatform && { display_version: asset.version }),
    } as unknown as AssetWithVersion;
    const response = await protectedRequest(onCreate, entity);
    setIsLoading(false);
    if (!response.success) {
      showNotification(getErrorNotification(response.errorHeader, response.errorMessage, response.requestId));
      return;
    }

    showNotification(
      getSuccessNotification(
        getCreateNotificationTitle(ApplicationRoute.AssetsApplications, t),
        getCreateNotificationDescription(ApplicationRoute.AssetsApplications, entity.name || '', t),
      ),
    );
    router.push(getUrnForEntity(ApplicationRoute.AssetsApplications, entity));
    onCloseAndReset();
  }, [
    asset,
    folderContext.filePath,
    isPlatform,
    onCloseAndReset,
    onCreate,
    protectedRequest,
    router,
    showNotification,
    t,
  ]);

  const versionError = !isPlatform
    ? getAssetDestinationError(
        folderContext.filePath,
        asset.name || '',
        asset.version,
        ResourceType.APPLICATION,
        t,
        getAssetPathsFromVersions(folderContext.filePath, versionsMap),
      )
    : undefined;
  const isDetailsValid =
    !!asset.name &&
    !!asset.displayName &&
    !isUniqueNameError &&
    (!isPlatform ? isValid && !!asset.version && !versionError : true);
  const isSourceValid =
    (source === ASSET_APPLICATION_INTERFACES_SOURCE_TYPE && Object.keys(asset.interfaces ?? {}).length) ||
    (source === 'schema' && !!asset.application_type_schema_id) ||
    (source === 'code-app' && !!codeAppEditorUrl) ||
    (source === 'endpoints' && !!asset.endpoint && isValidEndpoint(asset.endpoint));
  const isSourceStep = step === CreateStep.Source;

  const onChangeStep = useCallback(
    (id: string) => {
      if (id === CreateStep.Source) {
        void onNext();
        return;
      }
      setStep(id as CreateStep);
    },
    [onNext],
  );

  const steps = useMemo<Step[]>(
    () => [
      {
        id: CreateStep.Details,
        name: t(TabsI18nKey.Properties),
        status: isDetailsValid ? StepStatus.VALID : undefined,
      },
      {
        id: CreateStep.Source,
        name: t(EntitiesI18nKey.SourceType),
        status: isSourceStep && isSourceValid && isValid ? StepStatus.VALID : undefined,
      },
    ],
    [t, isDetailsValid, isSourceStep, isSourceValid, isValid],
  );
  const title = getCreateEntityTitle(ApplicationRoute.AssetsApplications, t);

  return (
    <Popup open={isOpen} header={title} portalId="CreateApplication" onClose={onCloseAndReset}>
      <div className="flex flex-col gap-y-6 px-6 py-4">
        <Steps
          steps={steps}
          currentStep={step}
          onChangeStep={onChangeStep}
          ariaLabel={title}
          statusLabels={getStepStatusLabels(t)}
        />
        {step === CreateStep.Details && (
          <div className="flex flex-col gap-y-8">
            <AssetProperties
              view={ApplicationRoute.AssetsApplications}
              versionsMap={versionsMap}
              entity={asset as unknown as DeploymentAsset}
              names={names}
              hideVersionField={isPlatform}
              isUniqueNameError={isUniqueNameError}
              onChangeEntity={(entity) => {
                setAsset(entity as DialApplicationResource);
                setIsUniqueNameError(false);
              }}
            />
          </div>
        )}
        {isSourceStep &&
          (isLoading ? (
            <PopupLoader />
          ) : (
            <div className="flex min-h-0 max-h-[540px] flex-col overflow-auto">
              <ResourceSourceField
                id="sourceType"
                label={t(EntitiesI18nKey.SourceType)}
                entity={asset}
                onChange={setAsset}
                view={ApplicationRoute.AssetsApplications}
                sourceItems={ASSET_APPLICATION_CREATE_SOURCE_ITEMS}
                runners={runners}
                initialSource={source}
                onSourceChange={setSource}
                translators={translators}
                codeAppEditorUrl={codeAppEditorUrl}
              />
            </div>
          ))}
      </div>

      <StepperModalButtons
        steps={steps}
        currentStep={steps.find((item) => item.id === step)}
        finishButtonLabel={t(ButtonsI18nKey.Create)}
        isLoading={isLoading}
        onChangeStep={onChangeStep}
        onNextStep={onNext}
        onFinishClick={onCreateApplication}
        onClose={onCloseAndReset}
      />
    </Popup>
  );
};

export default CreateApplication;
