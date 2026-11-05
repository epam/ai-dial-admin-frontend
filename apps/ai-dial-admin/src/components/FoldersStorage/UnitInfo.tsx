'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { Button, ButtonVariant, EllipsisTooltip, NoDataContent, Spinner } from '@epam/ai-dial-ui-kit';
import { IconSitemap } from '@tabler/icons-react';

import ChangedEntityButtons from '@/src/components/EntityHeaderControls/Buttons/ChangedEntityButtons';
import { LARGE_ICON_SIZE } from '@/src/components/FoldersStorage/constants';
import RemoveUnitModal from '@/src/components/FoldersStorage/Modals/RemoveUnitModal';
import RenameUnitModal from '@/src/components/FoldersStorage/Modals/RenameUnitModal';
import { RolesCardStatus } from '@/src/components/FoldersStorage/models';
import NewUnitButton from '@/src/components/FoldersStorage/NewUnitButton';
import UnitRolesCard from '@/src/components/FoldersStorage/UnitRolesCard';
import { useUnitRolesDraft } from '@/src/components/FoldersStorage/use-unit-roles-draft';
import { ActionMenuOperationI18nKey, ErrorI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useOrgUnits } from '@/src/context/OrgUnitsContext';
import { useRuleFolder } from '@/src/context/RuleFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialFileNodeType } from '@/src/models/dial/file';
import { DialFolder } from '@/src/models/dial/folder';
import { OrgUnit } from '@/src/models/dial/org-unit';
import { UnitAction, UnitNamespace } from '@/src/models/user-access';
import { getFolderNameAndPath } from '@/src/utils/files/path';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { hasActionAt } from '@/src/utils/org-units/access';
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
  const { isUnitMode, userAccess } = useAppContext();
  const hasUnitAction = (namespace: UnitNamespace, action: UnitAction) =>
    !isUnitMode || hasActionAt(userAccess.units, namespace, action, unit.folder);
  const canReadRoles = hasUnitAction(UnitNamespace.ROLE_ASSIGNMENTS, UnitAction.READ);
  const isRolesReadonly = isReadonly || !hasUnitAction(UnitNamespace.ROLE_ASSIGNMENTS, UnitAction.WRITE);
  const isUnitReadonly = isReadonly || !hasUnitAction(UnitNamespace.ORG_UNITS, UnitAction.WRITE);
  const draft = useUnitRolesDraft(unit.path, canReadRoles);
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
        : getErrorNotification(
            t(ErrorI18nKey.Error),
            [t(FoldersI18nKey.RolesSaveFailed), result.errorMessage].filter(Boolean).join(' '),
          ),
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
          <IconSitemap size={LARGE_ICON_SIZE} className="shrink-0 text-secondary" aria-hidden />
          <div className="flex min-w-0 flex-col">
            <h2 className="min-w-0">
              <EllipsisTooltip contentClassName="truncate" text={unit.name} />
            </h2>
            {unit.displayName && (
              <span className="dial-small-text text-secondary min-w-0">
                <EllipsisTooltip contentClassName="truncate" text={unit.displayName} />
              </span>
            )}
          </div>
        </div>
        {!isRolesReadonly && draft.isChanged ? (
          <ChangedEntityButtons onDiscard={draft.discard} onSave={onSave} disableSave={draft.isSaving} />
        ) : (
          !isUnitReadonly && (
            <div className="flex flex-row gap-3">
              <NewUnitButton />
              <Button
                variant={ButtonVariant.Neutral}
                label={t(ActionMenuOperationI18nKey.Rename)}
                onClick={() => setIsRenaming(true)}
              />
              <Button
                variant={ButtonVariant.Danger}
                label={t(FoldersI18nKey.RemoveUnit)}
                onClick={() => setIsRemoving(true)}
              />
            </div>
          )
        )}
      </div>
      {draft.status !== RolesCardStatus.FORBIDDEN && <h3>{t(FoldersI18nKey.UnitRoles)}</h3>}
      {draft.status === RolesCardStatus.LOADING && <Spinner size={40} fullWidth />}
      {draft.status === RolesCardStatus.ERROR && <NoDataContent title={t(FoldersI18nKey.UnitRolesLoadError)} />}
      {draft.status === RolesCardStatus.READY && (
        <UnitRolesCard
          roles={draft.roles}
          holders={draft.draft}
          groupClaim={groupClaim}
          isReadonly={isRolesReadonly}
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
