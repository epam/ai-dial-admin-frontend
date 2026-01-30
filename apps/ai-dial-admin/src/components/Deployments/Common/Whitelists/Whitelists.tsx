import { FC, useCallback, useEffect, useState } from 'react';
import Cloud from '@/public/images/icons/cloud.svg';

import { Image } from '@/src/models/deployments/images';
import { DeploymentsI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { getGlobalWhitelist } from '@/src/app/actions/deployments';
import { getWhitelistDomainError } from '@/src/utils/deployments/validation';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

import ItemsList from '@/src/components/Deployments/Common/ItemsList/ItemsList';

interface Props {
  image: Image;
  setImage: (image: Image) => void;
  route: ApplicationRoute;
}

const Whitelists: FC<Props> = ({ image, setImage, route }) => {
  const t = useI18n();
  const [globalWhitelist, setGlobalWhitelist] = useState<string[]>([]);

  const setItems = useCallback(
    (allowedDomains: string[]) => {
      setImage({
        ...image,
        allowedDomains,
      });
    },
    [image, setImage],
  );

  useEffect(() => {
    getGlobalWhitelist().then(({ response, success }) => {
      if (success) {
        setGlobalWhitelist(response as string[]);
      }
    });
  }, []);

  return (
    <div className="flex flex-col gap-8">
      {route === ApplicationRoute.Images && (
        <div className="flex flex-col gap-2">
          <p className="text-tiny text-secondary">{t(DeploymentsI18nKey.GlobalWhitelist)}</p>
          <ul>
            {globalWhitelist.map((domain, index) => (
              <li key={`domain-${index}`} className="flex items-center gap-2 text-primary">
                <span className="text-secondary ">
                  <Cloud {...BASE_BUTTON_ICON_PROPS} />
                </span>
                {domain}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <p className="text-tiny text-secondary">{t(DeploymentsI18nKey.ImageWhitelist)}</p>
        <ItemsList
          items={image.allowedDomains || []}
          setItems={setItems}
          addItemLabel={t(DeploymentsI18nKey.AddDomain)}
          validate={(value) => getWhitelistDomainError(value, t)}
        />
      </div>
    </div>
  );
};

export default Whitelists;
