import { useCallback, useEffect, useMemo, useState } from 'react';
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
import {
  isContainerFamilySource,
  isMcpContainer,
  isTextClassificationInferenceContainer,
  isValidSourceField,
} from '@/src/components/SourceField/utils';
import { MODEL_SERVING_SOURCE_TYPE } from '@/src/components/SourceField/constants';
import { CODE_APP_SOURCE_TYPE, createCodeAppFields, isCodeAppSource } from '@/src/utils/entities/application-source';
import { getEndpointPostfix } from '@/src/utils/models/model-endpoint';
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
  codeAppEditorUrl?: string;
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
  codeAppEditorUrl,
}: Props<T>) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isReadonly = disabled || isReadOnlyAdmin;
  const { dispatch } = useSaveValidationContext();
  const [source, setSource] = useState<string>();
  const [errorText, setErrorText] = useState('');

  // The Code App option is only available when CODE_APP_EDITOR_URL is configured.
  const visibleSourceItems = useMemo(
    () => (codeAppEditorUrl ? sourceItems : sourceItems.filter((item) => item.value !== CODE_APP_SOURCE_TYPE)),
    [sourceItems, codeAppEditorUrl],
  );

  // Toolsets offer two container options backed by one fetch (MCP + inference); scope the list
  // to the selected option. Other views keep their existing (unfiltered / Models) behaviour.
  const containerFilter = useMemo(() => {
    if (view !== ApplicationRoute.Toolsets) {
      return undefined;
    }
    return source === MODEL_SERVING_SOURCE_TYPE ? isTextClassificationInferenceContainer : isMcpContainer;
  }, [view, source]);

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
        setSource(sourceType);
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
            applicationProperties: undefined,
            responsesEndpoint: undefined,
          });
        } else if (view === ApplicationRoute.AssetsApplications) {
          Object.assign(reset, {
            mcp: undefined,
            viewer_url: undefined,
            editor_url: undefined,
            application_properties: undefined,
            responses_endpoint: undefined,
          });
        }

        if (sourceType === CODE_APP_SOURCE_TYPE) {
          onChangeEntity({
            ...entity,
            ...reset,
            ...createCodeAppFields(codeAppEditorUrl),
          });
          return;
        }

        // Model Serving is a UI-only selector value; it persists as a container source.
        const persistedType =
          sourceType === MODEL_SERVING_SOURCE_TYPE ? SOURCE_TYPE.CONTAINER : (sourceType as SOURCE_TYPE);

        onChangeEntity({
          ...entity,
          source: { $type: persistedType },
          ...reset,
        });
      }
    },
    [codeAppEditorUrl, dispatch, entity, onChangeEntity, source, view],
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
      setSource((prev) => {
        if (isCodeAppSource(entity, codeAppEditorUrl)) {
          return CODE_APP_SOURCE_TYPE;
        }
        const derived = entity.source?.$type || sourceItems[0].value;
        // MCP Container and Model Serving both persist as CONTAINER — keep the user's
        // container-family choice instead of collapsing Model Serving back to MCP Container.
        if (derived === SOURCE_TYPE.CONTAINER && isContainerFamilySource(prev)) {
          return prev;
        }
        return derived;
      });
    }
  }, [codeAppEditorUrl, entity, isModal, onChangeEntity, sourceItems, view]);

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
          entity={entity}
          onChange={onChangeEntity}
          view={view}
          isModal={isModal}
          isEntityImmutable={isEntityImmutable}
          disabled={isReadonly}
          isCodeApp={source === CODE_APP_SOURCE_TYPE}
        />
      )}
      {isContainerFamilySource(source) && getContainers && (
        <Containers
          entity={entity}
          onChange={onChangeEntity}
          getContainers={getContainers}
          containerFilter={containerFilter}
          view={view}
          isModal={isModal}
          error={isContainerFamilySource(source) ? errorText : ''}
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
