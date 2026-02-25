import { DialFormPopup } from '@epam/ai-dial-ui-kit';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useRef, useState } from 'react';

import { createApplicationScheme } from '@/src/app/[lang]/application-runners/actions';
import SchemeProperties from '@/src/components/ApplicationRunners/ConfigurationView/Properties';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
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
  onClose: () => void;
}

const CreateAppRunner: FC<Props> = ({ isModalOpen, names, onClose }) => {
  const t = useI18n();
  const router = useRouter();
  const getReqRef = useRef(useProtectedRequest());
  const { showNotification } = useNotification();

  const [currentScheme, setScheme] = useState<DialApplicationScheme>({
    'dial:applicationTypeDisplayName': '',
    $schema: 'https://dial.epam.com/application_type_schemas/schema#',
    $id: '',
  });
  const { isValid, dispatch } = useSaveValidationContext();

  const onChangeScheme = useCallback(
    (entity: DialApplicationScheme) => {
      setScheme({ ...currentScheme, ...entity });
    },
    [currentScheme, setScheme],
  );

  const onCreate = useCallback(() => {
    getReqRef.current(createApplicationScheme, currentScheme).then((res) => {
      if (res.success) {
        showNotification(
          getSuccessNotification(
            getCreateNotificationTitle(ApplicationRoute.ApplicationRunners, t),
            getCreateNotificationDescription(ApplicationRoute.ApplicationRunners, currentScheme.$id, t),
          ),
        );
        router.push(getUrnForEntity(ApplicationRoute.ApplicationRunners, currentScheme));
        onClose();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [currentScheme, showNotification, t, router, onClose]);

  // initial validation (disable save when no values entered yet)
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !!currentScheme.$id });
    dispatch({
      type: ValidationActionType.SetField,
      field: 'displayName',
      isValid: !!currentScheme['dial:applicationTypeDisplayName'],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DialFormPopup
      onClose={onClose}
      header={getCreateEntityTitle(ApplicationRoute.ApplicationRunners, t)}
      portalId="CreateRunner"
      open={isModalOpen}
      onSubmit={onCreate}
      onCancel={onClose}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={t(ButtonsI18nKey.Create)}
      disableSubmitButton={!isValid}
    >
      <div className="flex flex-col px-6 py-4">
        <SchemeProperties names={names} runner={currentScheme} onChangeRunner={onChangeScheme} />
      </div>
    </DialFormPopup>
  );
};

export default CreateAppRunner;
