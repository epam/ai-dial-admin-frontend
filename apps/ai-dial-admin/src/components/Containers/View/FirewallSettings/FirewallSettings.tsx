import { FC } from 'react';

import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { isEditDisabled } from '@/src/utils/deployments/containers';

import Whitelists from '@/src/components/Deployments/Common/Whitelists/Whitelists';

interface Props {
  container: Container;
  setContainer: (image: Container) => void;
  route: ApplicationRoute;
  disabled?: boolean;
}

const FirewallSettings: FC<Props> = ({ container, setContainer, route, disabled }) => {
  return (
    <Whitelists
      route={route}
      entity={container}
      setEntity={(container) => setContainer(container as Container)}
      disabled={!!disabled || isEditDisabled(container)}
    />
  );
};

export default FirewallSettings;
