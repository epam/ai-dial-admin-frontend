'use client';

import { FC, useState } from 'react';

import {
  DialFormPopup,
  DialInput,
  DialRadioGroup,
  DialSelectField,
  PopupSize,
  RadioButtonWithContent,
  RadioGroupOrientation,
} from '@epam/ai-dial-ui-kit';

import { createEvaluator } from '@/src/app/[lang]/evaluators/actions';
import EvaluatorVarsEditor from '@/src/components/Analytics/Evaluators/EvaluatorVarsEditor';
import { useCreateEvaluatorForm } from '@/src/components/Analytics/Evaluators/use-create-evaluator-form';
import { withStrandedOption } from '@/src/components/Analytics/Evaluators/utils';
import { AnalyticsEvaluatorsI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { EvaluatorPreset, EvaluatorType } from '@/src/models/analytics/evaluator';
import { getEvaluatorCreatedMessage } from '@/src/utils/analytics/evaluator-created-message';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

interface Props {
  existingNames: string[];
  onClose: () => void;
  onCreated: () => void;
}

const presetOptions = [{ value: EvaluatorPreset.ChatCompletion, label: EvaluatorPreset.ChatCompletion }];

const CreateEvaluatorPopup: FC<Props> = ({ existingNames, onClose, onCreated }) => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const form = useCreateEvaluatorForm({ existingNames });
  const { draft, onChange } = form;

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keyed on sql rather than on llm, as EvaluatorProperties is, so a type the service adds later
  // degrades to offering what it can instead of offering nothing.
  const isSql = draft.type === EvaluatorType.Sql;
  const outputVars = draft.output_vars ?? [];

  const typeRadios: RadioButtonWithContent[] = [
    { id: EvaluatorType.Llm, name: t(AnalyticsEvaluatorsI18nKey.EvaluatorTypeLlm) },
    { id: EvaluatorType.Sql, name: t(AnalyticsEvaluatorsI18nKey.EvaluatorTypeSql) },
  ];

  const onSubmit = async () => {
    if (!form.isValid || isSubmitting) return;

    setIsSubmitting(true);
    const res = await createEvaluator(form.buildDto());
    setIsSubmitting(false);

    if (res.success) {
      showNotification(getSuccessNotification(getEvaluatorCreatedMessage(res.response?.version, t)));
      onCreated();
      onClose();
      return;
    }

    showNotification(
      getErrorNotification(
        res.errorHeader || t(AnalyticsEvaluatorsI18nKey.CreateEvaluatorFailed),
        res.errorMessage,
        res.requestId,
      ),
    );
  };

  return (
    <DialFormPopup
      open
      onClose={onClose}
      portalId="create-evaluator"
      size={PopupSize.Md}
      header={t(AnalyticsEvaluatorsI18nKey.CreateEvaluatorTitle)}
      submitLabel={t(ButtonsI18nKey.Create)}
      disableSubmitButton={!form.isValid || isSubmitting}
      onSubmit={() => void onSubmit()}
    >
      <div className="flex flex-col gap-y-6 p-6">
        <DialInput
          id="create-evaluator-name"
          labelProps={{ label: t(AnalyticsEvaluatorsI18nKey.Name), required: true }}
          value={draft.name}
          error={form.nameError?.text}
          invalid={Boolean(form.nameError)}
          onChange={(v) => onChange({ name: v ?? '' })}
        />

        <DialRadioGroup
          elementId="create-evaluator-type"
          fieldTitle={t(AnalyticsEvaluatorsI18nKey.Type)}
          orientation={RadioGroupOrientation.Column}
          radioButtons={typeRadios}
          activeRadioButton={draft.type}
          onChange={(id) => onChange({ type: id as EvaluatorType })}
        />

        {!isSql && (
          <>
            <DialSelectField
              id="create-evaluator-preset"
              label={t(AnalyticsEvaluatorsI18nKey.Preset)}
              required
              options={withStrandedOption(presetOptions, draft.preset)}
              value={draft.preset ?? ''}
              onChange={(value) => onChange({ preset: value as EvaluatorPreset })}
            />

            <DialInput
              id="create-evaluator-model"
              labelProps={{ label: t(AnalyticsEvaluatorsI18nKey.Model), required: true }}
              value={draft.model ?? ''}
              onChange={(v) => onChange({ model: v ?? '' })}
            />
          </>
        )}

        <section aria-label={t(AnalyticsEvaluatorsI18nKey.SectionOutputVars)} className="flex flex-col gap-2">
          <h2 className="text-primary dial-small">{t(AnalyticsEvaluatorsI18nKey.SectionOutputVars)}</h2>
          <EvaluatorVarsEditor
            id="create-evaluator-output-var"
            title={t(AnalyticsEvaluatorsI18nKey.SectionOutputVars)}
            vars={outputVars}
            hasExpression
            // Required on the shared editor's Props, but this modal has nothing to say while the list
            // is empty: submit stays disabled and that is the whole feedback (design.md §11.2, §11.3).
            emptyText=""
            onChange={(output_vars) => onChange({ output_vars })}
          />
        </section>
      </div>
    </DialFormPopup>
  );
};

export default CreateEvaluatorPopup;
