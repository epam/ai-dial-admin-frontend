import { DialFormPopup, PasswordInput } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useMemo, useState } from 'react';

import { getCatalogSchemaById } from '@/src/app/[lang]/platform-catalog-schemas/actions';
import { getResolvedRunnerSchema } from '@/src/app/[lang]/platform-app-runners/actions';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IdControl from '@/src/components/BaseControls/Id/Id';
import {
  ButtonsI18nKey,
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
  ErrorI18nKey,
  UpstreamEndpointsI18nKey,
} from '@/src/constants/i18n';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import {
  DialAppRunnerResource,
  DialCatalogSchemaResource,
  DialModelResource,
  DialPlatformApplicationResource,
  DialPlatformToolsetResource,
  DialRouteResource,
  PlatformAsset,
  ToolsetAuthType,
} from '@/src/models/dial/resource';
import { UpstreamAuthType } from '@/src/models/dial/model';
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
  const isCatalogSchema = view === ApplicationRoute.PlatformCatalogSchemas;
  const isSchemaResource = isRunner || isCatalogSchema;
  // Applications/Toolsets carry their display name as `display_name` (snake_case, inherited from
  // `DialResource`), unlike Models/Interceptors' camelCase `displayName` — Core reuses the same
  // entity class for both buckets, so the field name doesn't change for a platform-bucket row.
  const isDualBucketAsset = DUAL_BUCKET_VIEWS.includes(view);
  const hasDisplayName =
    isSchemaResource ||
    view === ApplicationRoute.PlatformModels ||
    view === ApplicationRoute.PlatformInterceptors ||
    isDualBucketAsset;

  const [clonedAsset, setClonedAsset] = useState<PlatformAsset>(() => {
    if (isSchemaResource) {
      const schema = entity as DialAppRunnerResource | DialCatalogSchemaResource;
      return {
        ...entity,
        name: getClonedEntityName(schema.name, true),
        $id: getClonedEntityName(schema.$id, true),
      } as PlatformAsset;
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
  const [bearerKeys, setBearerKeys] = useState<Record<number, string>>({});
  const bearerUpstreamIndexes = useMemo(() => {
    if (view !== ApplicationRoute.PlatformRoutes) {
      return [];
    }

    return ((clonedAsset as DialRouteResource).upstreams ?? []).flatMap((upstream, index) =>
      upstream.authType === UpstreamAuthType.BEARER ? [index] : [],
    );
  }, [clonedAsset, view]);
  const hasMissingBearerKey = bearerUpstreamIndexes.some((index) => !bearerKeys[index]);

  const onChangeId = useCallback(
    ({ name }: { name?: string }) => {
      setClonedAsset((asset) => (isSchemaResource ? { ...asset, $id: name } : { ...asset, name: name as string }));
      setIdExistsError(void 0);
    },
    [isSchemaResource],
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
        if (isCatalogSchema) {
          return { ...asset, 'dial:catalogDisplayName': displayName };
        }
        return isDualBucketAsset ? { ...asset, display_name: displayName } : { ...asset, displayName };
      });
    },
    [isRunner, isCatalogSchema, isDualBucketAsset],
  );

  const id = isSchemaResource
    ? (clonedAsset as DialAppRunnerResource | DialCatalogSchemaResource).$id
    : clonedAsset.name;
  const idNames = isSchemaResource ? [] : names;
  const displayName = (() => {
    if (isRunner) {
      return (clonedAsset as DialAppRunnerResource)['dial:applicationTypeDisplayName'];
    }
    if (isCatalogSchema) {
      return (clonedAsset as DialCatalogSchemaResource)['dial:catalogDisplayName'];
    }
    if (isDualBucketAsset) {
      return (clonedAsset as DialPlatformApplicationResource | DialPlatformToolsetResource).display_name;
    }
    return (clonedAsset as DialModelResource).displayName;
  })();

  const onChangeBearerKey = useCallback((index: number, key?: string) => {
    setBearerKeys((keys) => ({ ...keys, [index]: key ?? '' }));
  }, []);

  const onDuplicateClick = useCallback(async () => {
    const duplicate =
      view === ApplicationRoute.PlatformRoutes
        ? {
            ...clonedAsset,
            upstreams: (clonedAsset as DialRouteResource).upstreams?.map((upstream, index) =>
              upstream.authType === UpstreamAuthType.BEARER ? { ...upstream, key: bearerKeys[index] } : upstream,
            ),
          }
        : clonedAsset;

    if (!isSchemaResource) {
      onDuplicate(duplicate);
      return;
    }

    const schema = clonedAsset as DialAppRunnerResource | DialCatalogSchemaResource;
    if (!schema.$id) return;

    try {
      const result = isRunner ? await getResolvedRunnerSchema(schema.$id) : await getCatalogSchemaById(schema.$id);
      if (result.success && result.response) {
        setIdExistsError(t(ErrorI18nKey.NameExists));
        return;
      }
    } catch {
      // The Core write remains the authoritative collision check when resolution is unavailable.
    }

    onDuplicate(clonedAsset);
  }, [bearerKeys, clonedAsset, isRunner, isSchemaResource, onDuplicate, t, view]);

  return (
    <DialFormPopup
      onClose={onClose}
      header={getCloneTitle(view, t)}
      portalId="DuplicatePlatformAsset"
      open={isModalOpen}
      onSubmit={onDuplicateClick}
      onCancel={onClose}
      disableSubmitButton={!isValid || hasMissingBearerKey}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={t(ButtonsI18nKey.Duplicate)}
    >
      <div className="flex flex-col px-6 py-4 gap-y-8">
        {isSchemaResource && (
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
          inputId={isSchemaResource ? 'id' : void 0}
          validationField={isSchemaResource ? 'id' : void 0}
          isUrlId={isSchemaResource}
          forbiddenChars={isSchemaResource ? CORE_UNENCODABLE_ID_CHARS : void 0}
          externalError={isSchemaResource ? idExistsError : void 0}
          onChangeEntity={onChangeId}
        />
        {hasDisplayName && <DisplayNameControl displayName={displayName} onChange={onChangeDisplayName} required />}
        {bearerUpstreamIndexes.map((index) => (
          <PasswordInput
            key={index}
            id={`bearer-key-${index}`}
            value={bearerKeys[index]}
            placeholder={t(EntityPlaceholdersI18nKey.UpstreamKey)}
            labelProps={{ label: t(UpstreamEndpointsI18nKey.BearerKey, { index: index + 1 }), required: true }}
            onChange={(key?: string) => onChangeBearerKey(index, key)}
          />
        ))}
      </div>
    </DialFormPopup>
  );
};

export default DuplicatePlatformAsset;
