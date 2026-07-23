'use client';

import { FC, useEffect, useState } from 'react';

import { DialFormPopup, DialLoader, DialSelectField, PopupSize, SelectOption } from '@epam/ai-dial-ui-kit';

import { getRoles, getTableAccess, replaceTableAccess } from '@/src/app/[lang]/tables/actions';
import { AnalyticsTablesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

interface Props {
  name: string;
  onClose: () => void;
}

// FULL_ADMIN-only panel to view and full-replace a table's write/modify provider-role lists. Rendered
// only when the caller can manage roles (the backend access endpoint is admin-only). Role names are
// picked from the DIAL Roles catalog (each role's `name` is what the backend matches against the
// caller's provider roles) rather than typed free-form.
const TableAccessPanel: FC<Props> = ({ name, onClose }) => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const [write, setWrite] = useState<string[]>([]);
  const [modify, setModify] = useState<string[]>([]);
  const [roleOptions, setRoleOptions] = useState<SelectOption[]>([]);
  const [saving, setSaving] = useState(false);
  // Whether the initial fetch is still in flight — gates the spinner. Distinct from `loaded` (below):
  // a failed fetch still stops `fetching` (falls through to the empty, Save-disabled form) rather than
  // spinning forever.
  const [fetching, setFetching] = useState(true);
  // Gate Save until the current lists are loaded — otherwise a save could full-replace the table's real
  // roles with empty state (before the fetch resolves, or if it failed).
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([getTableAccess(name), getRoles()]).then(([access, roles]) => {
      if (!active) return;
      setFetching(false);
      if (roles) {
        setRoleOptions(roles.map((role) => ({ value: role.name ?? '', label: role.name ?? '' })));
      } else {
        showNotification(getErrorNotification(t(AnalyticsTablesI18nKey.RolesLoadFailed)));
      }
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
    // Fetch once per table (`name`); `showNotification`/`t` are stable in practice but the mocked
    // notification context in tests returns a fresh function every render, which would otherwise
    // re-fire this fetch (and reset write/modify) on every state update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

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
        {fetching ? (
          <DialLoader size={24} />
        ) : (
          <>
            <DialSelectField
              id="table-access-write-roles"
              multiple
              label={t(AnalyticsTablesI18nKey.WriteRoles)}
              captionDescription={t(AnalyticsTablesI18nKey.WriteRolesCaption)}
              options={roleOptions}
              value={write}
              onChange={(v) => setWrite(v as string[])}
            />
            <DialSelectField
              id="table-access-modify-roles"
              multiple
              label={t(AnalyticsTablesI18nKey.ModifyRoles)}
              captionDescription={t(AnalyticsTablesI18nKey.ModifyRolesCaption)}
              options={roleOptions}
              value={modify}
              onChange={(v) => setModify(v as string[])}
            />
          </>
        )}
      </div>
    </DialFormPopup>
  );
};

export default TableAccessPanel;
