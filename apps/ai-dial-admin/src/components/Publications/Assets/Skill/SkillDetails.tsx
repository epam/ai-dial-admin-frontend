import { ColDef } from 'ag-grid-community';
import { FC, useMemo } from 'react';

import GridView from '@/src/components/Grid/GridView/GridView';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { EntitiesI18nKey, EntityFieldsI18nKey, PublicationsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { SkillPublication } from '@/src/models/dial/publications';
import { DialSkillFile } from '@/src/models/dial/resource';

interface Props {
  publication: SkillPublication;
}

/** Formats a byte count for display — this repo has no shared formatter since file grids elsewhere show name/author, not size. */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
};

const COLUMN_DEFS: ColDef<DialSkillFile>[] = [
  { field: 'name', headerName: 'Name', flex: 2 },
  {
    field: 'size',
    headerName: 'Size',
    flex: 1,
    filter: false,
    floatingFilter: false,
    valueFormatter: ({ value }) => formatFileSize(value ?? 0),
  },
];

/**
 * Read-only skill metadata + bundle file listing for a pending Skill publication. Unlike
 * `FilesDetails`, this has no add/remove/download affordances — Skill's files aren't independently
 * addressable Core file resources in this app, only names/sizes surfaced via folder metadata.
 */
const SkillDetails: FC<Props> = ({ publication }) => {
  const t = useI18n();
  const skillResource = publication.skillResources?.[0]?.skillResource;

  const rowData = useMemo<DialSkillFile[]>(() => skillResource?.files ?? [], [skillResource]);

  if (!skillResource) {
    return null;
  }

  return (
    <div className="flex flex-col gap-y-8 h-full">
      <div className="flex flex-col sm:flex-row gap-8">
        <LabelledText label={t(EntityFieldsI18nKey.name)} text={skillResource.name} />
        {skillResource.description && (
          <LabelledText label={t(EntityFieldsI18nKey.description)} text={skillResource.description} />
        )}
        {skillResource.version && <LabelledText label={t(EntityFieldsI18nKey.version)} text={skillResource.version} />}
      </div>
      <div className="flex flex-col gap-y-2 flex-1 min-h-0">
        <h3 className="text-primary mb-4">
          {t(PublicationsI18nKey.FilesListTitle)}: {rowData.length}
        </h3>
        <div className="flex-1 min-h-0">
          <GridView emptyDataProps={{ title: t(EntitiesI18nKey.NoFiles) }} columnDefs={COLUMN_DEFS} rowData={rowData} />
        </div>
      </div>
    </div>
  );
};

export default SkillDetails;
