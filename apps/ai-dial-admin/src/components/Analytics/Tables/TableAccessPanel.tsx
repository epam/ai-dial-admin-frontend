'use client';

import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react';

import { DialFormPopup, PopupSize } from '@epam/ai-dial-ui-kit';

import { getTableAccess, replaceTableAccess } from '@/src/app/[lang]/tables/actions';
import MultiValueAutocomplete, {
  MultiValueOption,
} from '@/src/components/Common/MultiValueAutocomplete/MultiValueAutocomplete';
import { AnalyticsTablesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

interface Props {
  name: string;
  onClose: () => void;
}

const toOptions = (roles: string[]): MultiValueOption[] => roles.map((role) => ({ label: role, value: role }));

// FULL_ADMIN-only panel to view and full-replace a table's write/modify provider-role lists. Rendered
// only when the caller can manage roles (the backend access endpoint is admin-only).
const TableAccessPanel: FC<Props> = ({ name, onClose }) => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const [write, setWrite] = useState<string[]>([]);
  const [modify, setModify] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  // Gate Save until the current lists are loaded — otherwise a save could full-replace the table's real
  // roles with empty state (before the fetch resolves, or if it failed).
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void getTableAccess(name).then((access) => {
      if (!active) return;
      if (access) {
        setWrite(access.write ?? []);
        setModify(access.modify ?? []);
        setLoaded(true);
      } else {
        showNotification(getErrorNotification(t(AnalyticsTablesI18nKey.AccessLoadFailed)));
      }
    });
    return () => {
      active = false;
    };
  }, [name, showNotification, t]);

  const onAddRole = (setter: Dispatch<SetStateAction<string[]>>) => (item: MultiValueOption) =>
    setter((prev) => (prev.includes(item.value) ? prev : [...prev, item.value]));

  const onRemoveRole = (setter: Dispatch<SetStateAction<string[]>>) => (index: number) =>
    setter((prev) => prev.filter((_, i) => i !== index));

  const onSave = async () => {
    if (!loaded) return;
    setSaving(true);
    const res = await replaceTableAccess(name, { write, modify });
    setSaving(false);
    if (res.success) {
      showNotification(getSuccessNotification(t(AnalyticsTablesI18nKey.AccessSaved)));
      onClose();
    } else {
      showNotification(
        getErrorNotification(
          res.errorHeader || t(AnalyticsTablesI18nKey.ActionFailed),
          res.errorMessage,
          res.requestId,
        ),
      );
    }
  };

  return (
    <DialFormPopup
      open
      portalId="qb-table-access"
      size={PopupSize.Sm}
      header={t(AnalyticsTablesI18nKey.AccessTitle)}
      submitLabel={t(ButtonsI18nKey.Save)}
      disableSubmitButton={saving || !loaded}
      onClose={onClose}
      onSubmit={() => void onSave()}
    >
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-1">
          <span className="text-secondary">{t(AnalyticsTablesI18nKey.WriteRoles)}</span>
          <MultiValueAutocomplete
            selected={toOptions(write)}
            availableItems={[]}
            placeholder={t(AnalyticsTablesI18nKey.AddRolePlaceholder)}
            caption={t(AnalyticsTablesI18nKey.WriteRolesCaption)}
            onAdd={onAddRole(setWrite)}
            onRemove={onRemoveRole(setWrite)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-secondary">{t(AnalyticsTablesI18nKey.ModifyRoles)}</span>
          <MultiValueAutocomplete
            selected={toOptions(modify)}
            availableItems={[]}
            placeholder={t(AnalyticsTablesI18nKey.AddRolePlaceholder)}
            caption={t(AnalyticsTablesI18nKey.ModifyRolesCaption)}
            onAdd={onAddRole(setModify)}
            onRemove={onRemoveRole(setModify)}
          />
        </div>
      </div>
    </DialFormPopup>
  );
};

export default TableAccessPanel;
