import { FC } from 'react';

import classNames from 'classnames';

import Button from '@/src/components/Common/Button/Button';
import FolderList from '@/src/components/Common/FolderList/FolderList';
import HorizontalCollapseBar from '@/src/components/Common/HorizontalCollapseBar/HorizontalCollapseBar';
import Popup from '@/src/components/Common/Popup/Popup';
import { generateExportList } from '@/src/components/EntityListView/Export/export';
import { BasicI18nKey, ButtonsI18nKey, ExportI18nKey, FoldersI18nKey, PromptsI18nKey } from '@/src/constants/i18n';
import { FileFolderContextType } from '@/src/context/FileFolderContext';
import { PromptFolderContextType } from '@/src/context/PromptFolderContext';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import ExportGrid from './ExportGrid';

interface Props {
  modalState: PopUpState;
  route?: ApplicationRoute;
  context?: () => PromptFolderContextType | FileFolderContextType;
  onClose: () => void;
  onApply?: (promptPaths: string[]) => void;
}

const ExportModal: FC<Props> = ({ modalState, route, context, onClose, onApply }) => {
  const t = useI18n();
  const folderContext = context?.();
  const containerClassName = classNames('h-[750px] lg:max-w-[65%]');

  return (
    <Popup
      onClose={onClose}
      heading={route === ApplicationRoute.Prompts ? t(PromptsI18nKey.Export) : t(FoldersI18nKey.Export)}
      portalId="ExportModal"
      state={modalState}
      containerClassName={containerClassName}
    >
      <div className="flex px-6 py-4 flex-1 flex-col min-h-0">
        <div className="flex flex-1 min-h-0">
          <HorizontalCollapseBar width="360" title={t(ExportI18nKey.Folders)}>
            <FolderList context={context} />
          </HorizontalCollapseBar>
          <ExportGrid context={context} route={route} />
        </div>
        <div className="pt-4 text-secondary">
          {generateExportList(folderContext?.exportFoldersData).length} {t(BasicI18nKey.Selected)}
        </div>
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <Button cssClass="secondary" title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <Button
          cssClass="primary"
          title={t(ButtonsI18nKey.Export)}
          onClick={() => {
            onApply?.(generateExportList(folderContext?.exportFoldersData));
            folderContext?.setExportFoldersData({});
            onClose();
          }}
          disable={Object.keys(folderContext?.exportFoldersData || {}).length === 0}
        />
      </div>
    </Popup>
  );
};

export default ExportModal;
