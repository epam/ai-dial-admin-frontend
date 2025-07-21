import { FC, useCallback } from 'react';

import classNames from 'classnames';
import Dollar from '@/public/images/icons/currency-dollar.svg';
import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import { NumberInputField } from '@/src/components/Common/InputField/InputField';
import { BasicI18nKey, ModelViewI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialModel, PricingType } from '@/src/models/dial/model';
import { DropdownItemsModel } from '@/src/models/dropdown-item';

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
    },
    {
      id: PricingType.CharWithoutWhitespace,
      name: t(ModelViewI18nKey.CharWithoutWhitespace),
    },
  ];

  const activeType = model.pricing?.unit || BasicI18nKey.None;
  const pricingContainerClasses = classNames(
    'flex flex-col gap-y-4 justify-center rounded border border-primary p-3 mb-4',
    'lg:w-[50%] lg:border-none lg:p-0 lg:flex-row lg:gap-x-2 lg:items-center lg:mb-0',
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
      onChangeModel({ ...model, pricing: { ...model.pricing, completion: completion.toString() } });
    },
    [onChangeModel, model],
  );

  const onChangePrompt = useCallback(
    (prompt: number | string) => {
      onChangeModel({ ...model, pricing: { ...model.pricing, prompt: prompt.toString() } });
    },
    [onChangeModel, model],
  );

  return (
    <div className={pricingContainerClasses}>
      <DropdownField
        selectedValue={activeType}
        elementId="pricing"
        items={items}
        fieldTitle={t(ModelViewI18nKey.CostUnit)}
        onChange={onChangePricingType}
      />

      <NumberInputField
        elementId="promptsPrice"
        fieldTitle={t(ModelViewI18nKey.PromptPrice)}
        value={model.pricing?.prompt}
        containerCssClass="w-[120px] lg:w-auto"
        onChange={onChangePrompt}
        iconBeforeInput={
          <i className="text-secondary">
            <Dollar />
          </i>
        }
        disabled={activeType === BasicI18nKey.None}
      />
      <NumberInputField
        elementId="completionsPrice"
        iconBeforeInput={
          <i className="text-secondary">
            <Dollar />
          </i>
        }
        fieldTitle={t(ModelViewI18nKey.CompletionPrice)}
        containerCssClass="w-[120px] lg:w-auto"
        disabled={activeType === BasicI18nKey.None}
        onChange={onChangeCompletion}
        value={model.pricing?.completion}
      />
    </div>
  );
};

export default Pricing;
