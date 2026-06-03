'use client';

import { FC, useCallback, useState } from 'react';

import { DialGhostButton, DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { IconCirclePlus, IconHandFinger } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

import { createDataset } from '@/src/app/[lang]/datasets/actions';
import { updateTestSuite } from '@/src/app/[lang]/test-suites/actions';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DatasetVisibility } from '@/src/models/evaluation/dataset';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { getErrorNotification } from '@/src/utils/notification';
import PickPublicDataset from './PickPublicDataset';

interface Props {
  selectedTestSuite: TestSuite;
  suiteEtag: string;
}

const DatasetBinding: FC<Props> = ({ selectedTestSuite, suiteEtag }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();

  const [isPickModalOpen, setIsPickModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const onCreatePrivate = useCallback(async () => {
    if (!selectedTestSuite.id) return;
    setIsCreating(true);

    const createRes = await createDataset({
      name: `DATASET_${selectedTestSuite.id}`,
      visibility: DatasetVisibility.PRIVATE,
      bindToSuiteId: selectedTestSuite.id,
    });
    if (!createRes.success) {
      showNotification(getErrorNotification(createRes.errorHeader, createRes.errorMessage));
      setIsCreating(false);
      return;
    }

    router.refresh();
  }, [selectedTestSuite, showNotification, router]);

  const onPickConfirm = useCallback(
    async (datasetId: string) => {
      setIsPickModalOpen(false);
      const updateRes = await updateTestSuite({ ...selectedTestSuite, datasetId }, suiteEtag);
      if (!updateRes.success) {
        showNotification(getErrorNotification(updateRes.errorHeader, updateRes.errorMessage));
        return;
      }
      router.refresh();
    },
    [selectedTestSuite, suiteEtag, showNotification, router],
  );

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <p className="text-secondary">{t(TestSuitesI18nKey.DatasetNotBound)}</p>
      <div className="flex gap-3">
        <DialPrimaryButton
          label={t(TestSuitesI18nKey.PickPublicDataset)}
          iconBefore={<IconHandFinger {...BASE_BUTTON_ICON_PROPS} />}
          onClick={() => setIsPickModalOpen(true)}
        />
        <DialGhostButton
          label={t(TestSuitesI18nKey.CreatePrivateDataset)}
          iconBefore={<IconCirclePlus {...BASE_BUTTON_ICON_PROPS} />}
          onClick={onCreatePrivate}
          disabled={isCreating}
        />
      </div>

      {isPickModalOpen && (
        <PickPublicDataset
          isOpen={isPickModalOpen}
          onClose={() => setIsPickModalOpen(false)}
          onConfirm={onPickConfirm}
        />
      )}
    </div>
  );
};

export default DatasetBinding;
