import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import classNames from 'classnames';

import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import SourceEntitySelector from '@/src/components/EntityMainProperties/SourceEntitySelector/SourceEntitySelector';
import { RUNNERS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, EntitiesI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrlError } from '@/src/utils/validation/url-error';
import { SourceTypes } from './constants';

interface Props {
  entity: DialApplication;
  runners?: DialApplicationScheme[];
  isEntityImmutable?: boolean;
  onChangeEntity: (entity: DialApplication) => void;
}

const ApplicationSource: FC<Props> = ({ entity, runners, onChangeEntity, isEntityImmutable }) => {
  const t = useI18n() as (key: string) => string;
  const sources: DropdownItemsModel[] = useMemo(
    () => [
      {
        id: SourceTypes.ENDPOINTS,
        name: t(EntitiesI18nKey.Endpoints),
      },
      {
        id: SourceTypes.APP_RUNNER,
        name: t(EntitiesI18nKey.AppRunner),
      },
    ],
    [t],
  );
  const [sourceType, setSourceType] = useState<DropdownItemsModel | undefined>(
    entity.endpoint || !entity.customAppSchemaId ? sources[0] : sources[1],
  );
  const { dispatch } = useSaveValidationContext();

  const endpointError = useMemo(() => {
    return entity.endpoint ? getUrlError(entity.endpoint, false, t) : null;
  }, [entity.endpoint, t]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'baseEndpoint', isValid: !endpointError });
  }, [endpointError, t, dispatch]);

  const viewerUrlError = useMemo(() => {
    return entity.viewerUrl ? getUrlError(entity.viewerUrl, false, t) : null;
  }, [entity.viewerUrl, t]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'viewerUrl', isValid: !viewerUrlError });
  }, [viewerUrlError, t, dispatch]);

  const editorUrlError = useMemo(() => {
    return entity.editorUrl ? getUrlError(entity.editorUrl, false, t) : null;
  }, [entity.editorUrl, t]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'editorUrl', isValid: !editorUrlError });
  }, [editorUrlError, t, dispatch]);

  const onChangeEndpoint = useCallback(
    (endpoint: string) => {
      onChangeEntity({ ...entity, endpoint });
    },
    [entity, onChangeEntity],
  );

  const onChangeSource = useCallback(
    (value: string) => {
      if (sourceType?.id !== value) {
        // Reset validation states when changing source type
        dispatch({ type: ValidationActionType.SetField, field: 'endpoint', isValid: true });
        dispatch({ type: ValidationActionType.SetField, field: 'viewerUrl', isValid: true });
        dispatch({ type: ValidationActionType.SetField, field: 'editorUrl', isValid: true });
        setSourceType(sources?.find((t) => t.id === value));
        onChangeEntity({
          ...entity,
          endpoint: void 0,
          viewerUrl: void 0,
          editorUrl: void 0,
          customAppSchemaId: void 0,
        });
      }
    },
    [entity, onChangeEntity, sourceType?.id, sources, dispatch],
  );

  const onChangeViewerUrl = useCallback(
    (viewerUrl: string) => {
      onChangeEntity({ ...entity, viewerUrl });
    },
    [entity, onChangeEntity],
  );

  const onChangeEditorUrl = useCallback(
    (editorUrl: string) => {
      onChangeEntity({ ...entity, editorUrl });
    },
    [entity, onChangeEntity],
  );

  const onChangeAppRunner = useCallback(
    (value?: string) => {
      onChangeEntity({ ...entity, customAppSchemaId: value, endpoint: void 0 });
    },
    [entity, onChangeEntity],
  );

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="max-w-[180px]">
        <DropdownField
          selectedValue={sourceType?.id}
          elementId="sourceType"
          items={sources}
          fieldTitle={t(EntitiesI18nKey.SourceType)}
          onChange={onChangeSource}
        />
      </div>
      {sourceType?.id === SourceTypes.ENDPOINTS && (
        <div className={classNames('flex flex-col gap-4', isEntityImmutable ? 'lg:w-[35%]' : 'w-full')}>
          <TextInputField
            elementId="completionEndpoint"
            fieldTitle={t(EntityFieldsI18nKey.completionEndpoint)}
            placeholder={t(EntityPlaceholdersI18nKey.CompletionEndpoint)}
            value={entity.endpoint}
            onChange={onChangeEndpoint}
            invalid={!!endpointError}
            errorText={endpointError?.text}
          />
          {isEntityImmutable && (
            <>
              <TextInputField
                optional={true}
                elementId="viewerUrl"
                fieldTitle={t(EntityFieldsI18nKey.viewerUrl)}
                placeholder={t(EntityPlaceholdersI18nKey.ViewerUrl)}
                value={entity.viewerUrl}
                errorText={viewerUrlError?.text}
                invalid={!!viewerUrlError}
                onChange={onChangeViewerUrl}
              />
              <TextInputField
                optional={true}
                elementId="editorUrl"
                fieldTitle={t(EntityFieldsI18nKey.editorUrl)}
                placeholder={t(EntityPlaceholdersI18nKey.EditorUrl)}
                value={entity.editorUrl}
                errorText={editorUrlError?.text}
                invalid={!!editorUrlError}
                onChange={onChangeEditorUrl}
              />
            </>
          )}
        </div>
      )}
      {sourceType?.id === SourceTypes.APP_RUNNER && (
        <div className={classNames('flex flex-row gap-4 items-start')}>
          <SourceEntitySelector
            buttonTitle={t(ButtonsI18nKey.OpenAppRunner)}
            columns={RUNNERS_COLUMNS}
            fieldTitle={t(EntitiesI18nKey.AppRunner)}
            placeholder={t(EntityPlaceholdersI18nKey.SelectAppRunner)}
            selectedValue={entity.customAppSchemaId}
            sourceEntities={runners}
            route={ApplicationRoute.ApplicationRunners}
            isEntityImmutable={isEntityImmutable}
            onChangeValue={onChangeAppRunner}
          />
        </div>
      )}
    </div>
  );
};

export default ApplicationSource;
