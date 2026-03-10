import { FC } from 'react';

import { Container } from '@/src/models/deployments/containers';
import { Image } from '@/src/models/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';

import ContainerFields from '@/src/components/Containers/Fields/ContainerFields';

interface Props {
  container: Container;
  image?: Image;
  setContainer: (container: Container) => void;
  route: ApplicationRoute;
  names: string[];
}

const Properties: FC<Props> = ({ container, setContainer, route, names }) => {
  return <ContainerFields container={container} setContainer={setContainer} route={route} names={names} />;
};

export default Properties;
