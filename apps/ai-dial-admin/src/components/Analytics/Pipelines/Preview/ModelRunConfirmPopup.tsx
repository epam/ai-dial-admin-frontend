'use client';

import { FC } from 'react';

import { ConfirmationPopup, ConfirmationPopupVariant } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import { ButtonsI18nKey, PipelinePreviewI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Pipeline, TransformPreset, TriggerKind } from '@/src/models/analytics/pipeline';

interface Props {
  pipeline: Pipeline;
  onConfirm: () => void;
  onClose: () => void;
}

const ModelRunConfirmPopup: FC<Props> = ({ pipeline, onConfirm, onClose }) => {
  const t = useI18n();

  const transform = pipeline.transform;
  const isRoute = transform?.preset === TransformPreset.DialAppRoute;
  const isGroup = pipeline.trigger?.kind === TriggerKind.Group;

  const facts = [
    {
      label: t(isRoute ? PipelinePreviewI18nKey.FactApplication : PipelinePreviewI18nKey.FactDeployment),
      value: transform?.model,
      isMono: true,
    },
    ...(isRoute ? [{ label: t(PipelinePreviewI18nKey.FactRoute), value: transform?.route, isMono: true }] : []),
    {
      label: t(PipelinePreviewI18nKey.FactModelCalls),
      value: t(isRoute ? PipelinePreviewI18nKey.ConfirmCallsRoute : PipelinePreviewI18nKey.ConfirmCallsChat),
      isMono: false,
    },
  ];

  return (
    <ConfirmationPopup
      open
      variant={ConfirmationPopupVariant.Info}
      header={t(PipelinePreviewI18nKey.RunWithModel)}
      description={
        <div className="flex flex-col gap-4">
          <span>{t(isGroup ? PipelinePreviewI18nKey.ConfirmBodyGroup : PipelinePreviewI18nKey.ConfirmBodyRow)}</span>
          <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2">
            {facts.map(({ label, value, isMono }) => (
              <div key={label} className="contents">
                <dt className="text-secondary">{label}</dt>
                <dd className={classNames(isMono && 'break-words font-mono')}>{value ?? '—'}</dd>
              </div>
            ))}
          </dl>
        </div>
      }
      confirmLabel={t(PipelinePreviewI18nKey.RunWithModel)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      onConfirm={onConfirm}
      onClose={onClose}
      onCancel={onClose}
    />
  );
};

export default ModelRunConfirmPopup;
