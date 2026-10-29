'use client';

import { FC, useCallback, useState } from 'react';

import { Input, Popup, PopupSize } from '@epam/ai-dial-ui-kit';

import { renameOrgUnit } from '@/src/app/[lang]/folders-storage/actions';
import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import { ButtonsI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { OrgUnit } from '@/src/models/dial/org-unit';
import { getErrorNotification } from '@/src/utils/notification';
import { isValidDisplayName } from '@/src/utils/org-units/subjects';

interface Props {
  unit: OrgUnit;
  onClose: () => void;
  onRenamed: (unit: OrgUnit) => void;
}

const RenameUnitModal: FC<Props> = ({ unit, onClose, onRenamed }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const [displayName, setDisplayName] = useState(unit.displayName);
  const [isSaving, setIsSaving] = useState(false);

  const isValid = isValidDisplayName(displayName);

  const onSubmit = useCallback(async () => {
    setIsSaving(true);
    const res = await renameOrgUnit(unit.path, displayName.trim());
    setIsSaving(false);
    if (res.success) {
      onRenamed(res.response as OrgUnit);
      return;
    }
    showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
  }, [unit.path, displayName, onRenamed, showNotification]);

  return (
    <Popup
      open
      header={t(FoldersI18nKey.RenameUnit)}
      portalId="RenameUnitModal"
      size={PopupSize.Md}
      onClose={onClose}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ButtonsI18nKey.Save),
        isSubmitDisabled: !isValid || isSaving,
        onCancel: onClose,
        onSubmit,
      })}
    >
      <div className="px-6 py-4">
        <Input
          id="rename-unit-display-name"
          labelProps={{ label: t(FoldersI18nKey.UnitDisplayName) }}
          placeholder={unit.name}
          value={displayName}
          invalid={!isValid}
          error={isValid ? undefined : t(FoldersI18nKey.UnitDisplayNameTooLong)}
          onChange={(value) => setDisplayName(value ?? '')}
        />
      </div>
    </Popup>
  );
};

export default RenameUnitModal;
