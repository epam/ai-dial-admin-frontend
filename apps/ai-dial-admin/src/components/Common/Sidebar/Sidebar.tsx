import { useAppContext } from '@/src/context/AppContext';

const Sidebar = () => {
  const { sidebar } = useAppContext();
  const { show, content } = sidebar;

  if (!show || !content) return null;

  return <aside className="flex flex-shrink-0 max-w-full bg-layer-0 p-4">{content}</aside>;
};

export default Sidebar;
