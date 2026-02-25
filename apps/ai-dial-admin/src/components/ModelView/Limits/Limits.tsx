import { DialNumberInput, DialSelectField, SelectOption } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useMemo } from 'react';

import { BasicI18nKey, EntityPlaceholdersI18nKey, ModelViewI18nKey } from '@/src/constants/i18n';
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
        model.limits = { maxTotalTokens: '' };
      } else if (isLimitTypeSeparateTokenAndCompletions(type)) {
        model.limits = {
          maxCompletionTokens: '',
          maxPromptTokens: '',
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
    <div className="flex flex-row gap-x-2 items-center">
      <DialSelectField
        value={activeLimitType}
        elementId="limits"
        options={items}
        className="w-[220px]"
        containerClassName="w-[220px]"
        fieldTitle={t(ModelViewI18nKey.InteractionLimit)}
        onChange={(type) => onChangeLimitType(type as string)}
      />

      {activeLimitType === LimitType.Total && (
        <DialNumberInput
          elementId="totalNum"
          elementClassName="flex-1"
          fieldTitle={t(ModelViewI18nKey.NumberOfTokens)}
          placeholder={t(EntityPlaceholdersI18nKey.Value)}
          value={model.limits?.maxTotalTokens}
          onChange={onChangeMaxTotalTokens}
          containerClassName="w-[150px]"
        />
      )}

      {activeLimitType === LimitType.SeparateTokenAndCompletions && (
        <>
          <DialNumberInput
            elementId="promptsNum"
            elementClassName="flex-1"
            fieldTitle={t(ModelViewI18nKey.Prompts)}
            value={model.limits?.maxPromptTokens}
            placeholder={t(EntityPlaceholdersI18nKey.Value)}
            onChange={onChangeMaxPromptTokens}
            containerClassName="w-[150px]"
          />
          <DialNumberInput
            elementId="completionsNum"
            elementClassName="flex-1"
            fieldTitle={t(ModelViewI18nKey.Completions)}
            placeholder={t(EntityPlaceholdersI18nKey.Value)}
            value={model.limits?.maxCompletionTokens}
            onChange={onChangeMaxCompletionTokens}
            containerClassName="w-[150px]"
          />
        </>
      )}
    </div>
  );
};

export default Limits;
