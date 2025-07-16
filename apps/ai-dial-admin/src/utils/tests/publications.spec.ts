import { ActionType } from '@/src/models/dial/publications';
import { getActionClass, getModalsTranslations } from '../publications';
import { ApplicationRoute } from '@/src/types/routes';
import { PublicationsI18nKey } from '@/src/constants/i18n';
import { describe, expect, test } from 'vitest';

describe('Utils :: publications :: getActionClass', () => {
  test('Should correctly return action class name', () => {
    expect(getActionClass('add' as ActionType)).toBeTruthy();
    expect(getActionClass('delete' as ActionType)).toBeTruthy();
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
});
