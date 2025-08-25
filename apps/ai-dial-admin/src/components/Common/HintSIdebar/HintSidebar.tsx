import { useAppContext } from '@/src/context/AppContext';

const HintSidebar = () => {
  const { hintSidebar } = useAppContext();
  const { show, content } = hintSidebar;

  if (!show || !content) return null;

  return <aside className="flex w-[400px] flex-shrink-0 bg-layer-0 p-4">{content}</aside>;
};

export default HintSidebar;
