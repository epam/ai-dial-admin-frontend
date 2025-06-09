import { FC, useCallback } from 'react';

import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import { NumberInputField } from '@/src/components/Common/InputField/InputField';
import { BasicI18nKey, ModelViewI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialModel } from '@/src/models/dial/model';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { getActiveLimitType, isLimitTypeSeparateTokenAndCompletions, isLimitTypeTotal, LimitType } from './limit';

interface Props {
  model: DialModel;
  onChangeModel: (model: DialModel) => void;
}

const Limits: FC<Props> = ({ model, onChangeModel }) => {
  const t = useI18n();

  const items: DropdownItemsModel[] = [
    {
      id: LimitType.None,
      name: t(BasicI18nKey.None),
    },
    {
      id: LimitType.Total,
      name: t(ModelViewI18nKey.TotalNumbers),
    },
    {
      id: LimitType.SeparateTokenAndCompletions,
      name: t(ModelViewI18nKey.SeparatelyPromptsAndCompletions),
    },
  ];
  const activeLimitType = getActiveLimitType(model);

  const onChangeLimitType = useCallback(
    (type: string) => {
      if (isLimitTypeTotal(type)) {
        model.limits = { maxTotalTokens: 0 };
      } else if (isLimitTypeSeparateTokenAndCompletions(type)) {
        model.limits = {
          maxCompletionTokens: 0,
          maxPromptTokens: 0,
        };
      } else {
        model.limits = {};
      }

      onChangeModel({ ...model, limits: { ...model.limits } });
    },
    [onChangeModel, model],
  );

  const onChangeMaxTotalTokens = useCallback(
    (maxTotalTokens: number | string) => {
      onChangeModel({ ...model, limits: { ...model.limits, maxTotalTokens } });
    },
    [onChangeModel, model],
  );

  const onChangeMaxCompletionTokens = useCallback(
    (maxCompletionTokens: number | string) => {
      onChangeModel({ ...model, limits: { ...model.limits, maxCompletionTokens } });
    },
    [onChangeModel, model],
  );

  const onChangeMaxPromptTokens = useCallback(
    (maxPromptTokens: number | string) => {
      onChangeModel({ ...model, limits: { ...model.limits, maxPromptTokens } });
    },
    [onChangeModel, model],
  );

  return (
    <div className="flex flex-row gap-x-2 items-center lg:w-[35%]">
      <DropdownField
        selectedValue={activeLimitType}
        elementId="limits"
        items={items}
        fieldTitle={t(ModelViewI18nKey.InteractionLimit)}
        onChange={onChangeLimitType}
      />

      {activeLimitType === LimitType.Total && (
        <NumberInputField
          elementId="totalNum"
          elementCssClass="flex-1"
          fieldTitle={t(ModelViewI18nKey.NumberOfTokens)}
          value={model.limits?.maxTotalTokens}
          onChange={onChangeMaxTotalTokens}
        />
      )}

      {activeLimitType === LimitType.SeparateTokenAndCompletions && (
        <>
          <NumberInputField
            elementId="promptsNum"
            elementCssClass="flex-1"
            fieldTitle={t(ModelViewI18nKey.Prompts)}
            value={model.limits?.maxPromptTokens}
            onChange={onChangeMaxPromptTokens}
          />
          <NumberInputField
            elementId="completionsNum"
            elementCssClass="flex-1"
            fieldTitle={t(ModelViewI18nKey.Completions)}
            value={model.limits?.maxCompletionTokens}
            onChange={onChangeMaxCompletionTokens}
          />
        </>
      )}
    </div>
  );
};

export default Limits;
