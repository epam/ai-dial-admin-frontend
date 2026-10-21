'use client';

import { createContext, FC, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { ApplicationRoute } from '@/src/types/routes';

interface HelpTopic {
  helpRoute?: ApplicationRoute;
  setHelpRoute: (route?: ApplicationRoute) => void;
}

const HelpTopicContext = createContext<HelpTopic>({ setHelpRoute: () => void 0 });

interface Props {
  children: ReactNode;
}

export const HelpTopicProvider: FC<Props> = ({ children }) => {
  const [helpRoute, setHelpRoute] = useState<ApplicationRoute>();
  const value = useMemo(() => ({ helpRoute, setHelpRoute }), [helpRoute]);

  return <HelpTopicContext.Provider value={value}>{children}</HelpTopicContext.Provider>;
};

export const useHelpTopic = () => useContext(HelpTopicContext);

/** Points the header help button at `route`'s documentation while the calling page is mounted. */
export const useHelpRoute = (route?: ApplicationRoute) => {
  const { setHelpRoute } = useHelpTopic();

  useEffect(() => {
    setHelpRoute(route);
    return () => setHelpRoute(void 0);
  }, [route, setHelpRoute]);
};
