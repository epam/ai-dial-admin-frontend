'use client';

import { FC, useCallback, useState } from 'react';

import { Popup, PopupSize } from '@epam/ai-dial-ui-kit';

import EntitySelectManager from '@/src/components/Common/EntitySelectInput/EntitySelectManager';
import { EntitySelectType } from '@/src/components/Common/EntitySelectInput/models';
import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import { ButtonsI18nKey, RolesI18nKey } from '@/src/constants/i18n';
import { AppsFolderProvider } from '@/src/context/assets/AppsFolderContext';
import { useI18n } from '@/src/locales/client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Receives the picked applications' tree paths, as the manager lists them. */
  onApply: (paths: string[]) => void;
}

/** Multi-select over the applications tree (its `file/`, `platform/` and `public/` roots) for a role's limits. */
const AddApplicationsPopup: FC<Props> = ({ isOpen, onClose, onApply }) => {
  const t = useI18n();
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);

  const onCancel = useCallback(() => {
    // A cancelled pick must not survive into the next open: the browser would not show it as selected.
    setSelectedPaths([]);
    onClose();
  }, [onClose]);

  const onConfirm = useCallback(() => {
    onApply(selectedPaths);
    setSelectedPaths([]);
  }, [onApply, selectedPaths]);

  return (
    // Own provider so the popup's folder state is isolated from the Applications page.
    <AppsFolderProvider>
      <Popup
        header={t(RolesI18nKey.AddApplications)}
        portalId="roleApplicationsSelect"
        open={isOpen}
        onClose={onCancel}
        className="md:h-[800px]"
        size={PopupSize.Lg}
        mainButtons={getFormPopupButtons({
          cancelLabel: t(ButtonsI18nKey.Cancel),
          submitLabel: t(ButtonsI18nKey.Apply),
          isSubmitDisabled: selectedPaths.length === 0,
          onCancel,
          onSubmit: onConfirm,
        })}
      >
        <div className="size-full min-h-0 overflow-hidden">
          <EntitySelectManager
            entityType={EntitySelectType.Application}
            value=""
            isModalOpen={isOpen}
            onChangeSelectedPaths={setSelectedPaths}
          />
        </div>
      </Popup>
    </AppsFolderProvider>
  );
};

export default AddApplicationsPopup;
