'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import {
  Button,
  ButtonVariant,
  EllipsisTooltip,
  NoDataContent,
  Spinner,
  Tag,
  TagAppearance,
} from '@epam/ai-dial-ui-kit';

import RemoveUnitModal from '@/src/components/FoldersStorage/Modals/RemoveUnitModal';
import RenameUnitModal from '@/src/components/FoldersStorage/Modals/RenameUnitModal';
import NewUnitButton from '@/src/components/FoldersStorage/NewUnitButton';
import { RolesCardStatus } from '@/src/components/FoldersStorage/models';
import UnitRolesCard from '@/src/components/FoldersStorage/UnitRolesCard';
import { useUnitRolesDraft } from '@/src/components/FoldersStorage/use-unit-roles-draft';
import ChangedEntityButtons from '@/src/components/EntityHeaderControls/Buttons/ChangedEntityButtons';
import { ActionMenuOperationI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useOrgUnits } from '@/src/context/OrgUnitsContext';
import { useRuleFolder } from '@/src/context/RuleFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialFileNodeType } from '@/src/models/dial/file';
import { DialFolder } from '@/src/models/dial/folder';
import { OrgUnit } from '@/src/models/dial/org-unit';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getFolderNameAndPath } from '@/src/utils/files/path';
import { getUnitWithDescendants, normalizeFolder } from '@/src/utils/org-units/units';

interface Props {
  unit: OrgUnit;
  isReadonly?: boolean;
}

const UnitInfo: FC<Props> = ({ unit, isReadonly }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const { fetchFiles, toggleFolder } = useRuleFolder();
  const { units, groupClaim, refreshUnits } = useOrgUnits();
  const draft = useUnitRolesDraft(unit.path);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const subUnits = useMemo(
    () => getUnitWithDescendants(units, unit.folder).filter((item) => item.id !== unit.id),
    [units, unit],
  );

  const onSave = useCallback(async () => {
    const result = await draft.save();
    showNotification(
      result.isSuccess
        ? getSuccessNotification(t(FoldersI18nKey.RolesSaved))
        : getErrorNotification(t(FoldersI18nKey.RolesSaveFailed), result.errorMessage),
    );
  }, [draft, showNotification, t]);

  const onRenamed = useCallback(async () => {
    setIsRenaming(false);
    await refreshUnits();
    showNotification(getSuccessNotification(t(FoldersI18nKey.UnitRenamed)));
  }, [refreshUnits, showNotification, t]);

  const onRemoved = useCallback(async () => {
    setIsRemoving(false);
    const { path } = getFolderNameAndPath(normalizeFolder(unit.folder));
    const parentFolder = normalizeFolder(path);
    await refreshUnits();
    fetchFiles(parentFolder);
    toggleFolder({ path: parentFolder, nodeType: DialFileNodeType.FOLDER } as DialFolder, true);
    showNotification(getSuccessNotification(t(FoldersI18nKey.UnitRemoved)));
  }, [unit.folder, refreshUnits, fetchFiles, toggleFolder, showNotification, t]);

  return (
    <div className="size-full min-w-0 bg-layer-3 rounded p-4 flex flex-col gap-4 overflow-hidden">
      <div className="flex flex-wrap justify-between items-center w-full gap-3">
        <div className="flex flex-1 min-w-0 items-center gap-3">
          <h2 className="min-w-0">
            <EllipsisTooltip contentClassName="truncate" text={unit.displayName || unit.name} />
          </h2>
          <Tag label={t(FoldersI18nKey.UnitBadge)} appearance={TagAppearance.Bordered} />
        </div>
        {!isReadonly &&
          (draft.isChanged ? (
            <ChangedEntityButtons onDiscard={draft.discard} onSave={onSave} disableSave={draft.isSaving} />
          ) : (
            <div className="flex flex-row gap-3">
              <NewUnitButton />
              <Button
                variant={ButtonVariant.Neutral}
                label={t(ActionMenuOperationI18nKey.Rename)}
                onClick={() => setIsRenaming(true)}
              />
              <Button
                variant={ButtonVariant.Neutral}
                label={t(FoldersI18nKey.RemoveUnit)}
                onClick={() => setIsRemoving(true)}
              />
            </div>
          ))}
      </div>
      {draft.status !== RolesCardStatus.FORBIDDEN && <h3>{t(FoldersI18nKey.UnitRoles)}</h3>}
      {draft.status === RolesCardStatus.LOADING && <Spinner size={40} fullWidth />}
      {draft.status === RolesCardStatus.ERROR && <NoDataContent title={t(FoldersI18nKey.UnitRolesLoadError)} />}
      {draft.status === RolesCardStatus.READY && (
        <UnitRolesCard
          roles={draft.roles}
          holders={draft.draft}
          groupClaim={groupClaim}
          isReadonly={isReadonly}
          onAdd={draft.addHolder}
          onRemove={draft.removeHolder}
        />
      )}
      {isRenaming && <RenameUnitModal unit={unit} onClose={() => setIsRenaming(false)} onRenamed={onRenamed} />}
      {isRemoving && (
        <RemoveUnitModal unit={unit} subUnits={subUnits} onClose={() => setIsRemoving(false)} onRemoved={onRemoved} />
      )}
    </div>
  );
};

export default UnitInfo;
