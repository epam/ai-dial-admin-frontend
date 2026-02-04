import { FC } from 'react';

import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { isEditDisabled } from '@/src/utils/deployments/containers';

import Whitelists from '@/src/components/Deployments/Common/Whitelists/Whitelists';

interface Props {
  container: Container;
  setContainer: (image: Container) => void;
  route: ApplicationRoute;
}

const FirewallSettings: FC<Props> = ({ container, setContainer, route }) => {
  return (
    <Whitelists
      route={route}
      entity={container}
      setEntity={(container) => setContainer(container as Container)}
      disabled={isEditDisabled(container)}
    />
  );
};

export default FirewallSettings;
