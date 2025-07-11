import { ActionType } from '@/src/models/dial/publications';
import { ACTION_CLASSNAMES } from '@/src/constants/publications';
import { ApplicationRoute } from '@/src/types/routes';
import { PublicationsI18nKey } from '@/src/constants/i18n';

export function getActionClass(action: ActionType): string {
  return ACTION_CLASSNAMES[action];
}

export function getModalsTranslations(route: ApplicationRoute, action: ActionType) {
  if (route === ApplicationRoute.PromptPublications) {
    if (action === ActionType.ADD) {
      return {
        ApproveModalTitle: PublicationsI18nKey.PromptPublishApproveModalTitle,
        DeclineModalTitle: PublicationsI18nKey.PromptPublishDeclineModalTitle,
        ApproveDescription: PublicationsI18nKey.PromptPublishApproveDescription,
      };
    } else {
      return {
        ApproveModalTitle: PublicationsI18nKey.PromptUnpublishApproveModalTitle,
        DeclineModalTitle: PublicationsI18nKey.PromptUnpublishDeclineModalTitle,
        ApproveDescription: PublicationsI18nKey.PromptUnpublishApproveDescription,
      };
    }
  } else if (route === ApplicationRoute.ApplicationPublications) {
    if (action === ActionType.ADD) {
      return {
        ApproveModalTitle: PublicationsI18nKey.ApplicationPublishApproveModalTitle,
        DeclineModalTitle: PublicationsI18nKey.ApplicationPublishDeclineModalTitle,
        ApproveDescription: PublicationsI18nKey.ApplicationPublishApproveDescription,
      };
    } else {
      return {
        ApproveModalTitle: PublicationsI18nKey.ApplicationUnpublishApproveModalTitle,
        DeclineModalTitle: PublicationsI18nKey.ApplicationUnpublishDeclineModalTitle,
        ApproveDescription: PublicationsI18nKey.ApplicationUnpublishApproveDescription,
      };
    }
  } else {
    if (action === ActionType.ADD) {
      return {
        ApproveModalTitle: PublicationsI18nKey.FilePublishApproveModalTitle,
        DeclineModalTitle: PublicationsI18nKey.FilePublishDeclineModalTitle,
        ApproveDescription: PublicationsI18nKey.FilePublishApproveDescription,
      };
    } else {
      return {
        ApproveModalTitle: PublicationsI18nKey.FileUnpublishApproveModalTitle,
        DeclineModalTitle: PublicationsI18nKey.FileUnpublishDeclineModalTitle,
        ApproveDescription: PublicationsI18nKey.FileUnpublishApproveDescription,
      };
    }
  }
}
