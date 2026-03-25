import { useAppContext } from '@/src/context/AppContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { mergeClasses } from '@/src/utils/merge-classes';

const Sidebar = () => {
  const { sidebar } = useAppContext();
  const { show, content, className } = sidebar;

  if (!show || !content) return null;

  return (
    <SaveValidationContextProvider>
      <aside className={mergeClasses('flex shrink-0 min-w-[400px] bg-layer-0 p-4', className)}>{content}</aside>
    </SaveValidationContextProvider>
  );
};

export default Sidebar;
