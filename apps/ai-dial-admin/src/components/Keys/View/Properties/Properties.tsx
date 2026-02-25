import { DialGhostButton, DialSwitch, DialInput } from '@epam/ai-dial-ui-kit';
import { IconSparkles } from '@tabler/icons-react';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IdControl from '@/src/components/BaseControls/Id/Id';
import TopicsControl from '@/src/components/BaseControls/Topics';
import ValidityPeriod from '@/src/components/Keys/Modals/ValidityPeriod';
import KeyGenerateField from '@/src/components/Keys/View/Properties/KeyGenerateField';
import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { MAX_NAME_SYMBOLS } from '@/src/constants/validation';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialKey } from '@/src/models/dial/key';
import { getControlClassName } from '@/src/utils/entities/view';
import AccessRestrictionField from './AccessRestrictionField';

interface Props {
  entity: DialKey;
  originalEntity?: DialKey;
  names: string[];
  keys: string[];
  isKeyImmutable?: boolean;
  onChangeKey: (key: DialKey) => void;
}

const KeyProperties: FC<Props> = ({ entity, originalEntity, names, keys, isKeyImmutable, onChangeKey }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const containerClassName = getControlClassName(!isKeyImmutable);

  const isValidKey = useMemo(() => {
    return !!entity.key && !(entity.key.length > MAX_NAME_SYMBOLS);
  }, [entity.key]);

  const [projectError, setProjectError] = useState<string | undefined>();

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'key', isValid: isValidKey });
  }, [isValidKey, dispatch]);

  const onValidateProject = useCallback(
    (project?: string) => {
      const error = project ? void 0 : t(ErrorI18nKey.RequiredField);
      setProjectError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'project', isValid: !error });
    },
    [dispatch, t],
  );

  const onChangeProject = useCallback(
    (project?: string) => {
      onChangeKey({ ...entity, project: project || '' });
      onValidateProject(project);
    },
    [entity, onChangeKey, onValidateProject],
  );

  const onChangeProjectContactPoint = useCallback(
    (projectContactPoint?: string) => {
      onChangeKey({ ...entity, projectContactPoint });
    },
    [entity, onChangeKey],
  );

  const onChangeSecured = useCallback(
    (secured: boolean) => {
      onChangeKey({ ...entity, secured });
    },
    [entity, onChangeKey],
  );

  const onChangeExpiresAt = useCallback(
    (expiresAt: string) => {
      onChangeKey({ ...entity, expiresAt });
    },
    [entity, onChangeKey],
  );

  const onChangeAccessRestriction = useCallback(
    (allowedIpAddressRanges?: string[]) => {
      onChangeKey({ ...entity, allowedIpAddressRanges });
    },
    [entity, onChangeKey],
  );

  const onChange = useCallback(
    (key: DialKey) => {
      onChangeKey(key);
      dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: true });
    },
    [dispatch, onChangeKey],
  );

  const onGenerateKeyId = () => {
    onChange({ ...entity, name: uuidv4() });
  };

  return (
    <div className="flex flex-col gap-y-8 h-full">
      {!isKeyImmutable && (
        <div className="flex items-end">
          <div className="flex-1">
            <IdControl entity={entity} names={names} onChangeEntity={onChangeKey} />
          </div>
          <DialGhostButton
            className="ml-2 h-[34px]"
            iconBefore={<IconSparkles />}
            label={t(ButtonsI18nKey.Generate)}
            onClick={onGenerateKeyId}
          />
        </div>
      )}

      <DisplayNameControl
        displayName={entity.displayName}
        required={true}
        isFullWidth={!isKeyImmutable}
        onChange={(displayName) => onChangeKey({ ...entity, displayName })}
      />

      <DescriptionControl entity={entity} onChangeEntity={onChangeKey} isFullWidth={!isKeyImmutable} />

      <DialInput
        id="project"
        labelProps={{ title: t(EntityFieldsI18nKey.project) }}
        placeholder={t(EntityPlaceholdersI18nKey.Project)}
        value={entity.project}
        errorText={projectError}
        onChange={onChangeProject}
        invalid={!!projectError}
        containerClassName={containerClassName}
      />

      {isKeyImmutable && (
        <DialInput
          id="projectContact"
          labelProps={{ title: t(EntityFieldsI18nKey.projectContactPoint) }}
          placeholder={t(EntityPlaceholdersI18nKey.ContactPoint)}
          value={entity.projectContactPoint}
          onChange={onChangeProjectContactPoint}
          containerClassName={STANDARD_CONTROL_WIDTH}
        />
      )}
      <KeyGenerateField isKeyImmutable={isKeyImmutable} keys={keys} selectedKey={entity} changeKey={onChange} />

      {isKeyImmutable && (
        <>
          <DialSwitch
            isOn={entity.secured}
            label={t(EntityFieldsI18nKey.secured)}
            switchId="secured"
            onChange={onChangeSecured}
          />
          <TopicsControl entity={entity} onChange={onChangeKey} />
        </>
      )}

      {!isKeyImmutable && <ValidityPeriod onChange={onChangeExpiresAt} />}

      {isKeyImmutable && (
        <AccessRestrictionField
          elementId="ip-access-restriction"
          onChange={onChangeAccessRestriction}
          entity={entity}
          originalEntity={originalEntity}
        />
      )}
    </div>
  );
};

export default KeyProperties;
