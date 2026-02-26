import { DialFormPopup } from '@epam/ai-dial-ui-kit';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createKey } from '@/src/app/[lang]/keys/actions';
import KeyProperties from '@/src/components/Keys/View/Properties/Properties';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialKey } from '@/src/models/dial/key';
import { ApplicationRoute } from '@/src/types/routes';
import {
  getCreateEntityTitle,
  getCreateNotificationDescription,
  getCreateNotificationTitle,
} from '@/src/utils/entities/create-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

interface Props {
  isModalOpen: boolean;
  names: string[];
  keys: string[];
  onClose: () => void;
}

const CreateKey: FC<Props> = ({ isModalOpen, names, keys, onClose }) => {
  const t = useI18n();
  const router = useRouter();
  const getReqRef = useRef(useProtectedRequest());

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
    getReqRef.current(createKey, currentKey).then((res) => {
      if (res.success) {
        showNotification(
          getSuccessNotification(
            getCreateNotificationTitle(ApplicationRoute.Keys, t),
            getCreateNotificationDescription(ApplicationRoute.Keys, currentKey.name, t),
          ),
        );
        router.push(getUrnForEntity(ApplicationRoute.Keys, currentKey));
        onClose();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [currentKey, showNotification, t, router, onClose]);

  // initial validation (disable save when no values entered yet)
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'key', isValid: !!currentKey.key });
    dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !!currentKey.name });
    dispatch({ type: ValidationActionType.SetField, field: 'displayName', isValid: !!currentKey.displayName });
    dispatch({ type: ValidationActionType.SetField, field: 'project', isValid: !!currentKey.project });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DialFormPopup
      onClose={onClose}
      header={getCreateEntityTitle(ApplicationRoute.Keys, t)}
      portalId="CreateKey"
      open={isModalOpen}
      onSubmit={onCreate}
      onCancel={onClose}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={t(ButtonsI18nKey.Create)}
      disableSubmitButton={!isValid || !isValidKey}
    >
      <div className="flex flex-col px-6 py-4">
        <KeyProperties entity={currentKey} names={names} keys={keys} onChangeKey={onChangeKey} />
      </div>
    </DialFormPopup>
  );
};

export default CreateKey;
