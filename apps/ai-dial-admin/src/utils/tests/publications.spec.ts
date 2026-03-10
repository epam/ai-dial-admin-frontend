import { ActionType } from '@/src/models/dial/publications';
import { getActionClassName, getModalsTranslations, isAddAction } from '../publications';
import { ApplicationRoute } from '@/src/types/routes';
import { PublicationsI18nKey } from '@/src/constants/i18n';
import { describe, expect, test } from 'vitest';

describe('Utils :: publications :: getActionClass', () => {
  test('Should correctly return action class name', () => {
    expect(getActionClassName('add' as ActionType)).toBeTruthy();
    expect(getActionClassName('delete' as ActionType)).toBeTruthy();
  });
});

describe('isAddAction', () => {
  test('should return true for ADD action', () => {
    const result = isAddAction(ActionType.ADD);
    expect(result).toBeTruthy();
  });
  test('should return true for ADD_IF_ABSENT action', () => {
    const result = isAddAction(ActionType.ADD_IF_ABSENT);
    expect(result).toBeTruthy();
  });
  test('should return true for DELETE action', () => {
    const result = isAddAction(ActionType.DELETE);
    expect(result).toBeFalsy();
  });
});

describe('getModalsTranslations', () => {
  test('returns prompt publication approve translations', () => {
    const result = getModalsTranslations(ApplicationRoute.PromptPublications, ActionType.ADD);
    expect(result).toEqual({
      ApproveModalTitle: PublicationsI18nKey.PromptPublishApproveModalTitle,
      DeclineModalTitle: PublicationsI18nKey.PromptPublishDeclineModalTitle,
      ApproveDescription: PublicationsI18nKey.PromptPublishApproveDescription,
    });
  });

  test('returns prompt publication unpublish translations', () => {
    const result = getModalsTranslations(ApplicationRoute.PromptPublications, ActionType.REMOVE);
    expect(result).toEqual({
      ApproveModalTitle: PublicationsI18nKey.PromptUnpublishApproveModalTitle,
      DeclineModalTitle: PublicationsI18nKey.PromptUnpublishDeclineModalTitle,
      ApproveDescription: PublicationsI18nKey.PromptUnpublishApproveDescription,
    });
  });

  test('returns file publication approve translations', () => {
    const result = getModalsTranslations(ApplicationRoute.FilePublications, ActionType.ADD);
    expect(result).toEqual({
      ApproveModalTitle: PublicationsI18nKey.FilePublishApproveModalTitle,
      DeclineModalTitle: PublicationsI18nKey.FilePublishDeclineModalTitle,
      ApproveDescription: PublicationsI18nKey.FilePublishApproveDescription,
    });
  });

  test('returns file publication unpublish translations', () => {
    const result = getModalsTranslations(ApplicationRoute.FilePublications, ActionType.REMOVE);
    expect(result).toEqual({
      ApproveModalTitle: PublicationsI18nKey.FileUnpublishApproveModalTitle,
      DeclineModalTitle: PublicationsI18nKey.FileUnpublishDeclineModalTitle,
      ApproveDescription: PublicationsI18nKey.FileUnpublishApproveDescription,
    });
  });

  test('returns application publication approve translations', () => {
    const result = getModalsTranslations(ApplicationRoute.ApplicationPublications, ActionType.ADD);
    expect(result).toEqual({
      ApproveModalTitle: PublicationsI18nKey.ApplicationPublishApproveModalTitle,
      DeclineModalTitle: PublicationsI18nKey.ApplicationPublishDeclineModalTitle,
      ApproveDescription: PublicationsI18nKey.ApplicationPublishApproveDescription,
    });
  });

  test('returns application publication unpublish translations', () => {
    const result = getModalsTranslations(ApplicationRoute.ApplicationPublications, ActionType.REMOVE);
    expect(result).toEqual({
      ApproveModalTitle: PublicationsI18nKey.ApplicationUnpublishApproveModalTitle,
      DeclineModalTitle: PublicationsI18nKey.ApplicationUnpublishDeclineModalTitle,
      ApproveDescription: PublicationsI18nKey.ApplicationUnpublishApproveDescription,
    });
  });

  test('returns toolset publication approve translations', () => {
    const result = getModalsTranslations(ApplicationRoute.ToolsetPublications, ActionType.ADD);
    expect(result).toEqual({
      ApproveModalTitle: PublicationsI18nKey.ToolsetPublishApproveModalTitle,
      DeclineModalTitle: PublicationsI18nKey.ToolsetPublishDeclineModalTitle,
      ApproveDescription: PublicationsI18nKey.ToolsetPublishApproveDescription,
    });
  });

  test('returns toolset publication unpublish translations', () => {
    const result = getModalsTranslations(ApplicationRoute.ToolsetPublications, ActionType.REMOVE);
    expect(result).toEqual({
      ApproveModalTitle: PublicationsI18nKey.ToolsetUnpublishApproveModalTitle,
      DeclineModalTitle: PublicationsI18nKey.ToolsetUnpublishDeclineModalTitle,
      ApproveDescription: PublicationsI18nKey.ToolsetUnpublishApproveDescription,
    });
  });
});
