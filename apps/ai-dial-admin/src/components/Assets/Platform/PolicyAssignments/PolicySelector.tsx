'use client';

import { Input, Select } from '@epam/ai-dial-ui-kit';
import { FC, useEffect, useMemo, useState } from 'react';

import { getPolicies } from '@/src/app/[lang]/platform-policies/actions';
import { EntitiesI18nKey, PolicyAssignmentsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { getErrorNotification } from '@/src/utils/notification';
import { getItemPaths } from '@/src/utils/policies/rows';

interface Props {
  /** Path of the selected policy under `policies`. */
  value?: string;
  /** The cost object of the assignment: its own project policies are offered next to the global ones. */
  costObject?: string;
  className?: string;
  error?: string;
  onChange: (policy?: string) => void;
}

/**
 * The `policy` of an assignment: the global policies plus the project policies of the assignment's own cost
 * object. Core refuses another cost object's project policy, so those are never listed. When the listing
 * fails the field becomes a plain path input, so a transient read error never blocks the form.
 */
const PolicySelector: FC<Props> = ({ value, costObject, className, error, onChange }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { showNotification } = useNotification();
  const [policies, setPolicies] = useState<string[]>();
  const [isFailed, setIsFailed] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      try {
        const [globals, project] = await Promise.all([
          getPolicies(''),
          costObject ? getPolicies(`${costObject}/`) : Promise.resolve([]),
        ]);
        if (!isCancelled) {
          setPolicies([...getItemPaths(globals), ...getItemPaths(project)]);
          setIsFailed(false);
        }
      } catch {
        if (!isCancelled) {
          setIsFailed(true);
          showNotification(
            getErrorNotification(t(EntitiesI18nKey.IncompleteOptionList), t(PolicyAssignmentsI18nKey.PolicyListFailed)),
          );
        }
      }
    };

    void load();
    return () => {
      isCancelled = true;
    };
  }, [costObject, showNotification, t]);

  const options = useMemo(() => (policies ?? []).map((path) => ({ value: path, label: path })), [policies]);

  if (isFailed) {
    return (
      <Input
        id="policy"
        containerClassName={className}
        labelProps={{ label: t(PolicyAssignmentsI18nKey.PolicyPath), required: true }}
        value={value ?? ''}
        disabled={isReadOnlyAdmin}
        error={error}
        invalid={!!error}
        onChange={(path) => onChange(path || undefined)}
      />
    );
  }

  return (
    <Select
      id="policy"
      className={className}
      labelProps={{ label: t(PolicyAssignmentsI18nKey.Policy), required: true }}
      placeholder={t(PolicyAssignmentsI18nKey.PolicyPlaceholder)}
      options={options}
      value={value ?? ''}
      disabled={isReadOnlyAdmin || policies == null}
      error={error}
      invalid={!!error}
      onChange={(path) => onChange((path as string) || undefined)}
    />
  );
};

export default PolicySelector;
