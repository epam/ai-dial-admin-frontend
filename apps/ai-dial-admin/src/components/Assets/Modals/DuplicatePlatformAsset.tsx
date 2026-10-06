import { DialFormPopup } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useState } from 'react';

import { getResolvedRunnerSchema } from '@/src/app/[lang]/platform-app-runners/actions';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IdControl from '@/src/components/BaseControls/Id/Id';
import { ButtonsI18nKey, EntityFieldsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import {
  DialAppRunnerResource,
  DialModelResource,
  DialPlatformApplicationResource,
  DialPlatformToolsetResource,
  PlatformAsset,
  ToolsetAuthType,
} from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import { CORE_UNENCODABLE_ID_CHARS } from '@/src/utils/core-schemas/constants';
import { getClonedEntityName, getCloneTitle } from '@/src/utils/entities/duplicate-entity';
import { DUAL_BUCKET_VIEWS } from '@/src/utils/files/root-folder';

interface Props {
  view: ApplicationRoute;
  isModalOpen: boolean;
  names: string[];
  entity: PlatformAsset;
  onClose: () => void;
  onDuplicate: (entity: PlatformAsset) => void;
}

const DuplicatePlatformAsset: FC<Props> = ({ view, isModalOpen, names, entity, onClose, onDuplicate }) => {
  const t = useI18n();
  const { isValid } = useSaveValidationContext();
  const isRunner = view === ApplicationRoute.PlatformAppRunners;
  // Applications/Toolsets carry their display name as `display_name` (snake_case, inherited from
  // `DialResource`), unlike Models/Interceptors' camelCase `displayName` — Core reuses the same
  // entity class for both buckets, so the field name doesn't change for a platform-bucket row.
  const isDualBucketAsset = DUAL_BUCKET_VIEWS.includes(view);
  const hasDisplayName =
    isRunner ||
    view === ApplicationRoute.PlatformModels ||
    view === ApplicationRoute.PlatformInterceptors ||
    isDualBucketAsset;

  const [clonedAsset, setClonedAsset] = useState<PlatformAsset>(() => {
    if (isRunner) {
      return {
        ...entity,
        name: getClonedEntityName((entity as DialAppRunnerResource).name, true),
        $id: getClonedEntityName((entity as DialAppRunnerResource).$id, true),
      } as DialAppRunnerResource;
    }

    const clone = { ...entity, name: getClonedEntityName(entity.name, true) } as PlatformAsset;

    // Core never returns a real client_secret/api_key on read, so an OAuth toolset or external
    // service copied verbatim fails Core's write-time validation with a missing-secret error.
    if (view === ApplicationRoute.AssetsToolsets) {
      const toolset = entity as DialPlatformToolsetResource;
      if (toolset.auth_settings?.authentication_type === ToolsetAuthType.OAUTH) {
        (clone as DialPlatformToolsetResource).auth_settings = { authentication_type: ToolsetAuthType.NONE };
      }
    } else if (view === ApplicationRoute.AssetsApplications) {
      const externalServices = (entity as DialPlatformApplicationResource).external_services;
      if (externalServices) {
        (clone as DialPlatformApplicationResource).external_services = Object.fromEntries(
          Object.entries(externalServices).map(([key, service]) => [
            key,
            service.auth_settings?.authentication_type === ToolsetAuthType.OAUTH
              ? { ...service, auth_settings: { authentication_type: ToolsetAuthType.NONE } }
              : service,
          ]),
        );
      }
    }

    return clone;
  });
  const [idExistsError, setIdExistsError] = useState<string>();

  const onChangeId = useCallback(
    ({ name }: { name?: string }) => {
      setClonedAsset((asset) => (isRunner ? { ...asset, $id: name } : { ...asset, name: name as string }));
      setIdExistsError(void 0);
    },
    [isRunner],
  );

  const onChangeStorageName = useCallback(({ name }: { name?: string }) => {
    setClonedAsset((asset) => ({ ...asset, name: name as string }));
  }, []);

  const onChangeDisplayName = useCallback(
    (displayName?: string) => {
      setClonedAsset((asset) => {
        if (isRunner) {
          return { ...asset, 'dial:applicationTypeDisplayName': displayName };
        }
        return isDualBucketAsset ? { ...asset, display_name: displayName } : { ...asset, displayName };
      });
    },
    [isRunner, isDualBucketAsset],
  );

  const id = isRunner ? (clonedAsset as DialAppRunnerResource).$id : clonedAsset.name;
  const idNames = isRunner ? [] : names;
  const displayName = isRunner
    ? (clonedAsset as DialAppRunnerResource)['dial:applicationTypeDisplayName']
    : isDualBucketAsset
      ? (clonedAsset as DialPlatformApplicationResource | DialPlatformToolsetResource).display_name
      : (clonedAsset as DialModelResource).displayName;

  const onDuplicateClick = useCallback(async () => {
    if (!isRunner) {
      onDuplicate(clonedAsset);
      return;
    }

    const runner = clonedAsset as DialAppRunnerResource;
    if (!runner.$id) return;

    try {
      const result = await getResolvedRunnerSchema(runner.$id);
      if (result.success && result.response) {
        setIdExistsError(t(ErrorI18nKey.NameExists));
        return;
      }
    } catch {
      // The Core write remains the authoritative collision check when resolution is unavailable.
    }

    onDuplicate(clonedAsset);
  }, [clonedAsset, isRunner, onDuplicate, t]);

  return (
    <DialFormPopup
      onClose={onClose}
      header={getCloneTitle(view, t)}
      portalId="DuplicatePlatformAsset"
      open={isModalOpen}
      onSubmit={onDuplicateClick}
      onCancel={onClose}
      disableSubmitButton={!isValid}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={t(ButtonsI18nKey.Duplicate)}
    >
      <div className="flex flex-col px-6 py-4 gap-y-8">
        {isRunner && (
          <IdControl
            label={t(EntityFieldsI18nKey.name)}
            inputId="name"
            entity={{ name: clonedAsset.name }}
            names={names}
            onChangeEntity={onChangeStorageName}
          />
        )}
        <IdControl
          entity={{ name: id }}
          names={idNames}
          inputId={isRunner ? 'id' : void 0}
          validationField={isRunner ? 'id' : void 0}
          isUrlId={isRunner}
          forbiddenChars={isRunner ? CORE_UNENCODABLE_ID_CHARS : void 0}
          externalError={isRunner ? idExistsError : void 0}
          onChangeEntity={onChangeId}
        />
        {hasDisplayName && <DisplayNameControl displayName={displayName} onChange={onChangeDisplayName} required />}
      </div>
    </DialFormPopup>
  );
};

export default DuplicatePlatformAsset;
