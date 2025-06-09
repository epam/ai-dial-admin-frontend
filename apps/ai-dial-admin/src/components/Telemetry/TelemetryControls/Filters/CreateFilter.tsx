import { Dispatch, FC, SetStateAction, useCallback } from 'react';
import { IconX } from '@tabler/icons-react';
import DropdownMenuItem from '@/src/components/Common/Dropdown/DropdownItem';
import Dropdown from '@/src/components/Common/Dropdown/Dropdown';
import Input from '@/src/components/Common/Input/Input';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import classNames from 'classnames';
import { BasicI18nKey, TelemetryI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { FILTER_OPERATOR, FILTER_TYPE } from '@/src/types/telemetry';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { getDefaultFilterValue, getFilterConditionConfig, getFilterTypeConfig } from '@/src/utils/telemetry';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  type: FILTER_TYPE;
  condition: FILTER_OPERATOR;
  value: string;
  setType: Dispatch<SetStateAction<FILTER_TYPE>>;
  setCondition: Dispatch<SetStateAction<FILTER_OPERATOR>>;
  setValue: Dispatch<SetStateAction<string>>;
  onClose: () => void;
  dropdownData: { projects: DropdownItemsModel[]; entities: DropdownItemsModel[] };
  route: ApplicationRoute;
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
}) => {
  const t = useI18n() as (t: string) => string;
  const filterTypeConfig = getFilterTypeConfig(t);
  const filterConditionConfig = getFilterConditionConfig(t);
  const isMobile = useIsMobileScreen();
  const { projects, entities } = dropdownData;

  const setConditionHandler = useCallback(
    (value: FILTER_OPERATOR) => {
      setCondition((prev) => {
        if (prev !== value) {
          if (value === FILTER_OPERATOR.Equal || value === FILTER_OPERATOR.NotEqual) {
            setValue(getDefaultFilterValue(type, entities, projects));
          } else {
            setValue('');
          }
        }
        return value;
      });
    },
    [entities, projects, setCondition, type, setValue],
  );

  const setTypeHandler = useCallback(
    (value: FILTER_TYPE) => {
      if (entities.length && projects.length) {
        setType((prev) => {
          if (prev !== value) {
            if (condition === FILTER_OPERATOR.Equal || condition === FILTER_OPERATOR.NotEqual) {
              if (type === FILTER_TYPE.Entity) {
                setValue(entities[0].id);
              } else {
                setValue(projects[0].id);
              }
            } else {
              setValue('');
            }
          }
          return value;
        });
      }
    },
    [entities, projects, setType, condition, type, setValue],
  );

  const containerClassNames = classNames(
    'flex',
    isMobile ? 'flex-col w-full' : 'items-center bg-layer-0 rounded p-2 z-50',
  );

  return (
    <div className={containerClassNames} data-testid="dashboard-create-filter">
      <>
        {route === ApplicationRoute.Dashboard ? (
          <div className="md:mr-4 md:mb-0 mb-4 min-w-[120px]">
            <Dropdown selectedValue={filterTypeConfig.find((item) => item.id === type)}>
              {filterTypeConfig.map((item, i) => (
                <DropdownMenuItem
                  className="gap-0"
                  key={i}
                  dropdownItem={item}
                  onClick={() => setTypeHandler(item.id)}
                />
              ))}
            </Dropdown>
          </div>
        ) : (
          <div className="flex">
            <p className="flex body mr-4 ml-2">{t(TelemetryI18nKey.FilterTypeProjects)}</p>
          </div>
        )}
      </>
      <div className="md:mr-4 md:mb-0 mb-4 min-w-[160px]">
        <Dropdown selectedValue={filterConditionConfig.find((item) => item.id === condition)}>
          {filterConditionConfig.map((item, i) => (
            <DropdownMenuItem
              className="gap-0"
              key={i}
              dropdownItem={item}
              onClick={() => setConditionHandler(item.id)}
            />
          ))}
        </Dropdown>
      </div>
      <div className="md:mr-2 md:mb-0 mb-4 min-w-[190px] max-w-[250px]">
        {condition === FILTER_OPERATOR.Equal || condition === FILTER_OPERATOR.NotEqual ? (
          <>
            {type === FILTER_TYPE.Entity ? (
              <Dropdown selectedValue={entities.find((item) => item.id === value)}>
                {entities.map((item, i) => (
                  <DropdownMenuItem className="gap-0" key={i} dropdownItem={item} onClick={() => setValue(item.id)} />
                ))}
              </Dropdown>
            ) : (
              <Dropdown selectedValue={projects.find((item) => item.id === value)}>
                {projects.map((item, i) => (
                  <DropdownMenuItem className="gap-0" key={i} dropdownItem={item} onClick={() => setValue(item.id)} />
                ))}
              </Dropdown>
            )}
          </>
        ) : (
          <Input
            inputId={'filterValue'}
            onChange={setValue}
            placeholder={t(BasicI18nKey.Value)}
            value={value}
            cssClass={'py-[9px]'}
          />
        )}
      </div>
      <button
        type="button"
        aria-label="button"
        className="hidden md:flex text-secondary hover:text-accent-primary"
        onClick={onClose}
      >
        <IconX height={24} width={24} />
      </button>
    </div>
  );
};

export default CreateFilter;
