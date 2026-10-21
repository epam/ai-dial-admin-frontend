'use client';

import {
  Button,
  ButtonAppearance,
  ButtonVariant,
  Notification,
  NotificationType,
  NotificationVariant,
  RadioGroup,
  Select,
  Switch,
} from '@epam/ai-dial-ui-kit';
import { FC, useMemo, useState } from 'react';

import Drawer from '@/src/components/Common/Drawer/Drawer';
import PrivilegeCard from '@/src/components/Analytics/Tables/access/PrivilegeCard';
import RowLimitEditor, { RowLimitValue } from '@/src/components/Analytics/Tables/access/RowLimitEditor';
import { MARKED_PRIVILEGES, SYSTEM_LOCKED_PRIVILEGES } from '@/src/components/Analytics/Tables/access/constants';
import { DrawerPhase, RoleSelection, RowsMode } from '@/src/components/Analytics/Tables/access/models';
import { findNamedField } from '@/src/components/Analytics/Tables/access/row-limit';
import { TableAccessState } from '@/src/components/Analytics/Tables/access/use-table-access';
import { useRoleCatalog } from '@/src/components/Analytics/Tables/access/use-role-catalog';
import {
  hasAnyPrivilege,
  isGetHeld,
  isRowsStepOffered,
  isSensitiveStepOffered,
  selectionFromAccess,
} from '@/src/components/Analytics/Tables/access/utils';
import { AnalyticsTableAccessI18nKey, AnalyticsTablesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { AnalyticsTableColumn, IneffectiveGrant, TableGrantKey } from '@/src/models/analytics/table';
import { getSuccessNotification } from '@/src/utils/notification';

interface Props {
  tableName: string;
  columns: AnalyticsTableColumn[];
  isSystem: boolean;
  access: TableAccessState;
  // The role being edited, or null to add one.
  role: string | null;
  onClose: () => void;
}

const HEADING = 'dial-tiny-lead-semi-text';
const roleHeading = `${HEADING} text-accent`;
const accessHeading = `${HEADING} text-brown-1`;
const sensitiveHeading = `${HEADING} text-accent-tertiary`;
const rowsHeading = `${HEADING} text-accent-secondary`;

const RoleDrawer: FC<Props> = ({ tableName, columns, isSystem, access, role: editedRole, onClose }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const isNew = editedRole === null;
  const { roles: catalogRoles, isLoading: isCatalogLoading } = useRoleCatalog(isNew);

  const [role, setRole] = useState(editedRole ?? '');
  const [selection, setSelection] = useState<RoleSelection>(() => selectionFromAccess(access.access, editedRole ?? ''));
  const [rowsMode, setRowsMode] = useState<RowsMode>(
    editedRole && access.policies[editedRole] ? RowsMode.Some : RowsMode.All,
  );
  const [rowLimit, setRowLimit] = useState<RowLimitValue>({
    filter: access.policies[editedRole ?? '']?.filter ?? null,
    isComplete: true,
  });
  const [phase, setPhase] = useState<DrawerPhase>(DrawerPhase.Editing);
  const [ineffectiveGrants, setIneffectiveGrants] = useState<IneffectiveGrant[]>([]);
  const [rowLimitError, setRowLimitError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  const isLocked = phase !== DrawerPhase.Editing;
  const isRowsOffered = isRowsStepOffered(selection);
  const isRowLimitSet = isRowsOffered && rowsMode === RowsMode.Some;
  const sensitiveColumns = columns.filter((column) => column.sensitive).map((column) => column.name);

  const roleOptions = useMemo(() => {
    const taken = new Set(access.rows.map((row) => row.role));

    return catalogRoles.filter((name) => !taken.has(name)).map((name) => ({ value: name, label: name }));
  }, [catalogRoles, access.rows]);

  const canSave =
    !isSaving &&
    !!role &&
    (hasAnyPrivilege(selection) || isRowLimitSet) &&
    (!isRowLimitSet || (!!rowLimit.filter && rowLimit.isComplete));

  const highlightedField = useMemo(
    () => findNamedField(rowLimitError, rowLimit.filter),
    [rowLimitError, rowLimit.filter],
  );

  const onToggle = (key: TableGrantKey) => (isSelected: boolean) =>
    setSelection((prev) => ({ ...prev, [key]: isSelected }));

  const onSaveRowLimit = async (): Promise<boolean> => {
    if (!selection.read) return true;

    const res = await access.saveRowPolicy(role, rowsMode === RowsMode.Some ? rowLimit.filter : null);
    if (res.isOk) return true;

    setRowLimitError(res.errorMessage);
    setPhase(DrawerPhase.RowLimitFailed);

    return false;
  };

  const onSave = async () => {
    setIsSaving(true);
    setRowLimitError(undefined);

    if (phase === DrawerPhase.RowLimitFailed) {
      const isSaved = await onSaveRowLimit();
      setIsSaving(false);
      if (isSaved) {
        showNotification(getSuccessNotification(t(AnalyticsTableAccessI18nKey.RowLimitSaved)));
        onClose();
      }
      return;
    }

    const grants = await access.saveGrants(role, selection);
    if (!grants.isOk) {
      setIsSaving(false);
      return;
    }

    const isRowLimitSaved = await onSaveRowLimit();
    setIsSaving(false);
    if (!isRowLimitSaved) return;

    const ineffective = grants.result?.ineffective_grants ?? [];
    if (ineffective.length) {
      setIneffectiveGrants(ineffective);
      setPhase(DrawerPhase.GrantsSavedWithBanner);
      return;
    }

    showNotification(getSuccessNotification(t(AnalyticsTablesI18nKey.AccessSaved)));
    onClose();
  };

  const banners = (keys: TableGrantKey[]) =>
    ineffectiveGrants
      .filter((grant) => keys.includes(grant.key))
      .map((grant) => (
        <Notification
          key={`${grant.key}:${grant.reason}`}
          role="status"
          type={NotificationType.SectionMessage}
          variant={NotificationVariant.Warning}
          message={grant.message}
        />
      ));

  const primary =
    phase === DrawerPhase.GrantsSavedWithBanner ? (
      <Button variant={ButtonVariant.Primary} label={t(AnalyticsTableAccessI18nKey.Done)} onClick={onClose} />
    ) : (
      <Button
        variant={ButtonVariant.Primary}
        label={t(
          phase === DrawerPhase.RowLimitFailed
            ? AnalyticsTableAccessI18nKey.SaveRowLimit
            : AnalyticsTableAccessI18nKey.SaveRole,
        )}
        disabled={!canSave}
        onClick={() => void onSave()}
      />
    );

  return (
    <Drawer
      isOpen
      ariaLabel={
        isNew ? t(AnalyticsTableAccessI18nKey.DrawerAddTitle) : t(AnalyticsTableAccessI18nKey.DrawerLabel, { role })
      }
      header={
        <div className="flex flex-col">
          <span className="dial-h3-text">
            {t(isNew ? AnalyticsTableAccessI18nKey.DrawerAddTitle : AnalyticsTableAccessI18nKey.DrawerEditTitle)}
          </span>
          <span className="dial-small-text text-secondary">
            {t(isNew ? AnalyticsTableAccessI18nKey.DrawerAddSubtitle : AnalyticsTableAccessI18nKey.DrawerEditSubtitle, {
              table: tableName,
            })}
          </span>
        </div>
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button
            variant={ButtonVariant.Neutral}
            appearance={ButtonAppearance.Outlined}
            label={t(ButtonsI18nKey.Cancel)}
            onClick={onClose}
          />
          {primary}
        </div>
      }
      onClose={onClose}
    >
      <section className="flex flex-col gap-2">
        <h3 className={roleHeading}>{t(AnalyticsTableAccessI18nKey.StepRole)}</h3>
        {isNew ? (
          <Select
            ariaLabel={t(AnalyticsTableAccessI18nKey.StepRole)}
            placeholder={t(AnalyticsTableAccessI18nKey.RolePlaceholder)}
            options={roleOptions}
            value={role}
            searchable
            disabled={isLocked || isCatalogLoading}
            onChange={(next) => setRole(next as string)}
          />
        ) : (
          <span className="rounded-xl bg-layer-4 px-3 py-2.5 dial-small-text">{role}</span>
        )}
      </section>

      {!!role && (
        <>
          <section className="flex flex-col gap-2">
            <h3 className={accessHeading}>{t(AnalyticsTableAccessI18nKey.StepAccess)}</h3>
            <div className="grid grid-cols-2 gap-2">
              {MARKED_PRIVILEGES.map(({ key, label }) => {
                const isGet = key === TableGrantKey.Get;
                const isImplied = isGet && !selection.get && (selection.read || selection.modify);
                const isSystemLocked = isSystem && SYSTEM_LOCKED_PRIVILEGES.includes(key);

                return (
                  <PrivilegeCard
                    key={key}
                    label={t(label)}
                    isSelected={isGet ? isGetHeld(selection) : selection[key] && !isSystemLocked}
                    isDisabled={isLocked || isSystemLocked || isImplied}
                    caption={
                      isImplied
                        ? t(AnalyticsTableAccessI18nKey.ViaPrivilege, {
                            privilege: t(
                              selection.read
                                ? AnalyticsTableAccessI18nKey.ColRead
                                : AnalyticsTableAccessI18nKey.ColModify,
                            ),
                          })
                        : undefined
                    }
                    onChange={onToggle(key)}
                  >
                    {key === TableGrantKey.Read && banners([TableGrantKey.Read])}
                  </PrivilegeCard>
                );
              })}
            </div>
            {isSystem && (
              <p className="dial-small-text text-secondary">{t(AnalyticsTableAccessI18nKey.SystemLockReason)}</p>
            )}
            {banners([TableGrantKey.Get, TableGrantKey.Write, TableGrantKey.Modify])}
          </section>

          {isSensitiveStepOffered(selection) && (
            <section className="flex flex-col gap-2">
              <h3 className={sensitiveHeading}>{t(AnalyticsTableAccessI18nKey.StepSensitive)}</h3>
              <div className="rounded-xl bg-layer-4 p-3">
                <Switch
                  labelProps={{ label: t(AnalyticsTableAccessI18nKey.SensitiveSwitchLabel) }}
                  caption={
                    sensitiveColumns.length
                      ? t(AnalyticsTableAccessI18nKey.SensitiveIncludes, { columns: sensitiveColumns.join(', ') })
                      : t(AnalyticsTableAccessI18nKey.SensitiveNoColumns)
                  }
                  isOn={selection.sensitive}
                  disabled={isLocked}
                  onChange={onToggle(TableGrantKey.Sensitive)}
                />
              </div>
              <p className="dial-tiny-text text-secondary">{t(AnalyticsTableAccessI18nKey.SensitiveScope)}</p>
              {banners([TableGrantKey.Sensitive])}
            </section>
          )}

          {isRowsOffered && (
            <section className="flex flex-col gap-2">
              <h3 className={rowsHeading}>{t(AnalyticsTableAccessI18nKey.StepRows)}</h3>
              <RadioGroup
                ariaLabel={t(AnalyticsTableAccessI18nKey.StepRows)}
                value={rowsMode}
                items={[
                  { value: RowsMode.All, label: t(AnalyticsTableAccessI18nKey.RowsAll) },
                  { value: RowsMode.Some, label: t(AnalyticsTableAccessI18nKey.RowsSome) },
                ]}
                onChange={(next) => setRowsMode(next as RowsMode)}
              />
              <p className="dial-tiny-text text-secondary">{t(AnalyticsTableAccessI18nKey.RowsScope)}</p>
              {rowsMode === RowsMode.Some && (
                <RowLimitEditor
                  key={role}
                  tableName={tableName}
                  columns={columns}
                  initialFilter={access.policies[role]?.filter ?? null}
                  highlightedField={highlightedField}
                  onChange={setRowLimit}
                />
              )}
              {phase === DrawerPhase.RowLimitFailed && (
                <p role="status" className="dial-small-text text-secondary">
                  {t(AnalyticsTableAccessI18nKey.RowLimitPending)}
                </p>
              )}
            </section>
          )}
        </>
      )}
    </Drawer>
  );
};

export default RoleDrawer;
