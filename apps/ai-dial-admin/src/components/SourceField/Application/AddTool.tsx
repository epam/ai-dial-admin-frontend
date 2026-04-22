'use client';
import { FC, useCallback } from 'react';

import { DialGhostButton, DialInput, DialLabel, DialRemoveButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import classNames from 'classnames';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, CONTROL_WITH_BUTTON_WIDTH } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';

export interface Props {
  entity: DialApplicationScheme;
  onChangeEntity: (entity: DialApplicationScheme) => void;
}

const AddTool: FC<Props> = ({ entity, onChangeEntity }) => {
  const t = useI18n();
  const onChangeTool = useCallback(
    (index: number, value?: string) => {
      const currentEntity = structuredClone(entity);
      const newMcpTools = [...(currentEntity['dial:applicationTypeMcp']?.['dial:allowedTools'] || [])];
      newMcpTools[index] = value || '';

      const updatedMCPContainer = {
        ...(currentEntity['dial:applicationTypeMcp'] || {}),
        ['dial:endpoint']: currentEntity['dial:applicationTypeMcp']?.['dial:endpoint'] || '',
        ['dial:allowedTools']: newMcpTools,
      };
      onChangeEntity({ ...entity, 'dial:applicationTypeMcp': updatedMCPContainer });
    },
    [entity, onChangeEntity],
  );

  const onAddTool = useCallback(() => {
    const currentEntity = structuredClone(entity);
    const newMcpTools = [...(currentEntity['dial:applicationTypeMcp']?.['dial:allowedTools'] || []), ''];
    const updatedMCPContainer = {
      ...(currentEntity['dial:applicationTypeMcp'] || {}),
      ['dial:endpoint']: currentEntity['dial:applicationTypeMcp']?.['dial:endpoint'] || '',
      ['dial:allowedTools']: newMcpTools,
    };
    onChangeEntity({ ...entity, 'dial:applicationTypeMcp': updatedMCPContainer });
  }, [entity, onChangeEntity]);

  const onRemoveTool = useCallback(
    (index: number) => {
      const currentEntity = structuredClone(entity);
      const newMcpTools = [...(currentEntity['dial:applicationTypeMcp']?.['dial:allowedTools'] || [])];
      newMcpTools.splice(index, 1);
      const updatedMCPContainer = {
        ...(currentEntity['dial:applicationTypeMcp'] || {}),
        ['dial:endpoint']: currentEntity['dial:applicationTypeMcp']?.['dial:endpoint'] || '',
        ['dial:allowedTools']: newMcpTools,
      };
      onChangeEntity({ ...entity, 'dial:applicationTypeMcp': updatedMCPContainer });
    },
    [entity, onChangeEntity],
  );

  return (
    <div className={classNames(CONTROL_WITH_BUTTON_WIDTH)}>
      <DialLabel label={t(EntityFieldsI18nKey.allowedTools)} />
      {(entity?.['dial:applicationTypeMcp']?.['dial:allowedTools'] || []).map((item, index) => (
        <div key={index} className="flex gap-x-2 items-end">
          <DialInput
            id={`mcp-container-tool-${index}`}
            containerClassName="w-full"
            value={item}
            placeholder={t(EntityPlaceholdersI18nKey.ToolName)}
            onChange={(value) => {
              onChangeTool(index, value);
            }}
          />
          <div className="w-[40px] shrink-0 mt-[10px]">
            <DialRemoveButton onClick={() => onRemoveTool(index)} />
          </div>
        </div>
      ))}
      <DialGhostButton
        label={t(ToolsetI18nKey.AddTools)}
        iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
        className="mt-2 min-h-[34px] h-[34px]"
        onClick={onAddTool}
      />
    </div>
  );
};

export default AddTool;
