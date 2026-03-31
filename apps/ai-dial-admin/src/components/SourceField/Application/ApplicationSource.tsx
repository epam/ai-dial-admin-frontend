'use client';

import { FC, useCallback, useEffect, useState } from 'react';

import { DialRadioGroup, RadioGroupOrientation } from '@epam/ai-dial-ui-kit';
import { JSONSchema7 } from 'json-schema';

import { getResolvedApplicationScheme } from '@/src/app/[lang]/application-runners/actions';
import EditorUrlControl from '@/src/components/BaseControls/Endpoint/EditorUrl';
import ViewerUrlControl from '@/src/components/BaseControls/Endpoint/ViewerUrl';
import AppRunners from '@/src/components/SourceField/Application/AppRunners';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DefaultsValue } from '@/src/models/dial/defaults';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { ApplicationRoute } from '@/src/types/routes';
import { getSchemaDefaults } from '@/src/utils/schema';
import EndpointAndMCPContainer from './EndpointAndMCPContainer';
import { APPLICATION_SOURCE_TYPES, SourceType } from './constants';

export interface Props {
  entity: DialApplication;
  runners?: DialApplicationScheme[];
  view?: ApplicationRoute;
  isEntityImmutable?: boolean;
  onChangeEntity: (entity: DialApplication) => void;
  isModal?: boolean;
}

const ApplicationSource: FC<Props> = ({ entity, runners, view, onChangeEntity, isEntityImmutable, isModal }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const [sourceType, setSourceType] = useState<SourceType>(
    entity?.endpoint || entity?.mcp || (!entity.customAppSchemaId && !(entity as AssetApp).applicationTypeSchemaId)
      ? SourceType.ENDPOINTS
      : SourceType.APP_RUNNER,
  );
  const { dispatch } = useSaveValidationContext();

  useEffect(() => {
    const isAppRunerSourceType = entity.customAppSchemaId || (entity as AssetApp).applicationTypeSchemaId;
    const isMCPSourceType = entity?.endpoint || entity?.mcp;
    if (isAppRunerSourceType) {
      setSourceType(SourceType.APP_RUNNER);
    } else if (isMCPSourceType) {
      setSourceType(SourceType.ENDPOINTS);
    }
  }, [entity]);

  const resetValidation = useCallback(() => {
    // Reset validation states when changing source type
    dispatch({ type: ValidationActionType.SetField, field: 'endpoint', isValid: true });
    dispatch({ type: ValidationActionType.SetField, field: 'mcp_endpoint', isValid: true });
    dispatch({ type: ValidationActionType.SetField, field: 'viewerUrl', isValid: true });
    dispatch({ type: ValidationActionType.SetField, field: 'editorUrl', isValid: true });
    onChangeEntity({
      ...entity,
      endpoint: void 0,
      mcp: void 0,
      viewerUrl: void 0,
      editorUrl: void 0,
      customAppSchemaId: void 0,
      applicationTypeSchemaId: void 0,
      applicationProperties: void 0,
    });
  }, [entity, onChangeEntity, dispatch]);

  const handleRadioChange = useCallback(
    (option: string) => {
      if (option === SourceType.ENDPOINTS) {
        setSourceType(SourceType.ENDPOINTS);
        const newEntity = {
          ...entity,
          applicationTypeSchemaId: void 0,
          customAppSchemaId: void 0,
          applicationProperties: void 0,
        };
        onChangeEntity(newEntity);
      } else if (option === SourceType.APP_RUNNER) {
        setSourceType(SourceType.APP_RUNNER);
        const newEntity = {
          ...entity,
          endpoint: void 0,
          mcp: void 0,
        };
        onChangeEntity(newEntity);
      }
      resetValidation();
    },
    [setSourceType, resetValidation, onChangeEntity, entity],
  );

  const onChangeViewerUrl = useCallback(
    (viewerUrl?: string) => {
      onChangeEntity({ ...entity, viewerUrl });
    },
    [entity, onChangeEntity],
  );

  const onChangeEditorUrl = useCallback(
    (editorUrl?: string) => {
      onChangeEntity({ ...entity, editorUrl });
    },
    [entity, onChangeEntity],
  );

  const onChangeAppRunner = useCallback(
    (value?: string) => {
      const newEntity =
        view === ApplicationRoute.AssetsApplications
          ? {
              ...entity,
              applicationTypeSchemaId: value,
              endpoint: void 0,
              mcp: void 0,
            }
          : { ...entity, customAppSchemaId: value, endpoint: void 0, mcp: void 0 };
      const runner = runners?.find((r) => r.$id === value);
      if (runner) {
        let scheme: DialApplicationScheme | undefined;
        getResolvedApplicationScheme(runner?.$id ?? '').then((res) => {
          if (res.success && (res.response as { schema?: DialApplicationScheme })?.schema) {
            scheme = (res.response as { schema: DialApplicationScheme }).schema;
          } else {
            scheme = runner ?? undefined;
          }
          const applicationProperties = getSchemaDefaults(scheme as JSONSchema7) as Record<string, DefaultsValue>;
          onChangeEntity({
            ...newEntity,
            applicationProperties: isEntityImmutable ? { ...newEntity.applicationProperties } : applicationProperties,
          });
        });
      }
    },
    [entity, isEntityImmutable, onChangeEntity, runners, view],
  );

  const onChangeEndpoint = useCallback(
    (entity: DialApplication) => {
      const newEntity = {
        ...entity,
        applicationTypeSchemaId: void 0,
        customAppSchemaId: void 0,
        applicationProperties: void 0,
      };
      onChangeEntity(newEntity);
    },
    [onChangeEntity],
  );

  return (
    <div className="flex flex-col w-full relative gap-3">
      <DialRadioGroup
        disabled={isReadOnlyAdmin}
        radioButtons={APPLICATION_SOURCE_TYPES(t)}
        activeRadioButton={sourceType}
        elementId="applicationSourceTypes"
        fieldTitle={t(EntitiesI18nKey.SourceType)}
        orientation={RadioGroupOrientation.Column}
        onChange={handleRadioChange}
      />

      {sourceType === SourceType.ENDPOINTS && (
        <div className="h-full flex flex-col gap-y-8">
          <div className="ml-8">
            <EndpointAndMCPContainer
              entity={entity}
              isEntityImmutable={isEntityImmutable}
              isReadOnlyAdmin={isReadOnlyAdmin}
              onChangeEntity={onChangeEndpoint}
              isModal={isModal}
              view={view || ApplicationRoute.Applications}
            />
          </div>

          {isEntityImmutable && (
            <>
              <ViewerUrlControl endpoint={entity.viewerUrl} disabled={isReadOnlyAdmin} onChange={onChangeViewerUrl} />
              <EditorUrlControl endpoint={entity.editorUrl} disabled={isReadOnlyAdmin} onChange={onChangeEditorUrl} />
            </>
          )}
        </div>
      )}

      {sourceType === SourceType.APP_RUNNER && (
        <div className="ml-8">
          <AppRunners
            selectedValue={
              view === ApplicationRoute.AssetsApplications
                ? (entity as AssetApp).applicationTypeSchemaId
                : entity.customAppSchemaId
            }
            runners={runners}
            isEntityImmutable={isEntityImmutable}
            onChangeValue={onChangeAppRunner}
          />
        </div>
      )}
    </div>
  );
};

export default ApplicationSource;
