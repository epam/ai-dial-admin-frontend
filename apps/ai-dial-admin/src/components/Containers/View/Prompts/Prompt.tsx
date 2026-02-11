import { FC, useCallback, useState } from 'react';
import { ColDef } from 'ag-grid-community';
import { useI18n } from '@/src/locales/client';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { Prompt as PromptType } from '@/src/models/deployments/containers';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import GridView from '@/src/components/Grid/GridView/GridView';
import classNames from 'classnames';

interface Props {
  prompt: PromptType;
}

const PROMPT_ARGUMENT_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Name', floatingFilter: false, filter: false, sortable: false },
  { field: 'description', headerName: 'Description', floatingFilter: false, filter: false, sortable: false },
  { field: 'required', headerName: 'Required', floatingFilter: false, filter: false, sortable: false },
];

const Prompt: FC<Props> = ({ prompt }) => {
  const t = useI18n();

  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  return (
    <div className="flex flex-col border-primary border p-4">
      <button className="flex items-center" onClick={toggleCollapse}>
        <i className="text-icon-secondary">
          {isCollapsed ? (
            <IconChevronRight {...BASE_BUTTON_ICON_PROPS} />
          ) : (
            <IconChevronDown {...BASE_BUTTON_ICON_PROPS} />
          )}
        </i>
        <h3 className="mx-2">{prompt.name}</h3>
      </button>
      <div className={classNames('flex flex-col mt-4 gap-4', isCollapsed && 'hidden')}>
        {prompt.description && (
          <div>
            <p className="small text-secondary">{t(EntityFieldsI18nKey.description)}</p>
            <p className="body">{prompt.description}</p>
          </div>
        )}
        {!!prompt.arguments?.length && (
          <div>
            <p className="small text-secondary">{t(EntityFieldsI18nKey.Arguments)}</p>
            <GridView
              columnDefs={PROMPT_ARGUMENT_COLUMNS}
              rowData={prompt.arguments.map((argument) => {
                return { ...argument, required: String(argument.required) };
              })}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Prompt;
