import { FC, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DialButton } from '@epam/ai-dial-ui-kit';

import { ApplicationRoute } from '@/src/types/routes';
import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { PopUpState } from '@/src/types/pop-up';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { useI18n } from '@/src/locales/client';
import { getEntityPath } from '@/src/utils/open-in-new-tab';
import { getErrorNotification } from '@/src/utils/notification';
import { createInterceptorTemplate } from '@/src/app/[lang]/interceptor-templates/actions';
import { useNotification } from '@/src/context/NotificationContext';

import Popup from '@/src/components/Common/Popup/Popup';
import BaseProperties from '@/src/components/InterceptorTemplates/Properties/BaseProperties';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';

interface Props {
  route: ApplicationRoute;
  names: string[];
  modalState: PopUpState;
  onClose: () => void;
}

const Create: FC<Props> = ({ route, onClose, modalState, names }) => {
  const t = useI18n() as (t: string) => string;
  const router = useRouter();
  const { showNotification } = useNotification();
  const { isValid, dispatch } = useSaveValidationContext();

  const [template, setTemplate] = useState<InterceptorTemplate>({
    name: '',
    displayName: '',
    description: '',
  });

  const onCreate = useCallback(() => {
    createInterceptorTemplate(template).then((res) => {
      if (res.success) {
        onClose();
        router.push(`${route}/${getEntityPath(route, template)}`);
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [template, route, router, onClose, showNotification]);

  // initial validation (disable save when no values entered yet)
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !!template.name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Popup
      onClose={onClose}
      heading={t(CreateI18nKey.CreateInterceptorTemplate)}
      portalId="CreateRunner"
      state={modalState}
    >
      <div className="flex flex-col px-6 py-4">
        <BaseProperties template={template} setTemplate={setTemplate} names={names} />
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

export default Create;
