import { PublicationsI18nKey } from '@/src/constants/i18n';
import { ActionType } from '@/src/models/dial/publications';

export const ACTION_I18N_KEYS: Record<ActionType, string> = {
  [ActionType.ADD]: PublicationsI18nKey.ActionPublish,
  [ActionType.DELETE]: PublicationsI18nKey.ActionUnpublish,
};

export const ACTION_CLASSNAMES: Record<ActionType, string> = {
  [ActionType.ADD]: 'bg-accent-primary',
  [ActionType.DELETE]: 'bg-red-400',
};
