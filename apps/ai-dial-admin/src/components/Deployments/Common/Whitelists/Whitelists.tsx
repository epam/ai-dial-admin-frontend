import { FC, useCallback, useEffect, useState } from 'react';
import Cloud from '@/public/images/icons/cloud.svg';

import { Image } from '@/src/models/deployments/images';
import { Container } from '@/src/models/deployments/containers';
import { DeploymentsI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getGlobalWhitelist } from '@/src/app/actions/deployments';
import { getWhitelistDomainError } from '@/src/utils/deployments/validation';
import { getDeploymentEntityKey } from '@/src/utils/deployments/entity';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

import ItemsList from '@/src/components/Deployments/Common/ItemsList/ItemsList';

interface Props {
  entity: Image | Container;
  setEntity: (image: Image | Container) => void;
  route: ApplicationRoute;
  disabled?: boolean;
}

const Whitelists: FC<Props> = ({ entity, setEntity, route, disabled }) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();

  const [globalWhitelist, setGlobalWhitelist] = useState<string[]>([]);

  const setItems = useCallback(
    (allowedDomains: string[]) => {
      setEntity({
        ...entity,
        allowedDomains,
      } as Container);
    },
    [entity, setEntity],
  );

  useEffect(() => {
    getGlobalWhitelist().then(({ response, success }) => {
      if (success) {
        setGlobalWhitelist(response as string[]);
      }
    });
  }, []);

  useEffect(() => {
    if (resetCounter || entity.allowedDomains !== null) {
      entity.allowedDomains?.forEach((item, index) => {
        dispatch({
          type: ValidationActionType.SetField,
          field: `item-${index}`,
          isValid: entity.allowedDomains?.length === 0 ? true : !getWhitelistDomainError(item, t),
        });
      });
    }
  }, [dispatch, entity.allowedDomains, resetCounter, t]);

  const validate = useCallback((value?: string) => getWhitelistDomainError(value, t), [t]);

  return (
    <div className="flex flex-col gap-8">
      {route === ApplicationRoute.Images && !!globalWhitelist.length && (
        <div className="flex flex-col gap-2">
          <p className="tiny text-secondary">{t(DeploymentsI18nKey.GlobalWhitelist)}</p>
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
        <p className="tiny text-secondary">
          {t(DeploymentsI18nKey.SpecificWhitelist, { type: getDeploymentEntityKey(route, t) })}
        </p>
        <ItemsList
          items={entity?.allowedDomains || []}
          setItems={setItems}
          addItemLabel={t(DeploymentsI18nKey.AddDomain)}
          validate={validate}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default Whitelists;
