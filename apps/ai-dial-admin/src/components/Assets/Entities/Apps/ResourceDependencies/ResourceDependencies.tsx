'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { NoDataContent } from '@epam/ai-dial-ui-kit';

import { ResourceDependenciesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplication } from '@/src/models/dial/application';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { ResourceAccess, ResourceDependency } from '@/src/models/dial/resource-dependency';
import AdminConsent from './AdminConsent/AdminConsent';
import DependenciesGrid from './DependenciesGrid';
import DependencyModal from './DependencyModal';
import { DependencyFormValues } from './models';
import { getCopyLinkId } from './utils/copy-link-id';
import {
  addDependency,
  insertDependencyAfter,
  isDeclarationDirty,
  removeDependency,
  replaceDependency,
  toDependency,
  toFormValues,
} from './utils/update-dependencies';
import { useAdminConsent } from './use-admin-consent';

interface Props {
  selectedApplication: DialApplication;
  originalApplication: AssetApp;
  etag: string;
  onChangeApplication: (application: DialApplication) => void;
}

interface ModalState {
  /** Index of the dependency being edited; absent when adding. */
  index?: number;
}

const NEW_DEPENDENCY: DependencyFormValues = { linkId: '', path: '', access: [ResourceAccess.Read], isRequired: false };

const ResourceDependencies: FC<Props> = ({ selectedApplication, originalApplication, etag, onChangeApplication }) => {
  const t = useI18n();
  const [modal, setModal] = useState<ModalState | null>(null);

  const appPath = originalApplication.path ?? originalApplication._metadata?.path ?? '';
  const { status, isLoading, hasFailed, isMutating, approve, revoke } = useAdminConsent(appPath, etag);

  const dependencies = useMemo(() => selectedApplication.resource_dependencies ?? [], [selectedApplication]);
  const isDirty = isDeclarationDirty(
    originalApplication.resource_dependencies,
    selectedApplication.resource_dependencies,
  );

  const onChangeDependencies = useCallback(
    (next?: ResourceDependency[]) => onChangeApplication({ ...selectedApplication, resource_dependencies: next }),
    [onChangeApplication, selectedApplication],
  );

  const onOpenAdd = useCallback(() => setModal({}), []);
  const onCloseModal = useCallback(() => setModal(null), []);

  const onOpenEdit = useCallback(
    (dependency?: ResourceDependency) => {
      const index = dependency ? dependencies.indexOf(dependency) : -1;
      if (index >= 0) {
        setModal({ index });
      }
    },
    [dependencies],
  );

  const onDuplicate = useCallback(
    (dependency?: ResourceDependency) => {
      const index = dependency ? dependencies.indexOf(dependency) : -1;
      if (!dependency || index < 0) {
        return;
      }
      const linkId = getCopyLinkId(
        dependency.link_id,
        dependencies.map((current) => current.link_id),
      );
      onChangeDependencies(insertDependencyAfter(dependencies, index, { ...dependency, link_id: linkId }));
    },
    [dependencies, onChangeDependencies],
  );

  const onRemove = useCallback(
    (dependency?: ResourceDependency) => {
      const index = dependency ? dependencies.indexOf(dependency) : -1;
      if (index >= 0) {
        onChangeDependencies(removeDependency(dependencies, index));
      }
    },
    [dependencies, onChangeDependencies],
  );

  const onConfirmModal = useCallback(
    (values: DependencyFormValues) => {
      const dependency = toDependency(values);
      onChangeDependencies(
        modal?.index == null
          ? addDependency(dependencies, dependency)
          : replaceDependency(dependencies, modal.index, dependency),
      );
      setModal(null);
    },
    [dependencies, modal, onChangeDependencies],
  );

  if (hasFailed) {
    return <NoDataContent title={t(ResourceDependenciesI18nKey.ConsentUnavailable)} />;
  }

  const editedIndex = modal?.index;

  return (
    <div className="flex flex-col h-full min-h-0">
      <AdminConsent
        savedDependencies={originalApplication.resource_dependencies}
        isDirty={isDirty}
        status={status}
        isLoading={isLoading}
        isMutating={isMutating}
        onApprove={approve}
        onRevoke={revoke}
      />
      <DependenciesGrid
        dependencies={dependencies}
        onAdd={onOpenAdd}
        onEdit={onOpenEdit}
        onDuplicate={onDuplicate}
        onRemove={onRemove}
      />
      {modal && (
        <DependencyModal
          isEdit={editedIndex != null}
          initialValues={editedIndex != null ? toFormValues(dependencies[editedIndex]) : NEW_DEPENDENCY}
          otherLinkIds={dependencies.filter((_, index) => index !== editedIndex).map((current) => current.link_id)}
          onClose={onCloseModal}
          onConfirm={onConfirmModal}
        />
      )}
    </div>
  );
};

export default ResourceDependencies;
