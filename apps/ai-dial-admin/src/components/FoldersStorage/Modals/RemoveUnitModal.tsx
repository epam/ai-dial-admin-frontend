'use client';

import { FC, useCallback, useState } from 'react';

import {
  Button,
  ButtonVariant,
  ConfirmationPopup,
  ConfirmationPopupVariant,
  EllipsisTooltip,
} from '@epam/ai-dial-ui-kit';

import { deleteOrgUnit, removeFolderMarkers } from '@/src/app/[lang]/folders-storage/actions';
import { ButtonsI18nKey, ErrorI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { OrgUnit } from '@/src/models/dial/org-unit';
import { ServerActionResponse } from '@/src/models/server-action';
import { getErrorNotification } from '@/src/utils/notification';
import {
  OrgUnitErrorKind,
  getContentItemName,
  isFilesMarkerUrl,
  isFolderMarkerUrl,
  mapOrgUnitError,
  parseUnitContentBlock,
  toFilePath,
} from '@/src/utils/org-units/errors';

interface Props {
  unit: OrgUnit;
  /** Units below `unit`, listed so the user sees everything the call removes. */
  subUnits: OrgUnit[];
  onClose: () => void;
  onRemoved: () => void;
}

// Core lists up to three items per refusal, so a unit with many markers needs a few passes.
const MAX_MARKER_SWEEPS = 5;

const FOOTER_CLASS_NAME = 'flex justify-end gap-2 px-6 py-4 border-t border-tertiary';

const RemoveUnitModal: FC<Props> = ({ unit, subUnits, onClose, onRemoved }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const [isRemoving, setIsRemoving] = useState(false);
  const [blockMessage, setBlockMessage] = useState<string>();
  const [blockingContent, setBlockingContent] = useState<string[]>();

  // Core refuses a unit holding only its `.dial_folder` markers on older backends; delete them and retry.
  const deleteUnitWithoutMarkers = useCallback(async (): Promise<ServerActionResponse> => {
    let res = await deleteOrgUnit(unit.path, true);
    for (let sweep = 0; sweep < MAX_MARKER_SWEEPS && !res.success; sweep++) {
      const markers = parseUnitContentBlock(res.errorMessage)?.filter(isFilesMarkerUrl);
      if (!markers?.length || !(await removeFolderMarkers(markers.map(toFilePath))).success) {
        break;
      }
      res = await deleteOrgUnit(unit.path, true);
    }
    return res;
  }, [unit.path]);

  const onConfirm = useCallback(async () => {
    setIsRemoving(true);
    try {
      const res = await deleteUnitWithoutMarkers();
      if (res.success) {
        onRemoved();
        return;
      }
      if (mapOrgUnitError(res).kind === OrgUnitErrorKind.FIELD) {
        const content = parseUnitContentBlock(res.errorMessage)?.filter((url) => !isFolderMarkerUrl(url));
        if (content?.length) {
          setBlockingContent(content.map(getContentItemName));
        } else {
          setBlockMessage(res.errorMessage);
        }
        return;
      }
      showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
    } catch {
      showNotification(getErrorNotification(t(ErrorI18nKey.SystemUnavailable), t(ErrorI18nKey.TryAgainLater)));
    } finally {
      setIsRemoving(false);
    }
  }, [deleteUnitWithoutMarkers, onRemoved, showNotification, t]);

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
      footer={
        blockingContent && (
          <div className={FOOTER_CLASS_NAME}>
            <Button variant={ButtonVariant.Neutral} label={t(ButtonsI18nKey.Close)} onClick={onClose} />
          </div>
        )
      }
      description={
        <div className="flex flex-col gap-y-3">
          <span>{t(FoldersI18nKey.RemoveUnitDescription)}</span>
          <div className="flex flex-col gap-y-1 bg-layer-4 rounded px-4 py-3">
            <div className="flex flex-row items-center gap-x-1 text-primary dial-small">
              <span className="shrink-0 text-secondary">{t(FoldersI18nKey.UnitName)}:</span>
              <EllipsisTooltip text={unit.name} />
            </div>
            {unit.displayName && (
              <div className="flex flex-row items-center gap-x-1 text-primary dial-small">
                <span className="shrink-0 text-secondary">{t(FoldersI18nKey.UnitDisplayName)}:</span>
                <EllipsisTooltip text={unit.displayName} />
              </div>
            )}
          </div>
          {subUnits.length > 0 && (
            <div className="flex flex-col gap-1">
              <span>{t(FoldersI18nKey.RemoveUnitSubunits)}</span>
              <ul className="list-disc pl-6">
                {subUnits.map((subUnit) => (
                  <li key={subUnit.id}>{subUnit.name}</li>
                ))}
              </ul>
            </div>
          )}
          {blockingContent && (
            <div role="alert" className="flex flex-col gap-y-1">
              <span className="text-error">{t(FoldersI18nKey.RemoveUnitHoldsContent)}</span>
              <ul className="flex flex-col gap-y-1 bg-layer-4 rounded px-4 py-3 text-primary dial-small">
                {blockingContent.map((name) => (
                  <li key={name}>
                    <EllipsisTooltip text={name} />
                  </li>
                ))}
              </ul>
              <span className="text-error">{t(FoldersI18nKey.RemoveUnitDeleteOrMove)}</span>
            </div>
          )}
          {blockMessage && (
            <span role="alert" className="text-error">
              {blockMessage}
            </span>
          )}
        </div>
      }
    />
  );
};

export default RemoveUnitModal;
