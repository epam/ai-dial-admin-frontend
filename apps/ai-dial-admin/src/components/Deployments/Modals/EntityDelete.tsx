import { FC, useMemo } from 'react';
import classNames from 'classnames';
import { DialConfirmationPopup } from '@epam/ai-dial-ui-kit';
import { ApplicationRoute } from '@/src/types/routes';
import { Container } from '@/src/models/deployments/containers';
import { useI18n } from '@/src/locales/client';
import { ButtonsI18nKey, ImagesI18nKey } from '@/src/constants/i18n';
import { getTranslatedType } from '@/src/utils/deployments/entity';
import DependenciesList from '@/src/components/Containers/List/DependenciesList';

interface Props {
  title: string;
  description: string;
  isModalOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  route: ApplicationRoute;
  dependencies?: Container[];
}

const EntityDeleteModal: FC<Props> = ({ title, description, isModalOpen, onClose, onApply, dependencies, route }) => {
  const t = useI18n();

  const containerClassNames = useMemo(() => {
    return classNames(
      'flex flex-col',
      !dependencies?.length ? 'lg:max-w-[400px] md:max-w-[400px]' : 'lg:max-w-[800px] md:max-w-[90%]',
    );
  }, [dependencies]);

  return (
    <DialConfirmationPopup
      onClose={onClose}
      header={title}
      portalId="DeleteImageModal"
      open={isModalOpen}
      className={containerClassNames}
      onConfirm={() => {
        onApply();
        onClose();
      }}
      confirmLabel={t(ButtonsI18nKey.Delete)}
    >
      <div className="flex flex-col h-full overflow-auto px-6 py-4">
        <p className="text-secondary small-150">{description}</p>
        {!!dependencies?.length && (
          <>
            <p className="text-secondary small-150 mb-4">
              {t(ImagesI18nKey.DeleteModalDependency, { type: getTranslatedType(route, t) })}
            </p>
            <p className="text-primary small-text-semi mb-4">
              {t(ImagesI18nKey.ModalRelatedContainers, { type: getTranslatedType(route, t) })}
            </p>
            <DependenciesList containerList={dependencies} route={route} />
          </>
        )}
      </div>
    </DialConfirmationPopup>
  );
};

export default EntityDeleteModal;
