'use client';

import { DialFormPopup } from '@epam/ai-dial-ui-kit';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useMemo, useState } from 'react';

import { checkIsUniqueDeploymentName } from '@/src/app/actions';
import ResourceSourceField from '@/src/components/Assets/Resources/ResourceSourceField';
import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IdControl from '@/src/components/BaseControls/Id/Id';
import VersionControl from '@/src/components/BaseControls/Version';
import {
  ASSET_APPLICATION_CREATE_SOURCE_ITEMS,
  ASSET_APPLICATION_INTERFACES_SOURCE_TYPE,
} from '@/src/components/SourceField/constants';
import { ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { DEFAULT_NEW_ENTITY_VERSION } from '@/src/constants/dial-base-entity';
import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useAppContext } from '@/src/context/AppContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { DialApplicationResource } from '@/src/models/dial/resource';
import { ServerActionResponse } from '@/src/models/server-action';
import type { ResourceInfo } from '@/src/server/core/asset-metadata';
import { ApplicationRoute } from '@/src/types/routes';
import { getAssetVersionBusinessError } from '@/src/utils/deployments/validation';
import {
  getCreateEntityTitle,
  getCreateNotificationDescription,
  getCreateNotificationTitle,
} from '@/src/utils/entities/create-entity';
import { isPlatformBucketPath } from '@/src/utils/files/root-folder';
import { getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { isValidEndpoint } from '@/src/utils/validation/url-error';

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
  onCreate?: (
    asset: AssetWithVersion,
    path?: string,
    isCreateDuplicate?: boolean,
    shouldCloseModal?: boolean,
  ) => Promise<ServerActionResponse>;
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
  const protectedRequest = useProtectedRequest();
  const folderContext = getContext();
  const isPlatform = isPlatformBucketPath(folderContext.filePath);
  const initialAsset = useMemo(
    () =>
      ({
        name: '',
        display_name: '',
        description: '',
        interfaces: {},
        ...(isPlatform ? { user_roles: [] } : { version: DEFAULT_NEW_ENTITY_VERSION }),
      }) as DialApplicationResource,
    [isPlatform],
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
    const isUnique = await checkIsUniqueDeploymentName(asset.name?.trim() || '');
    setIsUniqueNameError(!isUnique);
    if (isUnique) setStep(CreateStep.Source);
  }, [asset.name]);

  const onCreateApplication = useCallback(async () => {
    if (!onCreate) return;
    setIsLoading(true);
    const entity = {
      ...asset,
      name: asset.name?.trim() || '',
      folderId: folderContext.filePath,
    } as unknown as AssetWithVersion;
    const response = await protectedRequest(onCreate, entity, undefined, undefined, false);
    setIsLoading(false);
    if (!response.success) return;

    showNotification(
      getSuccessNotification(
        getCreateNotificationTitle(ApplicationRoute.AssetsApplications, t),
        getCreateNotificationDescription(ApplicationRoute.AssetsApplications, entity.name || '', t),
      ),
    );
    router.push(getUrnForEntity(ApplicationRoute.AssetsApplications, entity));
    onCloseAndReset();
  }, [asset, folderContext.filePath, onCloseAndReset, onCreate, protectedRequest, router, showNotification, t]);

  const versionError = !isPlatform
    ? getAssetVersionBusinessError(versionsMap, asset.name, t, asset.version)
    : undefined;
  const isDetailsValid =
    !!asset.name && !!asset.display_name && !isUniqueNameError && (isPlatform || (!!asset.version && !versionError));
  const isSourceValid =
    source === ASSET_APPLICATION_INTERFACES_SOURCE_TYPE ||
    (source === 'schema' && !!asset.application_type_schema_id) ||
    (source === 'code-app' && !!codeAppEditorUrl) ||
    (source === 'endpoints' && !!asset.endpoint && isValidEndpoint(asset.endpoint));

  if (step === CreateStep.Details) {
    return (
      <DialFormPopup
        open={isOpen}
        header={getCreateEntityTitle(ApplicationRoute.AssetsApplications, t)}
        portalId="CreateApplicationDetails"
        onClose={onCloseAndReset}
        onCancel={onCloseAndReset}
        onSubmit={onNext}
        cancelLabel={t(ButtonsI18nKey.Cancel)}
        submitLabel={t(ButtonsI18nKey.Next)}
        disableSubmitButton={!isDetailsValid}
      >
        <div className="flex flex-col gap-y-8 px-6 py-4">
          <IdControl
            entity={asset}
            names={names}
            onChangeEntity={(entity) => setAsset({ ...asset, ...entity } as DialApplicationResource)}
            checkEmptySymbols={false}
          />
          <DisplayNameControl
            displayName={asset.display_name}
            required
            isFullWidth
            onChange={(display_name) => setAsset({ ...asset, display_name })}
          />
          {!isPlatform && (
            <VersionControl
              isFullWidth
              version={asset.version}
              error={versionError?.text}
              onChange={(version) => setAsset({ ...asset, version })}
            />
          )}
          <DescriptionControl
            entity={asset}
            onChangeEntity={(entity) => setAsset({ ...asset, ...entity } as DialApplicationResource)}
          />
        </div>
      </DialFormPopup>
    );
  }

  return (
    <DialFormPopup
      open={isOpen}
      header={t(EntitiesI18nKey.SourceType)}
      portalId="CreateApplicationSource"
      className="max-h-[750px]"
      isLoading={isLoading}
      onClose={onCloseAndReset}
      onCancel={() => setStep(CreateStep.Details)}
      onSubmit={onCreateApplication}
      cancelLabel={t(ButtonsI18nKey.Back)}
      submitLabel={t(ButtonsI18nKey.Create)}
      disableSubmitButton={!isSourceValid}
    >
      <div className="flex min-h-0 flex-col overflow-auto px-6 py-4">
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
    </DialFormPopup>
  );
};

export default CreateApplication;
