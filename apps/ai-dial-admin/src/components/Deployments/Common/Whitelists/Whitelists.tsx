'use client';

import Cloud from '@/public/images/icons/cloud.svg';
import {
  AlertVariant,
  DialAlert,
  DialRadioGroup,
  RadioButtonWithContent,
  RadioGroupOrientation,
} from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useState } from 'react';

import { getGlobalWhitelist } from '@/src/app/actions/deployments';
import { DeploymentsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { Container } from '@/src/models/deployments/containers';
import { Image } from '@/src/models/deployments/images';
import { WHITELIST_POLICY } from '@/src/types/deployments/entity';
import { ApplicationRoute } from '@/src/types/routes';
import { getCurrentPolicy, getDeploymentEntityKey, getTranslatedDeploymentType } from '@/src/utils/deployments/entity';
import { getWhitelistDomainError } from '@/src/utils/deployments/validation';

import ItemsList from '@/src/components/Deployments/Common/ItemsList/ItemsList';

interface Props {
  entity: Image | Container;
  setEntity: (image: Image | Container) => void;
  route: ApplicationRoute;
  disabled?: boolean;
}

export const ALLOW_ALL_DOMAINS = '*';

const Whitelists: FC<Props> = ({ entity, setEntity, route, disabled }) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();

  const [currentPolicy, setCurrentPolicy] = useState<WHITELIST_POLICY>(getCurrentPolicy(entity));
  const [globalWhitelist, setGlobalWhitelist] = useState<string[]>([]);

  const policyOptions: RadioButtonWithContent[] = [
    {
      id: WHITELIST_POLICY.ALL,
      name: t(DeploymentsI18nKey.WhitelistPolicyAll),
      caption: t(DeploymentsI18nKey.WhitelistPolicyAllCaption),
    },
    {
      id: WHITELIST_POLICY.CUSTOM,
      name: t(DeploymentsI18nKey.WhitelistPolicyCustom),
      caption: t(DeploymentsI18nKey.WhitelistPolicyCustomCaption),
    },
  ];

  const setItems = useCallback(
    (allowedDomains: string[]) => {
      setEntity({
        ...entity,
        allowedDomains,
      });
    },
    [entity, setEntity],
  );

  useEffect(() => {
    setCurrentPolicy(getCurrentPolicy(entity));
  }, [entity]);

  useEffect(() => {
    getGlobalWhitelist().then(({ response, success }) => {
      if (success) {
        setGlobalWhitelist(response as string[]);
      }
    });
  }, []);

  useEffect(() => {
    if (resetCounter || entity.allowedDomains != null) {
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

  const onPolicyChange = useCallback(
    (policy: WHITELIST_POLICY) => {
      const has = entity.allowedDomains?.includes(ALLOW_ALL_DOMAINS);
      const list =
        policy === WHITELIST_POLICY.ALL
          ? has
            ? entity.allowedDomains
            : [...(entity.allowedDomains || []), ALLOW_ALL_DOMAINS]
          : has
            ? entity.allowedDomains?.filter((d: string) => d !== ALLOW_ALL_DOMAINS)
            : entity.allowedDomains;

      setEntity({
        ...entity,
        allowedDomains: list,
      });
    },
    [entity, setEntity],
  );

  return (
    <div className="flex flex-col gap-8">
      <DialRadioGroup
        elementId="policy"
        fieldTitle={t(DeploymentsI18nKey.WhitelistPolicyLabel)}
        radioButtons={policyOptions}
        activeRadioButton={currentPolicy}
        orientation={RadioGroupOrientation.Column}
        onChange={(id) => onPolicyChange(id as WHITELIST_POLICY)}
        disabled={disabled}
      />
      {currentPolicy === WHITELIST_POLICY.ALL ? (
        <DialAlert
          id="alert"
          message={
            <p className="small">
              <span className="small-text-semi mr-1">{t(DeploymentsI18nKey.WhitelistPolicyAllWarning)}</span>
              {t(DeploymentsI18nKey.WhitelistPolicyAllWarningDescription, {
                type: getTranslatedDeploymentType(route, t).toLowerCase(),
              })}
            </p>
          }
          variant={AlertVariant.Warning}
        />
      ) : (
        <div className="flex flex-col ml-[34px] gap-8">
          {route === ApplicationRoute.Images && !!globalWhitelist.length && (
            <div className="flex flex-col gap-2">
              <p className="small-text-semi">{t(DeploymentsI18nKey.AllowedDomains)}</p>
              <p className="tiny text-secondary">{t(DeploymentsI18nKey.GlobalWhitelist)}</p>
              <ul className="gap-1 flex flex-col">
                {globalWhitelist.map((domain, index) => (
                  <li key={`domain-${index}`} className="flex items-center gap-2 text-primary">
                    <span className="text-secondary">
                      <Cloud {...BASE_BUTTON_ICON_PROPS} />
                    </span>
                    <p className="dial-body-text"> {domain}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-col gap-2">
            {!(route === ApplicationRoute.Images && !!globalWhitelist.length) && (
              <p className="small-text-semi">{t(DeploymentsI18nKey.AllowedDomains)}</p>
            )}
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
      )}
    </div>
  );
};

export default Whitelists;
