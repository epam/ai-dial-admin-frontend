'use client';

import {
  ButtonAppearance,
  DIAL_ICON_SIZE,
  GhostIconButton,
  Input,
  PrimaryButton,
  Select,
  TagInput,
} from '@epam/ai-dial-ui-kit';
import { IconPlus, IconTrashX } from '@tabler/icons-react';
import { FC, useCallback } from 'react';

import { SUBJECT_FUNCTION_OPTIONS } from '@/src/components/Assets/Platform/PolicySubjects/constants';
import { PolicySubjectsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { PolicySubjectFunction, PolicySubjectRule } from '@/src/models/dial/policy';
import { addRule, isTargetlessFunction, normalizeSubject, removeRule, updateRule } from '@/src/utils/policies/subjects';

const isTargetMissing = (rule: PolicySubjectRule): boolean =>
  !isTargetlessFunction(rule.function) && !rule.targets?.length;

interface Props {
  rules?: PolicySubjectRule[];
  onChange: (rules?: PolicySubjectRule[]) => void;
}

/**
 * The `subject` of a policy or an assignment: rules OR-composed against the caller's claims. Shared by both
 * records, which pin `subject` exactly once between them (Core checks that; this only says so). An empty
 * list is reported as `undefined` so it is never written as `[]`.
 */
const SubjectRulesEditor: FC<Props> = ({ rules, onChange }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const functionOptions = SUBJECT_FUNCTION_OPTIONS.map((fn) => ({ value: fn, label: fn }));

  const onAddRule = useCallback(() => onChange(normalizeSubject(addRule(rules))), [onChange, rules]);

  const onRemoveRule = useCallback(
    (index: number) => onChange(normalizeSubject(removeRule(rules, index))),
    [onChange, rules],
  );

  const onChangeRule = useCallback(
    (index: number, patch: Partial<PolicySubjectRule>) => onChange(normalizeSubject(updateRule(rules, index, patch))),
    [onChange, rules],
  );

  return (
    <div className="flex flex-col gap-y-4">
      <p className="">{t(PolicySubjectsI18nKey.Pinned)}</p>
      {!rules?.length && <p className="text-secondary dial-small-text">{t(PolicySubjectsI18nKey.Empty)}</p>}
      {rules?.map((rule, index) => (
        <div
          // The list has no stable id and rules are only ever appended or removed by position.
          key={index}
          role="group"
          aria-label={t(PolicySubjectsI18nKey.Rule, { index: String(index + 1) })}
          className="flex flex-row flex-wrap items-start gap-4 p-4 border border-primary rounded-xl w-full"
        >
          <div className="flex-1 min-w-48">
            <Input
              id={`subject-source-${index}`}
              labelProps={{ label: t(PolicySubjectsI18nKey.Source), required: true }}
              placeholder={t(PolicySubjectsI18nKey.SourcePlaceholder)}
              value={rule.source}
              disabled={isReadOnlyAdmin}
              invalid={!rule.source}
              onChange={(source) => onChangeRule(index, { source })}
            />
          </div>
          <div className="w-40 shrink-0">
            <Select
              id={`subject-function-${index}`}
              labelProps={{ label: t(PolicySubjectsI18nKey.Function), required: true }}
              options={functionOptions}
              value={rule.function}
              disabled={isReadOnlyAdmin}
              onChange={(value) => onChangeRule(index, { function: value as PolicySubjectFunction })}
            />
          </div>
          <div className="flex-2 min-w-56">
            <TagInput
              id={`subject-targets-${index}`}
              labelProps={{ label: t(PolicySubjectsI18nKey.Targets), required: !isTargetlessFunction(rule.function) }}
              caption={isTargetlessFunction(rule.function) ? t(PolicySubjectsI18nKey.TargetsNotUsed) : undefined}
              error={isTargetMissing(rule) ? t(PolicySubjectsI18nKey.TargetsRequired) : undefined}
              invalid={isTargetMissing(rule)}
              value={rule.targets ?? []}
              disabled={isReadOnlyAdmin || isTargetlessFunction(rule.function)}
              onChange={(targets) => onChangeRule(index, { targets })}
              tagClassName="h-6 rounded-md border border-secondary bg-layer-sunken"
            />
          </div>
          {!isReadOnlyAdmin && (
            // Offset by the label height so the button lines up with the controls, not their labels.
            <div className="shrink-0 pt-6">
              <GhostIconButton
                icon={<IconTrashX size={DIAL_ICON_SIZE.SM} className="text-error" aria-hidden />}
                aria-label={t(PolicySubjectsI18nKey.RemoveRule)}
                onClick={() => onRemoveRule(index)}
              />
            </div>
          )}
        </div>
      ))}
      {!isReadOnlyAdmin && (
        <div>
          <PrimaryButton
            appearance={ButtonAppearance.Link}
            label={t(PolicySubjectsI18nKey.AddRule)}
            iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
            onClick={onAddRule}
          />
        </div>
      )}
    </div>
  );
};

export default SubjectRulesEditor;
