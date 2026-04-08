import { Dispatch, FC, SetStateAction, useCallback } from 'react';
import classNames from 'classnames';

import { DialInput, DialSelectField, SelectOption } from '@epam/ai-dial-ui-kit';

import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { BasicI18nKey, TelemetryI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { FILTER_OPERATOR, FILTER_TYPE } from '@/src/types/telemetry';
import { getFilterConditionConfig, getFilterTypeConfig } from '@/src/utils/telemetry';
import { ApplicationRoute } from '@/src/types/routes';
import CloseButton from '@/src/components/Common/CloseButton/CloseButton';

interface Props {
  type: FILTER_TYPE;
  condition: FILTER_OPERATOR;
  value: string[];
  setType: Dispatch<SetStateAction<FILTER_TYPE>>;
  setCondition: Dispatch<SetStateAction<FILTER_OPERATOR>>;
  setValue: Dispatch<SetStateAction<string[]>>;
  onClose: () => void;
  dropdownData: { projects: SelectOption[]; entities: SelectOption[] };
  route: ApplicationRoute;
  isMcpView?: boolean;
}

const CreateFilter: FC<Props> = ({
  type,
  condition,
  value,
  setValue,
  setCondition,
  setType,
  onClose,
  dropdownData,
  route,
  isMcpView = false,
}) => {
  const t = useI18n();
  const filterTypeConfig = getFilterTypeConfig(t, isMcpView);
  const filterConditionConfig = getFilterConditionConfig(t);
  const isMobile = useIsMobileScreen();
  const { projects, entities } = dropdownData;

  const setConditionHandler = useCallback(
    (value: FILTER_OPERATOR) => {
      setCondition((prev) => {
        if (prev !== value) {
          if (value === FILTER_OPERATOR.Equal || value === FILTER_OPERATOR.NotEqual) {
            setValue([]); // Empty array for multi-select
          } else {
            setValue(['']); // Single empty string for text input
          }
        }
        return value;
      });
    },
    [setCondition, setValue],
  );

  const setTypeHandler = useCallback(
    (value: FILTER_TYPE) => {
      setType((prev) => {
        if (prev !== value) {
          if (condition === FILTER_OPERATOR.Equal || condition === FILTER_OPERATOR.NotEqual) {
            setValue([]); // Clear selection when switching Entity ↔ Project
          } else {
            setValue(['']); // Single empty string for text input
          }
        }
        return value;
      });
    },
    [setType, condition, setValue],
  );

  return (
    <div className={classNames('flex', isMobile ? 'flex-col w-full' : 'items-center bg-layer-0 rounded p-2 z-50')}>
      <>
        {route === ApplicationRoute.Dashboard ? (
          <div className="md:mr-4 md:mb-0 mb-4 min-w-[120px]">
            <DialSelectField
              value={filterTypeConfig.find((item) => item.value === type)?.value}
              id="type"
              onChange={(type) => setTypeHandler(type as FILTER_TYPE)}
              options={filterTypeConfig}
            />
          </div>
        ) : (
          <div className="flex">
            <p className="flex body mr-4 ml-2">{t(TelemetryI18nKey.FilterTypeProjects)}</p>
          </div>
        )}
      </>
      <div className="md:mr-4 md:mb-0 mb-4 min-w-[160px]">
        <DialSelectField
          value={filterConditionConfig.find((item) => item.value === condition)?.value}
          id="Condition"
          onChange={(type) => setConditionHandler(type as FILTER_OPERATOR)}
          options={filterConditionConfig}
        />
      </div>
      <div className="md:mr-2 md:mb-0 mb-4 min-w-[190px] max-w-[250px]">
        {condition === FILTER_OPERATOR.Equal || condition === FILTER_OPERATOR.NotEqual ? (
          <>
            {isDeploymentFilter(type) ? (
              <DialSelectField
                value={value}
                id="entities"
                onChange={(selected) => setValue(selected as string[])}
                options={entities}
                multiple={true}
                listClassName="w-[250px]"
                placeholder={value.length === 0 ? t(TelemetryI18nKey.SelectEntities) : undefined}
              />
            ) : (
              <DialSelectField
                value={value}
                id="projects"
                onChange={(selected) => setValue(selected as string[])}
                options={projects}
                multiple={true}
                placeholder={value.length === 0 ? t(TelemetryI18nKey.SelectProjects) : undefined}
              />
            )}
          </>
        ) : (
          <DialInput
            id="filterValue"
            onChange={(v) => setValue([v || ''])}
            placeholder={t(BasicI18nKey.Value)}
            value={value[0] || ''}
            className="py-[9px]"
          />
        )}
      </div>
      <CloseButton onClose={onClose} className="hidden md:flex" />
    </div>
  );
};

export default CreateFilter;
