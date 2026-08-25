'use client';

import { FC, useState } from 'react';

import { DialFormPopup, PopupSize } from '@epam/ai-dial-ui-kit';

import { createRule } from '@/src/app/[lang]/enrichment-rules/actions';
import RuleProperties from '@/src/components/Analytics/EnrichmentRules/Properties/RuleProperties';
import { useRuleForm } from '@/src/components/Analytics/EnrichmentRules/use-rule-form';
import { AnalyticsEnrichmentRulesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { EvaluatorSummary } from '@/src/models/analytics/evaluator';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

interface Props {
  evaluators: EvaluatorSummary[];
  hasEvaluatorsError?: boolean;
  takenTargets: string[];
  onClose: () => void;
  onCreated: () => void;
}

const CreateRulePopup: FC<Props> = ({ evaluators, hasEvaluatorsError, takenTargets, onClose, onCreated }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const form = useRuleForm({ takenTargets });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!form.isValid || isSubmitting) return;

    setIsSubmitting(true);
    const res = await createRule(form.buildDto());
    setIsSubmitting(false);

    if (res.success) {
      showNotification(getSuccessNotification(t(AnalyticsEnrichmentRulesI18nKey.Created)));
      onCreated();
      onClose();
      return;
    }

    showNotification(
      getErrorNotification(
        res.errorHeader || t(AnalyticsEnrichmentRulesI18nKey.ActionFailed),
        res.errorMessage,
        res.requestId,
      ),
    );
  };

  return (
    <DialFormPopup
      open
      onClose={onClose}
      portalId="create-enrichment-rule"
      size={PopupSize.Md}
      header={t(AnalyticsEnrichmentRulesI18nKey.CreateRuleTitle)}
      submitLabel={t(AnalyticsEnrichmentRulesI18nKey.CreateRule)}
      disableSubmitButton={!form.isValid || isSubmitting}
      onSubmit={() => void onSubmit()}
    >
      <div className="p-6">
        <RuleProperties form={form} evaluators={evaluators} hasEvaluatorsError={hasEvaluatorsError} isModal />
      </div>
    </DialFormPopup>
  );
};

export default CreateRulePopup;
