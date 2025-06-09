import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';

import { createKey } from '@/src/app/[lang]/keys/actions';
import Button from '@/src/components/Common/Button/Button';
import Popup from '@/src/components/Common/Popup/Popup';
import KeyProperties from '@/src/components/KeysList/KeyProperties';
import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialKey } from '@/src/models/dial/key';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';
import { isValidKey } from '@/src/components/EntityListView/CreateEntity/validation';

interface Props {
  modalState: PopUpState;
  names: string[];
  keys: string[];
  onClose: () => void;
}

const CreateKey: FC<Props> = ({ modalState, names, keys, onClose }) => {
  const t = useI18n();
  const router = useRouter();

  const { showNotification } = useNotification();

  const [currentKey, setKey] = useState<DialKey>({
    name: '',
    key: '',
    description: '',
    project: '',
    secured: false,
  });
  const [isValid, setIsValid] = useState(false);

  const onChangeKey = useCallback(
    (entity: DialKey) => {
      setKey({ ...currentKey, ...entity });
    },
    [currentKey, setKey],
  );

  const onCreate = useCallback(() => {
    createKey(currentKey).then((res) => {
      if (res.success) {
        router.push(`${ApplicationRoute.Keys}/${currentKey.name}`);
        onClose();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [currentKey, showNotification, onClose, router]);

  useEffect(() => {
    setIsValid(isValidKey(currentKey, names) && !keys.includes(currentKey.key));
  }, [currentKey, keys, names]);

  return (
    <Popup onClose={onClose} heading={t(CreateI18nKey.Key)} portalId="CreateKey" state={modalState}>
      <div className="flex flex-col px-6 py-4">
        <KeyProperties entity={currentKey} names={names} keys={keys} onChangeKey={onChangeKey} />
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <Button cssClass="secondary" title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <Button cssClass="primary" title={t(ButtonsI18nKey.Create)} onClick={onCreate} disable={!isValid} />
      </div>
    </Popup>
  );
};

export default CreateKey;
