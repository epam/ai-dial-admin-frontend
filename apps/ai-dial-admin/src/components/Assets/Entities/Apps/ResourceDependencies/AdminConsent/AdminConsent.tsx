'use client';

import { FC, useId, useMemo, useState } from 'react';

import { LabelledText, OutlinedButton, PrimaryButton, Spinner } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, ResourceDependenciesI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { AdminConsentStatus, ResourceDependency } from '@/src/models/dial/resource-dependency';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { ConsentDialogType } from '../models';
import { deriveConsentState } from '../utils/derive-consent-state';
import { toApprovedResources } from '../utils/resources';
import ConsentDialog from './ConsentDialog';
import ResourceList from './ResourceList';

interface Props {
  /** The declaration as saved: Core approves this, never the unsaved draft. */
  savedDependencies?: ResourceDependency[];
  isDirty: boolean;
  status?: AdminConsentStatus;
  isLoading: boolean;
  isMutating: boolean;
  onApprove: () => Promise<void>;
  onRevoke: () => Promise<void>;
}

const AdminConsent: FC<Props> = ({
  savedDependencies,
  isDirty,
  status,
  isLoading,
  isMutating,
  onApprove,
  onRevoke,
}) => {
  const t = useI18n();
  const headingId = useId();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const [dialogType, setDialogType] = useState<ConsentDialogType | null>(null);

  const state = useMemo(
    () => (status ? deriveConsentState(savedDependencies?.length ?? 0, status, isDirty) : null),
    [savedDependencies, status, isDirty],
  );

  const grantedResources = status?.grantedResources ?? [];
  const statusLabel = t(
    state?.isApproved ? ResourceDependenciesI18nKey.Approved : ResourceDependenciesI18nKey.NotApproved,
  );
  const noValue = t(ResourceDependenciesI18nKey.NoValue);

  const onCloseDialog = () => setDialogType(null);

  const onConfirmDialog = async () => {
    await (dialogType === ConsentDialogType.Revoke ? onRevoke() : onApprove());
    onCloseDialog();
  };

  const areButtonsVisible = !isReadOnlyAdmin && !isLoading && state;

  return (
    <section aria-labelledby={headingId} className="mb-4 flex flex-col gap-3 rounded bg-layer-3 p-4">
      <div className="flex flex-row items-center justify-between gap-3 min-h-[34px]">
        <h2 id={headingId}>{t(ResourceDependenciesI18nKey.AdminConsent)}</h2>
        {areButtonsVisible && (
          <div className="flex flex-row gap-3">
            {state.isReApproveVisible && (
              <PrimaryButton
                label={t(ResourceDependenciesI18nKey.ReApprove)}
                disabled={state.isApproveDisabled || isMutating}
                onClick={() => setDialogType(ConsentDialogType.Approve)}
              />
            )}
            {state.isApproveVisible && (
              <PrimaryButton
                label={t(ButtonsI18nKey.Approve)}
                disabled={state.isApproveDisabled || isMutating}
                onClick={() => setDialogType(ConsentDialogType.Approve)}
              />
            )}
            {state.isRevokeVisible && (
              <OutlinedButton
                label={t(ResourceDependenciesI18nKey.Revoke)}
                disabled={isMutating}
                onClick={() => setDialogType(ConsentDialogType.Revoke)}
              />
            )}
          </div>
        )}
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {state && !isLoading ? t(ResourceDependenciesI18nKey.ConsentStatusLabel, { status: statusLabel }) : ''}
      </span>

      {isLoading || !state ? (
        <div role="status" aria-label={t(ResourceDependenciesI18nKey.ConsentLoading)}>
          <Spinner fullWidth={false} size={16} />
        </div>
      ) : (
        <>
          <div className="flex flex-row flex-wrap gap-x-8 gap-y-2">
            <LabelledText label={t(ResourceDependenciesI18nKey.Status)} text={statusLabel} />
            <LabelledText label={t(ResourceDependenciesI18nKey.LastApprovedBy)} text={status?.grantedBy ?? noValue} />
            <LabelledText
              label={t(ResourceDependenciesI18nKey.LastApprovedAt)}
              text={status?.grantedAt != null ? formatDateTimeToLocalString(status.grantedAt) : noValue}
            />
          </div>

          {state.isSavedDefinitionNoteVisible && (
            <p className="dial-small-text text-secondary">{t(ResourceDependenciesI18nKey.SavedDefinitionNote)}</p>
          )}
          {state.isStaleNoteVisible && (
            <p className="dial-small-text text-error">{t(ResourceDependenciesI18nKey.StaleNote)}</p>
          )}

          {state.hasRecord && grantedResources.length > 0 && (
            <div className="flex flex-col gap-1">
              <h3 className="dial-small-text text-secondary">{t(ResourceDependenciesI18nKey.ApprovedResources)}</h3>
              <ResourceList resources={grantedResources} ariaLabel={t(ResourceDependenciesI18nKey.ApprovedResources)} />
            </div>
          )}
        </>
      )}

      {dialogType && (
        <ConsentDialog
          type={dialogType}
          resources={
            dialogType === ConsentDialogType.Revoke ? grantedResources : toApprovedResources(savedDependencies)
          }
          isLoading={isMutating}
          onConfirm={onConfirmDialog}
          onClose={onCloseDialog}
        />
      )}
    </section>
  );
};

export default AdminConsent;
