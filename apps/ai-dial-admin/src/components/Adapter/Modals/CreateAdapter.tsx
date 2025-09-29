import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';
import { DialButton } from '@epam/ai-dial-ui-kit';

import { createAdapter } from '@/src/app/[lang]/adapters/actions';
import AdapterProperties from '@/src/components/Adapter/View/AdapterProperties';
import Popup from '@/src/components/Common/Popup/Popup';
import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';
import { getEntityPath } from '@/src/utils/open-in-new-tab';

interface Props {
  modalState: PopUpState;
  onClose: () => void;
  names: string[];
}

const CreateAdapter: FC<Props> = ({ modalState, onClose, names }) => {
  const t = useI18n() as (t: string) => string;
  const router = useRouter();

  const { showNotification } = useNotification();
  const { isValid, dispatch } = useSaveValidationContext();

  const [currentAdapter, setCurrentAdapter] = useState<DialAdapter>({
    name: '',
    displayName: '',
    baseEndpoint: '',
    description: '',
  });

  const onChangeAdapter = useCallback(
    (entity: DialAdapter) => {
      setCurrentAdapter({ ...currentAdapter, ...entity });
    },
    [currentAdapter, setCurrentAdapter],
  );

  // initial validation on creation adapter (disable save when no values entered yet)
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !!currentAdapter.name });
    dispatch({ type: ValidationActionType.SetField, field: 'baseEndpoint', isValid: !!currentAdapter.baseEndpoint });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreate = useCallback(() => {
    createAdapter(currentAdapter).then((res) => {
      if (res.success) {
        const originalRoute = ApplicationRoute.Adapters.split('/')[1];
        router.push(`${originalRoute}/${getEntityPath(ApplicationRoute.Adapters, res.response || currentAdapter)}`);
        onClose();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [currentAdapter, router, onClose, showNotification]);

  return (
    <Popup onClose={onClose} heading={t(CreateI18nKey.CreateAdapter)} portalId="CreateRunner" state={modalState}>
      <div className="flex flex-col px-6 py-4">
        <AdapterProperties entity={currentAdapter} names={names} onChangeAdapter={onChangeAdapter} />
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <DialButton cssClass="dial-secondary-button" title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <DialButton
          cssClass="dial-primary-button"
          title={t(ButtonsI18nKey.Create)}
          onClick={onCreate}
          disable={!isValid}
        />
      </div>
    </Popup>
  );
};

export default CreateAdapter;
