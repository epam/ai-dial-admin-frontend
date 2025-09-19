'use client';

import { Dispatch, SetStateAction, useCallback, useMemo } from 'react';

import { IconFileArrowRight, IconTrashX, IconX } from '@tabler/icons-react';

import { exportFiles } from '@/src/app/[lang]/files/actions';
import { exportPrompts } from '@/src/app/[lang]/prompts/actions';
import Button from '@/src/components/Common/Button/Button';
import { generateExportList } from '@/src/components/ExportAssets/export';
import { BasicI18nKey, ButtonsI18nKey, ExportI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { FileFolderContextType } from '@/src/context/FileFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { PromptFolderContextType } from '@/src/context/PromptFolderContext';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { downloadFile } from '@/src/utils/download';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { ModalType } from './Modals';

interface Props {
  route: ApplicationRoute;
  context?: () => PromptFolderContextType | FileFolderContextType;
  setModalState: Dispatch<SetStateAction<PopUpState>>;
  setModalType: Dispatch<SetStateAction<ModalType | undefined>>;
  setIsBulkView: Dispatch<SetStateAction<boolean>>;
}

const BulkButtons = ({ route, context, setModalState, setModalType, setIsBulkView }: Props) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const folderContext = context?.();

  const exportData = useMemo(() => {
    return generateExportList(folderContext?.bulkSelectedData);
  }, [folderContext?.bulkSelectedData]);

  const onExport = useCallback(() => {
    const type = t(route === ApplicationRoute.Prompts ? MenuI18nKey.Prompts : MenuI18nKey.Files);
    const exportFunction = route === ApplicationRoute.Prompts ? exportPrompts : exportFiles;

    exportFunction(exportData)
      .then(({ blob, fileName }) => {
        showNotification(
          getSuccessNotification(t(ExportI18nKey.SuccessTitle, { type }), t(ExportI18nKey.SuccessDescription)),
        );
        downloadFile(blob, fileName);
      })
      .catch(() => {
        showNotification(
          getErrorNotification(t(ExportI18nKey.ErrorTitle, { type }), t(ExportI18nKey.ErrorDescription)),
        );
      })
      .finally(() => {
        folderContext?.setBulkSelectedData({});
        setIsBulkView(false);
      });
  }, [exportData, folderContext, route, setIsBulkView, showNotification, t]);

  return (
    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-layer-0 flex flex-row gap-4 items-center">
      <div className="text-secondary">
        {exportData.length} {t(BasicI18nKey.Selected)}
      </div>
      <div className="bg-layer-4 h-5 w-[1px]"></div>
      <Button
        cssClass="secondary"
        title={t(ButtonsI18nKey.Export)}
        iconBefore={<IconFileArrowRight {...BASE_ICON_PROPS} />}
        disable={!exportData.length}
        onClick={onExport}
      />
      {route === ApplicationRoute.Prompts && (
        <Button
          cssClass="secondary"
          title={t(ButtonsI18nKey.Delete)}
          iconBefore={<IconTrashX {...BASE_ICON_PROPS} />}
          disable={!exportData.length}
          onClick={() => {
            setModalType(ModalType.deleteBulk);
            setModalState(PopUpState.Opened);
          }}
        />
      )}
      <Button
        cssClass="text-secondary hover:text-accent-primary"
        onClick={() => {
          setIsBulkView(false);
          folderContext?.setBulkSelectedData({});
        }}
        iconBefore={<IconX height={24} width={24} />}
      />
    </div>
  );
};

export default BulkButtons;
