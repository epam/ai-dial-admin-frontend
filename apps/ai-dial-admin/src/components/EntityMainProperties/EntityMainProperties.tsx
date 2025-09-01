'use client';

import { uniq } from 'lodash';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import ApplicationSource from '@/src/components/ApplicationSource/ApplicationSource';
import AutocompleteField from '@/src/components/Common/Dropdown/Autocomplete/AutocompleteField';
import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import IdControl from '@/src/components/EntityMainProperties/BaseProperties/Id';
import VersionControl from '@/src/components/EntityMainProperties/BaseProperties/Version';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialModel } from '@/src/models/dial/model';
import { ApplicationRoute } from '@/src/types/routes';
import classNames from 'classnames';
import AdditionalProperties from './AdditionalProperties';
import { getDisplayNameError, getVersionError } from './utils';

interface Props {
  view: ApplicationRoute;
  entity: BaseEntity;
  names: string[];
  isUniqueNameError?: boolean;
  runners?: DialApplicationScheme[];
  isEntityImmutable?: boolean;
  onChangeEntity: (entity: BaseEntity) => void;
}

const EntityMainProperties: FC<Props> = ({
  view,
  entity,
  runners,
  names,
  isUniqueNameError,
  onChangeEntity,
  isEntityImmutable = false,
}) => {
  const t = useI18n() as (str: string, param?: Record<string, number>) => string;
  const { dispatch } = useSaveValidationContext();

  const [isVersionOptional, setIsVersionOptional] = useState(true);
  const [displayNameError, setDisplayNameError] = useState<string | undefined>(void 0);

  const versionError = useMemo(() => {
    return entity.displayName ? void 0 : getVersionError(view, isVersionOptional, entity.version as string, t);
  }, [entity.version, entity.displayName, isVersionOptional, t, view]);

  const onChangeName = useCallback(
    (newEntity: BaseEntity) => {
      if (view === ApplicationRoute.Models) {
        (newEntity as DialModel).endpointDeploymentName = newEntity.name;
      }

      onChangeEntity(newEntity);
    },
    [onChangeEntity, view],
  );

  const onChangeDisplayName = useCallback(
    (displayName: string) => {
      setIsVersionOptional(!names.includes(displayName));
      const error = getDisplayNameError(view, displayName as string, names, t, (entity as DialModel).displayVersion);
      setDisplayNameError(error);

      dispatch({
        type: ValidationActionType.SetField,
        field: 'displayName',
        isValid: !error,
      });

      onChangeEntity({ ...entity, displayName });
    },
    [names, dispatch, view, t, onChangeEntity, entity],
  );

  useEffect(() => {
    if (view === ApplicationRoute.Models || view === ApplicationRoute.Applications) {
      dispatch({
        type: ValidationActionType.SetField,
        field: 'displayName',
        isValid: !!entity.displayName,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  useEffect(() => {
    if (view === ApplicationRoute.Models) {
      dispatch({ type: ValidationActionType.SetField, field: 'displayVersion', isValid: !versionError });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionError, (entity as DialModel).displayVersion, t, view, dispatch]);

  const onChangeVersion = useCallback(
    (displayVersion?: string) => {
      onChangeEntity({ ...entity, displayVersion } as DialModel);
      const error = getDisplayNameError(view, entity.displayName as string, names, t, displayVersion);
      setDisplayNameError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'displayName',
        isValid: !error,
      });
    },
    [onChangeEntity, entity, view, names, t, dispatch],
  );

  return (
    <div className="w-full flex flex-col">
      <div className={classNames('flex flex-col gap-y-6', isEntityImmutable ? 'lg:w-[35%]' : 'w-full')}>
        {!isEntityImmutable && (
          <IdControl entity={entity} onChangeEntity={onChangeName} isUniqueNameError={isUniqueNameError} />
        )}
        <AutocompleteField
          elementId="displayName"
          fieldTitle={t(EntityFieldsI18nKey.displayName)}
          placeholder={t(EntityPlaceholdersI18nKey.DisplayName)}
          value={entity.displayName}
          errorText={displayNameError}
          onChange={onChangeDisplayName}
          invalid={!!displayNameError}
          items={uniq(names)}
        />

        {view === ApplicationRoute.Models && (
          <VersionControl
            version={(entity as DialModel).displayVersion}
            onChange={onChangeVersion}
            error={versionError}
            optional={isVersionOptional}
          />
        )}

        {view === ApplicationRoute.Applications && !isEntityImmutable && (
          <ApplicationSource
            entity={entity}
            runners={runners}
            isEntityImmutable={isEntityImmutable}
            onChangeEntity={onChangeEntity}
          />
        )}

        <DescriptionControl entity={entity} onChangeEntity={onChangeEntity} />
      </div>

      <div className="mt-4">
        <AdditionalProperties
          entity={entity}
          onChangeEntity={onChangeEntity}
          view={view}
          isEntityImmutable={isEntityImmutable}
          runners={runners}
        />
      </div>
    </div>
  );
};

export default EntityMainProperties;
