'use client';

import { FC, useEffect, useMemo, useState } from 'react';

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

const TableAccessPanel: FC<Props> = ({ name, onClose }) => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const [write, setWrite] = useState<string[]>([]);
  const [modify, setModify] = useState<string[]>([]);
  const [catalogRoles, setCatalogRoles] = useState<string[]>([]);
  const [grantedOnLoad, setGrantedOnLoad] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const roleOptions: SelectOption[] = useMemo(
    () =>
      Array.from(new Set([...catalogRoles, ...grantedOnLoad]))
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
        .map((role) => ({ value: role, label: role })),
    [catalogRoles, grantedOnLoad],
  );

  useEffect(() => {
    let active = true;
    void Promise.all([getTableAccess(name), getRoles()]).then(([access, catalog]) => {
      if (!active) return;
      setFetching(false);
      setCatalogRoles(catalog.roles.map((role) => role.displayName ?? '').filter(Boolean));
      catalog.warnings.forEach((warning) =>
        showNotification(getErrorNotification(t(AnalyticsTablesI18nKey.RolesLoadFailed), t(warning))),
      );
      if (access) {
        setWrite(access.write ?? []);
        setModify(access.modify ?? []);
        setGrantedOnLoad([...(access.write ?? []), ...(access.modify ?? [])]);
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
