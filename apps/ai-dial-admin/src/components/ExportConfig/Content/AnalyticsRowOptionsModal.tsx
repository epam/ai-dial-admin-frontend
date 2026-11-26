'use client';
import { FC, useMemo, useState } from 'react';

import { Checkbox, Popup, PopupSize, Select, Spinner } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import { useTableAccessRoles } from '@/src/components/ExportConfig/Content/use-table-access-roles';
import { ButtonsI18nKey, ExportI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { AnalyticsExportEntityType } from '@/src/types/analytics/export';

interface Props {
  entity: EntitiesGridData;
  tab: AnalyticsExportEntityType;
  onClose: () => void;
  onApply: (entity: EntitiesGridData) => void;
}

const AnalyticsRowOptionsModal: FC<Props> = ({ entity, tab, onClose, onApply }) => {
  const t = useI18n();
  const isTable = tab === AnalyticsExportEntityType.TABLE;
  const { roles, isLoading, isFailed } = useTableAccessRoles(isTable ? entity.name : undefined);

  const [isDependenciesIncluded, setIsDependenciesIncluded] = useState(!entity.isExportedAlone);
  const [isAccessOnly, setIsAccessOnly] = useState(!!entity.isAccessOnly);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(entity.accessRoles ?? []);

  const roleOptions = useMemo(() => roles.map((role) => ({ value: role, label: role })), [roles]);
  const canPickAccess = roles.length > 0;
  const availableSelectedRoles = useMemo(
    () => selectedRoles.filter((role) => roles.includes(role)),
    [selectedRoles, roles],
  );

  const onSubmit = () => {
    if (!isTable) {
      onApply({ ...entity, isExportedAlone: !isDependenciesIncluded });
      return;
    }
    onApply({
      ...entity,
      isAccessOnly: canPickAccess && isAccessOnly,
      accessRoles: canPickAccess && availableSelectedRoles.length ? availableSelectedRoles : undefined,
    });
  };

  const renderTableOptions = () => {
    if (isLoading) {
      return <Spinner size={30} fullWidth />;
    }
    return (
      <>
        <Checkbox
          id="analyticsRowAccessOnly"
          isSelected={canPickAccess && isAccessOnly}
          disabled={!canPickAccess}
          labelProps={{ label: t(ExportI18nKey.AnalyticsAccessOnly) }}
          caption={t(ExportI18nKey.AnalyticsAccessOnlyCaption)}
          onChange={setIsAccessOnly}
        />
        <Select
          id="analyticsRowRoles"
          multiple
          searchable
          disabled={!canPickAccess}
          labelProps={{ label: t(ExportI18nKey.AnalyticsRoles) }}
          placeholder={t(ExportI18nKey.AnalyticsAllRoles)}
          caption={canPickAccess || isFailed ? undefined : t(ExportI18nKey.AnalyticsNoAccessEntries)}
          options={roleOptions}
          value={availableSelectedRoles}
          onChange={(next) => setSelectedRoles(next as string[])}
        />
      </>
    );
  };

  return (
    <Popup
      open
      onClose={onClose}
      header={`${t(ExportI18nKey.AnalyticsRowOptionsTitle)}: ${entity.name ?? ''}`}
      portalId="analyticsRowOptionsModal"
      size={PopupSize.Md}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ButtonsI18nKey.Save),
        isSubmitDisabled: isTable && (isLoading || isFailed),
        onCancel: onClose,
        onSubmit,
      })}
    >
      <div className="flex flex-col gap-4 px-6 py-4">
        {isTable ? (
          renderTableOptions()
        ) : (
          <Checkbox
            id="analyticsRowIncludeDependencies"
            isSelected={isDependenciesIncluded}
            labelProps={{ label: t(ExportI18nKey.AnalyticsIncludeDependencies) }}
            caption={t(ExportI18nKey.AnalyticsIncludeDependenciesCaption)}
            onChange={setIsDependenciesIncluded}
          />
        )}
      </div>
    </Popup>
  );
};

export default AnalyticsRowOptionsModal;
