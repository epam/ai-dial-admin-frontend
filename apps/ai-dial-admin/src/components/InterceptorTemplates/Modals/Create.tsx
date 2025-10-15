import { FC, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ButtonVariant, DialButton, DialPopup } from '@epam/ai-dial-ui-kit';

import { ApplicationRoute } from '@/src/types/routes';
import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { useI18n } from '@/src/locales/client';
import { getEntityPath } from '@/src/utils/open-in-new-tab';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { createInterceptorTemplate } from '@/src/app/[lang]/interceptor-templates/actions';
import { useNotification } from '@/src/context/NotificationContext';

import BaseProperties from '@/src/components/InterceptorTemplates/Properties/BaseProperties';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getCreateNotificationDescription, getCreateNotificationTitle } from '@/src/utils/entities/create-entity';

interface Props {
  route: ApplicationRoute;
  names: string[];
  isModalOpen: boolean;
  onClose: () => void;
}

const Create: FC<Props> = ({ route, onClose, isModalOpen, names }) => {
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
        showNotification(
          getSuccessNotification(
            getCreateNotificationTitle(ApplicationRoute.InterceptorTemplates, t),
            getCreateNotificationDescription(ApplicationRoute.InterceptorTemplates, template.name, t),
          ),
        );
        onClose();
        router.push(`${route}/${getEntityPath(route, template)}`);
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
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
    <DialPopup
      onClose={onClose}
      title={t(CreateI18nKey.InterceptorTemplate)}
      portalId="CreateInterceptorTemplate"
      open={isModalOpen}
      footer={
        <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
          <DialButton variant={ButtonVariant.Secondary} title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
          <DialButton
            variant={ButtonVariant.Primary}
            title={t(ButtonsI18nKey.Create)}
            onClick={onCreate}
            disable={!isValid}
          />
        </div>
      }
    >
      <div className="flex flex-col px-6 py-4">
        <BaseProperties template={template} setTemplate={setTemplate} names={names} />
      </div>
    </DialPopup>
  );
};

export default Create;
