'use client';

import { FC, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialConfirmationPopup, DialGhostButton, DialNeutralButton, DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { transitionVisibility } from '@/src/app/[lang]/datasets/actions';
import { updateTestSuite } from '@/src/app/[lang]/test-suites/actions';
import PickPublicDataset from '@/src/components/TestSuites/TestCases/DatasetBinding/PickPublicDataset';
import { ButtonsI18nKey, DatasetsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { Dataset, DatasetVisibility, DatasetVisibilityTransition } from '@/src/models/evaluation/dataset';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

interface Props {
  dataset: Dataset;
  selectedTestSuite: TestSuite;
  etag: string;
  onChangeDataset?: (dataset: Dataset) => void;
}

const DatasetHeader: FC<Props> = ({ dataset, selectedTestSuite, etag, onChangeDataset }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();

  const [isMakePublicOpen, setIsMakePublicOpen] = useState(false);
  const [isUnbindOpen, setIsUnbindOpen] = useState(false);
  const [isChangeOpen, setIsChangeOpen] = useState(false);

  const isPrivate = dataset.visibility === DatasetVisibility.PRIVATE;

  const onMakePublic = useCallback(() => {
    const body: DatasetVisibilityTransition = { visibility: DatasetVisibility.PUBLIC };
    transitionVisibility(dataset.id as string, body).then((res) => {
      if (res.success) {
        showNotification(getSuccessNotification(t(DatasetsI18nKey.MakePublicSuccess)));
        onChangeDataset?.({ ...dataset, visibility: DatasetVisibility.PUBLIC });
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
    setIsMakePublicOpen(false);
  }, [dataset, onChangeDataset, showNotification, t, router]);

  const onUnbind = useCallback(() => {
    updateTestSuite({ ...selectedTestSuite, datasetId: undefined }, etag).then((res) => {
      if (res.success) {
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
    setIsUnbindOpen(false);
  }, [selectedTestSuite, etag, showNotification, router]);

  const onChangeDatasetPick = useCallback(
    async (datasetId: string) => {
      setIsChangeOpen(false);
      const updateRes = await updateTestSuite({ ...selectedTestSuite, datasetId }, etag);
      if (!updateRes.success) {
        showNotification(getErrorNotification(updateRes.errorHeader, updateRes.errorMessage));
        return;
      }
      router.refresh();
    },
    [selectedTestSuite, etag, showNotification, router],
  );

  const description = isPrivate
    ? t(TestSuitesI18nKey.DatasetPrivateDescription)
    : t(TestSuitesI18nKey.DatasetPublicDescription);

  const datasetPageUrl = `${ApplicationRoute.Datasets}/${dataset.id}`;

  return (
    <div className="flex flex-col gap-2">
      <h1>{t(TestSuitesI18nKey.Dataset)}</h1>
      <div className="flex flex-row items-center gap-3 p-3 bg-layer-3 rounded mb-3">
        <span className="flex-shrink-0 text-xs text-secondary font-mono">{dataset.id}</span>

        <span
          className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded ${
            isPrivate ? 'bg-warning-secondary text-warning' : 'bg-success-secondary text-success'
          }`}
        >
          {isPrivate ? t(DatasetsI18nKey.VisibilityPrivate) : t(DatasetsI18nKey.VisibilityPublic)}
        </span>

        <div className="flex-1" />

        <p className="flex-shrink-0 text-xs text-secondary">{description}</p>

        <Link href={datasetPageUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
          <DialGhostButton
            label={t(TestSuitesI18nKey.OpenDataset)}
            iconBefore={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
          />
        </Link>

        {isPrivate ? (
          <DialPrimaryButton label={t(DatasetsI18nKey.MakePublic)} onClick={() => setIsMakePublicOpen(true)} />
        ) : (
          <>
            <DialGhostButton label={t(TestSuitesI18nKey.ChangeDataset)} onClick={() => setIsChangeOpen(true)} />
            <DialNeutralButton label={t(TestSuitesI18nKey.UnbindDataset)} onClick={() => setIsUnbindOpen(true)} />
          </>
        )}
      </div>

      {isMakePublicOpen &&
        createPortal(
          <DialConfirmationPopup
            open={isMakePublicOpen}
            header={t(TestSuitesI18nKey.MakePublicDatasetConfirmTitle)}
            description={t(TestSuitesI18nKey.MakePublicDatasetConfirmDescription)}
            onClose={() => setIsMakePublicOpen(false)}
            onConfirm={onMakePublic}
            confirmLabel={t(ButtonsI18nKey.Confirm)}
          />,
          document.body,
        )}

      {isUnbindOpen &&
        createPortal(
          <DialConfirmationPopup
            open={isUnbindOpen}
            header={t(TestSuitesI18nKey.UnbindDatasetConfirmTitle)}
            description={t(TestSuitesI18nKey.UnbindDatasetConfirmDescription)}
            onClose={() => setIsUnbindOpen(false)}
            onConfirm={onUnbind}
            confirmLabel={t(ButtonsI18nKey.Confirm)}
          />,
          document.body,
        )}

      {isChangeOpen && (
        <PickPublicDataset
          isOpen={isChangeOpen}
          onClose={() => setIsChangeOpen(false)}
          onConfirm={onChangeDatasetPick}
        />
      )}
    </div>
  );
};

export default DatasetHeader;
