import { FC } from 'react';

import { Image } from '@/src/models/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';

import Whitelists from '@/src/components/Deployments/Common/Whitelists/Whitelists';

interface Props {
  image: Image;
  setImage: (image: Image) => void;
  route: ApplicationRoute;
}

const FirewallSettings: FC<Props> = ({ image, setImage, route }) => {
  return <Whitelists route={route} image={image} setImage={setImage} />;
};

export default FirewallSettings;
