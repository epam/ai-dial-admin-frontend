import { ActionType } from '@/src/models/dial/publications';
import { ACTION_CLASS_NAME } from '@/src/constants/publications';
import { ApplicationRoute } from '@/src/types/routes';
import { PublicationsI18nKey } from '@/src/constants/i18n';

export function getActionClassName(action: ActionType): string {
  return ACTION_CLASS_NAME[action];
}

export function isAddAction(action: ActionType): boolean {
  return action === ActionType.ADD || action === ActionType.ADD_IF_ABSENT;
}

export function getModalsTranslations(route: ApplicationRoute, action: ActionType) {
  if (route === ApplicationRoute.PromptPublications) {
    return isAddAction(action)
      ? {
          ApproveModalTitle: PublicationsI18nKey.PromptPublishApproveModalTitle,
          DeclineModalTitle: PublicationsI18nKey.PromptPublishDeclineModalTitle,
          ApproveDescription: PublicationsI18nKey.PromptPublishApproveDescription,
        }
      : {
          ApproveModalTitle: PublicationsI18nKey.PromptUnpublishApproveModalTitle,
          DeclineModalTitle: PublicationsI18nKey.PromptUnpublishDeclineModalTitle,
          ApproveDescription: PublicationsI18nKey.PromptUnpublishApproveDescription,
        };
  } else if (route === ApplicationRoute.ApplicationPublications) {
    return isAddAction(action)
      ? {
          ApproveModalTitle: PublicationsI18nKey.ApplicationPublishApproveModalTitle,
          DeclineModalTitle: PublicationsI18nKey.ApplicationPublishDeclineModalTitle,
          ApproveDescription: PublicationsI18nKey.ApplicationPublishApproveDescription,
        }
      : {
          ApproveModalTitle: PublicationsI18nKey.ApplicationUnpublishApproveModalTitle,
          DeclineModalTitle: PublicationsI18nKey.ApplicationUnpublishDeclineModalTitle,
          ApproveDescription: PublicationsI18nKey.ApplicationUnpublishApproveDescription,
        };
  } else if (route === ApplicationRoute.ToolsetPublications) {
    return isAddAction(action)
      ? {
          ApproveModalTitle: PublicationsI18nKey.ToolsetPublishApproveModalTitle,
          DeclineModalTitle: PublicationsI18nKey.ToolsetPublishDeclineModalTitle,
          ApproveDescription: PublicationsI18nKey.ToolsetPublishApproveDescription,
        }
      : {
          ApproveModalTitle: PublicationsI18nKey.ToolsetUnpublishApproveModalTitle,
          DeclineModalTitle: PublicationsI18nKey.ToolsetUnpublishDeclineModalTitle,
          ApproveDescription: PublicationsI18nKey.ToolsetUnpublishApproveDescription,
        };
  }

  return isAddAction(action)
    ? {
        ApproveModalTitle: PublicationsI18nKey.FilePublishApproveModalTitle,
        DeclineModalTitle: PublicationsI18nKey.FilePublishDeclineModalTitle,
        ApproveDescription: PublicationsI18nKey.FilePublishApproveDescription,
      }
    : {
        ApproveModalTitle: PublicationsI18nKey.FileUnpublishApproveModalTitle,
        DeclineModalTitle: PublicationsI18nKey.FileUnpublishDeclineModalTitle,
        ApproveDescription: PublicationsI18nKey.FileUnpublishApproveDescription,
      };
}
