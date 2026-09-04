'use client';

import { FC, ReactNode, useState } from 'react';

import { DialFormPopup, DialInput, PopupSize } from '@epam/ai-dial-ui-kit';

import { createPipeline } from '@/src/app/[lang]/pipelines/actions';
import { AnalyticsPipelinesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { CreatePipelineDto } from '@/src/models/analytics/pipeline';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

interface Props {
  kindControl: ReactNode;
  name?: string;
  onChangeName: (name: string) => void;
  isValid: boolean;
  buildDto: () => CreatePipelineDto;
  onClose: () => void;
  onCreated: () => void;
  children: ReactNode;
}

const CreatePipelineShell: FC<Props> = ({
  kindControl,
  name,
  onChangeName,
  isValid,
  buildDto,
  onClose,
  onCreated,
  children,
}) => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    const res = await createPipeline(buildDto());
    setIsSubmitting(false);

    if (res.success) {
      showNotification(getSuccessNotification(t(AnalyticsPipelinesI18nKey.Created)));
      onCreated();
      onClose();
      return;
    }

    showNotification(
      getErrorNotification(
        res.errorHeader || t(AnalyticsPipelinesI18nKey.ActionFailed),
        res.errorMessage,
        res.requestId,
      ),
    );
  };

  return (
    <DialFormPopup
      open
      onClose={onClose}
      portalId="create-pipeline"
      size={PopupSize.Md}
      header={t(AnalyticsPipelinesI18nKey.CreateRuleTitle)}
      submitLabel={t(ButtonsI18nKey.Create)}
      disableSubmitButton={!isValid || isSubmitting}
      onSubmit={() => void onSubmit()}
    >
      <div className="flex flex-col gap-y-6 p-6">
        <DialInput
          id="pipeline-name"
          labelProps={{ label: t(AnalyticsPipelinesI18nKey.Name), required: true }}
          value={name ?? ''}
          onChange={(v) => onChangeName(v ?? '')}
        />
        {kindControl}
        {children}
      </div>
    </DialFormPopup>
  );
};

export default CreatePipelineShell;
