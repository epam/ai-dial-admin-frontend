import { FC } from 'react';

import { Image } from '@/src/models/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';

import Whitelists from '@/src/components/Deployments/Common/Whitelists/Whitelists';

interface Props {
  image: Image;
  setImage: (image: Image) => void;
  route: ApplicationRoute;
  disabled?: boolean;
}

const FirewallSettings: FC<Props> = ({ image, setImage, route, disabled }) => {
  return (
    <Whitelists route={route} entity={image} setEntity={(image) => setImage(image as Image)} disabled={disabled} />
  );
};

export default FirewallSettings;
