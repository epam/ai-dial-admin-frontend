import { useCallback, useEffect, useState } from 'react';
import { DialSelectField, SelectOption } from '@epam/ai-dial-ui-kit';

import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { Container } from '@/src/models/deployments/containers';
import { DialModel, DialModelType } from '@/src/models/dial/model';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { ApplicationRoute } from '@/src/types/routes';
import { ServerActionResponse } from '@/src/models/server-action';
import { Toolset } from '@/src/models/dial/toolset';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { isValidSourceField } from '@/src/components/SourceField/utils';
import { getEndpointPostfix } from '@/src/utils/models/model-endpoint';
import { clearUpstreamResponsesEndpoints } from '@/src/utils/models/upstream-responses';
import { useI18n } from '@/src/locales/client';

import Containers from '@/src/components/SourceField/Containers/Containers';
import McpRegistry from '@/src/components/SourceField/McpRegistry/McpRegistry';
import Templates from '@/src/components/SourceField/Template/Templates';
import Adapters from '@/src/components/SourceField/Adapters/Adapters';
import Endpoints from '@/src/components/SourceField/Endpoints/Endpoints';
import AppRunners from '@/src/components/SourceField/Application/AppRunners';

interface Props<T> {
  entity: T;
  onChange: (entity: T) => void;
  getContainers?: () => Promise<ServerActionResponse<Container[]>>;
  getRunners?: () => Promise<ServerActionResponse<InterceptorTemplate[]>>;
  getAdapters?: () => Promise<ServerActionResponse | null>;
  sourceItems: SelectOption[];
  id: string;
  label?: string;
  view: ApplicationRoute;
  adapters?: DialAdapter[];
  runners?: DialApplicationScheme[];
  isEntityImmutable?: boolean;
  isModal?: boolean;
  disabled?: boolean;
}

const SourceField = <T extends DialInterceptor | DialModel | Toolset | DialApplication>({
  entity,
  onChange,
  getContainers,
  getRunners,
  getAdapters,
  id,
  label,
  view,
  sourceItems,
  runners,
  isEntityImmutable,
  isModal,
  disabled,
}: Props<T>) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isReadonly = disabled || isReadOnlyAdmin;
  const { dispatch } = useSaveValidationContext();
  const [source, setSource] = useState<string>();
  const [errorText, setErrorText] = useState('');

  const onChangeEntity = useCallback(
    (entity: T) => {
      onChange(entity);
    },
    [onChange],
  );

  useEffect(() => {
    const isValid = isValidSourceField(entity, view);

    setErrorText(isValid ? '' : t(ErrorI18nKey.RequiredField));
    dispatch({
      type: ValidationActionType.SetField,
      field: 'source',
      isValid,
    });
  }, [dispatch, entity, t, view]);

  const onChangeSource = useCallback(
    (sourceType: string) => {
      if (sourceType !== source) {
        setSource(sourceType as SOURCE_TYPE);
        dispatch({
          type: ValidationActionType.SetField,
          field: 'completionEndpoint',
          isValid: true,
        });

        const reset: Partial<T> = { endpoint: undefined } as Partial<T>;
        if (view === ApplicationRoute.Applications) {
          Object.assign(reset, {
            mcp: undefined,
            viewerUrl: undefined,
            editorUrl: undefined,
            applicationTypeSchemaId: undefined,
            applicationProperties: undefined,
            responsesEndpoint: undefined,
          });
        }
        if (view === ApplicationRoute.Models) {
          Object.assign(reset, { responsesEndpoint: undefined });
        }

        const nextEntity = {
          ...entity,
          source: { $type: sourceType as SOURCE_TYPE },
          ...reset,
        };

        onChangeEntity(
          view === ApplicationRoute.Models
            ? (clearUpstreamResponsesEndpoints(nextEntity as DialModel) as T)
            : nextEntity,
        );
      }
    },
    [dispatch, entity, onChangeEntity, source, view],
  );

  useEffect(() => {
    if (!entity.source) {
      const entityWithSource = {
        ...entity,
        source: {
          $type: sourceItems[0].value,
        },
      };

      if (view === ApplicationRoute.Models) {
        entityWithSource.source.completionEndpointPath = getEndpointPostfix(DialModelType.Chat);
      }

      onChangeEntity(entityWithSource);
    } else {
      setSource(entity.source.$type || sourceItems[0].value);
    }
  }, [entity, isModal, onChangeEntity, sourceItems, view]);

  return (
    <div className="flex flex-col gap-y-8">
      <DialSelectField
        id={id}
        containerClassName="w-[180px]"
        label={label}
        options={sourceItems}
        onChange={(v) => onChangeSource(v as string)}
        value={source}
        disabled={isReadonly}
      />

      {source === SOURCE_TYPE.ENDPOINTS && (
        <Endpoints
          entity={entity}
          onChange={onChangeEntity}
          view={view}
          isModal={isModal}
          isEntityImmutable={isEntityImmutable}
          disabled={isReadonly}
        />
      )}
      {source === SOURCE_TYPE.CONTAINER && getContainers && (
        <Containers
          entity={entity}
          onChange={onChangeEntity}
          getContainers={getContainers}
          view={view}
          isModal={isModal}
          error={source === SOURCE_TYPE.CONTAINER ? errorText : ''}
          disabled={isReadonly}
        />
      )}
      {source === SOURCE_TYPE.RUNNER && getRunners && (
        <Templates
          entity={entity}
          onChange={onChangeEntity}
          getRunners={getRunners}
          error={source === SOURCE_TYPE.RUNNER ? errorText : ''}
          isModal={isModal}
          disabled={isReadonly}
        />
      )}
      {source === SOURCE_TYPE.ADAPTER && getAdapters && (
        <Adapters
          entity={entity}
          onChange={onChangeEntity}
          getAdapters={getAdapters}
          isModal={isModal}
          error={source === SOURCE_TYPE.ADAPTER ? errorText : ''}
          disabled={isReadonly}
        />
      )}
      {source === SOURCE_TYPE.MCP_REGISTRY && (
        <McpRegistry
          entity={entity as Toolset}
          onChange={onChangeEntity as (entity: Toolset) => void}
          view={view}
          isModal={isModal}
          disabled={isReadonly}
        />
      )}
      {source === SOURCE_TYPE.SCHEMA && (
        <AppRunners
          entity={entity as DialApplication}
          onChange={onChangeEntity as (entity: DialApplication) => void}
          runners={runners}
          isEntityImmutable={isEntityImmutable}
          isModal={isModal}
          disabled={isReadonly}
        />
      )}
    </div>
  );
};

export default SourceField;
