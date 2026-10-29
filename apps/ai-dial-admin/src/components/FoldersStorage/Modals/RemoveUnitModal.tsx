'use client';

import { FC, useCallback, useState } from 'react';

import { ConfirmationPopup, ConfirmationPopupVariant } from '@epam/ai-dial-ui-kit';

import { deleteOrgUnit } from '@/src/app/[lang]/folders-storage/actions';
import { ButtonsI18nKey, ErrorI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { OrgUnit } from '@/src/models/dial/org-unit';
import { getErrorNotification } from '@/src/utils/notification';
import { OrgUnitErrorKind, mapOrgUnitError } from '@/src/utils/org-units/errors';

interface Props {
  unit: OrgUnit;
  /** Units below `unit`, listed so the user sees everything the call removes. */
  subUnits: OrgUnit[];
  onClose: () => void;
  onRemoved: () => void;
}

const RemoveUnitModal: FC<Props> = ({ unit, subUnits, onClose, onRemoved }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const [isRemoving, setIsRemoving] = useState(false);
  const [blockMessage, setBlockMessage] = useState<string>();

  const onConfirm = useCallback(async () => {
    setIsRemoving(true);
    try {
      const res = await deleteOrgUnit(unit.path, true);
      if (res.success) {
        onRemoved();
        return;
      }
      if (mapOrgUnitError(res).kind === OrgUnitErrorKind.FIELD) {
        setBlockMessage(res.errorMessage);
        return;
      }
      showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
    } catch {
      showNotification(getErrorNotification(t(ErrorI18nKey.SystemUnavailable), t(ErrorI18nKey.TryAgainLater)));
    } finally {
      setIsRemoving(false);
    }
  }, [unit.path, onRemoved, showNotification, t]);

  return (
    <ConfirmationPopup
      open
      variant={ConfirmationPopupVariant.Danger}
      header={t(FoldersI18nKey.RemoveUnit)}
      confirmLabel={t(ButtonsI18nKey.Remove)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      isLoading={isRemoving}
      onConfirm={onConfirm}
      onCancel={onClose}
      onClose={onClose}
    >
      <div className="flex flex-col gap-3">
        <p>{t(FoldersI18nKey.RemoveUnitDescription, { unit: unit.displayName || unit.name })}</p>
        {subUnits.length > 0 && (
          <div className="flex flex-col gap-1">
            <p>{t(FoldersI18nKey.RemoveUnitSubunits)}</p>
            <ul className="list-disc pl-6">
              {subUnits.map((subUnit) => (
                <li key={subUnit.id}>{subUnit.displayName || subUnit.name}</li>
              ))}
            </ul>
          </div>
        )}
        {blockMessage && (
          <p role="alert" className="text-error">
            {blockMessage}
          </p>
        )}
      </div>
    </ConfirmationPopup>
  );
};

export default RemoveUnitModal;
