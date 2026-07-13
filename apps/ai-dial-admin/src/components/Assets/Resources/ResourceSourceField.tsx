import { FC, useCallback, useMemo, useState } from 'react';
import { DialSelectField, SelectOption } from '@epam/ai-dial-ui-kit';

import AppRunners from '@/src/components/SourceField/Application/AppRunners';
import Endpoints from '@/src/components/SourceField/Endpoints/Endpoints';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialApplicationResource } from '@/src/models/dial/resource';
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
}) => {
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isReadonly = disabled || isReadOnlyAdmin;

  // Source is UI-only state: derived once from the resource fields and never written back.
  const [source, setSource] = useState<string>(() => getInitialSource(entity, codeAppEditorUrl));

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

      if (sourceType === CODE_APP_SOURCE_TYPE) {
        onChange({ ...entity, endpoint: codeAppEditorUrl, editor_url: codeAppEditorUrl });
        return;
      }

      if (sourceType === SOURCE_TYPE.SCHEMA) {
        onChange({ ...entity, endpoint: undefined, application_type_schema_id: '' });
        return;
      }

      // Endpoints
      onChange({ ...entity, application_type_schema_id: undefined as unknown as string, endpoint: '' });
    },
    [source, entity, onChange, codeAppEditorUrl],
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
          runners={runners}
          isEntityImmutable={isEntityImmutable}
          isModal={isModal}
          disabled={isReadonly}
        />
      )}
    </div>
  );
};

export default ResourceSourceField;
