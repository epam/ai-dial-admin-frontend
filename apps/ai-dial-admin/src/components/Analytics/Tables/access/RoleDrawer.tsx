'use client';

import {
  Button,
  ButtonAppearance,
  ButtonVariant,
  ConfirmationPopup,
  ConfirmationPopupVariant,
  Notification,
  NotificationType,
  NotificationVariant,
  RadioGroup,
  Select,
  Switch,
} from '@epam/ai-dial-ui-kit';
import { FC, useMemo, useState } from 'react';

import Drawer from '@/src/components/Common/Drawer/Drawer';
import ColumnLimitStep from '@/src/components/Analytics/Tables/access/ColumnLimitStep';
import PrivilegeCard from '@/src/components/Analytics/Tables/access/PrivilegeCard';
import RowLimitEditor, { RowLimitValue } from '@/src/components/Analytics/Tables/access/RowLimitEditor';
import {
  EVERYONE_ROLE,
  MARKED_PRIVILEGES,
  SYSTEM_LOCKED_PRIVILEGES,
} from '@/src/components/Analytics/Tables/access/constants';
import {
  AccessChangeOutcome,
  ColumnsMode,
  DrawerPhase,
  MarkedPrivilege,
  RoleSelection,
  RowsMode,
} from '@/src/components/Analytics/Tables/access/models';
import { findNamedField } from '@/src/components/Analytics/Tables/access/row-limit';
import { TableAccessState } from '@/src/components/Analytics/Tables/access/use-table-access';
import { useRoleCatalog } from '@/src/components/Analytics/Tables/access/use-role-catalog';
import {
  buildEntry,
  hasAnyPrivilege,
  isColumnsStepOffered,
  isGetHeld,
  isOpenToEveryone,
  isRowsStepOffered,
  isSensitiveStepOffered,
  roleLabel,
  selectionFromEntry,
} from '@/src/components/Analytics/Tables/access/utils';
import {
  AnalyticsTableAccessI18nKey,
  AnalyticsTablesI18nKey,
  BasicI18nKey,
  ButtonsI18nKey,
} from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import {
  AnalyticsTable,
  AnalyticsTableColumn,
  IneffectiveGrant,
  TableAccessEntry,
  TableGrantKey,
} from '@/src/models/analytics/table';
import { CONFIG_ENTITY_ORIGIN_LABEL } from '@/src/utils/config-entities/source-column';
import { getSuccessNotification } from '@/src/utils/notification';

interface Props {
  tableName: string;
  columns: AnalyticsTableColumn[];
  isSystem: boolean;
  isEnrichment: boolean;
  enrichments: AnalyticsTable[];
  hasEnrichmentsFailed: boolean;
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

const ENRICHMENT_LOCKED_PRIVILEGES: MarkedPrivilege[] = [TableGrantKey.Get, TableGrantKey.Read];

const initialSelection = (entry: TableAccessEntry | undefined, isEnrichment: boolean): RoleSelection => {
  const selection = selectionFromEntry(entry);

  return isEnrichment ? { ...selection, get: false, read: false, sensitive: false } : selection;
};

const RoleDrawer: FC<Props> = ({
  tableName,
  columns,
  isSystem,
  isEnrichment,
  enrichments,
  hasEnrichmentsFailed,
  access,
  role: editedRole,
  onClose,
}) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const isNew = editedRole === null;
  const { roles: catalogRoles, isLoading: isCatalogLoading } = useRoleCatalog(isNew);

  const [role, setRole] = useState(editedRole ?? '');
  const [stored, setStored] = useState<TableAccessEntry | undefined>(access.roles[editedRole ?? '']);
  const [selection, setSelection] = useState<RoleSelection>(() => initialSelection(stored, isEnrichment));
  const [rowsMode, setRowsMode] = useState<RowsMode>(stored?.rows ? RowsMode.Some : RowsMode.All);
  const [rowLimit, setRowLimit] = useState<RowLimitValue>({ filter: stored?.rows?.filter ?? null, isComplete: true });
  const [columnsMode, setColumnsMode] = useState<ColumnsMode>(stored?.columns ? ColumnsMode.Some : ColumnsMode.All);
  const [limitedColumns, setLimitedColumns] = useState<string[]>(stored?.columns ?? []);
  const [resetCount, setResetCount] = useState(0);
  const [phase, setPhase] = useState<DrawerPhase>(DrawerPhase.Editing);
  const [ineffectiveGrants, setIneffectiveGrants] = useState<IneffectiveGrant[]>([]);
  const [rowLimitError, setRowLimitError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const isLocked = phase !== DrawerPhase.Editing;
  const isEveryone = role === EVERYONE_ROLE;
  const everyoneLabel = t(AnalyticsTableAccessI18nKey.EveryoneLabel);
  const displayedRole = roleLabel(role, everyoneLabel);
  const isRowsOffered = isRowsStepOffered(selection, isEnrichment);
  const isRowLimitSet = isRowsOffered && rowsMode === RowsMode.Some;
  const isColumnsOffered = isColumnsStepOffered(selection, isEnrichment);
  const isColumnLimitSet = isColumnsOffered && columnsMode === ColumnsMode.Some;
  const sensitiveColumns = columns.filter((column) => column.sensitive).map((column) => column.name);

  const roleOptions = useMemo(() => {
    const taken = new Set(access.rows.map((row) => row.role));
    const everyone =
      taken.has(EVERYONE_ROLE) && role !== EVERYONE_ROLE
        ? []
        : [
            {
              value: EVERYONE_ROLE,
              label: everyoneLabel,
              description: t(AnalyticsTableAccessI18nKey.EveryoneDescription),
            },
          ];

    return [
      ...everyone,
      ...catalogRoles
        .filter(({ name }) => name !== EVERYONE_ROLE && (name === role || !taken.has(name)))
        .map(({ name, origin }) => ({ value: name, label: name, description: CONFIG_ENTITY_ORIGIN_LABEL[origin] })),
    ];
  }, [catalogRoles, access.rows, role, everyoneLabel, t]);

  const locks = [
    { isOn: isSystem, keys: SYSTEM_LOCKED_PRIVILEGES, reason: AnalyticsTableAccessI18nKey.SystemLockReason },
    {
      isOn: isEveryone && !isSystem,
      keys: SYSTEM_LOCKED_PRIVILEGES,
      reason: AnalyticsTableAccessI18nKey.EveryoneLockReason,
    },
    {
      isOn: isEnrichment,
      keys: ENRICHMENT_LOCKED_PRIVILEGES,
      reason: AnalyticsTableAccessI18nKey.EnrichmentLockReason,
    },
  ].filter((lock) => lock.isOn);
  const lockedPrivileges = locks.flatMap((lock) => lock.keys);

  const onChangeRole = (next: string) => {
    setRole(next);
    if (next === EVERYONE_ROLE) setSelection((prev) => ({ ...prev, write: false, modify: false }));
  };

  const canSave =
    !isSaving &&
    !!role &&
    (hasAnyPrivilege(selection) || isRowLimitSet || isColumnLimitSet) &&
    (!isRowLimitSet || (!!rowLimit.filter && rowLimit.isComplete)) &&
    (!isColumnLimitSet || limitedColumns.length > 0);

  const highlightedField = useMemo(
    () => findNamedField(rowLimitError, rowLimit.filter),
    [rowLimitError, rowLimit.filter],
  );

  const onToggle = (key: TableGrantKey) => (isSelected: boolean) =>
    setSelection((prev) => ({ ...prev, [key]: isSelected }));

  const send = async () => {
    setIsSaving(true);
    setRowLimitError(undefined);

    const res = await access.saveEntry(
      role,
      buildEntry(
        stored,
        { selection, rowsMode, filter: rowLimit.filter, columnsMode, columns: limitedColumns },
        isEnrichment,
      ),
    );
    setIsSaving(false);

    if (res.outcome === AccessChangeOutcome.Conflict) {
      setPhase(DrawerPhase.Conflict);
      return;
    }
    if (res.outcome === AccessChangeOutcome.Failed) {
      setRowLimitError(res.errorMessage);
      return;
    }

    const ineffective = res.result?.ineffective_grants ?? [];
    if (ineffective.length) {
      setIneffectiveGrants(ineffective);
      setPhase(DrawerPhase.SavedWithBanner);
      return;
    }

    showNotification(getSuccessNotification(t(AnalyticsTablesI18nKey.AccessSaved)));
    onClose();
  };

  const onSave = () => {
    if (isEveryone && isRowsOffered && rowsMode === RowsMode.All && !isOpenToEveryone(stored)) {
      setIsConfirmOpen(true);
      return;
    }

    void send();
  };

  const onReload = async () => {
    setIsSaving(true);
    const config = await access.reload();
    setIsSaving(false);
    if (!config) return;

    const fresh = config.roles[role];
    setStored(fresh);
    setSelection(initialSelection(fresh, isEnrichment));
    setRowsMode(fresh?.rows ? RowsMode.Some : RowsMode.All);
    setRowLimit({ filter: fresh?.rows?.filter ?? null, isComplete: true });
    setColumnsMode(fresh?.columns ? ColumnsMode.Some : ColumnsMode.All);
    setLimitedColumns(fresh?.columns ?? []);
    setRowLimitError(undefined);
    setResetCount((count) => count + 1);
    setPhase(DrawerPhase.Editing);
  };

  const banners = (keys: TableGrantKey[]) =>
    ineffectiveGrants
      .filter((grant) => grant.role === role && keys.includes(grant.key))
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
    phase === DrawerPhase.SavedWithBanner ? (
      <Button variant={ButtonVariant.Primary} label={t(AnalyticsTableAccessI18nKey.Done)} onClick={onClose} />
    ) : (
      <Button
        variant={ButtonVariant.Primary}
        label={t(AnalyticsTableAccessI18nKey.SaveRole)}
        disabled={!canSave || phase === DrawerPhase.Conflict}
        onClick={onSave}
      />
    );

  return (
    <Drawer
      isOpen
      ariaLabel={
        isNew
          ? t(AnalyticsTableAccessI18nKey.DrawerAddTitle)
          : t(AnalyticsTableAccessI18nKey.DrawerLabel, { role: displayedRole })
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
      {phase === DrawerPhase.Conflict && (
        <Notification
          role="alert"
          type={NotificationType.SectionMessage}
          variant={NotificationVariant.Error}
          message={t(AnalyticsTableAccessI18nKey.ConflictMessage)}
          action={
            <Button
              variant={ButtonVariant.Neutral}
              appearance={ButtonAppearance.Outlined}
              label={t(AnalyticsTableAccessI18nKey.ReloadRole)}
              disabled={isSaving}
              onClick={() => void onReload()}
            />
          }
        />
      )}

      <section className="flex flex-col gap-2">
        <h3 className={roleHeading}>{t(AnalyticsTableAccessI18nKey.StepRole)}</h3>
        {isNew ? (
          <Select
            ariaLabel={t(AnalyticsTableAccessI18nKey.StepRole)}
            placeholder={t(AnalyticsTableAccessI18nKey.RolePlaceholder)}
            options={roleOptions}
            value={role}
            searchable
            caption={isCatalogLoading ? t(BasicI18nKey.Loading) : undefined}
            disabled={isLocked}
            onChange={(next) => onChangeRole(next as string)}
          />
        ) : (
          <span className="rounded-xl bg-layer-4 px-3 py-2.5 dial-small-text">{displayedRole}</span>
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
                const isPrivilegeLocked = lockedPrivileges.includes(key);

                return (
                  <PrivilegeCard
                    key={key}
                    label={t(label)}
                    isSelected={isGet ? isGetHeld(selection) : selection[key] && !isPrivilegeLocked}
                    isDisabled={isLocked || isPrivilegeLocked || isImplied}
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
                  />
                );
              })}
            </div>
            {locks.map((lock) => (
              <p key={lock.reason} className="dial-small-text text-secondary">
                {t(lock.reason)}
              </p>
            ))}
            {banners([TableGrantKey.Get, TableGrantKey.Read, TableGrantKey.Write, TableGrantKey.Modify])}
          </section>

          {isSensitiveStepOffered(selection, isEnrichment) && (
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
              {isEveryone && rowsMode === RowsMode.All && phase === DrawerPhase.Editing && (
                <Notification
                  role="status"
                  type={NotificationType.SectionMessage}
                  variant={NotificationVariant.Warning}
                  message={t(AnalyticsTableAccessI18nKey.EveryoneAllRowsWarning)}
                />
              )}
              {rowsMode === RowsMode.Some && (
                <>
                  <RowLimitEditor
                    key={`${role}:${resetCount}`}
                    tableName={tableName}
                    columns={columns}
                    initialFilter={stored?.rows?.filter ?? null}
                    highlightedField={highlightedField}
                    onChange={setRowLimit}
                  />
                  {!isColumnLimitSet && (
                    <p className="dial-tiny-text text-secondary">{t(AnalyticsTableAccessI18nKey.DerivedTablesNote)}</p>
                  )}
                </>
              )}
            </section>
          )}

          {isColumnsOffered && (
            <ColumnLimitStep
              stepNumber={isRowsOffered ? 5 : 4}
              columns={columns}
              enrichments={enrichments}
              hasEnrichmentsFailed={hasEnrichmentsFailed}
              mode={columnsMode}
              value={limitedColumns}
              isDisabled={isLocked}
              onChangeMode={setColumnsMode}
              onChange={setLimitedColumns}
            />
          )}
        </>
      )}

      {isConfirmOpen && (
        <ConfirmationPopup
          open
          variant={ConfirmationPopupVariant.Danger}
          header={t(AnalyticsTableAccessI18nKey.EveryoneConfirmTitle)}
          description={t(AnalyticsTableAccessI18nKey.EveryoneConfirmDescription)}
          confirmLabel={t(AnalyticsTableAccessI18nKey.EveryoneConfirmGrant)}
          cancelLabel={t(AnalyticsTableAccessI18nKey.EveryoneConfirmSetLimit)}
          onConfirm={() => {
            setIsConfirmOpen(false);
            void send();
          }}
          onCancel={() => {
            setIsConfirmOpen(false);
            setRowsMode(RowsMode.Some);
          }}
          onClose={() => setIsConfirmOpen(false)}
        />
      )}
    </Drawer>
  );
};

export default RoleDrawer;
