'use client';

import { FC, useCallback, useMemo } from 'react';

import { Input, Select, SelectOption } from '@epam/ai-dial-ui-kit';

import { SystemPropertiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { SpendingLimitMode, SpendingLimits as SpendingLimitsModel } from '@/src/models/system-properties';
import { DEFAULT_SPENDING_LIMITS, SPENDING_LIMIT_MODE_I18N_KEYS } from './constants';
import { isDefaultCostObjectValid } from './utils/spending-limits';

interface Props {
  spendingLimits?: SpendingLimitsModel;
  onChangeSpendingLimits: (spendingLimits: SpendingLimitsModel) => void;
}

const SpendingLimits: FC<Props> = ({ spendingLimits, onChangeSpendingLimits }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  // An absent field displays Core's defaults but stays undefined in the page state, so the page never
  // goes falsely dirty; the first edit to either control materializes both values.
  const effectiveSpendingLimits = spendingLimits ?? DEFAULT_SPENDING_LIMITS;
  const { mode, defaultCostObject } = effectiveSpendingLimits;

  const modeOptions = useMemo<SelectOption[]>(
    () =>
      Object.values(SpendingLimitMode).map((value) => ({
        value,
        label: t(SPENDING_LIMIT_MODE_I18N_KEYS[value].label),
      })),
    [t],
  );

  const isCostObjectInvalid = !isDefaultCostObjectValid(defaultCostObject);

  const onModeChange = useCallback(
    (value: string | string[]) => {
      onChangeSpendingLimits({ ...effectiveSpendingLimits, mode: value as SpendingLimitMode });
    },
    [effectiveSpendingLimits, onChangeSpendingLimits],
  );

  const onDefaultCostObjectChange = useCallback(
    (value?: string) => {
      onChangeSpendingLimits({ ...effectiveSpendingLimits, defaultCostObject: value ?? '' });
    },
    [effectiveSpendingLimits, onChangeSpendingLimits],
  );

  return (
    <div className="h-full flex flex-col pt-3">
      <div className="flex items-center mb-4 h-10">
        <h1>{t(TabsI18nKey.SpendingLimits)}</h1>
      </div>
      <p className="dial-small-text text-secondary mb-4 max-w-[560px]">
        {t(SystemPropertiesI18nKey.SpendingLimitsDescription)}
      </p>
      <div className="flex flex-col gap-4 max-w-[420px]">
        <div className="flex flex-col gap-2">
          <Select
            id="spending-limits-mode"
            labelProps={{ label: t(SystemPropertiesI18nKey.SpendingLimitModeLabel) }}
            options={modeOptions}
            value={mode}
            disabled={isReadOnlyAdmin}
            onChange={onModeChange}
          />
          <p className="dial-small-text text-secondary">{t(SPENDING_LIMIT_MODE_I18N_KEYS[mode].hint)}</p>
          <div role="status">
            {mode === SpendingLimitMode.Enforce && (
              <p className="dial-small-text text-error">{t(SystemPropertiesI18nKey.SpendingLimitEnforceWarning)}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Input
            id="spending-limits-default-cost-object"
            labelProps={{ label: t(SystemPropertiesI18nKey.DefaultCostObjectLabel) }}
            value={defaultCostObject}
            invalid={isCostObjectInvalid}
            disabled={isReadOnlyAdmin}
            onChange={onDefaultCostObjectChange}
          />
          {isCostObjectInvalid && (
            <p role="alert" className="dial-small-text text-error">
              {t(SystemPropertiesI18nKey.DefaultCostObjectInvalid)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpendingLimits;
