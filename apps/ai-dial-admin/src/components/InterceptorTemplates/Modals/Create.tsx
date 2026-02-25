import { DialFormPopup } from '@epam/ai-dial-ui-kit';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useRef, useState } from 'react';

import { createInterceptorTemplate } from '@/src/app/[lang]/interceptor-templates/actions';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

import BaseProperties from '@/src/components/InterceptorTemplates/Properties/BaseProperties';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import {
  getCreateEntityTitle,
  getCreateNotificationDescription,
  getCreateNotificationTitle,
} from '@/src/utils/entities/create-entity';

interface Props {
  route: ApplicationRoute;
  names: string[];
  isModalOpen: boolean;
  onClose: () => void;
}

const Create: FC<Props> = ({ route, onClose, isModalOpen, names }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { isValid, dispatch } = useSaveValidationContext();
  const getReqRef = useRef(useProtectedRequest());

  const [template, setTemplate] = useState<InterceptorTemplate>({
    name: '',
    displayName: '',
    description: '',
  });

  const onCreate = useCallback(() => {
    getReqRef.current(createInterceptorTemplate, template).then((res) => {
      if (res.success) {
        showNotification(
          getSuccessNotification(
            getCreateNotificationTitle(ApplicationRoute.InterceptorTemplates, t),
            getCreateNotificationDescription(ApplicationRoute.InterceptorTemplates, template.name, t),
          ),
        );
        onClose();
        router.push(getUrnForEntity(route, template));
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [template, showNotification, t, onClose, router, route]);

  // initial validation (disable save when no values entered yet)
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !!template.name });
    dispatch({ type: ValidationActionType.SetField, field: 'displayName', isValid: !!template.displayName });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DialFormPopup
      onClose={onClose}
      header={getCreateEntityTitle(ApplicationRoute.InterceptorTemplates, t)}
      portalId="CreateInterceptorTemplate"
      open={isModalOpen}
      onSubmit={onCreate}
      onCancel={onClose}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={t(ButtonsI18nKey.Create)}
      disableSubmitButton={!isValid}
    >
      <div className="flex flex-col px-6 py-4">
        <BaseProperties template={template} onChangeTemplate={setTemplate} names={names} />
      </div>
    </DialFormPopup>
  );
};

export default Create;
