import { DialNeutralButton, DialPopup, DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useRef, useState } from 'react';

import { createAdapter } from '@/src/app/[lang]/adapters/actions';
import AdapterProperties from '@/src/components/Adapter/View/Properties/Properties';
import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { ApplicationRoute } from '@/src/types/routes';
import { getCreateNotificationDescription, getCreateNotificationTitle } from '@/src/utils/entities/create-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  names: string[];
}

const CreateAdapter: FC<Props> = ({ isModalOpen, onClose, names }) => {
  const t = useI18n();
  const router = useRouter();
  const getReqRef = useRef(useProtectedRequest());
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
    dispatch({ type: ValidationActionType.SetField, field: 'displayName', isValid: !!currentAdapter.displayName });
    dispatch({ type: ValidationActionType.SetField, field: 'baseEndpoint', isValid: !!currentAdapter.baseEndpoint });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreate = useCallback(() => {
    getReqRef.current(createAdapter, currentAdapter).then((res) => {
      if (res.success) {
        showNotification(
          getSuccessNotification(
            getCreateNotificationTitle(ApplicationRoute.Adapters, t),
            getCreateNotificationDescription(ApplicationRoute.Adapters, currentAdapter.name, t),
          ),
        );
        router.push(getUrnForEntity(ApplicationRoute.Adapters, res.response || currentAdapter));

        onClose();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [currentAdapter, showNotification, t, router, onClose]);

  return (
    <DialPopup onClose={onClose} header={t(CreateI18nKey.Adapter)} portalId="CreateAdapter" open={isModalOpen}>
      <div className="flex flex-col px-6 py-4">
        <AdapterProperties entity={currentAdapter} names={names} onChangeAdapter={onChangeAdapter} isModal={true} />
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <DialNeutralButton label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <DialPrimaryButton label={t(ButtonsI18nKey.Create)} onClick={onCreate} disabled={!isValid} />
      </div>
    </DialPopup>
  );
};

export default CreateAdapter;
