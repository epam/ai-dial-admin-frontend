import { useAppContext } from '@/src/context/AppContext';
import classNames from 'classnames';

const Sidebar = () => {
  const { sidebar } = useAppContext();
  const { show, content, className } = sidebar;

  if (!show || !content) return null;

  return <aside className={classNames('flex shrink-0 min-w-[400px] bg-layer-0 p-4', className)}>{content}</aside>;
};

export default Sidebar;
