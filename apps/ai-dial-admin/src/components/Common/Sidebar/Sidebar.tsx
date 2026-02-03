import { useAppContext } from '@/src/context/AppContext';
import classNames from 'classnames';

const Sidebar = () => {
  const { sidebar } = useAppContext();
  const { show, content, className } = sidebar;

  if (!show || !content) return null;

  return (
    <aside className={classNames('flex flex-shrink-0 w-[400px] max-w-[800px] bg-layer-0 p-4', className)}>
      {content}
    </aside>
  );
};

export default Sidebar;
