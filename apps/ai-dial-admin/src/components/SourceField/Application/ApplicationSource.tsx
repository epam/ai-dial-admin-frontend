import { FC, useCallback, useMemo, useState } from 'react';

import { DialSelectField, SelectOption } from '@epam/ai-dial-ui-kit';
import { JSONSchema7 } from 'json-schema';

import CompletionEndpointControl from '@/src/components/BaseControls/Endpoint/CompletionEndpoint';
import EditorUrlControl from '@/src/components/BaseControls/Endpoint/EditorUrl';
import ViewerUrlControl from '@/src/components/BaseControls/Endpoint/ViewerUrl';
import AppRunners from '@/src/components/SourceField/Application/AppRunners';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DefaultsValue } from '@/src/models/dial/defaults';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { ApplicationRoute } from '@/src/types/routes';
import { getSchemaDefaults } from '@/src/utils/schema';
import { SourceTypes } from './constants';

interface Props {
  entity: DialApplication;
  runners?: DialApplicationScheme[];
  view?: ApplicationRoute;
  isEntityImmutable?: boolean;
  onChangeEntity: (entity: DialApplication) => void;
  isModal?: boolean;
}

const ApplicationSource: FC<Props> = ({ entity, runners, view, onChangeEntity, isEntityImmutable, isModal }) => {
  const t = useI18n();
  const sources: SelectOption[] = useMemo(
    () => [
      {
        value: SourceTypes.ENDPOINTS,
        label: t(EntitiesI18nKey.Endpoints),
      },
      {
        value: SourceTypes.APP_RUNNER,
        label: t(EntitiesI18nKey.AppRunner),
      },
    ],
    [t],
  );
  const [sourceType, setSourceType] = useState<SelectOption | undefined>(
    entity.endpoint || (!entity.customAppSchemaId && !(entity as AssetApp).applicationTypeSchemaId)
      ? sources[0]
      : sources[1],
  );
  const { dispatch } = useSaveValidationContext();

  const onChangeEndpoint = useCallback(
    (endpoint?: string) => {
      onChangeEntity({ ...entity, endpoint });
    },
    [entity, onChangeEntity],
  );

  const onChangeSource = useCallback(
    (value: string) => {
      if (sourceType?.value !== value) {
        // Reset validation states when changing source type
        dispatch({ type: ValidationActionType.SetField, field: 'endpoint', isValid: true });
        dispatch({ type: ValidationActionType.SetField, field: 'viewerUrl', isValid: true });
        dispatch({ type: ValidationActionType.SetField, field: 'editorUrl', isValid: true });
        dispatch({ type: ValidationActionType.SetField, field: 'completionEndpoint', isValid: true });
        setSourceType(sources?.find((t) => t.value === value));
        onChangeEntity({
          ...entity,
          endpoint: void 0,
          viewerUrl: void 0,
          editorUrl: void 0,
          customAppSchemaId: void 0,
        });
      }
    },
    [entity, onChangeEntity, sourceType?.value, sources, dispatch],
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
            }
          : { ...entity, customAppSchemaId: value, endpoint: void 0 };
      const runner = runners?.find((r) => r.$id === value);
      if (runner) {
        const applicationProperties = getSchemaDefaults(runner as JSONSchema7) as Record<string, DefaultsValue>;
        onChangeEntity({
          ...newEntity,
          applicationProperties: isEntityImmutable ? { ...newEntity.applicationProperties } : applicationProperties,
        });
      }
    },
    [entity, isEntityImmutable, onChangeEntity, runners, view],
  );

  return (
    <div className="h-full flex flex-col gap-y-8">
      <DialSelectField
        value={sourceType?.value}
        id="sourceType"
        options={sources}
        containerClassName="w-[180px]"
        label={t(EntitiesI18nKey.SourceType)}
        onChange={(source) => onChangeSource(source as string)}
      />
      {sourceType?.value === SourceTypes.ENDPOINTS && (
        <div className="flex flex-col gap-y-8">
          <CompletionEndpointControl
            required
            endpoint={entity.endpoint}
            onChange={onChangeEndpoint}
            isFullWidth={!isEntityImmutable}
            isModal={isModal}
          />
          {isEntityImmutable && (
            <>
              <ViewerUrlControl endpoint={entity.viewerUrl} onChange={onChangeViewerUrl} />
              <EditorUrlControl endpoint={entity.editorUrl} onChange={onChangeEditorUrl} />
            </>
          )}
        </div>
      )}
      {sourceType?.value === SourceTypes.APP_RUNNER && (
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
      )}
    </div>
  );
};

export default ApplicationSource;
