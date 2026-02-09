import { FC } from 'react';

import { Container } from '@/src/models/deployments/containers';
import { Image } from '@/src/models/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';

import ContainerProperties from '@/src/components/Containers/Fields/ContainerProperties';
import ServingProperties from '@/src/components/Containers/Fields/ServingProperties';

interface Props {
  container: Container;
  image?: Image;
  setContainer: (container: Container) => void;
  route: ApplicationRoute;
  names: string[];
}

const Properties: FC<Props> = ({ container, setContainer, route, names }) => {
  return route === ApplicationRoute.ModelServings ? (
    <ServingProperties container={container} setContainer={setContainer} names={names} route={route} />
  ) : (
    <ContainerProperties container={container} setContainer={setContainer} route={route} names={names} />
  );
};

export default Properties;
