'use client';

import { useCallback } from 'react';
import { DialSelectField, SelectOption } from '@epam/ai-dial-ui-kit';

import PriceControl from '@/src/components/BaseControls/Price';
import { BasicI18nKey, ModelViewI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialModelPricing, PricingRate, PricingType } from '@/src/models/dial/model';
import classNames from 'classnames';
import { getMultipliedRate, getMultipliedValue, getRealRate, getPriceRealValue } from './utils';
import PricingRateControl from './PricingRateControl';

interface Props<T> {
  model: T;
  onChangeModel: (model: T) => void;
}

const Pricing = <T extends { pricing?: DialModelPricing }>({ model, onChangeModel }: Props<T>) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const items: SelectOption[] = [
    {
      value: BasicI18nKey.None,
      label: t(BasicI18nKey.None),
    },
    {
      value: PricingType.Token,
      label: t(ModelViewI18nKey.Tokens),
      description: t(ModelViewI18nKey.PerMillion),
    },
    {
      value: PricingType.CharWithoutWhitespace,
      label: t(ModelViewI18nKey.CharWithoutWhitespace),
    },
  ];

  const activeType = model.pricing?.unit || BasicI18nKey.None;
  const isTokenType = activeType === PricingType.Token;
  const isPriceDisabled = activeType === BasicI18nKey.None || isReadOnlyAdmin;
  // DIAL Core drops a model whose cache rates are set under any unit but `token`, so the inputs stay
  // disabled rather than letting that state be saved.
  const isCacheRateDisabled = !isTokenType || isReadOnlyAdmin;

  const onChangePricingType = useCallback(
    (type: string) => {
      // Every rate is meaningful only under its unit, so changing the unit clears all four rather than
      // carrying a number whose meaning silently changed.
      const isKnownUnit = type === PricingType.Token || type === PricingType.CharWithoutWhitespace;
      onChangeModel({ ...model, pricing: isKnownUnit ? { unit: type } : void 0 });
    },
    [onChangeModel, model],
  );

  const onChangeCompletion = useCallback(
    (completion?: number | string) => {
      const value = getPriceRealValue(completion, isTokenType);
      onChangeModel({ ...model, pricing: { ...model.pricing, completion: value } });
    },
    [isTokenType, onChangeModel, model],
  );

  const onChangePrompt = useCallback(
    (prompt?: number | string) => {
      const value = getPriceRealValue(prompt, isTokenType);
      onChangeModel({ ...model, pricing: { ...model.pricing, prompt: value } });
    },
    [isTokenType, onChangeModel, model],
  );

  // Cache rates are flat-or-tree values: the control works in display units, and the whole tree is
  // scaled back to per-token at this boundary, where an emptied branch also drops out of the model.
  const onChangeCacheRead = useCallback(
    (cacheRead: PricingRate | undefined) => {
      onChangeModel({ ...model, pricing: { ...model.pricing, cacheRead: getRealRate(cacheRead, isTokenType) } });
    },
    [isTokenType, onChangeModel, model],
  );

  const onChangeCacheWrite = useCallback(
    (cacheWrite: PricingRate | undefined) => {
      onChangeModel({ ...model, pricing: { ...model.pricing, cacheWrite: getRealRate(cacheWrite, isTokenType) } });
    },
    [isTokenType, onChangeModel, model],
  );

  return (
    <div
      className={classNames(
        'flex flex-col gap-y-4 justify-center rounded border border-primary p-3 mb-4',
        'lg:justify-start lg:border-none lg:p-0 lg:mb-0',
      )}
    >
      <DialSelectField
        value={activeType}
        id="pricing"
        options={items}
        className="w-[220px]"
        containerClassName="w-[220px]"
        label={t(ModelViewI18nKey.CostUnit)}
        onChange={(type) => onChangePricingType(type as string)}
        disabled={isReadOnlyAdmin}
      />

      <div className="flex flex-col gap-y-4 lg:flex-row lg:gap-x-2 lg:items-center">
        <PriceControl
          elementId="promptsPrice"
          label={t(ModelViewI18nKey.PromptPrice)}
          value={getMultipliedValue(model.pricing?.prompt, isTokenType)}
          onChange={onChangePrompt}
          containerClassName="w-[120px]"
          disabled={isPriceDisabled}
        />

        <PriceControl
          elementId="completionsPrice"
          label={t(ModelViewI18nKey.CompletionPrice)}
          value={getMultipliedValue(model.pricing?.completion, isTokenType)}
          onChange={onChangeCompletion}
          containerClassName="w-[120px]"
          disabled={isPriceDisabled}
        />
      </div>
      <div className="flex flex-col gap-y-4 flex-wrap lg:flex-row lg:gap-x-2 lg:items-start">
        <PricingRateControl
          elementId="cacheReadPrice"
          label={t(ModelViewI18nKey.CacheReadPrice)}
          value={getMultipliedRate(model.pricing?.cacheRead, isTokenType)}
          onChange={onChangeCacheRead}
          disabled={isCacheRateDisabled}
        />

        <PricingRateControl
          elementId="cacheWritePrice"
          label={t(ModelViewI18nKey.CacheWritePrice)}
          value={getMultipliedRate(model.pricing?.cacheWrite, isTokenType)}
          onChange={onChangeCacheWrite}
          disabled={isCacheRateDisabled}
        />
      </div>
    </div>
  );
};

export default Pricing;
