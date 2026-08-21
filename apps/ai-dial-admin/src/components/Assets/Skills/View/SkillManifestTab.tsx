import { FC } from 'react';

import { DialInput } from '@epam/ai-dial-ui-kit';

import DescriptionControl from '@/src/components/BaseControls/Description';
import MdEditor from '@/src/components/Common/MdEditor/MdEditor';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';

interface Props {
  name: string;
  description: string;
  body: string;
  onChangeDescription: (description: string) => void;
  onChangeBody: (body: string) => void;
  disabled?: boolean;
}

/**
 * `SKILL.md`'s parsed frontmatter/body, shared between the Assets > Skills detail view and the Skill
 * Publications properties view (same split as `SkillDetails`). `Name` stays disabled — a skill's
 * identity is its path, not this field — while `Description` and the body are editable and staged by
 * the owning view, matching how every other field on both surfaces stages locally until Save.
 */
const SkillManifestTab: FC<Props> = ({ name, description, body, onChangeDescription, onChangeBody, disabled }) => {
  const t = useI18n();

  return (
    <div className="flex flex-col gap-y-8">
      <DialInput
        disabled
        placeholder={t(EntityPlaceholdersI18nKey.Name)}
        labelProps={{ label: t(EntityFieldsI18nKey.name) }}
        id="skill-manifest-name"
        value={name}
        containerClassName={STANDARD_CONTROL_WIDTH}
      />
      <DescriptionControl
        entity={{ description }}
        onChangeEntity={(updated) => onChangeDescription(updated.description ?? '')}
        disabled={disabled}
        isFullWidth={false}
        required
      />
      <div>
        <div className="tiny mb-2 text-secondary">{t(EntityFieldsI18nKey.content)}</div>
        <MdEditor content={body} onChangeContent={onChangeBody} readOnly={disabled} />
      </div>
    </div>
  );
};

export default SkillManifestTab;
