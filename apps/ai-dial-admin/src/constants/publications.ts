import { ButtonsI18nKey } from '@/src/constants/i18n';
import { ActionType } from '@/src/models/dial/publications';

export const ACTION_I18N_KEYS: Record<ActionType, string> = {
  [ActionType.ADD]: ButtonsI18nKey.Publish,
  [ActionType.ADD_IF_ABSENT]: ButtonsI18nKey.Publish,
  [ActionType.DELETE]: ButtonsI18nKey.Unpublish,
};

export const ACTION_CLASS_NAME: Record<ActionType, string> = {
  [ActionType.ADD]: 'bg-accent-primary',
  [ActionType.ADD_IF_ABSENT]: 'bg-accent-primary',
  [ActionType.DELETE]: 'bg-red-400',
};
