'use client';

import { FC, useCallback, useEffect, useState } from 'react';

import { DialRadioGroup, RadioGroupOrientation } from '@epam/ai-dial-ui-kit';

import AppRunners from '@/src/components/SourceField/Application/AppRunners';
import ApplicationEndpoint from '@/src/components/SourceField/Endpoints/ApplicationEndpoint';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { APPLICATION_SOURCE_TYPES, SourceType } from './constants';

export interface Props {
  entity: AssetApp;
  runners?: DialApplicationScheme[];
  isEntityImmutable?: boolean;
  onChangeEntity: (entity: DialApplication) => void;
  isModal?: boolean;
}

const ApplicationSource: FC<Props> = ({ entity, runners, onChangeEntity, isEntityImmutable, isModal }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const [sourceType, setSourceType] = useState<SourceType>(
    entity?.endpoint || entity?.mcp || !entity.applicationTypeSchemaId ? SourceType.ENDPOINTS : SourceType.APP_RUNNER,
  );
  const { dispatch } = useSaveValidationContext();

  useEffect(() => {
    if (entity.applicationTypeSchemaId) {
      setSourceType(SourceType.APP_RUNNER);
    } else if (entity?.endpoint || entity?.mcp) {
      setSourceType(SourceType.ENDPOINTS);
    }
  }, [entity]);

  const handleRadioChange = useCallback(
    (option: string) => {
      dispatch({ type: ValidationActionType.SetField, field: 'endpoint', isValid: true });
      dispatch({ type: ValidationActionType.SetField, field: 'mcp_endpoint', isValid: true });
      dispatch({ type: ValidationActionType.SetField, field: 'viewerUrl', isValid: true });
      dispatch({ type: ValidationActionType.SetField, field: 'editorUrl', isValid: true });

      if (option === SourceType.ENDPOINTS) {
        setSourceType(SourceType.ENDPOINTS);
      } else if (option === SourceType.APP_RUNNER) {
        setSourceType(SourceType.APP_RUNNER);
      }
      onChangeEntity({
        ...entity,
        endpoint: undefined,
        responsesEndpoint: undefined,
        mcp: undefined,
        viewerUrl: undefined,
        editorUrl: undefined,
        applicationTypeSchemaId: undefined,
        applicationProperties: undefined,
      });
    },
    [onChangeEntity, entity, dispatch],
  );

  const onChangeAppRunner = useCallback(
    (value?: string) => {
      onChangeEntity({
        ...entity,
        applicationTypeSchemaId: value,
        endpoint: undefined,
        mcp: undefined,
      });
    },
    [entity, onChangeEntity],
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
        <div className="ml-8">
          <ApplicationEndpoint
            entity={entity}
            onChange={onChangeEntity}
            isEntityImmutable={isEntityImmutable}
            isModal={isModal}
            disabled={isReadOnlyAdmin}
          />
        </div>
      )}

      {sourceType === SourceType.APP_RUNNER && (
        <div className="ml-8">
          <AppRunners
            selectedValue={entity.applicationTypeSchemaId}
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
