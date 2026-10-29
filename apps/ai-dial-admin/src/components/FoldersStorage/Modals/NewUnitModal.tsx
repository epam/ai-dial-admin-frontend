'use client';

import { FC, useCallback, useState } from 'react';

import { Input, Popup, PopupSize } from '@epam/ai-dial-ui-kit';

import { createOrgUnit } from '@/src/app/[lang]/folders-storage/actions';
import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import { ButtonsI18nKey, ErrorI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { OrgUnit } from '@/src/models/dial/org-unit';
import { getErrorNotification } from '@/src/utils/notification';
import { OrgUnitErrorKind, mapOrgUnitError } from '@/src/utils/org-units/errors';
import { isValidDisplayName } from '@/src/utils/org-units/subjects';

interface Props {
  /** Decoded path of the shared space or of the parent unit, e.g. `public/Acme`. */
  parentPath: string;
  onClose: () => void;
  onCreated: (unit: OrgUnit) => void;
}

const NewUnitModal: FC<Props> = ({ parentPath, onClose, onCreated }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [nameError, setNameError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);

  const isDisplayNameValid = isValidDisplayName(displayName);

  const onSubmit = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await createOrgUnit(parentPath, {
        name: name.trim(),
        ...(displayName.trim() ? { displayName: displayName.trim() } : {}),
      });
      if (res.success) {
        onCreated(res.response as OrgUnit);
        return;
      }
      const error = mapOrgUnitError(res);
      if (error.kind === OrgUnitErrorKind.FIELD || error.kind === OrgUnitErrorKind.NOT_FOUND) {
        setNameError(error.message);
        return;
      }
      showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
    } catch {
      showNotification(getErrorNotification(t(ErrorI18nKey.SystemUnavailable), t(ErrorI18nKey.TryAgainLater)));
    } finally {
      setIsSaving(false);
    }
  }, [parentPath, name, displayName, onCreated, showNotification, t]);

  return (
    <Popup
      open
      header={t(FoldersI18nKey.NewUnitTitle)}
      portalId="NewUnitModal"
      size={PopupSize.Md}
      onClose={onClose}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ButtonsI18nKey.Create),
        isSubmitDisabled: !name.trim() || !isDisplayNameValid || isSaving,
        onCancel: onClose,
        onSubmit,
      })}
    >
      <div className="flex flex-col gap-y-6 px-6 py-4">
        <Input id="new-unit-parent" labelProps={{ label: t(FoldersI18nKey.UnitParent) }} value={parentPath} disabled />
        <Input
          id="new-unit-name"
          labelProps={{ label: t(FoldersI18nKey.UnitName), required: true }}
          placeholder={t(FoldersI18nKey.UnitNamePlaceholder)}
          value={name}
          invalid={!!nameError}
          error={nameError}
          onChange={(value) => {
            setName(value ?? '');
            setNameError(undefined);
          }}
        />
        <Input
          id="new-unit-display-name"
          labelProps={{ label: t(FoldersI18nKey.UnitDisplayName) }}
          placeholder={t(FoldersI18nKey.UnitDisplayNamePlaceholder)}
          value={displayName}
          invalid={!isDisplayNameValid}
          error={isDisplayNameValid ? undefined : t(FoldersI18nKey.UnitDisplayNameTooLong)}
          onChange={(value) => setDisplayName(value ?? '')}
        />
      </div>
    </Popup>
  );
};

export default NewUnitModal;
