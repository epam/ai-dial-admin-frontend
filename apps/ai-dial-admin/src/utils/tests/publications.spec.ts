import { ActionType } from '@/src/models/dial/publications';
import {
  getActionClassName,
  getModalsTranslations,
  getPublicationEntityLabel,
  getPublicationTypeLabel,
  getPublicationView,
  isAddAction,
  isComplexResourcePublicationView,
} from '../publications';
import { ResourceType } from '@/src/types/resource-type';
import { ApplicationRoute } from '@/src/types/routes';
import { PublicationsI18nKey } from '@/src/constants/i18n';
import { describe, expect, test } from 'vitest';

const t = (key: string) => key;

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
    const result = getModalsTranslations(ApplicationRoute.PromptPublications, ActionType.DELETE);
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
    const result = getModalsTranslations(ApplicationRoute.FilePublications, ActionType.DELETE);
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
    const result = getModalsTranslations(ApplicationRoute.ApplicationPublications, ActionType.DELETE);
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
    const result = getModalsTranslations(ApplicationRoute.ToolsetPublications, ActionType.DELETE);
    expect(result).toEqual({
      ApproveModalTitle: PublicationsI18nKey.ToolsetUnpublishApproveModalTitle,
      DeclineModalTitle: PublicationsI18nKey.ToolsetUnpublishDeclineModalTitle,
      ApproveDescription: PublicationsI18nKey.ToolsetUnpublishApproveDescription,
    });
  });
});

describe('getPublicationEntityLabel', () => {
  test('returns the application publication entity key', () => {
    expect(getPublicationEntityLabel(ApplicationRoute.ApplicationPublications, t)).toBe(
      PublicationsI18nKey.ApplicationPublicationEntity,
    );
  });

  test('returns the toolset publication entity key', () => {
    expect(getPublicationEntityLabel(ApplicationRoute.ToolsetPublications, t)).toBe(
      PublicationsI18nKey.ToolsetPublicationEntity,
    );
  });

  test('returns the prompt publication entity key', () => {
    expect(getPublicationEntityLabel(ApplicationRoute.PromptPublications, t)).toBe(
      PublicationsI18nKey.PromptPublicationEntity,
    );
  });

  test('returns the file publication entity key', () => {
    expect(getPublicationEntityLabel(ApplicationRoute.FilePublications, t)).toBe(
      PublicationsI18nKey.FilePublicationEntity,
    );
  });

  test('returns the conversation publication entity key', () => {
    expect(getPublicationEntityLabel(ApplicationRoute.ConversationPublications, t)).toBe(
      PublicationsI18nKey.ConversationPublicationEntity,
    );
  });

  test('returns the project publication entity key', () => {
    expect(getPublicationEntityLabel(ApplicationRoute.ProjectPublications, t)).toBe(
      PublicationsI18nKey.ProjectPublicationEntity,
    );
  });

  test('returns the skill publication entity key', () => {
    expect(getPublicationEntityLabel(ApplicationRoute.SkillPublications, t)).toBe(
      PublicationsI18nKey.SkillPublicationEntity,
    );
  });
});

describe('getPublicationView', () => {
  test('maps every publishable resource type to its view', () => {
    expect(getPublicationView(ResourceType.APPLICATION)).toBe(ApplicationRoute.ApplicationPublications);
    expect(getPublicationView(ResourceType.TOOLSET)).toBe(ApplicationRoute.ToolsetPublications);
    expect(getPublicationView(ResourceType.PROMPT)).toBe(ApplicationRoute.PromptPublications);
    expect(getPublicationView(ResourceType.FILE)).toBe(ApplicationRoute.FilePublications);
    expect(getPublicationView(ResourceType.CONVERSATION)).toBe(ApplicationRoute.ConversationPublications);
    expect(getPublicationView(ResourceType.SKILL)).toBe(ApplicationRoute.SkillPublications);
    expect(getPublicationView(ResourceType.PROJECT)).toBe(ApplicationRoute.ProjectPublications);
  });

  test('returns undefined for a missing or non-publishable type', () => {
    expect(getPublicationView(undefined)).toBeUndefined();
    expect(getPublicationView('bogus')).toBeUndefined();
    expect(getPublicationView(ResourceType.MODEL)).toBeUndefined();
  });
});

describe('getPublicationTypeLabel', () => {
  test('returns the translated label of a publishable type', () => {
    expect(getPublicationTypeLabel(ResourceType.SKILL, t)).toBe(PublicationsI18nKey.SkillType);
    expect(getPublicationTypeLabel(ResourceType.PROJECT, t)).toBe(PublicationsI18nKey.ProjectType);
  });

  test('returns an empty string for a missing or non-publishable type', () => {
    expect(getPublicationTypeLabel(undefined, t)).toBe('');
    expect(getPublicationTypeLabel(ResourceType.MODEL, t)).toBe('');
  });
});

describe('getModalsTranslations — project publications', () => {
  test('returns the publish keys for an add action', () => {
    expect(getModalsTranslations(ApplicationRoute.ProjectPublications, ActionType.ADD)).toEqual({
      ApproveModalTitle: PublicationsI18nKey.ProjectPublishApproveModalTitle,
      DeclineModalTitle: PublicationsI18nKey.ProjectPublishDeclineModalTitle,
      ApproveDescription: PublicationsI18nKey.ProjectPublishApproveDescription,
    });
  });

  test('returns the unpublish keys for a delete action', () => {
    expect(getModalsTranslations(ApplicationRoute.ProjectPublications, ActionType.DELETE)).toEqual({
      ApproveModalTitle: PublicationsI18nKey.ProjectUnpublishApproveModalTitle,
      DeclineModalTitle: PublicationsI18nKey.ProjectUnpublishDeclineModalTitle,
      ApproveDescription: PublicationsI18nKey.ProjectUnpublishApproveDescription,
    });
  });
});

describe('isComplexResourcePublicationView', () => {
  test.each([ApplicationRoute.SkillPublications, ApplicationRoute.ProjectPublications])('is true for %s', (view) => {
    expect(isComplexResourcePublicationView(view)).toBe(true);
  });

  test.each([
    ApplicationRoute.ApplicationPublications,
    ApplicationRoute.ToolsetPublications,
    ApplicationRoute.PromptPublications,
    ApplicationRoute.FilePublications,
    ApplicationRoute.ConversationPublications,
  ])('is false for %s', (view) => {
    expect(isComplexResourcePublicationView(view)).toBe(false);
  });
});
