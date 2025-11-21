import { DialNumberInputField, DialSelectField, SelectOption } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useMemo } from 'react';

import { BasicI18nKey, ModelViewI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialModel } from '@/src/models/dial/model';
import { LimitType } from './constants';
import { getActiveLimitType, isLimitTypeSeparateTokenAndCompletions, isLimitTypeTotal } from './utils';

interface Props {
  model: DialModel;
  onChangeModel: (model: DialModel) => void;
}

const Limits: FC<Props> = ({ model, onChangeModel }) => {
  const t = useI18n();

  const items: SelectOption[] = [
    {
      value: LimitType.None,
      label: t(BasicI18nKey.None),
    },
    {
      value: LimitType.Total,
      label: t(ModelViewI18nKey.TotalNumbers),
    },
    {
      value: LimitType.SeparateTokenAndCompletions,
      label: t(ModelViewI18nKey.SeparatelyPromptsAndCompletions),
    },
  ];
  const activeLimitType = useMemo(() => getActiveLimitType(model?.limits), [model.limits]);

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
    (maxTotalTokens?: number | string) => {
      onChangeModel({ ...model, limits: { ...model.limits, maxTotalTokens } });
    },
    [onChangeModel, model],
  );

  const onChangeMaxCompletionTokens = useCallback(
    (maxCompletionTokens?: number | string) => {
      onChangeModel({ ...model, limits: { ...model.limits, maxCompletionTokens } });
    },
    [onChangeModel, model],
  );

  const onChangeMaxPromptTokens = useCallback(
    (maxPromptTokens?: number | string) => {
      onChangeModel({ ...model, limits: { ...model.limits, maxPromptTokens } });
    },
    [onChangeModel, model],
  );

  return (
    <div className="flex flex-row gap-x-2 items-center lg:w-[35%]">
      <DialSelectField
        value={activeLimitType}
        elementId="limits"
        options={items}
        fieldTitle={t(ModelViewI18nKey.InteractionLimit)}
        onChange={(type) => onChangeLimitType(type as string)}
      />

      {activeLimitType === LimitType.Total && (
        <DialNumberInputField
          elementId="totalNum"
          elementCssClass="flex-1"
          fieldTitle={t(ModelViewI18nKey.NumberOfTokens)}
          value={model.limits?.maxTotalTokens}
          onChange={onChangeMaxTotalTokens}
        />
      )}

      {activeLimitType === LimitType.SeparateTokenAndCompletions && (
        <>
          <DialNumberInputField
            elementId="promptsNum"
            elementCssClass="flex-1"
            fieldTitle={t(ModelViewI18nKey.Prompts)}
            value={model.limits?.maxPromptTokens}
            onChange={onChangeMaxPromptTokens}
          />
          <DialNumberInputField
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
