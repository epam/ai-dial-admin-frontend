import DuplicateAdapter from '@/src/components/Adapter/Modals/DuplicateAdapter';
import DuplicateScheme from '@/src/components/ApplicationRunners/Modals/DuplicateAppRunner';
import DuplicatePopup from '@/src/components/DuplicatePopup/DuplicatePopup';
import DuplicateInterceptorTemplate from '@/src/components/InterceptorTemplates/Modals/Duplicate';
import DuplicateKey from '@/src/components/KeysList/Popup/DuplicateKey';
import DuplicatePrompt from '@/src/components/PromptView/Modals/DuplicatePrompt';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ServerActionResponse } from '@/src/models/server-action';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';

export const getDuplicateModal = <T extends object>(
  currentEntity: T | undefined,
  names: string[],
  keys: string[],
  route: ApplicationRoute,
  versionsMap: Record<string, string[]>,
  modalState: PopUpState,
  handleModalClose: () => void,
  onDuplicate: (entity: BaseEntity) => Promise<ServerActionResponse>,
) => {
  if (!currentEntity) return null;

  if (route === ApplicationRoute.ApplicationRunners) {
    return (
      <DuplicateScheme
        entity={currentEntity}
        onDuplicate={onDuplicate}
        modalState={modalState}
        onClose={handleModalClose}
      />
    );
  }

  if (route === ApplicationRoute.InterceptorTemplates) {
    return (
      <DuplicateInterceptorTemplate
        template={currentEntity}
        onDuplicate={onDuplicate}
        modalState={modalState}
        onClose={handleModalClose}
        names={names}
      />
    );
  }
  if (route === ApplicationRoute.Adapters) {
    return (
      <DuplicateAdapter
        adapter={currentEntity}
        onDuplicate={onDuplicate}
        modalState={modalState}
        onClose={handleModalClose}
      />
    );
  }

  if (route === ApplicationRoute.Keys) {
    return (
      <DuplicateKey
        entity={currentEntity}
        onDuplicate={onDuplicate}
        modalState={modalState}
        names={names}
        keys={keys}
        onClose={handleModalClose}
      />
    );
  }

  if (route === ApplicationRoute.Prompts) {
    return (
      <DuplicatePrompt
        entity={currentEntity as DialPrompt}
        versionsMap={versionsMap}
        onDuplicate={onDuplicate}
        modalState={modalState}
        onClose={handleModalClose}
      />
    );
  }
  return (
    <DuplicatePopup
      view={route}
      names={names || []}
      entity={currentEntity}
      onDuplicate={onDuplicate}
      modalState={modalState}
      onClose={handleModalClose}
    />
  );
};
