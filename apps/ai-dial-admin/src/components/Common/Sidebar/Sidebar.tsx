import { FC } from 'react';

import { SidebarPosition } from '@/src/components/Common/Sidebar/models';
import { useAppContext } from '@/src/context/AppContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { mergeClasses } from '@/src/utils/merge-classes';

interface Props {
  slot?: SidebarPosition;
}

const RIGHT_SLOT_CLASSES = 'flex shrink-0 min-w-[400px] h-full overflow-hidden bg-layer-0 p-4 z-10';
const BOTTOM_SLOT_CLASSES = 'flex flex-col shrink-0 w-full flex-1 min-h-0 overflow-hidden bg-layer-0 z-10';

const Sidebar: FC<Props> = ({ slot = SidebarPosition.Right }) => {
  const { sidebar } = useAppContext();
  const { show, content, className, position = SidebarPosition.Right } = sidebar;

  if (!show || !content || position !== slot) return null;

  const isBottom = slot === SidebarPosition.Bottom;

  return (
    <SaveValidationContextProvider>
      {isBottom ? (
        <section className={mergeClasses(BOTTOM_SLOT_CLASSES, className)}>{content}</section>
      ) : (
        <aside className={mergeClasses(RIGHT_SLOT_CLASSES, className)}>{content}</aside>
      )}
    </SaveValidationContextProvider>
  );
};

export default Sidebar;
