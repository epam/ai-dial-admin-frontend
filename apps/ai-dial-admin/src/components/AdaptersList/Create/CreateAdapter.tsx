import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';

import { createAdapter } from '@/src/app/[lang]/adapters/actions';
import AdapterProperties from '@/src/components/AdaptersView/AdapterProperties';
import Button from '@/src/components/Common/Button/Button';
import Popup from '@/src/components/Common/Popup/Popup';
import { getEntityPath } from '@/src/components/EntityListView/entity-list-view';
import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';
import { isValidAdapter } from '@/src/components/EntityListView/CreateEntity/validation';

interface Props {
  modalState: PopUpState;
  onClose: () => void;
  route: ApplicationRoute;
  names: string[];
}

const CreateAdapter: FC<Props> = ({ modalState, onClose, route, names }) => {
  const t = useI18n() as (t: string) => string;
  const router = useRouter();

  const { showNotification } = useNotification();

  const [currentAdapter, setCurrentAdapter] = useState<DialAdapter>({
    name: '',
    displayName: '',
    baseEndpoint: '',
    description: '',
  });
  const [isValid, setIsValid] = useState(false);

  const onChangeAdapter = useCallback(
    (entity: DialAdapter) => {
      setCurrentAdapter({ ...currentAdapter, ...entity });
    },
    [currentAdapter, setCurrentAdapter],
  );

  const onCreate = useCallback(() => {
    const entity = {
      ...currentAdapter,
      name: currentAdapter.name?.trim(),
    };
    createAdapter(entity).then((res) => {
      if (res.success) {
        const originalRoute = route.split('/')[1];
        router.push(`${originalRoute}/${getEntityPath(route, res.response || entity)}`);
        onClose();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [currentAdapter, route, router, onClose, showNotification]);

  useEffect(() => {
    setIsValid(isValidAdapter(currentAdapter, names));
  }, [currentAdapter, names]);

  return (
    <Popup onClose={onClose} heading={t(CreateI18nKey.Adapter)} portalId="CreateRunner" state={modalState}>
      <div className="flex flex-col px-6 py-4">
        <AdapterProperties entity={currentAdapter} names={names} onChangeAdapter={onChangeAdapter} />
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <Button cssClass="secondary" title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <Button cssClass="primary" title={t(ButtonsI18nKey.Create)} onClick={onCreate} disable={!isValid} />
      </div>
    </Popup>
  );
};

export default CreateAdapter;
