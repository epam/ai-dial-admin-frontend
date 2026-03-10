import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialFormPopup, DialSelectField, DialInput, PopupSize, SelectOption } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, CoreVersionModalI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { CoreVersions } from '@/src/models/core-version';
import { getDefinitionTypes, getIconAfter, getIconBefore } from '../utils';
import { DefinitionType, DefinitionValues } from '../types';

interface Props {
  coreVersions?: CoreVersions;
  isModalOpen: boolean;
  onClose: () => void;
  onApply: (version: string, isDefault: boolean) => void;
}

const VersionModal: FC<Props> = ({ coreVersions, isModalOpen, onClose, onApply }) => {
  const t = useI18n();

  const [definition, setDefinition] = useState<string | undefined>();
  const [version, setVersion] = useState('');

  const definitionTypes: SelectOption[] = useMemo(() => {
    return coreVersions ? getDefinitionTypes(coreVersions, t) : [];
  }, [coreVersions, t]);

  const iconBefore = useMemo(() => {
    if (coreVersions) {
      return getIconBefore(coreVersions, definition);
    }
  }, [coreVersions, definition]);

  const iconAfter = useMemo(() => {
    if (coreVersions) {
      return getIconAfter(coreVersions, definition, version, t);
    }
  }, [coreVersions, definition, t, version]);

  const captionDescription = useMemo(() => {
    return definition === DefinitionType.AUTO &&
      version === coreVersions?.defaultVersion &&
      coreVersions.autoDetectedVersion === '-1'
      ? t(CoreVersionModalI18nKey.DefaultCaption)
      : '';
  }, [coreVersions, definition, t, version]);

  useEffect(() => {
    if (coreVersions?.manuallySetVersion) {
      setVersion(coreVersions?.manuallySetVersion);
      setDefinition(DefinitionType.MANUAL);
    } else if (coreVersions?.autoDetectedVersion) {
      setDefinition(DefinitionType.AUTO);
      if (coreVersions?.autoDetectedVersion === '-1') {
        setVersion(coreVersions?.defaultVersion ? coreVersions?.defaultVersion : DefinitionValues.NOT_DETECTED);
      } else {
        setVersion(coreVersions?.autoDetectedVersion);
      }
    } else if (coreVersions?.defaultVersion) {
      setDefinition(DefinitionType.DEFAULT);
      setVersion(coreVersions?.defaultVersion);
    } else {
      setDefinition(DefinitionType.MANUAL);
      setVersion('');
    }
  }, [coreVersions, definitionTypes, t]);

  useEffect(() => {
    if (definition === DefinitionType.AUTO) {
      setVersion(
        (coreVersions?.autoDetectedVersion === '-1'
          ? coreVersions?.defaultVersion
            ? coreVersions?.defaultVersion
            : DefinitionValues.NOT_DETECTED
          : coreVersions?.autoDetectedVersion) as string,
      );
    }
    if (definition === DefinitionType.MANUAL) {
      setVersion(coreVersions?.manuallySetVersion || '');
    }
    if (definition === DefinitionType.DEFAULT) {
      setVersion(coreVersions?.defaultVersion as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definition]);

  const setNewVersion = useCallback(() => {
    if (definition === DefinitionType.DEFAULT || definition === DefinitionType.AUTO) {
      onApply('', true);
    } else {
      onApply(version, false);
    }
  }, [definition, onApply, version]);

  return (
    <DialFormPopup
      portalId="CoreVersion"
      className="min-w-[480px]"
      size={PopupSize.Sm}
      open={isModalOpen}
      dividers={true}
      header={t(CoreVersionModalI18nKey.Title)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={t(ButtonsI18nKey.Apply)}
      onSubmit={setNewVersion}
      onCancel={onClose}
      onClose={onClose}
      disableSubmitButton={!version}
    >
      <div className="px-6 py-4">
        <div className="flex flex-row gap-x-4">
          <DialSelectField
            containerClassName="w-[160px]"
            id="definitionType"
            options={definitionTypes}
            value={definition}
            label={t(CoreVersionModalI18nKey.DefinitionType)}
            onChange={(value) => setDefinition(value as string)}
          />
          <DialInput
            id="version"
            labelProps={{ label: t(EntityFieldsI18nKey.version), caption: captionDescription }}
            value={version}
            disabled={definition === DefinitionType.AUTO || definition === DefinitionType.DEFAULT}
            iconBefore={iconBefore}
            iconAfter={iconAfter}
            onChange={(v) => setVersion(v || '')}
          />
        </div>
      </div>
    </DialFormPopup>
  );
};

export default VersionModal;
