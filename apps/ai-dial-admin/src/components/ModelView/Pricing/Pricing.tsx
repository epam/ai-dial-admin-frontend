import { FC, useCallback } from 'react';

import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import PriceControl from '@/src/components/EntityMainProperties/BaseProperties/Price';
import { BasicI18nKey, ModelViewI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialModel, PricingType } from '@/src/models/dial/model';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import classNames from 'classnames';
import { getMultipliedValue } from './utils';

interface Props {
  model: DialModel;
  onChangeModel: (model: DialModel) => void;
}

const Pricing: FC<Props> = ({ model, onChangeModel }) => {
  const t = useI18n();

  const items: DropdownItemsModel[] = [
    {
      id: BasicI18nKey.None,
      name: t(BasicI18nKey.None),
    },
    {
      id: PricingType.Token,
      name: t(ModelViewI18nKey.Tokens),
      description: t(ModelViewI18nKey.PerMillion),
    },
    {
      id: PricingType.CharWithoutWhitespace,
      name: t(ModelViewI18nKey.CharWithoutWhitespace),
    },
  ];

  const activeType = model.pricing?.unit || BasicI18nKey.None;
  const isTokenType = activeType === PricingType.Token;

  const pricingContainerClasses = classNames(
    'flex flex-col gap-y-4 justify-center rounded border border-primary p-3 mb-4',
    'lg:justify-start lg:border-none lg:p-0 lg:flex-row lg:gap-x-2 lg:items-center lg:mb-0',
  );

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
    (completion: number | string) => {
      const value = (isTokenType ? +completion / 1000000 : completion).toString();
      onChangeModel({ ...model, pricing: { ...model.pricing, completion: value } });
    },
    [isTokenType, onChangeModel, model],
  );

  const onChangePrompt = useCallback(
    (prompt: number | string) => {
      const value = (isTokenType ? +prompt / 1000000 : prompt).toString();
      onChangeModel({ ...model, pricing: { ...model.pricing, prompt: value } });
    },
    [isTokenType, onChangeModel, model],
  );

  return (
    <div className={pricingContainerClasses}>
      <div className="lg:w-[35%]">
        <DropdownField
          selectedValue={activeType}
          elementId="pricing"
          items={items}
          fieldTitle={t(ModelViewI18nKey.CostUnit)}
          onChange={onChangePricingType}
        />
      </div>

      <PriceControl
        elementId="promptsPrice"
        fieldTitle={t(ModelViewI18nKey.PromptPrice)}
        value={getMultipliedValue(model.pricing?.prompt, isTokenType)}
        onChange={onChangePrompt}
        controlClassName="w-[120px] lg:w-auto lg:max-w-[120px]"
        disabled={activeType === BasicI18nKey.None}
      />

      <PriceControl
        elementId="completionsPrice"
        fieldTitle={t(ModelViewI18nKey.CompletionPrice)}
        value={getMultipliedValue(model.pricing?.completion, isTokenType)}
        onChange={onChangeCompletion}
        controlClassName="w-[120px] lg:w-auto lg:max-w-[120px]"
        disabled={activeType === BasicI18nKey.None}
      />
    </div>
  );
};

export default Pricing;
