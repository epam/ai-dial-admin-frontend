import { FC, useCallback, useState } from 'react';

import ApplicationSource from '@/src/components/Applications/ApplicationSource/ApplicationSource';
import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import IdControl from '@/src/components/EntityMainProperties/BaseProperties/Id';
import VersionControl from '@/src/components/EntityMainProperties/BaseProperties/Version';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { Asset } from '@/src/models/dial/deployment-asset';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ApplicationRoute } from '@/src/types/routes';
import { getPromptVersionError } from '@/src/utils/validation/version-error';
import { DialApplicationScheme } from '@/src/models/dial/application';

interface Props {
  view?: ApplicationRoute;
  entity: Asset;
  names: string[];
  isEntityImmutable?: boolean;
  versionsMap?: Record<string, string[]>;
  onChangeEntity: (entity: object) => void;
  isModal?: boolean;
  runners?: DialApplicationScheme[];
  initialValues?: Partial<BaseEntity>;
}

const AssetProperties: FC<Props> = ({
  view,
  entity,
  names,
  onChangeEntity,
  isEntityImmutable = false,
  versionsMap,
  runners,
}) => {
  const t = useI18n() as (t: string) => string;
  const { dispatch } = useSaveValidationContext();

  const [versionError, setVersionError] = useState<string | undefined>(void 0);

  const validateVersion = useCallback(
    (version?: string) => {
      const versionError = getPromptVersionError(versionsMap, entity, t, version);
      setVersionError(versionError);
      dispatch({ type: ValidationActionType.SetField, field: 'version', isValid: !versionError });
    },
    [dispatch, entity, t, versionsMap],
  );

  const onChangeVersion = useCallback(
    (version?: string) => {
      onChangeEntity({ ...entity, version } as DialPrompt);
      validateVersion(version);
    },
    [entity, onChangeEntity, validateVersion],
  );

  return (
    <div className="flex flex-col gap-6">
      {!isEntityImmutable && (
        <IdControl
          fieldTitle={t(EntityFieldsI18nKey.displayName)}
          placeholder={t(EntityPlaceholdersI18nKey.DisplayName)}
          entity={entity}
          names={names}
          onChangeEntity={onChangeEntity}
        />
      )}

      <VersionControl
        containerCssClass="w-[150px]"
        version={entity.version}
        onChange={onChangeVersion}
        error={versionError}
      />

      <DescriptionControl entity={entity} onChangeEntity={onChangeEntity} />

      {view === ApplicationRoute.AssetsApplications && !isEntityImmutable && (
        <ApplicationSource
          entity={entity}
          runners={runners}
          isEntityImmutable={isEntityImmutable}
          onChangeEntity={onChangeEntity}
        />
      )}
    </div>
  );
};

export default AssetProperties;
