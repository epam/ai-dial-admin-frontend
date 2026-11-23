'use client';

import { FC } from 'react';

import { ConfirmationPopup, ConfirmationPopupVariant, PopupSize } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, ResourceDependenciesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ApprovedResource } from '@/src/models/dial/resource-dependency';
import { ConsentDialogType } from '../models';
import ResourceList from './ResourceList';

interface Props {
  type: ConsentDialogType;
  /** Approve lists the saved declaration; revoke lists what is currently approved. */
  resources: ApprovedResource[];
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const ConsentDialog: FC<Props> = ({ type, resources, isLoading, onConfirm, onClose }) => {
  const t = useI18n();
  const isRevoke = type === ConsentDialogType.Revoke;
  const header = t(isRevoke ? ResourceDependenciesI18nKey.RevokeTitle : ResourceDependenciesI18nKey.ApproveTitle);

  return (
    <ConfirmationPopup
      open
      variant={isRevoke ? ConfirmationPopupVariant.Danger : ConfirmationPopupVariant.Info}
      header={header}
      ariaLabel={header}
      size={PopupSize.Md}
      description={
        <div className="flex flex-col gap-3">
          <p>
            {t(
              isRevoke ? ResourceDependenciesI18nKey.RevokeDescription : ResourceDependenciesI18nKey.ApproveDescription,
            )}
          </p>
          <ResourceList
            resources={resources}
            ariaLabel={t(
              isRevoke ? ResourceDependenciesI18nKey.ApprovedResources : ResourceDependenciesI18nKey.TargetPath,
            )}
          />
        </div>
      }
      confirmLabel={t(isRevoke ? ResourceDependenciesI18nKey.Revoke : ButtonsI18nKey.Approve)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      isLoading={isLoading}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
};

export default ConsentDialog;
