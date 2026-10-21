'use client';

import { ConfirmationPopup, ConfirmationPopupVariant } from '@epam/ai-dial-ui-kit';
import { FC, useState } from 'react';

import { MARKED_PRIVILEGES } from '@/src/components/Analytics/Tables/access/constants';
import { PrivilegeMark, RoleRow, RowsCellKind } from '@/src/components/Analytics/Tables/access/models';
import { summarizeFilter } from '@/src/components/Analytics/Tables/access/utils';
import { AnalyticsTableAccessI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { TableGrantKey } from '@/src/models/analytics/table';
import { getSuccessNotification } from '@/src/utils/notification';

interface Props {
  tableName: string;
  row: RoleRow;
  // Resolves true when the role is gone; the failure notification has been shown by the caller.
  onRemove: (role: string) => Promise<boolean>;
  onClose: () => void;
}

const describePrivileges = (row: RoleRow, label: (key: AnalyticsTableAccessI18nKey) => string): string => {
  const isReadOnly =
    row.marks[TableGrantKey.Read] === PrivilegeMark.Stored &&
    row.marks[TableGrantKey.Write] === PrivilegeMark.None &&
    row.marks[TableGrantKey.Modify] === PrivilegeMark.None;
  const privileges = isReadOnly
    ? [label(AnalyticsTableAccessI18nKey.RemoveReadWithGet)]
    : MARKED_PRIVILEGES.filter(({ key }) => row.marks[key] !== PrivilegeMark.None).map((privilege) =>
        label(privilege.label),
      );
  if (row.isSensitive) privileges.push(label(AnalyticsTableAccessI18nKey.SummarySensitive));

  return privileges.join(', ');
};

const RemoveRoleDialog: FC<Props> = ({ tableName, row, onRemove, onClose }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const [isRemoving, setIsRemoving] = useState(false);

  const onConfirm = async () => {
    setIsRemoving(true);
    const isRemoved = await onRemove(row.role);
    setIsRemoving(false);
    if (!isRemoved) return;

    showNotification(getSuccessNotification(t(AnalyticsTableAccessI18nKey.RoleRemoved)));
    onClose();
  };

  const privileges = describePrivileges(row, t);
  const details: Array<[AnalyticsTableAccessI18nKey, string]> = [[AnalyticsTableAccessI18nKey.RemoveTable, tableName]];
  if (privileges) details.push([AnalyticsTableAccessI18nKey.RemoveAccess, privileges]);
  if (row.rowsKind === RowsCellKind.Policy && row.filter) {
    details.push([AnalyticsTableAccessI18nKey.RemoveRowLimit, summarizeFilter(row.filter)]);
  }

  return (
    <ConfirmationPopup
      open
      variant={ConfirmationPopupVariant.Danger}
      header={t(AnalyticsTableAccessI18nKey.RemoveTitle, { role: row.role })}
      confirmLabel={t(AnalyticsTableAccessI18nKey.RemoveRole)}
      isLoading={isRemoving}
      onConfirm={() => void onConfirm()}
      onCancel={onClose}
      onClose={onClose}
    >
      <div className="flex flex-col gap-3">
        <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-1 dial-small-text">
          {details.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-secondary">{t(label)}</dt>
              <dd className="break-words">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="dial-small-text">{t(AnalyticsTableAccessI18nKey.RemoveWarning)}</p>
      </div>
    </ConfirmationPopup>
  );
};

export default RemoveRoleDialog;
