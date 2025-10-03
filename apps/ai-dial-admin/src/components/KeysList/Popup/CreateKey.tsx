import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';

import { createKey } from '@/src/app/[lang]/keys/actions';
import Popup from '@/src/components/Common/Popup/Popup';
import KeyProperties from '@/src/components/Keys/View/Properties';
import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialKey } from '@/src/models/dial/key';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

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
  const { isValid, dispatch } = useSaveValidationContext();

  const [currentKey, setKey] = useState<DialKey>({
    name: '',
    key: '',
    description: '',
    project: '',
    secured: false,
  });

  const isValidKey = useMemo(() => {
    return !keys.includes(currentKey.key || '');
  }, [currentKey.key, keys]);

  const onChangeKey = useCallback(
    (entity: DialKey) => {
      setKey({ ...currentKey, ...entity });
    },
    [currentKey, setKey],
  );

  const onCreate = useCallback(() => {
    createKey(currentKey).then((res) => {
      if (res.success) {
        router.push(getUrnForEntity(ApplicationRoute.Keys, currentKey));
        onClose();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [currentKey, showNotification, onClose, router]);

  // initial validation (disable save when no values entered yet)
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'key', isValid: !!currentKey.key });
    dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !!currentKey.name });
    dispatch({ type: ValidationActionType.SetField, field: 'project', isValid: !!currentKey.project });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Popup onClose={onClose} heading={t(CreateI18nKey.Key)} portalId="CreateKey" state={modalState}>
      <div className="flex flex-col px-6 py-4">
        <KeyProperties entity={currentKey} names={names} keys={keys} onChangeKey={onChangeKey} />
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <DialButton variant={ButtonVariant.Secondary} title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <DialButton
          variant={ButtonVariant.Primary}
          title={t(ButtonsI18nKey.Create)}
          onClick={onCreate}
          disable={!isValid || !isValidKey}
        />
      </div>
    </Popup>
  );
};

export default CreateKey;
