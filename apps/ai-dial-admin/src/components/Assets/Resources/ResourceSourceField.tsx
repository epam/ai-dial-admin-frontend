import { FC, useCallback, useMemo, useState } from 'react';
import { DialSelectField, SelectOption } from '@epam/ai-dial-ui-kit';

import InterfacesField from '@/src/components/BaseControls/InterfacesField/InterfacesField';
import AppRunners from '@/src/components/SourceField/Application/AppRunners';
import Endpoints from '@/src/components/SourceField/Endpoints/Endpoints';
import { ASSET_APPLICATION_INTERFACES_SOURCE_TYPE } from '@/src/components/SourceField/constants';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { ASSET_APPLICATION_INTERFACE_TYPES } from '@/src/constants/deployment-interfaces';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialApplicationResource } from '@/src/models/dial/resource';
import type { ResourceInfo } from '@/src/server/core/asset-metadata';
import { ApplicationRoute } from '@/src/types/routes';
import { CODE_APP_SOURCE_TYPE } from '@/src/utils/entities/application-source';

interface Props {
  entity: DialApplicationResource;
  onChange: (entity: DialApplicationResource) => void;
  id: string;
  label?: string;
  view: ApplicationRoute;
  sourceItems: SelectOption[];
  runners?: DialApplicationScheme[];
  isEntityImmutable?: boolean;
  isModal?: boolean;
  disabled?: boolean;
  codeAppEditorUrl?: string;
  initialSource?: string;
  onSourceChange?: (source: string) => void;
  translators?: ResourceInfo[];
}

/**
 * Derives the source selector value from the resource's own fields (never from a persisted
 * `source.$type`):
 * - Code App: `endpoint` and `editor_url` both present and equal to the configured editor URL.
 * - App Runner: `application_type_schema_id` present.
 * - Endpoints: otherwise (default).
 */
const getInitialSource = (entity: DialApplicationResource, codeAppEditorUrl?: string): string => {
  if (!!codeAppEditorUrl && entity.endpoint === codeAppEditorUrl && entity.editor_url === codeAppEditorUrl) {
    return CODE_APP_SOURCE_TYPE;
  }
  if (entity.application_type_schema_id) {
    return SOURCE_TYPE.SCHEMA;
  }
  if (entity.interfaces && Object.keys(entity.interfaces).length) {
    return ASSET_APPLICATION_INTERFACES_SOURCE_TYPE;
  }
  return SOURCE_TYPE.ENDPOINTS;
};

const ResourceSourceField: FC<Props> = ({
  entity,
  onChange,
  id,
  label,
  view,
  sourceItems,
  runners,
  isEntityImmutable,
  isModal,
  disabled,
  codeAppEditorUrl,
  initialSource,
  onSourceChange,
  translators,
}) => {
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isReadonly = disabled || isReadOnlyAdmin;

  // Source is UI-only state: derived once from the resource fields and never written back.
  const [source, setSource] = useState<string>(() => initialSource ?? getInitialSource(entity, codeAppEditorUrl));

  // The Code App option is only available when CODE_APP_EDITOR_URL is configured.
  const visibleSourceItems = useMemo(
    () => (codeAppEditorUrl ? sourceItems : sourceItems.filter((item) => item.value !== CODE_APP_SOURCE_TYPE)),
    [sourceItems, codeAppEditorUrl],
  );

  const onChangeEntity = useCallback(
    (updated: DialApplication) => {
      onChange(updated as unknown as DialApplicationResource);
    },
    [onChange],
  );

  const onChangeSource = useCallback(
    (sourceType: string) => {
      if (sourceType === source) {
        return;
      }
      setSource(sourceType);
      onSourceChange?.(sourceType);

      if (sourceType === ASSET_APPLICATION_INTERFACES_SOURCE_TYPE) {
        return;
      }

      if (sourceType === CODE_APP_SOURCE_TYPE) {
        onChange({
          ...entity,
          endpoint: codeAppEditorUrl,
          editor_url: codeAppEditorUrl,
          application_type_schema_id: undefined,
        });
        return;
      }

      if (sourceType === SOURCE_TYPE.SCHEMA) {
        onChange({ ...entity, endpoint: undefined, application_type_schema_id: '', routes: undefined });
        return;
      }

      // Endpoints
      onChange({ ...entity, application_type_schema_id: undefined, endpoint: '' });
    },
    [source, entity, onChange, onSourceChange, codeAppEditorUrl],
  );

  return (
    <div className="flex flex-col gap-y-8">
      <DialSelectField
        id={id}
        containerClassName="w-[180px]"
        label={label}
        options={visibleSourceItems}
        onChange={(v) => onChangeSource(v as string)}
        value={source}
        disabled={isReadonly}
      />

      {source === ASSET_APPLICATION_INTERFACES_SOURCE_TYPE && (
        <InterfacesField
          interfaces={entity.interfaces}
          onChangeInterfaces={(interfaces) => onChange({ ...entity, interfaces })}
          allowedTypes={ASSET_APPLICATION_INTERFACE_TYPES}
          translators={translators}
          entityBaseUrl={entity.base_url}
          view={view}
          isAsset
        />
      )}

      {(source === SOURCE_TYPE.ENDPOINTS || source === CODE_APP_SOURCE_TYPE) && (
        <Endpoints
          entity={entity as unknown as DialApplication}
          onChange={onChangeEntity}
          view={view}
          isModal={isModal}
          isEntityImmutable={isEntityImmutable}
          disabled={isReadonly}
          isCodeApp={source === CODE_APP_SOURCE_TYPE}
        />
      )}

      {source === SOURCE_TYPE.SCHEMA && (
        <AppRunners
          selectedValue={entity.application_type_schema_id}
          onChange={onChangeEntity}
          onChangeValue={(value, application_properties) =>
            onChangeEntity({
              ...entity,
              application_type_schema_id: value,
              application_properties: { ...application_properties, ...entity.application_properties },
            } as DialApplication)
          }
          runners={runners}
          view={view}
          isEntityImmutable={isEntityImmutable}
          isModal={isModal}
          disabled={isReadonly}
        />
      )}
    </div>
  );
};

export default ResourceSourceField;
