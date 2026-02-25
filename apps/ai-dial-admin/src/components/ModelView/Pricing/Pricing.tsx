import { FC, useCallback } from 'react';
import { DialSelectField, SelectOption } from '@epam/ai-dial-ui-kit';

import PriceControl from '@/src/components/BaseControls/Price';
import { BasicI18nKey, ModelViewI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialModel, PricingType } from '@/src/models/dial/model';
import classNames from 'classnames';
import { getMultipliedValue, getPriceRealValue } from './utils';

interface Props {
  model: DialModel;
  onChangeModel: (model: DialModel) => void;
}

const Pricing: FC<Props> = ({ model, onChangeModel }) => {
  const t = useI18n();

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

  const onChangePricingType = useCallback(
    (type: string) => {
      if (type === PricingType.Token || type === PricingType.CharWithoutWhitespace) {
        model.pricing = { unit: type };
      } else {
        model.pricing = { prompt: '0', completion: '0' };
      }

      onChangeModel({ ...model, pricing: { ...model.pricing } });
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

  return (
    <div
      className={classNames(
        'flex flex-col gap-y-4 justify-center rounded border border-primary p-3 mb-4',
        'lg:justify-start lg:border-none lg:p-0 lg:flex-row lg:gap-x-2 lg:items-center lg:mb-0',
      )}
    >
      <DialSelectField
        value={activeType}
        elementId="pricing"
        options={items}
        className="w-[220px]"
        containerClassName="w-[220px]"
        fieldTitle={t(ModelViewI18nKey.CostUnit)}
        onChange={(type) => onChangePricingType(type as string)}
      />

      <PriceControl
        elementId="promptsPrice"
        label={t(ModelViewI18nKey.PromptPrice)}
        value={getMultipliedValue(model.pricing?.prompt, isTokenType)}
        onChange={onChangePrompt}
        containerClassName="w-[120px]"
        disabled={activeType === BasicI18nKey.None}
      />

      <PriceControl
        elementId="completionsPrice"
        label={t(ModelViewI18nKey.CompletionPrice)}
        value={getMultipliedValue(model.pricing?.completion, isTokenType)}
        onChange={onChangeCompletion}
        containerClassName="w-[120px]"
        disabled={activeType === BasicI18nKey.None}
      />
    </div>
  );
};

export default Pricing;
