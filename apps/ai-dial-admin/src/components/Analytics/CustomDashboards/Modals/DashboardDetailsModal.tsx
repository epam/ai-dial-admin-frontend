'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { Input, Popup, PopupSize, Select } from '@epam/ai-dial-ui-kit';

import { DashboardDetails } from '@/src/components/Analytics/CustomDashboards/models';
import { useCompareOptions } from '@/src/components/Analytics/Usage/Controls/use-compare-options';
import { ComparePeriod } from '@/src/components/Analytics/Usage/models';
import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import { ButtonsI18nKey, CustomDashboardsI18nKey, EntityFieldsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DashboardVisibility } from '@/src/models/analytics/dashboard';
import { getErrorNotification } from '@/src/utils/notification';

interface Props {
  header: string;
  submitLabel: string;
  initial?: DashboardDetails;
  canPublish: boolean;
  // Resolves true when the caller has done its write, which closes the modal; false keeps the values.
  onSubmit: (details: DashboardDetails) => Promise<boolean>;
  onClose: () => void;
}

const EMPTY_DETAILS: DashboardDetails = {
  name: '',
  description: '',
  compare: ComparePeriod.Off,
  visibility: DashboardVisibility.Private,
};

/**
 * The field set of creating a dashboard and of editing its details: a required name, a description, the
 * compare it opens with, and — for a caller the service lets publish, the only one who may change it — its
 * visibility.
 */
const DashboardDetailsModal: FC<Props> = ({
  header,
  submitLabel,
  initial = EMPTY_DETAILS,
  canPublish,
  onSubmit,
  onClose,
}) => {
  const t = useI18n();
  const compareOptions = useCompareOptions();
  const { showNotification } = useNotification();
  const visibilityOptions = useMemo(
    () => [
      { value: DashboardVisibility.Private, label: t(CustomDashboardsI18nKey.VisibilityPrivate) },
      { value: DashboardVisibility.Public, label: t(CustomDashboardsI18nKey.VisibilityPublic) },
    ],
    [t],
  );
  const [details, setDetails] = useState<DashboardDetails>(initial);
  const [isSaving, setIsSaving] = useState(false);

  const onSubmitDetails = useCallback(async () => {
    setIsSaving(true);
    let isDone = false;
    try {
      isDone = await onSubmit({ ...details, name: details.name.trim(), description: details.description.trim() });
    } catch {
      showNotification(getErrorNotification(t(ErrorI18nKey.Error), t(ErrorI18nKey.TryAgainLater)));
    } finally {
      setIsSaving(false);
    }
    if (isDone) onClose();
  }, [details, onSubmit, onClose, showNotification, t]);

  return (
    <Popup
      open
      header={header}
      portalId="DashboardDetailsModal"
      size={PopupSize.Md}
      onClose={onClose}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel,
        isSubmitDisabled: !details.name.trim() || isSaving,
        onCancel: onClose,
        onSubmit: onSubmitDetails,
      })}
    >
      <div className="flex flex-col gap-y-6 px-6 py-4">
        <Input
          id="dashboard-name"
          labelProps={{ label: t(EntityFieldsI18nKey.name), required: true }}
          value={details.name}
          onChange={(name) => setDetails((prev) => ({ ...prev, name: name ?? '' }))}
        />
        <Input
          id="dashboard-description"
          labelProps={{ label: t(EntityFieldsI18nKey.description) }}
          value={details.description}
          onChange={(description) => setDetails((prev) => ({ ...prev, description: description ?? '' }))}
        />
        <Select
          id="dashboard-compare"
          labelProps={{
            label: t(CustomDashboardsI18nKey.DefaultCompare),
            caption: t(CustomDashboardsI18nKey.DefaultCompareHint),
          }}
          options={compareOptions}
          value={details.compare}
          onChange={(compare) => setDetails((prev) => ({ ...prev, compare: compare as ComparePeriod }))}
        />
        {canPublish && (
          <Select
            id="dashboard-visibility"
            labelProps={{
              label: t(CustomDashboardsI18nKey.Visibility),
              caption: t(CustomDashboardsI18nKey.VisibilityHint),
            }}
            options={visibilityOptions}
            value={details.visibility}
            onChange={(visibility) =>
              setDetails((prev) => ({ ...prev, visibility: visibility as DashboardVisibility }))
            }
          />
        )}
      </div>
    </Popup>
  );
};

export default DashboardDetailsModal;
